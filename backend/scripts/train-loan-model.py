from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, precision_recall_curve, precision_score, recall_score, roc_auc_score, confusion_matrix
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier


SCRIPT_DIR = Path(__file__).resolve().parent
FEATURES = [
    "ltv",
    "loan_amount",
    "collateral_value",
    "loan_duration_days",
    "previous_defaults",
    "repayment_ratio",
]
MODEL_VERSION = "xgboost-v1"


def generate_synthetic_data(record_count=1000, seed=42):
    rng = np.random.default_rng(seed)
    loan_amount = np.clip(rng.lognormal(mean=4.2, sigma=0.9, size=record_count), 10, 1000)
    ltv = rng.beta(a=2.5, b=2.0, size=record_count) * 0.85 + 0.05
    collateral_value = loan_amount / ltv
    loan_duration_days = rng.integers(7, 181, size=record_count)
    repayment_ratio = rng.uniform(0, 1, size=record_count)

    risk_score = (
        3.2 * (ltv - 0.5)
        + 0.012 * (loan_duration_days - 60)
        + 0.001 * (loan_amount - 100)
        + rng.normal(0, 0.65, size=record_count)
    )
    default_count = round(record_count * 0.20)
    defaulted = np.zeros(record_count, dtype=int)
    defaulted[np.argsort(risk_score)[-default_count:]] = 1

    return pd.DataFrame(
        {
            "ltv": ltv,
            "loan_amount": loan_amount,
            "collateral_value": collateral_value,
            "loan_duration_days": loan_duration_days,
            "previous_defaults": np.zeros(record_count, dtype=int),
            "repayment_ratio": repayment_ratio,
            "defaulted": defaulted,
        }
    )


def main():
    data = generate_synthetic_data()
    x_train, x_test, y_train, y_test = train_test_split(
        data[FEATURES],
        data["defaulted"],
        test_size=0.2,
        random_state=42,
        stratify=data["defaulted"],
    )

    model = XGBClassifier(
        n_estimators=180,
        max_depth=3,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.9,
        reg_lambda=2.0,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        n_jobs=1,
    )
    model.fit(x_train, y_train)

    training_probabilities = model.predict_proba(x_train)[:, 1]
    train_precision, train_recall, train_thresholds = precision_recall_curve(
        y_train, training_probabilities
    )
    train_f1 = (
        2 * train_precision[:-1] * train_recall[:-1]
        / (train_precision[:-1] + train_recall[:-1] + 1e-12)
    )
    decision_threshold = float(train_thresholds[np.argmax(train_f1)])

    probabilities = model.predict_proba(x_test)[:, 1]
    predictions = (probabilities >= decision_threshold).astype(int)
    metrics = {
        "model_version": MODEL_VERSION,
        "accuracy": float(accuracy_score(y_test, predictions)),
        "precision": float(precision_score(y_test, predictions, zero_division=0)),
        "recall": float(recall_score(y_test, predictions, zero_division=0)),
        "f1_score": float(f1_score(y_test, predictions, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, probabilities)),
        "decision_threshold": decision_threshold,
        "training_records": int(len(data)),
        "test_records": int(len(y_test)),
    }
    tn, fp, fn, tp = confusion_matrix(y_test, predictions, labels=[0, 1]).ravel()

    joblib.dump(model, SCRIPT_DIR / "loan_risk_model.pkl")
    (SCRIPT_DIR / "metrics.json").write_text(
        pd.Series(metrics).to_json(indent=2) + "\n", encoding="utf-8"
    )
    (SCRIPT_DIR / "confusion_matrix.json").write_text(
        pd.Series(
            {
                "actual_safe_predicted_safe": int(tn),
                "actual_safe_predicted_risk": int(fp),
                "actual_default_predicted_safe": int(fn),
                "actual_default_predicted_risk": int(tp),
                "test_records": int(len(y_test)),
            }
        ).to_json(indent=2)
        + "\n",
        encoding="utf-8",
    )
    feature_importance = [
        {"feature": feature, "importance": float(importance)}
        for feature, importance in sorted(
            zip(FEATURES, model.feature_importances_),
            key=lambda item: item[1],
            reverse=True,
        )
    ]
    (SCRIPT_DIR / "feature_importance.json").write_text(
        pd.Series(feature_importance).to_json(orient="values", indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Generated {len(data)} synthetic records ({data['defaulted'].mean():.1%} defaults)")
    print(pd.Series(metrics).to_string())


if __name__ == "__main__":
    main()