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

// ─── Get signer ───────────────────────────────────────────────
let _signer = null;
const getSigner = async () => {
  if (_signer) return _signer;

  // Desktop VeWorld extension — uses old .sign() style
  if (window.connex?.vendor) {
    // Wrap old API to match new style
    _signer = {
      isLegacy: true,
      vendor: window.connex.vendor,
    };
    return _signer;
  }

  // VeWorld mobile — newConnexSigner returns { signCert, signTx }
  if (window.vechain?.newConnexSigner) {
    _signer = await window.vechain.newConnexSigner(GENESIS_ID);
    return _signer;
  }

  if (isMobileBrowser()) {
    openInVeWorld();
    throw new Error("OPEN_IN_VEWORLD");
  }

  throw new Error("VeWorld wallet not detected. Please open this site inside VeWorld browser.");
};

// ─── Sign a certificate ───────────────────────────────────────
const signCert = async (message) => {
  const signer = await getSigner();
  if (signer.isLegacy) {
    // Desktop extension — old API
    return await signer.vendor.sign("cert", message).request();
  }
  // Mobile — new API
  return await signer.signCert(message, {});
};

// ─── Sign a transaction ───────────────────────────────────────
const signTx = async (clauses, comment) => {
  const signer = await getSigner();
  if (signer.isLegacy) {
    // Desktop extension — old API
    return await signer.vendor.sign("tx", clauses).comment(comment).request();
  }
  // Mobile — new API
  return await signer.signTx(clauses, { comment });
};

export const getWalletAddress = async () => {
  const result = await signCert({
    purpose: "identification",
    payload: { type: "text", content: "Connect to PredictChain" },
  });
  return result.annex.signer.toLowerCase();
};

export const signAuthMessage = async (address, message) => {
  const result = await signCert({
    purpose: "agreement",
    payload: { type: "text", content: message },
  });
  return {
    signature: result.annex?.signature || result.signature || "",
    signer:    result.annex?.signer    || address,
  };
};

export const placePredictionOnChain = async ({ contractMarketId, isYes, stakeVet }) => {
  if (!CONTRACT) throw new Error("Contract address not set. Check .env");
  const stakeWei = toHex(BigInt(Math.round(Number(stakeVet) * 1e18)));
  const data     = `${PREDICT_SIG}${encodeUint256(contractMarketId)}${encodeBool(isYes)}`;
  const result   = await signTx(
    [{ to: CONTRACT, value: stakeWei, data }],
    `Predict ${isYes ? "YES" : "NO"} with ${stakeVet} VET`
  );
  return result.txid;
};

export const claimWinningsOnChain = async ({ contractPredictionId }) => {
  if (!CONTRACT) throw new Error("Contract address not set.");
  const data   = `${CLAIM_SIG}${encodeUint256(contractPredictionId)}`;
  const result = await signTx(
    [{ to: CONTRACT, value: "0x0", data }],
    "Claim prediction winnings"
  );
  return result.txid;
};

export const claimRefundOnChain = async ({ contractPredictionId }) => {
  if (!CONTRACT) throw new Error("Contract address not set.");
  const data   = `${REFUND_SIG}${encodeUint256(contractPredictionId)}`;
  const result = await signTx(
    [{ to: CONTRACT, value: "0x0", data }],
    "Claim market refund"
  );
  return result.txid;
};

export const withdrawFeesOnChain = async ({ toAddress }) => {
  if (!CONTRACT) throw new Error("Contract address not set.");
  const paddedAddress = toAddress.replace("0x", "").toLowerCase().padStart(64, "0");
  const data          = `${WITHDRAW_FEES_SIG}${paddedAddress}`;
  const result        = await signTx(
    [{ to: CONTRACT, value: "0x0", data }],
    "Withdraw platform fees"
  );
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