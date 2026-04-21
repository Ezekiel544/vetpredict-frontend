const NODE_URL   = process.env.REACT_APP_VECHAIN_NODE || "https://node-testnet.vechain.energy";
const CONTRACT   = process.env.REACT_APP_CONTRACT_ADDRESS || "";
const GENESIS_ID = "0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127";

const encodeUint256 = (n) => BigInt(n).toString(16).padStart(64, "0");
const encodeBool    = (b) => (b ? "1" : "0").padStart(64, "0");
const toHex         = (n) => "0x" + BigInt(n).toString(16);

const PREDICT_SIG       = "0xebd389fe";
const CLAIM_SIG         = "0x677bd9ff";
const REFUND_SIG        = "0x5b7baf64";
const WITHDRAW_FEES_SIG = "0x164e68de";

export const hasConnex = () => !!(window.connex || window.vechain);

export const waitForConnex = (timeoutMs = 5000) =>
  new Promise((resolve) => {
    if (hasConnex()) return resolve(true);
    const interval = setInterval(() => {
      if (hasConnex()) { clearInterval(interval); resolve(true); }
    }, 100);
    setTimeout(() => { clearInterval(interval); resolve(false); }, timeoutMs);
  });

export const isMobileBrowser = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.connex && !window.vechain;

export const openInVeWorld = () => {
  const url = window.location.href;
  window.location.href = `veworld://browser?url=${encodeURIComponent(url)}`;
  setTimeout(() => { window.location.href = "https://www.veworld.net"; }, 2000);
};

// ─── Connex singleton ─────────────────────────────────────────
let _connex = null;
const getConnex = async () => {
  if (_connex) return _connex;

  // VeWorld mobile injects window.vechain
  if (window.vechain) {
    try {
      if (typeof window.vechain.newConnex === "function") {
        _connex = await window.vechain.newConnex({
          node:    NODE_URL,
          network: { id: GENESIS_ID },
        });
        return _connex;
      }
      // Some versions expose connex directly on window.vechain
      if (window.vechain.connex) {
        _connex = window.vechain.connex;
        return _connex;
      }
      // Some versions expose thor/vendor directly
      if (window.vechain.thor) {
        _connex = window.vechain;
        return _connex;
      }
    } catch (e) {
      throw new Error("VeWorld connection failed: " + e.message);
    }
  }

  // Desktop VeWorld extension injects window.connex
  if (window.connex) {
    _connex = window.connex;
    return _connex;
  }

  // Not inside VeWorld — redirect mobile users
  if (isMobileBrowser()) {
    openInVeWorld();
    throw new Error("OPEN_IN_VEWORLD");
  }

  throw new Error("VeWorld wallet not detected. Please install VeWorld from veworld.net");
};

const getVendor = async () => {
  const connex = await getConnex();
  // Handle different vendor locations
  if (connex.vendor) return connex.vendor;
  if (window.vechain?.vendor) return window.vechain.vendor;
  throw new Error("VeWorld vendor not found. Please update your VeWorld app.");
};

export const getWalletAddress = async () => {
  const vendor = await getVendor();
  const result = await vendor.sign("cert", {
    purpose: "identification",
    payload: { type: "text", content: "Connect to PredictChain" },
  }).request();
  return result.annex.signer.toLowerCase();
};

export const signAuthMessage = async (address, message) => {
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

export const placePredictionOnChain = async ({ contractMarketId, isYes, stakeVet }) => {
  if (!CONTRACT) throw new Error("Contract address not set. Check .env");
  const vendor   = await getVendor();
  const stakeWei = toHex(BigInt(Math.round(Number(stakeVet) * 1e18)));
  const data     = `${PREDICT_SIG}${encodeUint256(contractMarketId)}${encodeBool(isYes)}`;
  const result   = await vendor
    .sign("tx", [{ to: CONTRACT, value: stakeWei, data }])
    .comment(`Predict ${isYes ? "YES" : "NO"} with ${stakeVet} VET`)
    .request();
  return result.txid;
};

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