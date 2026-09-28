import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FiCreditCard, FiLock, FiShield, FiCheckCircle, FiArrowLeft, FiLoader } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import Head from "next/head";

export default function FiatCheckout() {
  const router = useRouter();
  const { order, amount, currency, wallet } = router.query;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");

  // Fire SMS once when the checkout page opens
  const smsSentRef = useRef(false);
  useEffect(() => {
    if (!order || smsSentRef.current) return;
    smsSentRef.current = true;

    fetch("/api/notify-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order, amount, currency, wallet }),
    }).catch((err) => console.error("[Notify SMS Error]:", err));
  }, [order]);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) return parts.join(" ");
    return value;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (cardNumber.length < 19 || expiry.length < 5 || cvc.length < 3 || !name) {
      toast.error("Please fill in all card details correctly.");
      return;
    }

    setLoading(true);

    // Simulate network delay for banking verification
    setTimeout(async () => {
      try {
        // Trigger the webhook internally to simulate Mudrex/Stripe success
        await fetch("/api/onramp/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: order,
            status: "COMPLETED",
          })
        });

        setSuccess(true);
        toast.success("Payment Successful! Funds routed to Merchant.");

        // Redirect back to home/dashboard after 3 seconds
        setTimeout(() => {
          router.push("/");
        }, 3000);

      } catch (err) {
        toast.error("Payment failed to process");
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0F0B13] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <Head>
        <title>Secure Fiat Checkout</title>
      </Head>
      <Toaster position="top-center" />
      
      {/* Background Ambience */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl mix-blend-screen"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2 text-blue-400">
              <FiShield className="w-5 h-5" />
              <span className="font-semibold text-sm tracking-widest uppercase">Secure Checkout</span>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm mb-1">Amount Due</p>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {currency === 'INR' ? '₹' : '$'}{amount || "0.00"}
            </h1>
            <p className="text-xs text-gray-500 mt-2 font-mono break-all px-4">
              To: {wallet || "Merchant Wallet"}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handlePay}
                className="space-y-6"
              >

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Cardholder Name</label>
                    <input 
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Card Number</label>
                    <div className="relative">
                      <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        maxLength="19"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white font-mono placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Expiry Date</label>
                      <input 
                        type="text"
                        placeholder="MM/YY"
                        maxLength="5"
                        value={expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "");
                          if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
                          setExpiry(v);
                        }}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">CVC</label>
                      <input 
                        type="text"
                        placeholder="123"
                        maxLength="4"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl py-4 shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-70"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-2">
                    {loading ? (
                      <><FiLoader className="w-5 h-5 animate-spin" /> <span>Encrypting...</span></>
                    ) : (
                      <><span>Pay Now</span></>
                    )}
                  </div>
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center flex flex-col items-center justify-center"
              >
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                  <FiCheckCircle className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Payment Complete!</h2>
                <p className="text-blue-400/80 mb-8 max-w-[250px] mx-auto text-sm">
                  {amount} {currency} has been successfully converted to USDC and delivered to the merchant.
                </p>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-400"
                  ></motion.div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Redirecting...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
