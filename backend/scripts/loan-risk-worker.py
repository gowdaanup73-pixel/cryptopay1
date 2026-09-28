import json
import sys
from pathlib import Path

import joblib
import pandas as pd


SCRIPT_DIR = Path(__file__).resolve().parent
FEATURES = [
    "ltv",
    "loan_amount",
    "collateral_value",
    "loan_duration_days",
    "previous_defaults",
    "repayment_ratio",
]


def write_message(message):
    sys.stdout.write(json.dumps(message) + "\n")
    sys.stdout.flush()


try:
    model = joblib.load(SCRIPT_DIR / "loan_risk_model.pkl")
    metrics_path = SCRIPT_DIR / "metrics.json"
    model_version = (
        json.loads(metrics_path.read_text(encoding="utf-8")).get("model_version", "xgboost-v1")
        if metrics_path.exists()
        else "xgboost-v1"
    )
    write_message({"ready": True, "model_version": model_version})
except Exception as error:
    write_message({"ready": False, "error": str(error)})
    sys.exit(1)


for line in sys.stdin:
    try:
        features = json.loads(line)
        row = pd.DataFrame([[features[name] for name in FEATURES]], columns=FEATURES)
        probability = float(model.predict_proba(row)[0][1])
        write_message(
            {
                "default_probability": probability,
                "model_version": model_version,
            }
        )
    except Exception as error:
        write_message({"error": str(error)})