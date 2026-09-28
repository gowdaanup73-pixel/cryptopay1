import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import {
  FiTruck,
  FiPackage,
  FiMapPin,
  FiShield,
  FiZap,
  FiExternalLink,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";

// ── Change this to your actual Supply Chain DApp URL ──
const SUPPLY_CHAIN_URL = "http://localhost:3001";

export default function ShipmentsPortal() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(null);
  const [launching, setLaunching] = useState(false);

  const handleLaunch = () => {
    setLaunching(true);
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      window.open(SUPPLY_CHAIN_URL, "_blank");
      setLaunching(false);
      setCountdown(null);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const features = [
    {
      icon: FiPackage,
      title: "Create Shipments",
      desc: "Create blockchain-verified shipments with full tracking history.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: FiMapPin,
      title: "Live Tracking",
      desc: "Track every shipment in real-time with on-chain status updates.",
      color: "from-purple-500 to-violet-500",
    },
    {
      icon: FiShield,
      title: "Tamper-Proof Records",
      desc: "All logistics data is immutably recorded on the Polygon blockchain.",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: FiZap,
      title: "Instant Settlement",
      desc: "Payments settle automatically when delivery is confirmed on-chain.",
      color: "from-orange-500 to-amber-500",
    },
  ];

  const steps = [
    "Connect your MetaMask wallet",
    "Create a new shipment with receiver & carrier addresses",
    "Track progress on the live dashboard",
    "Confirm delivery to settle on-chain",
  ];

  return (
    <>
      <Head>
        <title>Shipments — Supply Chain DApp | CryptoPay</title>
        <meta name="description" content="Launch the blockchain-powered supply chain logistics platform." />
      </Head>

      <Layout>
        <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">

          {/* ── Hero Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl p-10 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(20,184,166,0.14) 0%, rgba(16,185,129,0.08) 50%, rgba(59,130,246,0.1) 100%)",
              border: "1px solid rgba(20,184,166,0.25)",
              boxShadow: "0 0 60px rgba(20,184,166,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Background glow */}
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)" }}
            />

            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="relative z-10 mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #14b8a6, #059669)",
                boxShadow: "0 0 40px rgba(20,184,166,0.4)",
              }}
            >
              <FiTruck className="h-10 w-10 text-white" />
            </motion.div>

            <h1
              className="relative z-10 text-4xl font-black mb-3 tracking-tight"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                background: "linear-gradient(135deg, #34d399, #14b8a6, #60a5fa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Supply Chain DApp
            </h1>
            <p className="relative z-10 text-[#94a3b8] text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              A decentralized logistics platform powered by the Polygon blockchain.
              Create, track, and settle shipments — all on-chain, no middlemen.
            </p>

            {/* Launch Button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLaunch}
              disabled={launching}
              className="relative z-10 inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-bold text-lg shadow-xl transition-all duration-300"
              style={{
                background: launching
                  ? "linear-gradient(135deg, rgba(20,184,166,0.5), rgba(5,150,105,0.5))"
                  : "linear-gradient(135deg, #14b8a6, #059669)",
                boxShadow: launching ? "none" : "0 0 32px rgba(20,184,166,0.45)",
                cursor: launching ? "not-allowed" : "pointer",
              }}
            >
              {launching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Launching in {countdown}…</span>
                </>
              ) : (
                <>
                  <FiExternalLink className="h-5 w-5" />
                  <span>Launch Supply Chain DApp</span>
                  <FiArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>

            <p className="relative z-10 mt-4 text-[#475569] text-sm">
              Opens at{" "}
              <a
                href={SUPPLY_CHAIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 underline transition-colors"
              >
                {SUPPLY_CHAIN_URL}
              </a>
            </p>
          </motion.div>

          {/* ── Feature Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                className="group relative rounded-2xl p-6 overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                  style={{ background: "rgba(20,184,166,0.04)" }}
                />
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${f.color}`}
                  style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
                >
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* ── How it works ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-8"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h2
              className="text-xl font-bold mb-6"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                background: "linear-gradient(135deg, #e2e8f0, #94a3b8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              How It Works
            </h2>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #14b8a6, #059669)",
                      boxShadow: "0 0 12px rgba(20,184,166,0.4)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-[#cbd5e1] text-sm">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Quick link row ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-3 justify-center pb-4"
          >
            {[
              { label: "Create Shipment", path: "/create-shipment" },
              { label: "My Shipments",   path: "/shipments" },
              { label: "Live Tracking",  path: "/tracking" },
              { label: "Admin Panel",    path: "/admin" },
            ].map((link) => (
              <a
                key={link.label}
                href={`${SUPPLY_CHAIN_URL}${link.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-[#94a3b8] hover:text-white transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <FiTruck className="h-3.5 w-3.5" />
                {link.label}
                <FiExternalLink className="h-3 w-3 opacity-50" />
              </a>
            ))}
          </motion.div>

        </div>
      </Layout>
    </>
  );
}
