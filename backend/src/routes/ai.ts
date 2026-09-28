import { Router, Request, Response } from "express";
import { readFile } from "fs/promises";
import path from "path";
import { LoanRiskFeatures, predictLoanRisk } from "../services/aiLoanScorer";

const router = Router();
const scriptDirectory = path.resolve(__dirname, "../../scripts");
const featureNames: Array<keyof LoanRiskFeatures> = [
  "ltv",
  "loan_amount",
  "collateral_value",
  "loan_duration_days",
  "previous_defaults",
  "repayment_ratio",
];

router.post("/loan-risk", async (req: Request, res: Response) => {
  const features = req.body as Partial<LoanRiskFeatures>;
  const hasInvalidFeature = featureNames.some(
    (name) => typeof features[name] !== "number" || !Number.isFinite(features[name])
  );
  if (hasInvalidFeature) {
    return res.status(400).json({ error: "All loan risk features must be finite numbers" });
  }
  if (
    (features.ltv as number) < 0 ||
    (features.loan_amount as number) < 0 ||
    (features.collateral_value as number) <= 0 ||
    (features.loan_duration_days as number) < 0 ||
    (features.previous_defaults as number) < 0 ||
    (features.repayment_ratio as number) < 0 ||
    (features.repayment_ratio as number) > 1
  ) {
    return res.status(400).json({ error: "Loan risk features are outside supported ranges" });
  }

  try {
    return res.json(await predictLoanRisk(features as LoanRiskFeatures));
  } catch (error) {
    console.error("AI loan risk prediction failed:", error);
    return res.status(500).json({ error: "Loan risk prediction failed" });
  }
});

router.get("/model-metrics", async (_req: Request, res: Response) => {
  try {
    const [metrics, confusionMatrix, featureImportance] = await Promise.all(
      ["metrics.json", "confusion_matrix.json", "feature_importance.json"].map(
        async (file) => JSON.parse(await readFile(path.join(scriptDirectory, file), "utf-8"))
      )
    );
    return res.json({ metrics, confusion_matrix: confusionMatrix, feature_importance: featureImportance });
  } catch (error) {
    console.error("AI model metrics are unavailable:", error);
    return res.status(503).json({ error: "Model metrics are unavailable; train the loan risk model first" });
  }
});

export default router;