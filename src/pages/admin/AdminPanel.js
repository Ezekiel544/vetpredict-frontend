import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  adminFetchStats, adminFetchMarkets, adminFetchUsers,
  adminFetchTransactions, adminCreateMarket, adminUpdateMarket,
  adminResolveMarket, adminCancelMarket, adminToggleAdmin,
  verifyAdminCode, adminWithdrawFees, adminToggleActive, adminNotifyAll,
} from "../../services/api";
import { withdrawFeesOnChain, waitForTx, hasConnex } from "../../services/vechain";

// ─── Secret Code Gate ─────────────────────────────────────────
function SecretCodeGate({ onUnlocked }) {
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [show, setShow]       = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) { setError("Enter the admin secret code"); return; }
    setLoading(true); setError("");
    try {
      const res = await verifyAdminCode(code.trim());
      sessionStorage.setItem("pc_admin_token", res.data.adminToken);
      onUnlocked();
    } catch (err) {
      setError(err.response?.data?.error || "Invalid code");
      setCode("");
    } finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#0F1117",padding:20,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{background:"#13161F",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:40,width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{width:52,height:52,borderRadius:14,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 16px"}}>🔐</div>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:20,fontWeight:800,color:"#F4F5F7",marginBottom:6}}>Admin Access</div>
        <div style={{fontSize:13,color:"#9BA3B8",marginBottom:28,lineHeight:1.6}}>This area is restricted. Enter your admin secret code to continue.</div>
        {error && <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.22)",color:"#EF4444",padding:"10px 14px",borderRadius:9,fontSize:13,marginBottom:16}}>{error}</div>}
        <div style={{position:"relative",marginBottom:14}}>
          <input
            type={show ? "text" : "password"}
            placeholder="Enter secret code"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={handleKey}
            style={{width:"100%",background:"#1A1E2E",border:"1.5px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"11px 44px 11px 14px",color:"#F4F5F7",fontSize:14,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",transition:"border-color 0.18s"}}
            onFocus={e => e.target.style.borderColor="#0BAB64"}
            onBlur={e => e.target.style.borderColor="rgba(255,255,255,0.07)"}
            autoFocus
          />
          <button onClick={() => setShow(s => !s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#5B6478",fontSize:13,padding:4}}>
            {show ? "Hide" : "Show"}
          </button>
        </div>
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",background:"#0BAB64",color:"#fff",border:"none",borderRadius:10,padding:"12px 20px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:loading?0.7:1,transition:"all 0.18s"}}>
          {loading ? "Verifying..." : "Unlock Admin Panel →"}
        </button>
        <div style={{marginTop:16,fontSize:12,color:"#5B6478"}}>Unauthorized access attempts are logged.</div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const injectAdminStyles = () => {
  if (document.getElementById("admin-styles")) return;
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Bricolage+Grotesque:wght@600;700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    :root{
      --fh:'Bricolage Grotesque',sans-serif;--fb:'Plus Jakarta Sans',sans-serif;
      --bg:#0F1117;--bg2:#13161F;--bg3:#1A1E2E;--bg4:#1F2436;
      --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.13);
      --text:#F4F5F7;--text2:#9BA3B8;--text3:#5B6478;
      --green:#0BAB64;--gbg:rgba(11,171,100,0.1);--gbd:rgba(11,171,100,0.22);
      --red:#EF4444;--rbg:rgba(239,68,68,0.1);--rbd:rgba(239,68,68,0.22);
      --blue:#3B82F6;--bbg:rgba(59,130,246,0.1);--bbd:rgba(59,130,246,0.22);
      --amber:#F59E0B;--abg:rgba(245,158,11,0.1);--abd:rgba(245,158,11,0.22);
      --purple:#8B5CF6;--pbg:rgba(139,92,246,0.1);--pbd:rgba(139,92,246,0.22);
    }
    body{background:var(--bg);color:var(--text);font-family:var(--fb);-webkit-font-smoothing:antialiased;}
    .admin-shell{display:flex;min-height:100vh;}
    .adm-sb{width:220px;flex-shrink:0;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;}
    .adm-logo{padding:18px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:9px;font-family:var(--fh);font-weight:800;font-size:15px;color:var(--text);}
    .adm-badge{background:var(--rbg);color:var(--red);border:1px solid var(--rbd);font-size:9px;font-weight:800;padding:2px 7px;border-radius:100px;text-transform:uppercase;letter-spacing:0.5px;}
    .adm-nav{flex:1;padding:10px 8px;overflow-y:auto;}
    .adm-ni{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text2);transition:all 0.15s;margin-bottom:2px;}
    .adm-ni:hover{background:var(--bg3);color:var(--text);}
    .adm-ni.active{background:var(--rbg);color:var(--red);font-weight:600;}
    .adm-ni-ico{font-size:15px;width:18px;text-align:center;flex-shrink:0;}
    .adm-foot{padding:12px 8px;border-top:1px solid var(--border);}
    .adm-back{display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text3);transition:all 0.15s;}
    .adm-back:hover{background:var(--bg3);color:var(--text2);}
    .adm-main{margin-left:220px;min-height:100vh;background:var(--bg);}
    .adm-topbar{height:58px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:50;}
    .adm-title{font-family:var(--fh);font-size:16px;font-weight:800;color:var(--text);}
    .adm-page{padding:24px;}
    .adm-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:18px;}
    .adm-ch{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
    .adm-ct{font-family:var(--fh);font-size:14px;font-weight:700;color:var(--text);}
    .stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;}
    .stat-card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px;}
    .stat-card:hover{border-color:var(--border2);}
    .stat-ico{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;margin-bottom:10px;}
    .stat-val{font-family:var(--fh);font-size:22px;font-weight:800;color:var(--text);margin-bottom:2px;}
    .stat-lbl{font-size:11px;color:var(--text3);font-weight:500;text-transform:uppercase;letter-spacing:0.4px;}
    .adm-table{width:100%;border-collapse:collapse;}
    .adm-table th{padding:10px 16px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3);border-bottom:1px solid var(--border);background:var(--bg3);}
    .adm-table td{padding:12px 16px;font-size:13px;color:var(--text);border-bottom:1px solid var(--border);}
    .adm-table tr:last-child td{border-bottom:none;}
    .adm-table tr:hover td{background:var(--bg3);}
    .adm-table td.muted{color:var(--text2);}
    .adm-table td.mono{font-family:monospace;font-size:11px;color:var(--text3);}
    .btn{display:inline-flex;align-items:center;gap:6px;font-family:var(--fb);font-weight:600;font-size:12px;border:none;border-radius:8px;cursor:pointer;transition:all 0.15s;padding:7px 14px;white-space:nowrap;}
    .btn-p{background:var(--green);color:#fff;}
    .btn-p:hover{background:#09966f;}
    .btn-r{background:var(--rbg);color:var(--red);border:1px solid var(--rbd);}
    .btn-r:hover{background:var(--red);color:#fff;}
    .btn-b{background:var(--bbg);color:var(--blue);border:1px solid var(--bbd);}
    .btn-b:hover{background:var(--blue);color:#fff;}
    .btn-a{background:var(--abg);color:var(--amber);border:1px solid var(--abd);}
    .btn-a:hover{background:var(--amber);color:#fff;}
    .btn-g{background:var(--bg4);color:var(--text2);border:1px solid var(--border);}
    .btn-g:hover{border-color:var(--border2);color:var(--text);}
    .btn-sm{padding:5px 10px;font-size:11px;border-radius:6px;}
    .btn-lg{padding:10px 20px;font-size:13px;}
    .btn-bl{width:100%;justify-content:center;}
    .btn:disabled{opacity:0.5;cursor:not-allowed;}
    .spill{display:inline-flex;align-items:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;padding:3px 9px;border-radius:100px;}
    .spill-active{background:var(--gbg);color:var(--green);border:1px solid var(--gbd);}
    .spill-closed{background:var(--abg);color:var(--amber);border:1px solid var(--abd);}
    .spill-resolved{background:var(--bbg);color:var(--blue);border:1px solid var(--bbd);}
    .spill-cancelled{background:var(--bg4);color:var(--text3);border:1px solid var(--border);}
    .spill-won{background:var(--gbg);color:var(--green);border:1px solid var(--gbd);}
    .spill-lost{background:var(--rbg);color:var(--red);border:1px solid var(--rbd);}
    .spill-pending{background:var(--abg);color:var(--amber);border:1px solid var(--abd);}
    .spill-yes{background:var(--gbg);color:var(--green);border:1px solid var(--gbd);}
    .spill-no{background:var(--rbg);color:var(--red);border:1px solid var(--rbd);}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .form-group{display:flex;flex-direction:column;gap:5px;margin-bottom:12px;}
    .form-group.full{grid-column:span 2;}
    .form-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text3);}
    .form-inp{background:var(--bg3);border:1.5px solid var(--border);border-radius:9px;padding:9px 13px;color:var(--text);font-size:13px;font-family:var(--fb);outline:none;transition:all 0.18s;width:100%;}
    .form-inp:focus{border-color:var(--green);background:var(--bg4);}
    .form-inp::placeholder{color:var(--text3);}
    select.form-inp{cursor:pointer;}
    .adm-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;}
    .adm-modal{background:var(--bg2);border:1px solid var(--border);border-radius:18px;padding:28px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;position:relative;}
    .adm-modal-title{font-family:var(--fh);font-size:18px;font-weight:800;color:var(--text);margin-bottom:20px;}
    .adm-modal-close{position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:7px;border:1px solid var(--border);background:var(--bg3);cursor:pointer;color:var(--text2);display:flex;align-items:center;justify-content:center;font-size:12px;}
    .adm-modal-close:hover{color:var(--text);}
    .alert{padding:11px 14px;border-radius:9px;font-size:13px;margin-bottom:14px;}
    .alert-r{background:var(--rbg);border:1px solid var(--rbd);color:var(--red);}
    .alert-g{background:var(--gbg);border:1px solid var(--gbd);color:var(--green);}
    .pool-bar{height:4px;border-radius:100px;background:var(--bg4);overflow:hidden;margin-top:4px;}
    .pool-bar-fill{height:100%;border-radius:100px;background:var(--green);}
    .confirm-box{background:var(--bg3);border:1px solid var(--border);border-radius:11px;padding:16px;margin-bottom:16px;}
    .confirm-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px;}
    .confirm-sub{font-size:12px;color:var(--text2);line-height:1.6;}
    .adm-search{display:flex;align-items:center;gap:8px;background:var(--bg3);border:1.5px solid var(--border);border-radius:9px;padding:7px 12px;width:220px;}
    .adm-search input{background:none;border:none;outline:none;font-size:13px;color:var(--text);font-family:var(--fb);width:100%;}
    .adm-search input::placeholder{color:var(--text3);}
    .adm-search:focus-within{border-color:var(--green);}
    @media(max-width:1200px){.stats-grid{grid-template-columns:repeat(3,1fr);}}
    @media(max-width:768px){.adm-sb{display:none;}.adm-main{margin-left:0;}.stats-grid{grid-template-columns:repeat(2,1fr);}.form-grid{grid-template-columns:1fr;}.form-group.full{grid-column:span 1;}}
  `;
  const el = document.createElement("style");
  el.id = "admin-styles";
  el.textContent = css;
  document.head.appendChild(el);
};

// ─── Helpers ─────────────────────────────────────────────────
const fmt     = (n) => Number(n || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleString() : "—";
// const fmtVet  = (n) => `${fmt(Math.round(n || 0))} VET`;
// Replace the existing fmtVet with this:
const fmtVet = (n) => {
  const val = Number(n || 0);
  if (val === 0) return "0 VET";
  // Show up to 4 decimal places, strip trailing zeros
  return `${parseFloat(val.toFixed(4)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })} VET`;
};
const truncAddr = (a) => a ? `${a.slice(0,6)}...${a.slice(-4)}` : "—";
const StatusPill = ({ status }) => {
  const map = { active:"spill-active",closed:"spill-closed",resolved:"spill-resolved",cancelled:"spill-cancelled",won:"spill-won",lost:"spill-lost",pending_tx:"spill-pending",active_pred:"spill-active" };
  return <span className={`spill ${map[status] || "spill-pending"}`}>{status}</span>;
};

// ─── VeChain helpers (shared across pages) ────────────────────
const NODE_URL   = process.env.REACT_APP_VECHAIN_NODE || "https://testnet.vechain.org";
const GENESIS_ID = "0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127";
const CONTRACT   = process.env.REACT_APP_CONTRACT_ADDRESS;
console.log("CONTRACT ADDRESS:", CONTRACT); 
// CORRECT selectors — verified keccak256 hashes
const SEL_CREATE_MARKET  = "0xc48d8656"; // ✅ correct
const SEL_RESOLVE_MARKET = "0x57bde446"; // ✅ correct

const encodeUint256 = (n) => BigInt(n).toString(16).padStart(64, "0");
const encodeBool    = (b) => (b ? "1" : "0").padStart(64, "0");
const encodeStr     = (str) => {
  const bytes  = new TextEncoder().encode(str);
  const lenHex = encodeUint256(bytes.length);
  const slots  = Math.ceil(bytes.length / 32);
  const padded = new Uint8Array(slots * 32);
  padded.set(bytes);
  return lenHex + Array.from(padded).map(b => b.toString(16).padStart(2,"0")).join("");
};

const buildCreateMarketCalldata = (title, category, closesAtUnix, featured) => {
  const titleSlots = Math.ceil(new TextEncoder().encode(title).length / 32);
  return SEL_CREATE_MARKET
    + encodeUint256(128)
    + encodeUint256(128 + 32 + titleSlots * 32)
    + encodeUint256(closesAtUnix)
    + encodeBool(featured)
    + encodeStr(title)
    + encodeStr(category);
};

const getConnex = async () => {
  if (!window.vechain) throw new Error("VeWorld wallet not detected");
  return window.vechain.newConnex({ node: NODE_URL, network: { id: GENESIS_ID } });
};

const waitForReceipt = async (txid) => {
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res = await fetch(`${NODE_URL}/transactions/${txid}/receipt`);
      const d   = await res.json();
      if (d && d.reverted === false) return d;
      if (d && d.reverted === true)  throw new Error("Transaction reverted on-chain");
    } catch (e) {
      if (e.message.includes("reverted")) throw e;
    }
  }
  throw new Error("Timed out waiting for confirmation");
};

// ─── Overview Page ────────────────────────────────────────────
// ─── Overview Page ────────────────────────────────────────────
function OverviewPage() {
  const { user } = useAuth();
  const [stats, setStats]         = useState(null);
  const [markets, setMarkets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [withdrawing, setWith]    = useState(false);
  const [withdrawMsg, setWithMsg] = useState({ text:"", ok:false });

  const load = useCallback(() => {
    Promise.all([
      adminFetchStats(),
      adminFetchMarkets(),
      // Also fetch contract-stats as backup fee source
      fetch("/api/admin/contract-stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "x-admin-token": sessionStorage.getItem("pc_admin_token") || "",
        }
      }).then(r => r.json()).catch(() => ({ pendingFees: 0 }))
    ])
      .then(([s, m, contractStats]) => {
        const statsData = s.data;

        // Use whichever fee value is larger — backend or contract-stats
        const feeFromStats    = Number(statsData?.feesCollectedVet || 0);
        const feeFromContract = Number(contractStats?.pendingFees   || 0);
        const bestFee         = Math.max(feeFromStats, feeFromContract);

        console.log("[Admin] feeFromStats:", feeFromStats, "feeFromContract:", feeFromContract, "using:", bestFee);

        setStats({ ...statsData, feesCollectedVet: bestFee });
        setMarkets(m.data.markets.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleWithdrawFees = async () => {
    const currentFees = Number(stats?.feesCollectedVet || 0);
    if (currentFees <= 0) { setWithMsg({ text:"No fees to withdraw yet.", ok:false }); return; }
    if (!hasConnex()) { setWithMsg({ text:"VeWorld wallet not detected.", ok:false }); return; }

    const toAddress = user?.walletAddress || process.env.REACT_APP_ADMIN_WALLET;
    if (!toAddress) { setWithMsg({ text:"No admin wallet address found.", ok:false }); return; }

    setWith(true); setWithMsg({ text:"Confirm in VeWorld...", ok:false });
    try {
      const txHash = await withdrawFeesOnChain({ toAddress });
      setWithMsg({ text:"Waiting for confirmation...", ok:false });
      await waitForTx(txHash);
      await adminWithdrawFees({ toAddress, amountVet: currentFees, txHash });
      setStats(s => ({ ...s, feesCollectedVet: 0 }));
      setWithMsg({ text:`Withdrew ${currentFees} VET successfully.`, ok:true });
      setTimeout(() => { setWithMsg({ text:"", ok:false }); load(); }, 4000);
    } catch (e) {
      setWithMsg({ text: e.message || "Withdrawal failed", ok:false });
    } finally { setWith(false); }
  };

  if (loading) return <div style={{padding:40,color:"var(--text3)"}}>Loading stats...</div>;

  const fees = Number(stats?.feesCollectedVet || 0);

  const statCards = [
    { ico:"👤", bg:"var(--bbg)", val:fmt(stats?.totalUsers),       lbl:"Total Users",          sub:`+${fmt(stats?.newUsersWeekly)} this week` },
    { ico:"📊", bg:"var(--gbg)", val:fmt(stats?.activeMarkets),    lbl:"Active Markets",       sub:`${fmt(stats?.resolvedMarkets)} resolved` },
    { ico:"🎯", bg:"var(--pbg)", val:fmt(stats?.totalPredictions), lbl:"Total Predictions",    sub:`${fmt(stats?.weeklyPreds)} this week` },
    { ico:"💰", bg:"var(--abg)", val:fmtVet(stats?.totalVetStaked),lbl:"Total VET Staked",     sub:"All time" },
    { ico:"🏦", bg:"var(--abg)", val:fmtVet(stats?.activePoolVet), lbl:"VET in Active Pools",  sub:"Currently locked" },
    { ico:"💎", bg:"var(--gbg)", val:fmtVet(fees),                 lbl:"Platform Fees (1.5%)", sub:"From resolved markets" },
    { ico:"📈", bg:"var(--bbg)", val:fmtVet(stats?.weeklyVet),     lbl:"Weekly Volume",        sub:"Last 7 days" },
    { ico:"🏆", bg:"var(--pbg)", val:fmt(stats?.resolvedMarkets),  lbl:"Resolved Markets",     sub:`${fmt(stats?.cancelledMarkets)} cancelled` },
  ];

  return (
    <div className="adm-page">
      <div className="stats-grid">
        {statCards.map(s => (
          <div className="stat-card" key={s.lbl}>
            <div className="stat-ico" style={{background:s.bg}}>{s.ico}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
            {s.sub && <div style={{fontSize:10,color:"var(--text3)",marginTop:3}}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {stats?.topMarket && (
        <div className="adm-card" style={{marginBottom:16}}>
          <div className="adm-ch"><span className="adm-ct">🔥 Top Market by Pool</span></div>
          <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{stats.topMarket.title}</div>
            <div style={{fontFamily:"var(--fh)",fontWeight:700,color:"var(--green)"}}>{fmtVet(stats.topMarket.totalPool)}</div>
          </div>
        </div>
      )}

      <div className="adm-card" style={{marginBottom:16}}>
        <div className="adm-ch"><span className="adm-ct">💎 Platform Fee Withdrawal</span></div>
        <div style={{padding:"16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontSize:12,color:"var(--text3)",marginBottom:4}}>Collected fees (1.5% of resolved pools)</div>
              <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:800,color: fees > 0 ? "var(--green)" : "var(--text3)"}}>
                {fmtVet(fees)}
              </div>
              <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>Sends directly to your connected VeWorld wallet</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
              {withdrawMsg.text && (
                <div style={{fontSize:12,color:withdrawMsg.ok?"var(--green)":"var(--amber)",textAlign:"right",maxWidth:240}}>
                  {withdrawMsg.text}
                </div>
              )}
              <button
                className="btn btn-p"
                onClick={handleWithdrawFees}
                disabled={withdrawing || fees <= 0}
                style={{opacity: fees <= 0 ? 0.5 : 1}}
              >
                {withdrawing ? "Processing..." : fees > 0 ? `Withdraw ${fmtVet(fees)} →` : "No Fees Yet"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-ch"><span className="adm-ct">Recent Markets</span></div>
        <table className="adm-table">
          <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Pool</th><th>YES/NO</th><th>Closes</th></tr></thead>
          <tbody>
            {markets.map(m => {
              const yp = m.totalPool > 0 ? Math.round(m.yesPool/m.totalPool*100) : 50;
              return (
                <tr key={m._id}>
                  <td style={{maxWidth:240,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title}</td>
                  <td className="muted">{m.category}</td>
                  <td><StatusPill status={m.status}/></td>
                  <td className="muted" style={{fontWeight:600}}>{fmtVet(m.totalPool)}</td>
                  <td style={{fontSize:11}}>
                    <span style={{color:"var(--green)",fontWeight:700}}>Y {yp}%</span>
                    {" / "}
                    <span style={{color:"var(--red)",fontWeight:700}}>N {100-yp}%</span>
                  </td>
                  <td className="muted">{fmtDate(m.closesAt)}</td>
                </tr>
              );
            })}
            {markets.length === 0 && (
              <tr><td colSpan={6} style={{textAlign:"center",color:"var(--text3)",padding:24}}>No markets yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Markets Page ─────────────────────────────────────────────
function MarketsPage() {
  const [markets, setMarkets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setCreate]   = useState(false);
  const [resolveModal, setResolve]= useState(null);
  const [search, setSearch]       = useState("");
  const [msg, setMsg]             = useState({ type:"", text:"" });

  const load = useCallback(() => {
    setLoading(true);
    adminFetchMarkets()
      .then(r => setMarkets(r.data.markets))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (type, text) => { setMsg({type,text}); setTimeout(()=>setMsg({type:"",text:""}), 4000); };

  // ── Resolve market on-chain then in DB ──
  const handleResolve = async (marketId, result) => {
    try {
      if (window.vechain && resolveModal?.contractMarketId) {
        const marketIdHex = resolveModal.contractMarketId.toString(16).padStart(64, "0");
        const yesWonHex   = (result === "YES" ? "1" : "0").padStart(64, "0");
        // CORRECT selector: keccak256("resolveMarket(uint256,bool)") = 0xb8f97c39
        const data   = SEL_RESOLVE_MARKET + marketIdHex + yesWonHex;
        const connex = await getConnex();
        const txResult = await connex.vendor.sign("tx", [{ to: CONTRACT, value: "0x0", data }])
          .comment(`Resolve market as ${result}`).request();
        await waitForReceipt(txResult.txid);
      } else if (!resolveModal?.contractMarketId) {
        showMsg("r", "Market not on-chain yet — use Resync button first"); return;
      }
      await adminResolveMarket(marketId, { result });
      showMsg("g", `Market resolved as ${result}. Payouts calculated.`);
      setResolve(null);
      load();
    } catch (err) {
      showMsg("r", err.response?.data?.error || err.message || "Resolve failed");
    }
  };

  // ── Cancel market in DB ──
  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this market? All stakes will be refundable.")) return;
    try {
      await adminCancelMarket(id);
      showMsg("g", "Market cancelled");
      load();
    } catch (err) {
      showMsg("r", err.response?.data?.error || "Cancel failed");
    }
  };

  // ── Push existing DB market on-chain ──
  const handlePushOnChain = async (market) => {
    if (!window.vechain) { showMsg("r", "VeWorld not detected"); return; }
    if (new Date(market.closesAt) <= new Date()) {
      showMsg("r", "Market already expired — update closesAt first"); return;
    }
    showMsg("g", `Pushing "${market.title}" on-chain... confirm in VeWorld`);
    try {
      const closesAtUnix = Math.floor(new Date(market.closesAt).getTime() / 1000);
      const calldata     = buildCreateMarketCalldata(market.title, market.category, closesAtUnix, market.featured || false);
      const connex       = await getConnex();
      const txResult     = await connex.vendor.sign("tx", [{ to: CONTRACT, value: "0x0", data: calldata }])
        .comment(`Register on-chain: ${market.title}`).request();

      const receipt        = await waitForReceipt(txResult.txid);
      const contractMarketId = parseInt(receipt.outputs?.[0]?.events?.[0]?.topics?.[1], 16) || null;

      await adminUpdateMarket(market._id, { contractMarketId, txHash: txResult.txid });
      showMsg("g", `✅ "${market.title}" is now on-chain! ID: ${contractMarketId}`);
      load();
    } catch (err) {
      showMsg("r", err.message || "Push on-chain failed");
    }
  };

  const filtered   = markets.filter(m => m.title.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()));
  const yesPercent = (m) => m.totalPool > 0 ? Math.round(m.yesPool / m.totalPool * 100) : 50;

  return (
    <div className="adm-page">
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,gap:12,flexWrap:"wrap"}}>
        <div className="adm-search">
          <span style={{color:"var(--text3)",fontSize:13}}>🔍</span>
          <input placeholder="Search markets..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <button className="btn btn-p btn-lg" onClick={()=>setCreate(true)}>+ Create Market</button>
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead>
            <tr><th>Market</th><th>Category</th><th>Status</th><th>Pool (VET)</th><th>YES/NO</th><th>Participants</th><th>Closes</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{textAlign:"center",padding:30,color:"var(--text3)"}}>Loading...</td></tr>}
            {!loading && filtered.map(m => (
              <tr key={m._id}>
                <td style={{maxWidth:220}}>
                  <div style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title}</div>
                  {m.featured && <span style={{fontSize:9,background:"var(--abg)",color:"var(--amber)",padding:"1px 6px",borderRadius:4,fontWeight:700,marginTop:2,display:"inline-block"}}>FEATURED</span>}
                </td>
                <td className="muted">{m.category}</td>
                <td>
                  <StatusPill status={m.status}/>
                  {m.result && <span className={`spill spill-${m.result.toLowerCase()}`} style={{marginLeft:4}}>{m.result}</span>}
                </td>
                <td>
                  <div style={{fontWeight:600}}>{fmtVet(m.totalPool)}</div>
                  <div className="pool-bar"><div className="pool-bar-fill" style={{width:`${yesPercent(m)}%`}}/></div>
                </td>
                <td style={{fontSize:11}}>
                  <span style={{color:"var(--green)",fontWeight:700}}>Y {yesPercent(m)}%</span>
                  {" / "}
                  <span style={{color:"var(--red)",fontWeight:700}}>N {100-yesPercent(m)}%</span>
                </td>
                <td className="muted">{fmt(m.participants)}</td>
                <td className="muted" style={{fontSize:11}}>{fmtDate(m.closesAt)}</td>
                <td>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {/* ⛓ Always show for active markets so admin can resync */}
                    {m.status === "active" && (
                      <button
                        className="btn btn-a btn-sm"
                        onClick={() => handlePushOnChain(m)}
                        title={m.contractMarketId ? `DB ID: ${m.contractMarketId} — click to re-sync with blockchain` : "Not on-chain yet — click to register"}
                      >
                        ⛓ {m.contractMarketId ? `Resync #${m.contractMarketId}` : "Push On-Chain"}
                      </button>
                    )}
                    {(m.status === "active" || m.status === "closed") && (
                      <button className="btn btn-b btn-sm" onClick={()=>setResolve(m)}>Resolve</button>
                    )}
                    {m.status === "active" && (
                      <button className="btn btn-r btn-sm" onClick={()=>handleCancel(m._id)}>Cancel</button>
                    )}
                    {m.status === "resolved" && <span style={{fontSize:11,color:"var(--text3)"}}>Done ✓</span>}
                    {m.status === "cancelled" && <span style={{fontSize:11,color:"var(--red)"}}>Cancelled</span>}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} style={{textAlign:"center",padding:30,color:"var(--text3)"}}>No markets found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateMarketModal onClose={()=>setCreate(false)} onCreated={()=>{setCreate(false);load();}} showMsg={showMsg}/>}

      {resolveModal && (
        <div className="adm-modal-bg" onClick={e=>e.target===e.currentTarget&&setResolve(null)}>
          <div className="adm-modal" style={{maxWidth:420}}>
            <button className="adm-modal-close" onClick={()=>setResolve(null)}>x</button>
            <div className="adm-modal-title">Resolve Market</div>
            <div className="confirm-box">
              <div className="confirm-title">{resolveModal.title}</div>
              <div className="confirm-sub">
                Pool: {fmtVet(resolveModal.totalPool)} total ({fmtVet(resolveModal.yesPool)} YES / {fmtVet(resolveModal.noPool)} NO)
                <br/>1.5% platform fee will be deducted. Winners receive proportional payouts.
                {!resolveModal.contractMarketId && <><br/><strong style={{color:"var(--amber)"}}>⚠️ This market has no on-chain ID — resolve in DB only.</strong></>}
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-p btn-bl" style={{flex:1}} onClick={()=>handleResolve(resolveModal._id,"YES")}>Resolve as YES</button>
              <button className="btn btn-r btn-bl" style={{flex:1}} onClick={()=>handleResolve(resolveModal._id,"NO")}>Resolve as NO</button>
            </div>
            <button className="btn btn-g btn-bl" style={{marginTop:10}} onClick={()=>setResolve(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create Market Modal ──────────────────────────────────────
function CreateMarketModal({ onClose, onCreated, showMsg }) {
  const [form, setForm] = useState({ title:"", description:"", category:"Sports", emoji:"📊", closesAt:"", oracleSource:"manual", featured:false });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSubmit = async () => {
    if (!form.title || !form.closesAt) { setError("Title and close date are required"); return; }
    if (!window.vechain) { setError("VeWorld wallet not detected."); return; }
    const closesAtUnix = Math.floor(new Date(form.closesAt).getTime() / 1000);
    if (closesAtUnix <= Math.floor(Date.now() / 1000)) { setError("Close date must be in the future"); return; }

    setLoading(true); setError("");
    try {
      const calldata = buildCreateMarketCalldata(form.title, form.category, closesAtUnix, form.featured);
      const connex   = await getConnex();
      const txResult = await connex.vendor.sign("tx", [{ to: CONTRACT, value: "0x0", data: calldata }])
        .comment(`Create market: ${form.title}`).request();

      const receipt        = await waitForReceipt(txResult.txid);
      const contractMarketId = parseInt(receipt.outputs?.[0]?.events?.[0]?.topics?.[1], 16) || null;

      await adminCreateMarket({ ...form, txHash: txResult.txid, contractMarketId });
      showMsg("g", `✅ Market created on-chain! Contract ID: ${contractMarketId}`);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to create market");
    } finally { setLoading(false); }
  };

  return (
    <div className="adm-modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="adm-modal">
        <button className="adm-modal-close" onClick={onClose}>x</button>
        <div className="adm-modal-title">Create New Market</div>
        {error && <div className="alert alert-r">{error}</div>}
        <div className="form-grid">
          <div className="form-group full">
            <label className="form-lbl">Market Title *</label>
            <input className="form-inp" placeholder="Will Bitcoin close above $100k this week?" value={form.title} onChange={set("title")}/>
          </div>
          <div className="form-group full">
            <label className="form-lbl">Description</label>
            <textarea className="form-inp" rows={2} placeholder="Optional description..." value={form.description} onChange={set("description")} style={{resize:"none"}}/>
          </div>
          <div className="form-group">
            <label className="form-lbl">Category *</label>
            <select className="form-inp" value={form.category} onChange={set("category")}>
              {["Sports","Crypto","Politics","Entertainment","Gaming","Stocks","Meme","Other"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-lbl">Emoji</label>
            <input className="form-inp" placeholder="📊" value={form.emoji} onChange={set("emoji")}/>
          </div>
          <div className="form-group">
            <label className="form-lbl">Closes At *</label>
            <input className="form-inp" type="datetime-local" value={form.closesAt} onChange={set("closesAt")}/>
          </div>
          <div className="form-group">
            <label className="form-lbl">Resolution Source</label>
            <select className="form-inp" value={form.oracleSource} onChange={set("oracleSource")}>
              <option value="manual">Manual (Admin)</option>
              <option value="witnet">Witnet Oracle</option>
            </select>
          </div>
          <div className="form-group" style={{display:"flex",alignItems:"center",gap:8,flexDirection:"row",marginTop:4}}>
            <input type="checkbox" id="featured" checked={form.featured} onChange={set("featured")} style={{width:16,height:16,cursor:"pointer"}}/>
            <label htmlFor="featured" className="form-lbl" style={{cursor:"pointer",textTransform:"none",fontSize:13,letterSpacing:0}}>Feature this market on homepage</label>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:6}}>
          <button className="btn btn-g btn-bl" onClick={onClose}>Cancel</button>
          <button className="btn btn-p btn-bl" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating & Registering on Blockchain..." : "Create Market"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Users Page ───────────────────────────────────────────────
function UsersPage() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [msg, setMsg]         = useState({ type:"", text:"" });

  const load = useCallback(() => {
    setLoading(true);
    adminFetchUsers({ limit: 100 })
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (type, text) => { setMsg({type,text}); setTimeout(()=>setMsg({type:"",text:""}), 3500); };

  const toggleAdmin = async (id) => {
    try { const r = await adminToggleAdmin(id); showMsg("g", r.data.message); load(); }
    catch (err) { showMsg("r", err.response?.data?.error || "Failed"); }
  };

  const toggleActive = async (id, isActive) => {
    if (!window.confirm(isActive ? "Deactivate this user?" : "Reactivate this user?")) return;
    try { const r = await adminToggleActive(id); showMsg("g", r.data.message); load(); }
    catch (err) { showMsg("r", err.response?.data?.error || "Failed"); }
  };

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    return (u.displayName||"").toLowerCase().includes(s) || (u.email||"").toLowerCase().includes(s) || (u.walletAddress||"").toLowerCase().includes(s);
  });

  return (
    <div className="adm-page">
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,gap:12}}>
        <div className="adm-search">
          <span style={{color:"var(--text3)",fontSize:13}}>🔍</span>
          <input placeholder="Search users..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <span style={{fontSize:13,color:"var(--text3)"}}>{total} total users</span>
      </div>
      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>User</th><th>Auth</th><th>Wallet</th><th>Predictions</th><th>Win Rate</th><th>VET Earned</th><th>Joined</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={9} style={{textAlign:"center",padding:30,color:"var(--text3)"}}>Loading...</td></tr>}
            {!loading && filtered.map(u => (
              <tr key={u._id}>
                <td><div style={{fontWeight:600}}>{u.displayName||"—"}</div><div style={{fontSize:11,color:"var(--text3)"}}>{u.email||"wallet only"}</div></td>
                <td><span className={`spill ${u.authMethod==="wallet"?"spill-active":"spill-resolved"}`}>{u.authMethod}</span></td>
                <td className="mono">{u.walletAddress?truncAddr(u.walletAddress):"—"}</td>
                <td className="muted">{fmt(u.totalPredictions)}</td>
                <td className="muted">{u.totalPredictions>0?`${Math.round((u.correctPredictions/u.totalPredictions)*100)}%`:"—"}</td>
                <td style={{fontWeight:600}}>{fmtVet(u.totalEarnedVet)}</td>
                <td className="muted" style={{fontSize:11}}>{fmtDate(u.createdAt)}</td>
                <td>{u.isAdmin?<span className="spill spill-lost">Admin</span>:<span className="spill spill-pending">User</span>}</td>
                <td>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    <button className={`btn btn-sm ${u.isAdmin?"btn-r":"btn-g"}`} onClick={()=>toggleAdmin(u._id)}>{u.isAdmin?"Remove Admin":"Make Admin"}</button>
                    <button className={`btn btn-sm ${u.isActive!==false?"btn-r":"btn-p"}`} onClick={()=>toggleActive(u._id,u.isActive!==false)}>{u.isActive!==false?"Deactivate":"Reactivate"}</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length===0 && <tr><td colSpan={9} style={{textAlign:"center",padding:30,color:"var(--text3)"}}>No users found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Transactions Page ────────────────────────────────────────
function TransactionsPage() {
  const [txs, setTxs]         = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    adminFetchTransactions({ limit: 100 })
      .then(r => { setTxs(r.data.transactions); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const typeColor = { deposit:"spill-active",withdrawal:"spill-closed",stake:"spill-pending",win:"spill-won",refund:"spill-resolved",fee:"spill-lost" };
  const filtered  = txs.filter(t => {
    const s = search.toLowerCase();
    return (t.user?.displayName||"").toLowerCase().includes(s) || (t.user?.walletAddress||"").toLowerCase().includes(s) || t.type.includes(s);
  });

  return (
    <div className="adm-page">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,gap:12}}>
        <div className="adm-search"><span style={{color:"var(--text3)",fontSize:13}}>🔍</span><input placeholder="Search transactions..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <span style={{fontSize:13,color:"var(--text3)"}}>{total} total transactions</span>
      </div>
      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>Type</th><th>User</th><th>Amount (VET)</th><th>Market</th><th>Tx Hash</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{textAlign:"center",padding:30,color:"var(--text3)"}}>Loading...</td></tr>}
            {!loading && filtered.map(t => (
              <tr key={t._id}>
                <td><span className={`spill ${typeColor[t.type]||"spill-pending"}`}>{t.type}</span></td>
                <td><div style={{fontWeight:600}}>{t.user?.displayName||"—"}</div><div className="mono">{t.user?.walletAddress?truncAddr(t.user.walletAddress):""}</div></td>
                <td style={{fontWeight:700,color:t.amountVet>=0?"var(--green)":"var(--red)"}}>{t.amountVet>=0?"+":""}{fmtVet(t.amountVet)}</td>
                <td className="muted" style={{maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.market?.title||"—"}</td>
                <td className="mono">{t.txHash?truncAddr(t.txHash):"—"}</td>
                <td><span className={`spill ${t.status==="confirmed"?"spill-active":t.status==="failed"?"spill-lost":"spill-pending"}`}>{t.status}</span></td>
                <td className="muted" style={{fontSize:11}}>{fmtDate(t.createdAt)}</td>
              </tr>
            ))}
            {!loading && filtered.length===0 && <tr><td colSpan={7} style={{textAlign:"center",padding:30,color:"var(--text3)"}}>No transactions found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Push Notifications Page ──────────────────────────────────
function NotificationsPage() {
  const [form, setForm]       = useState({ title:"", message:"", type:"system" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState({ text:"", ok:false });
  const [history, setHistory] = useState([]);

  const notifTypes = [
    { value:"system",        label:"📢 System Announcement" },
    { value:"market_closing",label:"⏰ Market Closing Soon"  },
    { value:"win",           label:"🎉 Win Announcement"     },
    { value:"deposit",       label:"📥 Deposit / Reward"     },
  ];

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) { setMsg({ text:"Title and message are required", ok:false }); return; }
    setLoading(true); setMsg({ text:"", ok:false });
    try {
      const res = await adminNotifyAll(form);
      setMsg({ text:`Sent to ${res.data.count} users successfully`, ok:true });
      setHistory(h => [{ ...form, sentAt: new Date(), count: res.data.count }, ...h.slice(0,9)]);
      setForm({ title:"", message:"", type:"system" });
    } catch (err) {
      setMsg({ text: err.response?.data?.error || "Failed to send", ok:false });
    } finally { setLoading(false); }
  };

  const charCount = form.message.length;

  return (
    <div className="adm-page">
      <div className="adm-card" style={{marginBottom:16}}>
        <div className="adm-ch"><span className="adm-ct">📢 Send Push Notification</span></div>
        <div style={{padding:"20px 18px"}}>
          <div style={{fontSize:13,color:"var(--text3)",marginBottom:18,lineHeight:1.6}}>
            This notification will be delivered instantly to <strong style={{color:"var(--text)"}}>all active users</strong> via real-time socket and saved to their notification inbox.
          </div>
          {msg.text && (
            <div style={{background:msg.ok?"var(--gbg)":"var(--rbg)",border:`1px solid ${msg.ok?"var(--gbd)":"var(--rbd)"}`,color:msg.ok?"var(--green)":"var(--red)",padding:"10px 14px",borderRadius:9,fontSize:13,marginBottom:16}}>
              {msg.text}
            </div>
          )}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-lbl">Notification Type</label>
              <select className="form-inp" value={form.type} onChange={set("type")}>
                {notifTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-lbl">Title *</label>
              <input className="form-inp" placeholder="e.g. New market available!" value={form.title} onChange={set("title")} maxLength={80}/>
            </div>
            <div className="form-group full">
              <label className="form-lbl" style={{display:"flex",justifyContent:"space-between"}}>
                <span>Message *</span>
                <span style={{color:charCount>200?"var(--red)":"var(--text3)",fontWeight:400}}>{charCount}/200</span>
              </label>
              <textarea className="form-inp" rows={4} placeholder="Write your message to all users..." value={form.message} onChange={set("message")} maxLength={200} style={{resize:"vertical"}}/>
            </div>
          </div>
          {(form.title || form.message) && (
            <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:11,color:"var(--text3)",marginBottom:8,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px"}}>Preview</div>
              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"var(--gbg)",border:"1px solid var(--gbd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
                  {notifTypes.find(t=>t.value===form.type)?.label.split(" ")[0]||"📢"}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:3}}>{form.title||"Title"}</div>
                  <div style={{fontSize:12,color:"var(--text2)",lineHeight:1.5}}>{form.message||"Message..."}</div>
                  <div style={{fontSize:10,color:"var(--text3)",marginTop:4}}>Just now</div>
                </div>
              </div>
            </div>
          )}
          <button className="btn btn-p" onClick={handleSend} disabled={loading} style={{minWidth:160}}>
            {loading ? "Sending..." : "📢 Send to All Users →"}
          </button>
        </div>
      </div>
      {history.length > 0 && (
        <div className="adm-card">
          <div className="adm-ch"><span className="adm-ct">Recent Sends (this session)</span></div>
          <table className="adm-table">
            <thead><tr><th>Type</th><th>Title</th><th>Message</th><th>Users</th><th>Sent</th></tr></thead>
            <tbody>
              {history.map((h,i) => (
                <tr key={i}>
                  <td><span style={{fontSize:11,background:"var(--gbg)",color:"var(--green)",padding:"2px 8px",borderRadius:4,fontWeight:700}}>{h.type}</span></td>
                  <td style={{fontWeight:600}}>{h.title}</td>
                  <td className="muted" style={{maxWidth:240,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.message}</td>
                  <td style={{fontWeight:600,color:"var(--green)"}}>{h.count}</td>
                  <td className="muted">{new Date(h.sentAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Root Admin App ───────────────────────────────────────────
export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [page, setPage]         = useState("overview");
  const [unlocked, setUnlocked] = useState(false);

  injectAdminStyles();

  useEffect(() => {
    const token = sessionStorage.getItem("pc_admin_token");
    if (token) setUnlocked(true);
  }, []);

  if (!unlocked) return <SecretCodeGate onUnlocked={() => setUnlocked(true)} />;

  if (!user) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0F1117",color:"#9BA3B8",fontFamily:"sans-serif",flexDirection:"column",gap:12}}>
        <div style={{fontSize:14}}>You need to be logged in to access the admin panel.</div>
        <button onClick={() => window.location.href="/"} style={{padding:"8px 18px",background:"#1A1E2E",color:"#9BA3B8",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,cursor:"pointer",fontSize:13}}>Go to Login</button>
      </div>
    );
  }

  if (!user.isAdmin && !user.walletAddress) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0F1117",color:"#EF4444",fontFamily:"sans-serif",flexDirection:"column",gap:12}}>
        <div style={{fontSize:40}}>🚫</div>
        <div style={{fontSize:16,fontWeight:700}}>Admin access required</div>
        <div style={{fontSize:13,color:"#9BA3B8"}}>Your account does not have admin privileges.</div>
        <button onClick={() => { sessionStorage.removeItem("pc_admin_token"); window.location.href="/"; }} style={{marginTop:8,padding:"8px 18px",background:"#1A1E2E",color:"#9BA3B8",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,cursor:"pointer",fontSize:13}}>Go back</button>
      </div>
    );
  }

  const handleSignOut = () => { sessionStorage.removeItem("pc_admin_token"); logout(); window.location.href="/"; };
  const handleLock    = () => { sessionStorage.removeItem("pc_admin_token"); setUnlocked(false); };

  const navItems = [
    { id:"overview",      ico:"📊", lbl:"Overview"           },
    { id:"markets",       ico:"🎯", lbl:"Markets"            },
    { id:"users",         ico:"👥", lbl:"Users"              },
    { id:"transactions",  ico:"💳", lbl:"Transactions"       },
    { id:"notifications", ico:"📢", lbl:"Push Notifications" },
  ];

  const pageTitles = { overview:"Overview", markets:"Markets", users:"Users", transactions:"Transactions", notifications:"Push Notifications" };

  const renderPage = () => {
    if (page==="overview")      return <OverviewPage/>;
    if (page==="markets")       return <MarketsPage/>;
    if (page==="users")         return <UsersPage/>;
    if (page==="transactions")  return <TransactionsPage/>;
    if (page==="notifications") return <NotificationsPage/>;
    return null;
  };

  return (
    <div className="admin-shell">
      <aside className="adm-sb">
        <div className="adm-logo">
          <span style={{width:28,height:28,borderRadius:7,background:"var(--red)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:800,flexShrink:0}}>P</span>
          PredictChain
          <span className="adm-badge">Admin</span>
        </div>
        <nav className="adm-nav">
          {navItems.map(n => (
            <div key={n.id} className={`adm-ni${page===n.id?" active":""}`} onClick={()=>setPage(n.id)}>
              <span className="adm-ni-ico">{n.ico}</span>{n.lbl}
            </div>
          ))}
        </nav>
        <div className="adm-foot">
          <div style={{fontSize:11,color:"var(--text3)",padding:"4px 11px 8px",fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {user.walletAddress ? truncAddr(user.walletAddress) : user.email}
          </div>
          <div className="adm-back" onClick={handleLock} style={{marginBottom:4}}><span className="adm-ni-ico">🔒</span>Lock Panel</div>
          <div className="adm-back" onClick={handleSignOut}><span className="adm-ni-ico">🚪</span>Sign Out</div>
        </div>
      </aside>
      <main className="adm-main">
        <div className="adm-topbar">
          <span className="adm-title">{pageTitles[page]}</span>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:"var(--text3)"}}>Admin:</span>
            <span style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{user.displayName||truncAddr(user.walletAddress)||user.email}</span>
          </div>
        </div>
        {renderPage()}
      </main>
    </div>
  );
}