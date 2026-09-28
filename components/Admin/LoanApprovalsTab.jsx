import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheck,
  FiX,
  FiShield,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
  FiAlertTriangle,
  FiCopy,
  FiCheckCircle,
  FiXCircle,
  FiZap,
  FiTrendingUp,
  FiUser,
  FiPackage,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function LoanApprovalsTab() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});

  const loadLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/loans");
      const data = await res.json();
      if (res.ok && data.loans) {
        setLoans(data.loans);
      } else {
        throw new Error(data.error || "Failed to load loan applications");
      }
    } catch (e) {
      toast.error(e.message || "Could not fetch loans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const handleUpdateStatus = async (loanId, newStatus) => {
    setActionLoading((prev) => ({ ...prev, [loanId]: true }));
    try {
      const res = await fetch("/api/loans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: loanId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");

      toast.success(
        newStatus === "approved"
          ? "Loan approved! Ready for blockchain disbursement."
          : "Loan rejected."
      );
      loadLoans();
    } catch (e) {
      toast.error(e.message || "Failed to update loan");
    } finally {
      setActionLoading((prev) => ({ ...prev, [loanId]: false }));
    }
  };

  const copyToClipboard = (text, label = "Address") => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copied!`))
      .catch(() => toast.error("Copy failed"));
  };

  const formatAddress = (addr) => {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const filteredLoans = loans.filter((loan) => {
    if (filter === "all") return true;
    return loan.status === filter;
  });

  const pendingCount = loans.filter((l) => l.status === "pending_approval").length;
  const approvedCount = loans.filter((l) => l.status === "approved").length;
  const rejectedCount = loans.filter((l) => l.status === "rejected").length;
  const activeCount = loans.filter((l) => l.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
            <FiShield className="text-blue-400" />
            ML Loan Risk Approvals
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Review machine learning risk assessments and approve or reject borrower loan applications
          </p>
        </div>

        <button
          type="button"
          onClick={loadLoans}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 hover:border-blue-500/30 transition text-sm font-semibold disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Loans
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <p className="text-xs font-semibold uppercase text-amber-400">Pending Review</p>
          <p className="text-2xl font-black text-white mt-1">{pendingCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Awaiting admin decision</p>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-xs font-semibold uppercase text-emerald-400">Approved</p>
          <p className="text-2xl font-black text-white mt-1">{approvedCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Ready for blockchain</p>
        </div>
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
          <p className="text-xs font-semibold uppercase text-rose-400">Rejected</p>
          <p className="text-2xl font-black text-white mt-1">{rejectedCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">High risk or denied</p>
        </div>
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <p className="text-xs font-semibold uppercase text-blue-400">Active On-Chain</p>
          <p className="text-2xl font-black text-white mt-1">{activeCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Smart contract loans</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-2">
        {[
          ["all", "All Applications"],
          ["pending_approval", `Pending (${pendingCount})`],
          ["approved", `Approved (${approvedCount})`],
          ["rejected", `Rejected (${rejectedCount})`],
          ["active", `Active On-Chain (${activeCount})`],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filter === key
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loans Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 flex items-center justify-center gap-2">
          <FiRefreshCw className="animate-spin w-5 h-5 text-blue-400" />
          Loading applications...
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="text-center py-12 border border-white/10 rounded-2xl bg-white/[0.02]">
          <FiShield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">No loan applications found</p>
          <p className="text-gray-500 text-xs mt-1">
            Applications submitted by borrowers through the Loan Form will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-gray-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3.5">Borrower</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Collateral</th>
                <th className="px-4 py-3.5">Duration</th>
                <th className="px-4 py-3.5">ML Risk Level</th>
                <th className="px-4 py-3.5">Default Prob.</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {filteredLoans.map((loan) => {
                const isPending = loan.status === "pending_approval";
                const isApproved = loan.status === "approved";
                const isRejected = loan.status === "rejected";
                const isActive = loan.status === "active";
                const isBusy = actionLoading[loan.loan_id];

                return (
                  <tr key={loan.loan_id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white font-medium">
                          {formatAddress(loan.farmer_id)}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(loan.farmer_id)}
                          className="text-gray-500 hover:text-white"
                          title="Copy full address"
                        >
                          <FiCopy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">{loan.loan_id}</span>
                    </td>

                    <td className="px-4 py-4 font-bold text-white">
                      ${Number(loan.amount_usdc || 0).toLocaleString()} USDC
                    </td>

                    <td className="px-4 py-4 text-gray-300">
                      {Number(loan.collateral_kg || 0).toLocaleString()} units
                    </td>

                    <td className="px-4 py-4 text-gray-300">
                      {loan.loan_duration_days || 30} days
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                          loan.risk_level === "LOW"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : loan.risk_level === "MEDIUM"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {loan.risk_level || "LOW"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-bold text-white">
                        {(Number(loan.default_probability || 0) * 100).toFixed(1)}%
                      </span>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {loan.model_version || "xgboost-v1"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          <FiClock className="w-3 h-3 animate-pulse" />
                          Pending Review
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          <FiCheckCircle className="w-3 h-3" />
                          Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                          <FiXCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                          <FiZap className="w-3 h-3" />
                          On-Chain Active
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(loan.loan_id, "approved")}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold transition disabled:opacity-50"
                          >
                            <FiCheck className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(loan.loan_id, "rejected")}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs font-bold transition disabled:opacity-50"
                          >
                            <FiX className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : isApproved ? (
                        <span className="text-xs text-emerald-400 font-medium">
                          Approved (Awaiting Disburse)
                        </span>
                      ) : isRejected ? (
                        <span className="text-xs text-rose-400 font-medium">Rejected</span>
                      ) : (
                        <span className="text-xs text-gray-500 font-mono">
                          {loan.tx_hash ? `${loan.tx_hash.slice(0, 8)}...` : "Confirmed"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
