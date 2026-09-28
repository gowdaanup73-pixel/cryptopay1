// pages/api/loans.js
// Crypto Lending API — Supabase CRUD + local fallback + demo escrow simulation
//
// Endpoints:
//   GET   /api/loans?borrower=0x...          → list loans for borrower
//   GET   /api/loans?id=123                → single loan
//   GET   /api/loans?simulate=true&loanId=X → simulate escrow revenue
//   GET   /api/loans                       → all loans (admin)
//   POST  /api/loans                       → create loan application (status: pending_approval)
//   PATCH /api/loans                       → update loan status (approved, rejected, active, etc.)
//   DELETE /api/loans?id=123               → cancel loan

import { createClient } from "@supabase/supabase-js";

const hasSupabase =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabase = hasSupabase
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

// In-memory fallback store when Supabase is not configured or offline
// Initialized with realistic initial application data for demo
let fallbackLoans = [
  {
    loan_id: "loan_demo_001",
    farmer_id: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".toLowerCase(),
    amount_usdc: 100,
    collateral_kg: 400,
    loan_duration_days: 30,
    risk_level: "LOW",
    default_probability: 0.048,
    model_version: "xgboost-v1",
    status: "pending_approval",
    repay_by: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    tx_hash: null,
    created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    loan_id: "loan_demo_002",
    farmer_id: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC".toLowerCase(),
    amount_usdc: 250,
    collateral_kg: 1000,
    loan_duration_days: 60,
    risk_level: "HIGH",
    default_probability: 0.725,
    model_version: "xgboost-v1",
    status: "pending_approval",
    repay_by: new Date(Date.now() + 60 * 86400 * 1000).toISOString(),
    tx_hash: null,
    created_at: new Date(Date.now() - 7200 * 1000).toISOString(),
  }
];

// Mock crypto price table for demo escrow simulation
const CRYPTO_PRICES_USD = {
  bitcoin: 0.3,
  ethereum: 0.25,
  solana: 0.35,
  polkadot: 0.2,
  chainlink: 0.28,
};

function simulateEscrowRevenue(collateralKg) {
  const assets = Object.keys(CRYPTO_PRICES_USD);
  const crypto = assets[Math.floor(Math.random() * assets.length)];
  const price = CRYPTO_PRICES_USD[crypto];
  const soldKg = collateralKg * 0.6;
  const revenueUSDC = parseFloat((soldKg * price).toFixed(2));
  return { crypto, soldKg: parseFloat(soldKg.toFixed(1)), revenueUSDC };
}

export default async function handler(req, res) {
  try {
    // ──────────────────────────────────────────────────────
    // GET
    // ──────────────────────────────────────────────────────
    if (req.method === "GET") {
      const { borrower, farmer: queryFarmer, id, simulate, loanId } = req.query;
      const farmerAddress = (borrower || queryFarmer || "").toLowerCase();

      // Demo escrow simulation
      if (simulate === "true" && loanId) {
        let collateralKg = 200;
        if (supabase) {
          const { data: loan } = await supabase
            .from("loans")
            .select("*")
            .eq("loan_id", loanId)
            .single();
          if (loan?.collateral_kg) collateralKg = parseFloat(loan.collateral_kg);
        } else {
          const loan = fallbackLoans.find((l) => l.loan_id === loanId);
          if (loan?.collateral_kg) collateralKg = parseFloat(loan.collateral_kg);
        }

        const { crypto, soldKg, revenueUSDC } = simulateEscrowRevenue(collateralKg);
        return res.status(200).json({
          success: true,
          simulation: true,
          crypto,
          soldKg,
          revenueUSDC,
          message: `Escrow: Sold ${soldKg} units ${crypto} @ $${CRYPTO_PRICES_USD[crypto]}/unit → $${revenueUSDC} USDC credited`,
        });
      }

      // Single loan by ID
      if (id) {
        if (supabase) {
          const { data, error } = await supabase
            .from("loans")
            .select("*")
            .eq("loan_id", id)
            .single();
          if (!error && data) return res.status(200).json({ success: true, loan: data });
        }
        const item = fallbackLoans.find((l) => l.loan_id === id);
        if (item) return res.status(200).json({ success: true, loan: item });
        return res.status(404).json({ success: false, error: "Loan not found" });
      }

      // All loans for borrower
      if (farmerAddress) {
        if (supabase) {
          try {
            const { data, error } = await supabase
              .from("loans")
              .select("*")
              .ilike("farmer_id", farmerAddress)
              .order("created_at", { ascending: false });
            if (!error && data) return res.status(200).json({ success: true, loans: data });
          } catch (e) {
            console.warn("Supabase query failed, using local store:", e.message);
          }
        }
        const filtered = fallbackLoans.filter(
          (l) => l.farmer_id.toLowerCase() === farmerAddress
        );
        return res.status(200).json({ success: true, loans: filtered });
      }

      // All loans (Admin view)
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("loans")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100);
          if (!error && data) return res.status(200).json({ success: true, loans: data });
        } catch (e) {
          console.warn("Supabase admin query failed, using local store:", e.message);
        }
      }
      return res.status(200).json({ success: true, loans: fallbackLoans });
    }

    // ──────────────────────────────────────────────────────
    // POST — create loan application
    // ──────────────────────────────────────────────────────
    if (req.method === "POST") {
      const { simulate, loanId } = req.query;

      if (simulate === "true" && loanId) {
        const item = fallbackLoans.find((l) => l.loan_id === loanId);
        const collateralKg = item?.collateral_kg || 200;
        const { crypto, soldKg, revenueUSDC } = simulateEscrowRevenue(parseFloat(collateralKg));
        return res.status(200).json({
          success: true,
          simulation: true,
          crypto,
          soldKg,
          revenueUSDC,
          message: `Simulated: sold ${soldKg} units ${crypto} → $${revenueUSDC} USDC available to repay`,
        });
      }

      const {
        loan_id,
        farmer_id,
        borrower,
        borrower_wallet,
        amount_usdc,
        loan_amount,
        amount,
        collateral_kg,
        collateral_amount,
        collateral,
        loan_duration_days = 30,
        risk_level = "LOW",
        default_probability = 0.05,
        model_version = "xgboost-v1",
        status = "pending_approval",
        repay_by,
        tx_hash = null,
      } = req.body;

      const applicant = (farmer_id || borrower || borrower_wallet || "").toLowerCase();
      const finalAmount = amount_usdc || loan_amount || amount;
      const finalCollateral = collateral_kg || collateral_amount || collateral;

      // Validate required fields
      if (!applicant) {
        return res.status(400).json({ success: false, error: "farmer_id or borrower_wallet is required" });
      }
      if (!finalAmount || isNaN(Number(finalAmount)) || Number(finalAmount) <= 0) {
        return res.status(400).json({ success: false, error: "loan amount must be a positive number" });
      }

      const newLoan = {
        loan_id: loan_id || `loan_${Date.now()}_${applicant.slice(2, 8)}`,
        farmer_id: applicant,
        amount_usdc: parseFloat(finalAmount),
        collateral_kg: parseFloat(finalCollateral || Number(finalAmount) * 4),
        loan_duration_days: parseInt(loan_duration_days, 10) || 30,
        risk_level: String(risk_level).toUpperCase(),
        default_probability: parseFloat(default_probability) || 0.05,
        model_version: model_version || "xgboost-v1",
        status: status || "pending_approval",
        repay_by: repay_by || new Date(Date.now() + (parseInt(loan_duration_days, 10) || 30) * 86400 * 1000).toISOString(),
        tx_hash: tx_hash || null,
        created_at: new Date().toISOString(),
      };

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("loans")
            .insert(newLoan)
            .select()
            .single();
          if (!error && data) {
            // Also mirror to memory for instant consistency
            fallbackLoans.unshift(data);
            return res.status(201).json({ success: true, loan: data });
          }
        } catch (e) {
          console.warn("Supabase insert failed, using memory store:", e.message);
        }
      }

      fallbackLoans.unshift(newLoan);
      return res.status(201).json({ success: true, loan: newLoan });
    }

    // ──────────────────────────────────────────────────────
    // PATCH — update loan status (approve, reject, disburse/active)
    // ──────────────────────────────────────────────────────
    if (req.method === "PATCH") {
      const { id, status, tx_hash } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: "id is required" });
      }

      const validStatuses = [
        "pending_approval",
        "approved",
        "rejected",
        "active",
        "repaid",
        "liquidated",
        "cancelled"
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `status must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const updates = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (tx_hash) updates.tx_hash = tx_hash;

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("loans")
            .update(updates)
            .eq("loan_id", id)
            .select()
            .single();
          if (!error && data) {
            const index = fallbackLoans.findIndex((l) => l.loan_id === id || l.id === id);
            if (index !== -1) fallbackLoans[index] = { ...fallbackLoans[index], ...updates };
            return res.status(200).json({ success: true, loan: data });
          }
        } catch (e) {
          console.warn("Supabase update failed, using memory store:", e.message);
        }
      }

      const index = fallbackLoans.findIndex((l) => l.loan_id === id || l.id === id);
      if (index !== -1) {
        fallbackLoans[index] = { ...fallbackLoans[index], ...updates };
        return res.status(200).json({ success: true, loan: fallbackLoans[index] });
      }

      return res.status(404).json({ success: false, error: "Loan not found" });
    }

    // ──────────────────────────────────────────────────────
    // DELETE — soft delete / cancel
    // ──────────────────────────────────────────────────────
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, error: "id required" });
      }

      if (supabase) {
        try {
          await supabase
            .from("loans")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("loan_id", id);
        } catch (e) {
          console.warn("Supabase delete failed:", e.message);
        }
      }

      const index = fallbackLoans.findIndex((l) => l.loan_id === id);
      if (index !== -1) {
        fallbackLoans[index].status = "cancelled";
      }

      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err) {
    console.error("Loans API error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}
