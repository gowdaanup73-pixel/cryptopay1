import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiCpu, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import Layout from "../components/Layout";

const METRIC_LABELS = [
  ["accuracy", "Accuracy"],
  ["precision", "Precision"],
  ["recall", "Recall"],
  ["f1_score", "F1 Score"],
  ["roc_auc", "ROC-AUC"],
];

function GlassPanel({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-white/10 p-5 backdrop-blur-xl ${className}`}
      style={{ background: "linear-gradient(135deg, rgba(15,11,19,0.88), rgba(22,28,40,0.82))" }}
    >
      {children}
    </section>
  );
}

export default function AiAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
      const response = await fetch(`${backendUrl}/api/ai/model-metrics`);
      if (!response.ok) throw new Error("Model metrics are unavailable. Train the loan model and start the backend.");
      setData(await response.json());
    } catch (requestError) {
      setError(requestError.message || "Could not load AI model metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const metrics = data?.metrics;
  const confusion = data?.confusion_matrix;
  const featureImportance = (data?.feature_importance || []).slice(0, 5);
  const maxImportance = Math.max(...featureImportance.map((item) => item.importance), 0.0001);

  return (
    <Layout title="AI Analytics">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-blue-400/25 bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3 text-blue-200">
              <FiCpu className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Loan Risk Model</h2>
              <p className="mt-1 text-sm text-gray-400">Held-out evaluation of the synthetic training set</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadMetrics}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-blue-400/30 hover:bg-blue-400/10 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </button>
        </motion.div>

        {loading ? (
          <GlassPanel className="text-sm text-gray-400">Loading model metrics...</GlassPanel>
        ) : error ? (
          <GlassPanel className="flex items-center gap-3 text-sm text-amber-200">
            <FiAlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </GlassPanel>
        ) : (
          <>
            {data.demo && (
              <p className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">
                DEMO DATA
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {METRIC_LABELS.map(([key, label], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassPanel className="h-full">
                    <p className="text-xs font-medium text-gray-400">{label}</p>
                    <p className="mt-2 text-2xl font-black text-transparent bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text">
                      {(Number(metrics[key]) * 100).toFixed(1)}%
                    </p>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>

            <p className="text-xs text-gray-500">
              {metrics.model_version} · {metrics.training_records} training records · {metrics.test_records} test records
            </p>

            <div className="grid gap-5 xl:grid-cols-2">
              <GlassPanel>
                <h3 className="mb-5 text-base font-bold text-white">Confusion Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[360px] text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500">
                        <th className="pb-3 text-left font-medium">Predicted</th>
                        <th className="pb-3 text-center font-medium" colSpan="2">Actual</th>
                      </tr>
                      <tr className="border-b border-white/10 text-xs text-gray-400">
                        <th className="pb-3 text-left font-medium">Class</th>
                        <th className="pb-3 text-center font-medium">Safe</th>
                        <th className="pb-3 text-center font-medium">Default</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-200">
                      <tr className="border-b border-white/5">
                        <th className="py-4 text-left font-medium">Safe</th>
                        <td className="py-4 text-center font-bold text-emerald-300">{confusion.actual_safe_predicted_safe}</td>
                        <td className="py-4 text-center font-bold text-rose-300">{confusion.actual_default_predicted_safe}</td>
                      </tr>
                      <tr>
                        <th className="py-4 text-left font-medium">Risk</th>
                        <td className="py-4 text-center font-bold text-amber-300">{confusion.actual_safe_predicted_risk}</td>
                        <td className="py-4 text-center font-bold text-emerald-300">{confusion.actual_default_predicted_risk}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-gray-500">Test set: {confusion.test_records} records</p>
              </GlassPanel>

              <GlassPanel>
                <h3 className="mb-5 text-base font-bold text-white">Feature Importance</h3>
                <div className="space-y-4">
                  {featureImportance.map((item, index) => (
                    <div key={item.feature}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium text-gray-300">{index + 1}. {item.feature.replaceAll("_", " ")}</span>
                        <span className="tabular-nums text-gray-500">{(item.importance * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
                          style={{ width: `${(item.importance / maxImportance) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}