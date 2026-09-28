import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";
import CryptoPaymentGateway from "../../../web3/artifacts/contracts/CryptoPaymentGateway.sol/CryptoPaymentGateway.json";
import { getContractAddresses } from "../../../lib/constants";

const LOCAL_CHAIN_ID = 1337;
const MAX_RECORDS = 50;
const gatewayAddresses = getContractAddresses(LOCAL_CHAIN_ID);
const gatewayInterface = new ethers.utils.Interface(CryptoPaymentGateway.abi);

function findPaymentEvent(receipt) {
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== gatewayAddresses.PAYMENT_GATEWAY.toLowerCase()) continue;
    try {
      const event = gatewayInterface.parseLog(log);
      if (event.name === "PaymentReceived") return event.args;
    } catch {
      // Ignore unrelated gateway events in the same transaction.
    }
  }
  return null;
}

async function checkPayment(record, provider) {
  const check = {
    tx_hash: record.tx_hash,
    token_symbol: record.token_symbol,
    token_amount: String(record.token_amount),
    created_at: record.created_at,
    status: "needs_review",
    reason: "",
  };

  const receipt = await provider.getTransactionReceipt(record.tx_hash);
  if (!receipt) {
    check.reason = "Transaction is not on the current Hardhat chain";
    return check;
  }
  if (receipt.transactionHash.toLowerCase() !== record.tx_hash.toLowerCase()) {
    check.reason = "Transaction ID does not match the saved record";
    return check;
  }
  if (receipt.status !== 1) {
    check.reason = "Blockchain transaction did not succeed";
    return check;
  }

  const payment = findPaymentEvent(receipt);
  if (!payment) {
    check.reason = "No payment event was found for the gateway";
    return check;
  }

  const symbol = String(record.token_symbol || "").toUpperCase();
  const expectedEventToken = { USDT: 1, USDC: 2 }[symbol];
  if (expectedEventToken === undefined || Number(payment.token) !== expectedEventToken) {
    check.reason = "Token does not match the saved record";
    return check;
  }

  const expectedTokenAddress = gatewayAddresses[symbol];
  if (
    !expectedTokenAddress ||
    !record.token_address ||
    record.token_address.toLowerCase() !== expectedTokenAddress.toLowerCase()
  ) {
    check.reason = "Token address does not match the Hardhat deployment";
    return check;
  }

  if (
    !record.buyer_wallet ||
    payment.buyer.toLowerCase() !== record.buyer_wallet.toLowerCase()
  ) {
    check.reason = "Buyer wallet does not match the saved record";
    return check;
  }

  if (
    record.product_id === null ||
    !ethers.BigNumber.from(record.product_id).eq(payment.productId)
  ) {
    check.reason = "Product does not match the saved record";
    return check;
  }

  let expectedAmount;
  try {
    expectedAmount = ethers.utils.parseUnits(String(record.token_amount), 6);
  } catch {
    check.reason = "Saved amount is invalid";
    return check;
  }
  if (!expectedAmount.eq(payment.amount)) {
    check.reason = "Amount does not match the saved record";
    return check;
  }

  check.status = "verified";
  check.reason = "Saved details match the successful Hardhat transaction";
  return check;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const wallet = Array.isArray(req.query.wallet) ? req.query.wallet[0] : req.query.wallet;
  if (!wallet || !ethers.utils.isAddress(wallet)) {
    return res.status(400).json({ error: "A valid wallet query parameter is required" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: "Supabase is not configured for payment verification" });
  }

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545"
  );

  try {
    const network = await provider.getNetwork();
    if (network.chainId !== LOCAL_CHAIN_ID) {
      return res.status(503).json({ error: "The local Hardhat chain is not running on chain ID 1337" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: records, error } = await supabase
      .from("crypto_payments")
      .select("tx_hash, buyer_wallet, product_id, token_symbol, token_address, token_amount, created_at")
      .eq("chain_id", LOCAL_CHAIN_ID)
      .eq("buyer_wallet", wallet.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(MAX_RECORDS);

    if (error) {
      console.error("[payments/verification] Supabase error:", error.message);
      return res.status(503).json({
        error: "Could not load saved payments",
        hint: "Supabase could not be reached. Check NEXT_PUBLIC_SUPABASE_URL in .env.local and confirm it is the URL for your active project.",
      });
    }

    const checks = await Promise.all((records || []).map((record) => checkPayment(record, provider)));
    const verified = checks.filter((check) => check.status === "verified").length;

    return res.status(200).json({
      network: "Hardhat Local",
      checked: checks.length,
      verified,
      needs_review: checks.length - verified,
      limited: checks.length === MAX_RECORDS,
      checks,
    });
  } catch (error) {
    console.error("[payments/verification] Verification error:", error.message);
    return res.status(503).json({ error: "Could not verify payments against the local Hardhat chain" });
  } finally {
    provider.removeAllListeners();
  }
}