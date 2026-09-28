import { motion } from "framer-motion";
import { FiActivity, FiAlertCircle, FiLoader } from "react-icons/fi";

const RISK_STYLES = {
  LOW: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  MEDIUM: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  HIGH: "border-rose-400/30 bg-rose-400/10 text-rose-300",
};

export default function LoanRiskCard({ assessment }) {
  const probability = Number(assessment?.default_probability);
  const hasScore = Number.isFinite(probability);
  const confidence = hasScore ? Math.max(probability, 1 - probability) : 0;
  const riskStyle = RISK_STYLES[assessment?.risk_level] || RISK_STYLES.MEDIUM;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-blue-400/20 p-5 backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(15,11,19,0.9), rgba(22,28,40,0.88), rgba(15,11,19,0.9))",
      }}
      aria-live="polite"
    >
      <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg border border-blue-400/20 bg-blue-400/10 p-2 text-blue-300">
              <FiActivity className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">AI Risk Assessment</h3>
              <p className="text-xs text-gray-500">Loan default probability estimate</p>
            </div>
          </div>
          {assessment?.demo && (
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] font-bold tracking-wide text-amber-300">
              DEMO
            </span>
          )}
        </div>

        {assessment?.loading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
            <FiLoader className="h-4 w-4 animate-spin text-blue-300" />
            Assessing loan risk...
          </div>
        ) : assessment?.unavailable || !hasScore ? (
          <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
            <FiAlertCircle className="h-4 w-4 text-amber-300" />
            Risk assessment is temporarily unavailable.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-gray-500">Default Probability</p>
                <p className="mt-1 text-xl font-black text-white">
                  {(probability * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Risk Level</p>
                <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${riskStyle}`}>
                  {assessment.risk_level}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Model Confidence</p>
                <p className="mt-1 text-xl font-black text-white">
                  {(confidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div
                className="h-2 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-label="Default probability"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={Math.round(probability * 100)}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 transition-[width] duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, probability * 100))}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-gray-600">
                <span>Lower risk</span>
                <span>Higher risk</span>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-gray-600">
              Model: {assessment.model_version || "unknown"}
            </p>
          </>
        )}
      </div>
    </motion.section>
  );
}