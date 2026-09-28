// ─────────────────────────────────────────────────────────────
// Pinata Service — uploads JSON to IPFS via Pinata
// ─────────────────────────────────────────────────────────────
import fetch from "node-fetch";
import { env } from "../config/env";

const PINATA_BASE_URL = "https://api.pinata.cloud";

/**
 * Upload a JSON object to IPFS via Pinata.
 * Returns the IPFS CID (content identifier).
 */
export async function uploadJsonToIpfs(
  jsonData: any,
  name: string = "KYC Proof"
): Promise<{ success: boolean; cid: string; error?: string }> {
  try {
    const body = {
      pinataContent: jsonData,
      pinataMetadata: {
        name,
        keyvalues: {
          type: "kyc-proof",
          timestamp: new Date().toISOString(),
        },
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };

    const response = await fetch(`${PINATA_BASE_URL}/pinning/pinJSONToIPFS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.PINATA_JWT}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata returned HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    return {
      success: true,
      cid: result.IpfsHash,
    };
  } catch (err: any) {
    console.error("❌ Pinata upload failed:", err.message);
    return {
      success: false,
      cid: "",
      error: err.message,
    };
  }
}
