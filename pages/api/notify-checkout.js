// /api/notify-checkout.js
// Sends an SMS to the merchant when the fiat checkout page is opened.
// Called server-side so Twilio credentials never reach the browser.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { order, amount, currency, wallet, productName } = req.body;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone  = process.env.TWILIO_SENDER_PHONE;
  const toPhone    = process.env.MERCHANT_PHONE;

  if (!accountSid || !authToken || !fromPhone || !toPhone) {
    console.warn("⚠️  SMS skipped — Twilio env vars not configured");
    return res.status(200).json({ sent: false, reason: "Twilio not configured" });
  }

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);

    const shortWallet = wallet
      ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
      : "Unknown";

    const timeIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const body = `Checkout Alert: Order ${order || "N/A"} opened for ${amount} INR by ${shortWallet}.`;

    const msg = await client.messages.create({ body, from: fromPhone, to: toPhone });
    console.log(`📱 Checkout SMS sent [${msg.sid}]`);

    return res.status(200).json({ sent: true, sid: msg.sid });
  } catch (err) {
    console.error("[Checkout SMS Error]:", err.message);
    // Never crash the checkout — just log and continue
    return res.status(200).json({ sent: false, reason: err.message });
  }
}
