import { spawn } from "child_process";
import { createInterface } from "readline";
import path from "path";

export interface LoanRiskFeatures {
  ltv: number;
  loan_amount: number;
  collateral_value: number;
  loan_duration_days: number;
  previous_defaults: number;
  repayment_ratio: number;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface WorkerResponse {
  ready?: boolean;
  error?: string;
  default_probability?: number;
  model_version?: string;
}

type WorkerStatus = "starting" | "ready" | "failed";

const scriptDirectory = path.resolve(__dirname, "../../scripts");
const pythonExecutable = process.env.PYTHON_EXECUTABLE || (process.platform === "win32" ? "python" : "python3");
const worker = spawn(pythonExecutable, [path.join(scriptDirectory, "loan-risk-worker.py")], {
  stdio: ["pipe", "pipe", "pipe"],
});

let workerStatus: WorkerStatus = "starting";
let workerError = "AI model worker is unavailable";
let modelVersion = "xgboost-v1";
const startupWaiters: Array<() => void> = [];
const pendingRequests: Array<{
  resolve: (response: WorkerResponse) => void;
  reject: (error: Error) => void;
}> = [];

function settleStartup(): void {
  startupWaiters.splice(0).forEach((resolve) => resolve());
}

function failWorker(message: string): void {
  workerStatus = "failed";
  workerError = message;
  settleStartup();
  pendingRequests.splice(0).forEach(({ reject }) => reject(new Error(message)));
}

const output = createInterface({ input: worker.stdout });
output.on("line", (line) => {
  let response: WorkerResponse;
  try {
    response = JSON.parse(line) as WorkerResponse;
  } catch {
    failWorker("AI model worker returned invalid output");
    return;
  }

  if (typeof response.ready === "boolean") {
    if (response.ready) {
      workerStatus = "ready";
      modelVersion = response.model_version || modelVersion;
      settleStartup();
    } else {
      failWorker(response.error || "AI model failed to load");
    }
    return;
  }

  const pending = pendingRequests.shift();
  if (!pending) return;
  if (response.error) pending.reject(new Error(response.error));
  else pending.resolve(response);
});

worker.stderr.on("data", (chunk: Buffer) => {
  console.error("AI model worker:", chunk.toString().trim());
});
worker.on("error", (error) => failWorker(error.message));
worker.on("exit", (code) => {
  if (workerStatus !== "failed") {
    failWorker(`AI model worker exited with code ${String(code)}`);
  }
});

function waitForWorker(): Promise<void> {
  if (workerStatus !== "starting") return Promise.resolve();
  return new Promise((resolve) => startupWaiters.push(resolve));
}

function riskLevelFor(probability: number): RiskLevel {
  if (probability < 0.3) return "LOW";
  if (probability <= 0.6) return "MEDIUM";
  return "HIGH";
}

function demoProbability(features: LoanRiskFeatures): number {
  const score =
    -2.5 +
    Math.max(0, features.ltv - 0.25) * 3.2 +
    Math.max(0, features.loan_duration_days - 30) * 0.012 +
    Math.log1p(features.loan_amount) * 0.08 +
    features.previous_defaults * 0.8 -
    features.repayment_ratio * 0.35;
  return 1 / (1 + Math.exp(-score));
}

export async function predictLoanRisk(features: LoanRiskFeatures) {
  try {
    await waitForWorker();
    if (workerStatus !== "ready") throw new Error(workerError);

    const response = await new Promise<WorkerResponse>((resolve, reject) => {
      pendingRequests.push({ resolve, reject });
      worker.stdin.write(`${JSON.stringify(features)}\n`, (error) => {
        if (error) {
          const pending = pendingRequests.pop();
          pending?.reject(error);
        }
      });
    });
    if (typeof response.default_probability !== "number") {
      throw new Error("AI model worker returned no prediction");
    }

    return {
      default_probability: response.default_probability,
      risk_level: riskLevelFor(response.default_probability),
      model_version: response.model_version || modelVersion,
      demo: false,
    };
  } catch (error) {
    const probability = demoProbability(features);
    console.error("AI loan scoring fell back to demo mode:", error);
    return {
      default_probability: probability,
      risk_level: riskLevelFor(probability),
      model_version: "demo-fallback",
      demo: true,
    };
  }
}