import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import Layout from "../components/Layout";
import OnRampButton from "../components/OnRampButton";
import { FiSend, FiDollarSign } from "react-icons/fi";
import { motion } from "framer-motion";
import { getTokenAddress, TOKEN_CONFIG } from "../lib/constants";
import toast from "react-hot-toast";

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export default function Transfer() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("POL");
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!recipient || !amount) {
      toast.error("Please fill all fields");
      return;
    }
    
    if (!ethers.utils.isAddress(recipient)) {
      toast.error("Invalid recipient address");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Processing transfer...");

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      if (token === "POL") {
        const tx = await signer.sendTransaction({
          to: recipient,
          value: ethers.utils.parseEther(amount)
        });
        toast.loading("Waiting for confirmation...", { id: toastId });
        await tx.wait();
        toast.success("Transfer successful!", { id: toastId });
      } else {
        const tokenAddr = getTokenAddress(token);
        if (!tokenAddr) throw new Error("Token address not found");
        
        const decimals = TOKEN_CONFIG[token]?.decimals || 6;
        const contract = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
        
        const tx = await contract.transfer(recipient, ethers.utils.parseUnits(amount, decimals));
        toast.loading("Waiting for confirmation...", { id: toastId });
        await tx.wait();
        toast.success("Transfer successful!", { id: toastId });
      }
      setAmount("");
      setRecipient("");
    } catch (error) {
      console.error(error);
      toast.error("Transfer failed: " + (error.reason || error.message), { id: toastId });
    }
    setLoading(false);
  };

  return (
    <Layout title="Transfer Funds">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Crypto Transfer Dashboard */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl border backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(15, 11, 19, 0.8) 0%, rgba(26, 22, 37, 0.8) 50%, rgba(15, 11, 19, 0.8) 100%)",
            borderColor: "rgba(139, 92, 246, 0.2)"
          }}
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30">
              <FiSend className="h-8 w-8 text-purple-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                Send Crypto
              </h1>
              <p className="text-gray-400 mt-1">
                Transfer funds instantly to any address
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Recipient Address</label>
              <input 
                type="text" 
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                className="w-full px-4 py-3 rounded-xl backdrop-blur-sm border transition-all duration-300 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{
                  background: "rgba(139, 92, 246, 0.05)",
                  borderColor: "rgba(139, 92, 246, 0.2)"
                }}
                placeholder="0x..."
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl backdrop-blur-sm border transition-all duration-300 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{
                    background: "rgba(139, 92, 246, 0.05)",
                    borderColor: "rgba(139, 92, 246, 0.2)"
                  }}
                  placeholder="0.00"
                />
              </div>
              <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-300 mb-2">Asset</label>
                <select 
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl backdrop-blur-sm border transition-all duration-300 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{
                    background: "rgba(139, 92, 246, 0.1)",
                    borderColor: "rgba(139, 92, 246, 0.2)"
                  }}
                >
                  <option value="POL" className="bg-gray-900">POL</option>
                  <option value="USDT" className="bg-gray-900">USDT</option>
                  <option value="USDC" className="bg-gray-900">USDC</option>
                </select>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTransfer}
              disabled={loading || !isConnected}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-bold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Processing..." : !isConnected ? "Connect Wallet" : "Send Funds"}
            </motion.button>
          </div>
        </motion.div>

        {/* Fiat On-Ramp Modal/Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-2xl border backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(15, 11, 19, 0.8) 0%, rgba(26, 22, 37, 0.8) 50%, rgba(15, 11, 19, 0.8) 100%)",
            borderColor: "rgba(59, 130, 246, 0.2)"
          }}
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30">
              <FiDollarSign className="h-8 w-8 text-blue-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Fiat Conversion
              </h2>
              <p className="text-gray-400 mt-1">
                Convert your fiat currency directly to crypto via card
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 p-6 rounded-xl border border-blue-500/20">
             <p className="text-sm text-gray-300 mb-4">
               Use our integrated payment gateway to purchase crypto directly with your credit or debit card. The funds will be deposited into your connected wallet.
             </p>
             <OnRampButton 
               product={{ 
                 priceUSDC: amount || 10, 
                 id: "fiat-to-crypto", 
                 name: "Crypto Purchase", 
                 merchant: address || "0x0000000000000000000000000000000000000000"
               }} 
             />
          </div>
        </motion.div>

      </div>
    </Layout>
  );
}
