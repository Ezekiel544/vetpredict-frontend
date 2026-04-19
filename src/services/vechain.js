/**
 * VeChain wallet integration
 * Supports VeWorld 1.x (window.vechain)
 * Mobile: deep-links into VeWorld app browser
 */

const NODE_URL   = process.env.REACT_APP_VECHAIN_NODE || "https://node-testnet.vechain.energy";
const CONTRACT   = process.env.REACT_APP_CONTRACT_ADDRESS || "";
const GENESIS_ID = "0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127";

// ─── Mobile detection ─────────────────────────────────────────
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// ─── Open site inside VeWorld app browser ────────────────────
const openInVeWorld = () => {
  const currentUrl = encodeURIComponent(window.location.href);
  window.location.href = `veworld://browser?url=${currentUrl}`;

  // Fallback: if VeWorld not installed, redirect to store after 2s
  setTimeout(() => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    window.location.href = isIOS
      ? "https://apps.apple.com/app/veworld/id1633613910"
      : "https://play.google.com/store/apps/details?id=com.vechain.wallet";
  }, 2000);
};

// ─── Detect wallet ────────────────────────────────────────────
export const hasConnex = () => !!(window.connex || window.vechain);

// ─── Connex singleton ─────────────────────────────────────────
let _connex = null;
const getConnex = async () => {
  if (_connex) return _connex;
  if (window.vechain && typeof window.vechain.newConnex === "function") {
    _connex = await window.vechain.newConnex({
      node:    NODE_URL,
      network: { id: GENESIS_ID },
    });
    return _connex;
  }
  if (window.connex) {
    _connex = window.connex;
    return _connex;
  }
  throw new Error("VeWorld wallet not detected. Please install VeWorld from veworld.net");
};

const getVendor = async () => {
  const connex = await getConnex();
  return connex.vendor;
};

// ─── ABI helpers ──────────────────────────────────────────────
const encodeUint256 = (n) => BigInt(n).toString(16).padStart(64, "0");
const encodeBool    = (b) => (b ? "1" : "0").padStart(64, "0");
const toHex         = (n) => "0x" + BigInt(n).toString(16);

// ─── CORRECT Function Selectors (verified from hardhat) ───────
const PREDICT_SIG       = "0xebd389fe"; // predict(uint256,bool)
const CLAIM_SIG         = "0x677bd9ff"; // claimWinnings(uint256)
const REFUND_SIG        = "0x5b7baf64"; // claimRefund(uint256)
const WITHDRAW_FEES_SIG = "0x164e68de"; // withdrawFees(address)

// ─── Get connected wallet address ────────────────────────────
export const getWalletAddress = async () => {
  // On mobile without VeWorld browser → deep link into VeWorld app
  if (isMobile() && !hasConnex()) {
    openInVeWorld();
    throw new Error("Opening VeWorld app...");
  }

  // On desktop without VeWorld extension
  if (!hasConnex()) {
    throw new Error("VeWorld wallet not detected. Please install VeWorld from veworld.net");
  }

  const vendor = await getVendor();
  const result = await vendor.sign("cert", {
    purpose: "identification",
    payload: { type: "text", content: "Connect to PredictChain" },
  }).request();
  return result.annex.signer.toLowerCase();
};

// ─── Sign auth message ────────────────────────────────────────
export const signAuthMessage = async (address, message) => {
  // On mobile without VeWorld browser → deep link into VeWorld app
  if (isMobile() && !hasConnex()) {
    openInVeWorld();
    throw new Error("Opening VeWorld app...");
  }

  const vendor = await getVendor();
  const result = await vendor.sign("cert", {
    purpose: "agreement",
    payload: { type: "text", content: message },
  }).request();

  return {
    signature: result.annex?.signature || result.signature || "",
    signer:    result.annex?.signer    || address,
  };
};

// ─── Place prediction on-chain ────────────────────────────────
export const placePredictionOnChain = async ({ contractMarketId, isYes, stakeVet }) => {
  if (!CONTRACT) throw new Error("Contract address not set. Check .env");
  const vendor   = await getVendor();
  const stakeWei = toHex(BigInt(Math.round(Number(stakeVet) * 1e18)));
  const data     = `${PREDICT_SIG}${encodeUint256(contractMarketId)}${encodeBool(isYes)}`;

  console.log("predict() calldata:", data);
  console.log("stakeWei:", stakeWei);
  console.log("contractMarketId:", contractMarketId, "isYes:", isYes);

  const result = await vendor
    .sign("tx", [{ to: CONTRACT, value: stakeWei, data }])
    .comment(`Predict ${isYes ? "YES" : "NO"} with ${stakeVet} VET`)
    .request();

  return result.txid;
};

// ─── Claim winnings on-chain ──────────────────────────────────
export const claimWinningsOnChain = async ({ contractPredictionId }) => {
  if (!CONTRACT) throw new Error("Contract address not set.");
  const vendor = await getVendor();
  const data   = `${CLAIM_SIG}${encodeUint256(contractPredictionId)}`;
  const result = await vendor
    .sign("tx", [{ to: CONTRACT, value: "0x0", data }])
    .comment("Claim prediction winnings")
    .request();
  return result.txid;
};

// ─── Claim refund ─────────────────────────────────────────────
export const claimRefundOnChain = async ({ contractPredictionId }) => {
  if (!CONTRACT) throw new Error("Contract address not set.");
  const vendor = await getVendor();
  const data   = `${REFUND_SIG}${encodeUint256(contractPredictionId)}`;
  const result = await vendor
    .sign("tx", [{ to: CONTRACT, value: "0x0", data }])
    .comment("Claim market refund")
    .request();
  return result.txid;
};

// ─── Wait for tx confirmation ─────────────────────────────────
export const waitForTx = async (txHash, maxWaitMs = 60000) => {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res  = await fetch(`${NODE_URL}/transactions/${txHash}/receipt`);
      const json = await res.json();
      if (json && json.reverted === false) return true;
      if (json && json.reverted === true)  throw new Error("Transaction reverted on-chain");
    } catch (e) {
      if (e.message.includes("reverted")) throw e;
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  throw new Error("Transaction timed out.");
};

// ─── Get live VET balance ─────────────────────────────────────
export const getVetBalance = async (address) => {
  try {
    const res  = await fetch(`${NODE_URL}/accounts/${address}`);
    const json = await res.json();
    const wei  = BigInt(json.balance || "0x0");
    return Number(wei) / 1e18;
  } catch {
    return null;
  }
};

// ─── Withdraw platform fees ───────────────────────────────────
export const withdrawFeesOnChain = async ({ toAddress }) => {
  if (!CONTRACT) throw new Error("Contract address not set.");
  const vendor        = await getVendor();
  const paddedAddress = toAddress.replace("0x", "").toLowerCase().padStart(64, "0");
  const data          = `${WITHDRAW_FEES_SIG}${paddedAddress}`;
  const result        = await vendor
    .sign("tx", [{ to: CONTRACT, value: "0x0", data }])
    .comment("Withdraw platform fees")
    .request();
  return result.txid;
};