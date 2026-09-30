import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiCpu, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import Layout from "../components/Layout";

const OVERALL_METRIC_LABELS = [
  ["accuracy", "Accuracy"],
  ["macro_f1", "Macro F1"],
  ["balanced_accuracy", "Balanced accuracy"],
  ["pr_auc", "PR-AUC"],
];

const DEFAULT_METRIC_LABELS = [
  ["precision_default", "Default precision"],
  ["recall_default", "Default recall"],
  ["f1_default", "Default F1"],
];

const OCR_METRIC_LABELS = [
  ["exact_match_accuracy", "Exact transcription accuracy"],
  ["character_error_rate", "Character error rate"],
  ["word_error_rate", "Word error rate"],
  ["word_precision", "Word precision"],
  ["word_recall", "Word recall"],
  ["word_f1", "Word F1"],
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

function MetricGrid({ metrics, labels }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {labels.map(([key, label]) => {
        const value = Number(metrics[key]);
        return (
          <GlassPanel key={key} className="h-full">
            <p className="text-xs font-medium text-gray-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-transparent bg-gradient-to-r from-blue-300 to-cyan-200 bg-clip-text">
              {Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "—"}
            </p>
          </GlassPanel>
        );
      })}
    </div>
  );
}

export default function AiAnalyticsPage() {
  const [data, setData] = useState({ creditDefault: null, ocr: null });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({ creditDefault: "", ocr: "" });

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setErrors({ creditDefault: "", ocr: "" });
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
      const load = async (endpoint) => {
        const response = await fetch(`${backendUrl}/api/ai/${endpoint}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Metrics unavailable");
        return result;
      };
      const [creditDefault, ocr] = await Promise.allSettled([
        load("credit-default-metrics"),
        load("ocr-metrics"),
      ]);
      setData({
        creditDefault: creditDefault.status === "fulfilled" ? creditDefault.value : null,
        ocr: ocr.status === "fulfilled" ? ocr.value : null,
      });
      setErrors({
        creditDefault: creditDefault.status === "rejected" ? creditDefault.reason.message : "",
        ocr: ocr.status === "rejected" ? ocr.reason.message : "",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const creditDefaultMetrics = data.creditDefault?.metrics;
  const confusion = data.creditDefault?.confusion_matrix;
  const featureImportance = (data.creditDefault?.feature_importance || []).slice(0, 5);
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
              <h2 className="text-2xl font-bold text-white">AI Model Evaluation</h2>
              <p className="mt-1 text-sm text-gray-400">Independent held-out benchmark results</p>
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

        <section className="space-y-4">
          <div>
              <h3 className="text-lg font-bold text-white">Credit-card Default Risk</h3>
            <p className="mt-1 text-sm text-gray-400">UCI benchmark · overall accuracy is around 79%, while default recall and F1 are lower due to class imbalance.</p>
          </div>
          {loading ? <GlassPanel className="text-sm text-gray-400">Loading credit-default metrics...</GlassPanel> : errors.creditDefault ? (
            <GlassPanel className="flex items-center gap-3 text-sm text-amber-200"><FiAlertCircle className="h-5 w-5 shrink-0" />{errors.creditDefault}</GlassPanel>
          ) : creditDefaultMetrics ? (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Overall benchmark performance</h4>
                <MetricGrid metrics={creditDefaultMetrics} labels={OVERALL_METRIC_LABELS} />
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Default-class performance</h4>
                <MetricGrid metrics={creditDefaultMetrics} labels={DEFAULT_METRIC_LABELS} />
              </div>
              <p className="text-xs text-gray-500">
                {creditDefaultMetrics.dataset} · {creditDefaultMetrics.training_records} training · {creditDefaultMetrics.validation_records} validation · {creditDefaultMetrics.test_records} held-out clients
              </p>
              <p className="text-xs text-gray-500">Majority baseline accuracy: {(creditDefaultMetrics.majority_baseline_accuracy * 100).toFixed(1)}%; macro F1: {(creditDefaultMetrics.majority_baseline_macro_f1 * 100).toFixed(1)}%. {creditDefaultMetrics.limitations}</p>
              <div className="grid gap-5 xl:grid-cols-2">
                <GlassPanel>
                  <h4 className="mb-5 text-base font-bold text-white">Test Confusion Matrix</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[360px] text-sm">
                      <thead><tr className="text-xs text-gray-500"><th className="pb-3 text-left font-medium">Actual</th><th className="pb-3 text-center font-medium">Predicted no default</th><th className="pb-3 text-center font-medium">Predicted default</th></tr></thead>
                      <tbody className="text-gray-200">
                        <tr className="border-t border-white/5"><th className="py-4 text-left font-medium">No default</th><td className="py-4 text-center text-emerald-300">{confusion.true_no_default_predicted_no_default}</td><td className="py-4 text-center text-amber-300">{confusion.true_no_default_predicted_default}</td></tr>
                        <tr className="border-t border-white/5"><th className="py-4 text-left font-medium">Default</th><td className="py-4 text-center text-rose-300">{confusion.true_default_predicted_no_default}</td><td className="py-4 text-center text-emerald-300">{confusion.true_default_predicted_default}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Test set: {confusion.test_records} clients</p>
                </GlassPanel>
                <GlassPanel>
                  <h4 className="mb-5 text-base font-bold text-white">Feature Importance</h4>
                  <div className="space-y-4">{featureImportance.map((item, index) => <div key={item.feature}><div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="font-medium text-gray-300">{index + 1}. {item.feature.replaceAll("_", " ")}</span><span className="tabular-nums text-gray-500">{(item.importance * 100).toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-300" style={{ width: `${(item.importance / maxImportance) * 100}%` }} /></div></div>)}</div>
                </GlassPanel>
              </div>
            </>
          ) : null}
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">Identity Document OCR</h3>
            <p className="mt-1 text-sm text-gray-400">MIDV-500 benchmark · text transcription, not document authentication</p>
          </div>
          {loading ? <GlassPanel className="text-sm text-gray-400">Loading OCR metrics...</GlassPanel> : errors.ocr ? (
            <GlassPanel className="flex items-center gap-3 text-sm text-amber-200"><FiAlertCircle className="h-5 w-5 shrink-0" />{errors.ocr}</GlassPanel>
          ) : data.ocr?.metrics ? (
            <>
              <MetricGrid metrics={data.ocr.metrics} labels={OCR_METRIC_LABELS} />
              <p className="text-xs text-gray-500">{data.ocr.metrics.dataset} · {data.ocr.metrics.test_records} held-out images · lower CER/WER is better. {data.ocr.metrics.limitations}</p>
            </>
          ) : null}
        </section>
      </div>
    </Layout>
  );
}