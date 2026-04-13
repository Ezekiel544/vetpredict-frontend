import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useMarkets, useMyPredictions, useWallet, useLeaderboard, useNotifications } from "../hooks/useData";
import { placePrediction, markNotifsRead, changePassword } from "../services/api";
import { hasConnex, placePredictionOnChain, waitForTx, claimWinningsOnChain } from "../services/vechain";

const injectStyles = (theme) => {
  const id = "pc-styles";
  const el = document.getElementById(id);
  if (el) el.remove();
  const isDark = theme === "dark";
  const dark = '--bg:#0F1117;--bg2:#171B26;--bg3:#1D2235;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.13);--text:#F4F5F7;--text2:#9BA3B8;--text3:#5B6478;--card:#171B26;--sh:0 2px 16px rgba(0,0,0,0.35);--shl:0 8px 40px rgba(0,0,0,0.45);';
  const light = '--bg:#F4F6FA;--bg2:#FFFFFF;--bg3:#EEF1F8;--border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.13);--text:#111827;--text2:#4B5563;--text3:#9CA3AF;--card:#FFFFFF;--sh:0 2px 12px rgba(0,0,0,0.06);--shl:0 8px 36px rgba(0,0,0,0.11);';
  const tbBg = isDark ? 'rgba(15,17,23,0.95)' : 'rgba(255,255,255,0.95)';
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Bricolage+Grotesque:wght@500;600;700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    :root{
      --fh:'Bricolage Grotesque',sans-serif;
      --fb:'Plus Jakarta Sans',sans-serif;
      ${isDark ? dark : light}
      --green:#0BAB64;--gbg:rgba(11,171,100,0.09);--gbd:rgba(11,171,100,0.22);
      --red:#EF4444;--rbg:rgba(239,68,68,0.08);--rbd:rgba(239,68,68,0.2);
      --blue:#3B82F6;--bbg:rgba(59,130,246,0.08);--bbd:rgba(59,130,246,0.2);
      --amber:#F59E0B;--abg:rgba(245,158,11,0.09);--abd:rgba(245,158,11,0.2);
      --purple:#8B5CF6;--pbg:rgba(139,92,246,0.08);--pbd:rgba(139,92,246,0.2);
      --vet:#5C6BC0;--vbg:rgba(92,107,192,0.09);--vbd:rgba(92,107,192,0.22);
      --r:10px;--rl:16px;--rxl:22px;
    }
    body{background:var(--bg);color:var(--text);font-family:var(--fb);line-height:1.6;-webkit-font-smoothing:antialiased;}
    .shell{display:flex;min-height:100vh;}
    .sb{width:220px;flex-shrink:0;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:300;transition:transform 0.26s ease;}
    .sb-logo{padding:16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;font-family:var(--fh);font-weight:800;font-size:16px;color:var(--text);cursor:pointer;}
    .lmark{width:27px;height:27px;border-radius:7px;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;}
    .sb-nav{flex:1;padding:8px 7px;overflow-y:auto;}
    .nlbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text3);padding:8px 9px 4px;}
    .ni{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text2);transition:all 0.15s;margin-bottom:1px;}
    .ni:hover{background:var(--bg3);color:var(--text);}
    .ni.active{background:var(--gbg);color:var(--green);font-weight:600;}
    .ni-i{font-size:15px;width:18px;text-align:center;flex-shrink:0;}
    .nbadge{margin-left:auto;background:var(--green);color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:100px;}
    .sb-foot{padding:10px 7px;border-top:1px solid var(--border);}
    .ucard{display:flex;align-items:center;gap:8px;padding:8px 9px;border-radius:9px;background:var(--bg3);cursor:pointer;}
    .ucard:hover{background:var(--border);}
    .uav{width:30px;height:30px;border-radius:50%;background:var(--gbg);border:2px solid var(--gbd);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--green);flex-shrink:0;}
    .uname-sb{font-size:11px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px;font-family:monospace;}
    .urank-sb{font-size:10px;color:var(--text3);}
    .tb{position:fixed;top:0;left:220px;right:0;height:58px;z-index:200;background:${tbBg};backdrop-filter:blur(16px);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 20px;gap:12px;}
    .tb-l{display:flex;align-items:center;gap:10px;}
    .tb-title{font-family:var(--fh);font-size:16px;font-weight:800;color:var(--text);}
    .hbtn{display:none;width:34px;height:34px;border-radius:8px;border:1.5px solid var(--border);background:var(--card);align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:var(--text2);flex-shrink:0;}
    .srch{display:flex;align-items:center;gap:7px;background:var(--bg3);border:1.5px solid var(--border);border-radius:8px;padding:6px 12px;width:190px;transition:all 0.18s;}
    .srch:focus-within{border-color:var(--green);width:230px;}
    .srch input{background:none;border:none;outline:none;font-size:12px;color:var(--text);font-family:var(--fb);width:100%;}
    .srch input::placeholder{color:var(--text3);}
    .tb-r{display:flex;align-items:center;gap:8px;position:relative;}
    .ibtn{width:34px;height:34px;border-radius:8px;border:1.5px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;transition:all 0.15s;position:relative;color:var(--text2);flex-shrink:0;}
    .ibtn:hover{border-color:var(--border2);color:var(--text);}
    .ndot{position:absolute;top:5px;right:5px;width:6px;height:6px;border-radius:50%;background:var(--red);border:1.5px solid var(--bg2);}
    .notif-wrap{position:relative;}
    .notif-popup{position:absolute;top:42px;right:0;width:310px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--rl);box-shadow:var(--shl);z-index:400;overflow:hidden;}
    .np-head{padding:13px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
    .np-title{font-family:var(--fh);font-size:14px;font-weight:700;color:var(--text);}
    .np-mark{font-size:11px;color:var(--green);font-weight:600;cursor:pointer;}
    .np-item{display:flex;align-items:flex-start;gap:10px;padding:11px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.15s;}
    .np-item:last-child{border-bottom:none;}
    .np-item:hover{background:var(--bg3);}
    .np-ico{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
    .np-body{flex:1;}
    .np-text{font-size:12px;color:var(--text);line-height:1.5;}
    .np-time{font-size:10px;color:var(--text3);margin-top:2px;}
    .np-dot{width:6px;height:6px;border-radius:50%;background:var(--green);flex-shrink:0;margin-top:6px;}
    .np-footer{padding:10px 16px;border-top:1px solid var(--border);text-align:center;}
    .np-see{font-size:12px;color:var(--green);font-weight:600;cursor:pointer;}
    .main{margin-left:220px;padding-top:58px;min-height:100vh;width:calc(100% - 220px);}
    .pg{padding:22px;width:100%;}
    .sbo{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:290;}
    .sbo.open{display:block;}
    .card{background:var(--card);border:1px solid var(--border);border-radius:var(--rl);overflow:hidden;margin-bottom:16px;}
    .ph{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
    .pt{font-family:var(--fh);font-size:14px;font-weight:700;color:var(--text);}
    .pa{font-size:12px;color:var(--green);font-weight:600;cursor:pointer;}
    .btn{display:inline-flex;align-items:center;gap:7px;font-family:var(--fb);font-weight:600;font-size:13px;border:none;border-radius:9px;cursor:pointer;transition:all 0.18s;padding:9px 18px;}
    .btn-p{background:var(--green);color:#fff;}
    .btn-p:hover{background:#09966f;box-shadow:0 4px 14px rgba(11,171,100,0.35);}
    .btn-o{background:transparent;color:var(--text);border:1.5px solid var(--border2);}
    .btn-o:hover{border-color:var(--green);color:var(--green);background:var(--gbg);}
    .btn-g{background:var(--bg3);color:var(--text2);border:1.5px solid var(--border);}
    .btn-g:hover{border-color:var(--border2);color:var(--text);}
    .btn-vet{background:var(--vbg);color:var(--vet);border:1.5px solid var(--vbd);}
    .btn-sm{padding:6px 13px;font-size:12px;border-radius:8px;}
    .btn-bl{width:100%;justify-content:center;}
    .pill{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;padding:3px 8px;border-radius:100px;}
    .pill-g{background:var(--gbg);color:var(--green);border:1px solid var(--gbd);}
    .pill-r{background:var(--rbg);color:var(--red);border:1px solid var(--rbd);}
    .pill-b{background:var(--bbg);color:var(--blue);border:1px solid var(--bbd);}
    .pill-a{background:var(--abg);color:var(--amber);border:1px solid var(--abd);}
    .pill-p{background:var(--pbg);color:var(--purple);border:1px solid var(--pbd);}
    .pill-v{background:var(--vbg);color:var(--vet);border:1px solid var(--vbd);}
    .inp{background:var(--bg3);border:1.5px solid var(--border);border-radius:9px;padding:9px 13px;color:var(--text);font-size:13px;font-family:var(--fb);outline:none;transition:all 0.18s;width:100%;margin-bottom:10px;}
    .inp:focus{border-color:var(--green);background:var(--bg2);}
    .mo{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:500;align-items:center;justify-content:center;padding:20px;}
    .mo.open{display:flex;}
    .mbox{background:var(--bg2);border:1px solid var(--border);border-radius:var(--rxl);padding:28px;max-width:420px;width:100%;position:relative;}
    .mclose{position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:7px;border:1.5px solid var(--border);background:var(--bg3);cursor:pointer;font-size:12px;color:var(--text2);display:flex;align-items:center;justify-content:center;}
    .mhead{text-align:center;margin-bottom:20px;}
    .mico{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 12px;}
    .mtitle{font-family:var(--fh);font-size:18px;font-weight:800;color:var(--text);margin-bottom:6px;}
    .msub{font-size:13px;color:var(--text2);line-height:1.6;}
    .mbody{display:flex;flex-direction:column;gap:10px;}
    .welcome{background:linear-gradient(135deg,var(--gbg),var(--bbg));border:1px solid var(--gbd);border-radius:var(--rxl);padding:22px 26px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:14px;}
    .wt h2{font-family:var(--fh);font-size:20px;font-weight:800;color:var(--text);margin-bottom:4px;}
    .wt p{font-size:13px;color:var(--text2);}
    .streak{display:flex;align-items:center;gap:10px;background:var(--abg);border:1px solid var(--abd);border-radius:11px;padding:10px 14px;}
    .snum{font-family:var(--fh);font-size:24px;font-weight:800;color:var(--amber);}
    .sinfo{font-size:11px;color:var(--text2);}
    .sinfo strong{display:block;font-size:12px;color:var(--text);font-weight:700;}
    .stats4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
    .sc{background:var(--card);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px;transition:all 0.2s;}
    .sc:hover{border-color:var(--border2);transform:translateY(-1px);box-shadow:var(--sh);}
    .sc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
    .sc-ico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;}
    .sc-ch{font-size:10px;font-weight:700;padding:2px 7px;border-radius:100px;}
    .sc-val{font-family:var(--fh);font-size:22px;font-weight:800;color:var(--text);margin-bottom:3px;}
    .sc-lbl{font-size:11px;color:var(--text3);font-weight:500;}
    .dbcols{display:grid;grid-template-columns:1fr 300px;gap:16px;margin-bottom:20px;}
    .prow{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;transition:background 0.15s;cursor:pointer;}
    .prow:last-child{border-bottom:none;}
    .prow:hover{background:var(--bg3);}
    .pcat{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
    .pi{flex:1;min-width:0;}
    .pq{font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
    .pm{display:flex;align-items:center;gap:8px;margin-top:3px;}
    .ptag{font-size:9px;font-weight:700;text-transform:uppercase;padding:2px 6px;border-radius:100px;}
    .ptag.yes{background:var(--gbg);color:var(--green);}
    .ptag.no{background:var(--rbg);color:var(--red);}
    .ptimer{font-size:11px;color:var(--text3);}
    .pr{text-align:right;flex-shrink:0;}
    .pstake{font-family:var(--fh);font-size:14px;font-weight:800;color:var(--text);}
    .ppot{font-size:11px;color:var(--green);font-weight:600;margin-top:1px;}
    .arow{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:10px;transition:background 0.15s;}
    .arow:last-child{border-bottom:none;}
    .arow:hover{background:var(--bg3);}
    .aico{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
    .atxt{font-size:12px;color:var(--text);line-height:1.5;}
    .atime{font-size:10px;color:var(--text3);margin-top:2px;}
    .trow{padding:12px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.15s;}
    .trow:last-child{border-bottom:none;}
    .trow:hover{background:var(--bg3);}
    .ttop{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
    .tq{font-size:12px;font-weight:600;color:var(--text);flex:1;}
    .tbar{height:4px;border-radius:100px;background:var(--bg3);overflow:hidden;margin-bottom:4px;}
    .tbf{height:100%;border-radius:100px;background:var(--green);}
    .todds{display:flex;justify-content:space-between;font-size:10px;font-weight:700;}
    .rring{position:relative;width:80px;height:80px;flex-shrink:0;}
    .rring svg{transform:rotate(-90deg);}
    .ring-bg{fill:none;stroke:var(--bg3);stroke-width:7;}
    .ring-fill{fill:none;stroke:var(--green);stroke-width:7;stroke-linecap:round;stroke-dasharray:200;transition:stroke-dashoffset 1s ease;}
    .ring-txt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
    .ring-pct{font-family:var(--fh);font-size:17px;font-weight:800;color:var(--text);}
    .ring-sub{font-size:8px;color:var(--text3);font-weight:600;text-transform:uppercase;}
    .wrrow{display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid var(--border);}
    .wrrow:last-child{border-bottom:none;}
    .badge-g{display:flex;gap:8px;flex-wrap:wrap;padding:14px 16px;}
    .badge-i{display:flex;flex-direction:column;align-items:center;gap:5px;}
    .badge-ico{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;}
    .badge-on{border:2px solid var(--gbd);background:var(--gbg);}
    .badge-off{border:2px solid var(--border);background:var(--bg3);opacity:0.5;filter:grayscale(1);}
    .badge-nm{font-size:9px;font-weight:600;color:var(--text2);text-align:center;max-width:46px;}
    .qb-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
    .qb-opt{padding:11px;border-radius:9px;border:2px solid var(--border);cursor:pointer;text-align:center;transition:all 0.15s;background:var(--bg3);}
    .qb-opt:hover{border-color:var(--gbd);background:var(--gbg);}
    .qb-opt.sel{border-color:var(--green);background:var(--gbg);}
    .qb-lbl{font-size:12px;font-weight:700;color:var(--text);}
    .qb-pct{font-size:11px;color:var(--text3);margin-top:2px;}
    .qb-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
    .chip{padding:5px 12px;border-radius:7px;border:1.5px solid var(--border);font-size:12px;font-weight:600;cursor:pointer;background:var(--bg3);color:var(--text2);transition:all 0.15s;}
    .chip:hover,.chip.sel{background:var(--gbg);border-color:var(--gbd);color:var(--green);}
    .qb-sum{background:var(--bg3);border-radius:9px;padding:10px 12px;margin-bottom:12px;}
    .qb-sumrow{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;}
    .qb-sumrow:last-child{margin-bottom:0;font-weight:700;border-top:1px solid var(--border);padding-top:5px;margin-top:5px;}
    .qb-sumrow span:last-child{color:var(--green);font-weight:700;}
    .filter-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px;}
    .ftab{padding:7px 14px;border-radius:8px;border:1.5px solid var(--border);font-size:12px;font-weight:600;cursor:pointer;background:var(--bg3);color:var(--text2);transition:all 0.15s;}
    .ftab:hover{border-color:var(--border2);color:var(--text);}
    .ftab.active{background:var(--gbg);border-color:var(--gbd);color:var(--green);}
    .mkt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;}
    .mkt{background:var(--card);border:1px solid var(--border);border-radius:var(--rl);padding:16px;cursor:pointer;transition:all 0.2s;}
    .mkt:hover{border-color:var(--border2);transform:translateY(-2px);box-shadow:var(--sh);}
    .mkt-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
    .mkt-ico{font-size:20px;}
    .mkt-q{font-size:13px;font-weight:700;color:var(--text);line-height:1.4;margin-bottom:10px;}
    .mkt-bar-wrap{height:5px;border-radius:100px;background:var(--bg3);overflow:hidden;margin-bottom:7px;}
    .mkt-bar-fill{height:100%;border-radius:100px;background:var(--green);}
    .mkt-odds{display:flex;justify-content:space-between;font-size:11px;font-weight:700;margin-bottom:10px;}
    .mkt-foot{display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--text3);}
    .pred-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .pred-card{background:var(--card);border:1px solid var(--border);border-radius:var(--rl);padding:16px;transition:all 0.2s;}
    .pred-card:hover{border-color:var(--border2);box-shadow:var(--sh);}
    .pc-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;gap:8px;}
    .pc-q{font-size:13px;font-weight:700;color:var(--text);line-height:1.4;flex:1;}
    .pc-row{display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid var(--border);}
    .pc-row:last-child{border-bottom:none;}
    .lb-tabs{display:flex;background:var(--bg3);border-radius:9px;padding:3px;gap:3px;margin-bottom:18px;width:fit-content;}
    .lb-tab{padding:7px 16px;border-radius:7px;border:none;background:transparent;color:var(--text2);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--fb);transition:all 0.15s;}
    .lb-tab.active{background:var(--bg2);color:var(--text);box-shadow:0 1px 6px rgba(0,0,0,0.1);}
    .lb-row{display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid var(--border);transition:background 0.15s;}
    .lb-row:last-child{border-bottom:none;}
    .lb-row:hover{background:var(--bg3);}
    .lb-row.me{background:var(--gbg);}
    .lb-rank{width:28px;text-align:center;font-family:var(--fh);font-size:14px;font-weight:800;color:var(--text3);flex-shrink:0;}
    .lb-av{width:34px;height:34px;border-radius:50%;background:var(--bg3);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--text2);flex-shrink:0;}
    .lb-info{flex:1;min-width:0;}
    .lb-name{font-size:13px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .lb-sub{font-size:11px;color:var(--text3);margin-top:1px;}
    .lb-right{text-align:right;flex-shrink:0;}
    .lb-val{font-family:var(--fh);font-size:14px;font-weight:800;color:var(--text);}
    .lb-ch{font-size:10px;color:var(--green);font-weight:600;margin-top:1px;}
    .my-rank-bar{background:var(--gbg);border:1px solid var(--gbd);border-radius:var(--rl);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px;}
    .w-hero{background:linear-gradient(135deg,var(--gbg),var(--vbg));border:1px solid var(--gbd);border-radius:var(--rxl);padding:22px;margin-bottom:16px;}
    .w-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px;}
    .w-bal{font-family:var(--fh);font-size:34px;font-weight:800;color:var(--text);letter-spacing:-1px;}
    .w-usd{font-size:13px;color:var(--text2);margin-top:3px;}
    .wstats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
    .wstat{background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;}
    .wsl{font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;}
    .wsv{font-family:var(--fh);font-size:15px;font-weight:800;color:var(--text);}
    .wacts{display:flex;gap:8px;flex-wrap:wrap;}
    .w-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
    .wcrow{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border);transition:background 0.15s;}
    .wcrow:last-child{border-bottom:none;}
    .wcrow:hover{background:var(--bg3);}
    .wcico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
    .wcname{font-size:13px;font-weight:700;color:var(--text);}
    .wcaddr{font-size:10px;color:var(--text3);font-family:monospace;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;}
    .wcpill{font-size:9px;font-weight:700;text-transform:uppercase;padding:2px 7px;border-radius:100px;background:var(--gbg);color:var(--green);border:1px solid var(--gbd);margin-left:auto;flex-shrink:0;}
    .txrow{display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid var(--border);transition:background 0.15s;}
    .txrow:last-child{border-bottom:none;}
    .txrow:hover{background:var(--bg3);}
    .txic{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
    .txi{flex:1;min-width:0;}
    .txn{font-size:13px;font-weight:600;color:var(--text);}
    .txm{font-size:11px;color:var(--text3);margin-top:1px;}
    .txa{font-family:var(--fh);font-size:13px;font-weight:800;text-align:right;flex-shrink:0;}
    .txa.pos{color:var(--green);}
    .txa.neg{color:var(--red);}
    .prof-hero{background:linear-gradient(135deg,var(--pbg),var(--gbg));border:1px solid var(--pbd);border-radius:var(--rxl);padding:24px;margin-bottom:16px;}
    .prof-top{display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:18px;}
    .prof-av{width:68px;height:68px;border-radius:50%;background:var(--gbg);border:3px solid var(--gbd);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:var(--green);flex-shrink:0;font-family:var(--fh);}
    .prof-name{font-family:var(--fh);font-size:19px;font-weight:800;color:var(--text);margin-bottom:2px;}
    .prof-addr{font-size:11px;color:var(--vet);font-family:monospace;display:flex;align-items:center;gap:5px;margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;}
    .prof-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
    .prof-stat{background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:var(--r);padding:11px 12px;text-align:center;}
    .psv{font-family:var(--fh);font-size:17px;font-weight:800;color:var(--text);}
    .psl{font-size:10px;color:var(--text3);margin-top:2px;text-transform:uppercase;letter-spacing:0.4px;font-weight:600;}
    .prof-two{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .prof-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border);font-size:13px;}
    .prof-row:last-child{border-bottom:none;}
    .prof-row-lbl{color:var(--text2);font-weight:500;flex-shrink:0;}
    .prof-row-val{color:var(--text);font-weight:600;font-family:monospace;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:55%;text-align:right;}
    .prof-row-val.nm{font-family:var(--fb);}
    .sup-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;}
    .sup-card{background:var(--card);border:1px solid var(--border);border-radius:var(--rl);padding:18px;cursor:pointer;transition:all 0.18s;display:flex;align-items:flex-start;gap:12px;}
    .sup-card:hover{border-color:var(--border2);transform:translateY(-2px);box-shadow:var(--sh);}
    .sup-ico{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;}
    .faq-item{border-bottom:1px solid var(--border);}
    .faq-item:last-child{border-bottom:none;}
    .faq-q{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;cursor:pointer;font-size:13px;font-weight:600;color:var(--text);transition:background 0.15s;}
    .faq-q:hover{background:var(--bg3);}
    .faq-ch{transition:transform 0.2s;font-size:12px;color:var(--text3);}
    .faq-a{padding:0 16px 13px;font-size:12px;color:var(--text2);line-height:1.7;}
    @media(max-width:1024px){
      .dbcols{grid-template-columns:1fr;}
      .stats4{grid-template-columns:repeat(2,1fr);}
      .mkt-grid{grid-template-columns:repeat(2,1fr);}
      .pred-grid{grid-template-columns:1fr;}
      .sup-grid{grid-template-columns:1fr;}
      .wstats{grid-template-columns:repeat(2,1fr);}
      .w-cols{grid-template-columns:1fr!important;}
      .prof-stats{grid-template-columns:repeat(2,1fr);}
      .prof-two{grid-template-columns:1fr!important;}
    }
    @media(max-width:768px){
      .sb{transform:translateX(-100%);}
      .sb.open{transform:translateX(0);}
      .tb{left:0;padding:0 14px;}
      .main{margin-left:0;width:100%;}
      .pg{padding:14px;}
      .stats4{grid-template-columns:1fr 1fr;gap:10px;}
      .srch{display:none;}
      .hbtn{display:flex!important;}
      .mkt-grid{grid-template-columns:1fr;}
      .w-cols{grid-template-columns:1fr!important;}
      .prof-two{grid-template-columns:1fr!important;}
    }
    @media(max-width:480px){
      .stats4{grid-template-columns:1fr 1fr;}
      .wstats{grid-template-columns:1fr 1fr;}
      .prof-stats{grid-template-columns:1fr 1fr;}
      .sup-grid{grid-template-columns:1fr;}
    }
  `;
  const s = document.createElement("style");
  s.id = id; s.textContent = css;
  document.head.appendChild(s);
};

const truncAddr = a => a ? a.slice(0,6)+"..."+a.slice(-4) : "";
const addrInit  = a => a ? a.slice(2,4).toUpperCase() : "0x";
const getDisplayName = u => u.walletUser ? truncAddr(u.walletAddress) : (u.displayName||"User");
const getInitials    = u => u.walletUser ? addrInit(u.walletAddress) : (u.displayName?.slice(0,2).toUpperCase()||"US");

const fmtVet = (n) => n ? `${parseFloat(n).toLocaleString()} VET` : "0 VET";
const fmtDate = (d) => {
  if(!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  if(diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if(diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return `${Math.floor(diff/86400000)}d ago`;
};
const timeLeft = (closesAt) => {
  const ms = new Date(closesAt) - Date.now();
  if(ms<=0) return "Closed";
  const d = Math.floor(ms/86400000);
  const h = Math.floor(ms/3600000);
  const m = Math.floor(ms/60000);
  if(d>=1) return `${d}d left`;
  if(h>=1) return `${h}h left`;
  return `${m}m left`;
};
const yesPercent = (m) => m.totalPool > 0 ? Math.round((m.yesPool/m.totalPool)*100) : 50;
const catBadge   = (cat) => ({Sports:"pill-b",Crypto:"pill-g",Politics:"pill-p",Entertainment:"pill-a",Gaming:"pill-g",Stocks:"pill-b",Meme:"pill-r"}[cat]||"pill-g");
const txIcon     = (type) => ({deposit:"📥",withdrawal:"📤",stake:"🎯",win:"💰",refund:"📤",fee:"💳"}[type]||"💳");
const txBg       = (type) => ({deposit:"var(--vbg)",withdrawal:"var(--pbg)",stake:"var(--bbg)",win:"var(--gbg)",refund:"var(--abg)",fee:"var(--rbg)"}[type]||"var(--bg3)");
const notifIcon  = (type) => ({win:"🎉",loss:"📉",market_closing:"⏰",deposit:"📥",withdrawal:"📤",system:"📢",rank_change:"🏆"}[type]||"🔔");
const notifBg    = (type) => ({win:"var(--gbg)",loss:"var(--rbg)",market_closing:"var(--abg)",deposit:"var(--vbg)",rank_change:"var(--pbg)"}[type]||"var(--bg3)");

function EmptyState({icon,title,sub,action,onAction}) {
  return (
    <div style={{padding:"48px 20px",textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:12}}>{icon}</div>
      <div style={{fontFamily:"var(--fh)",fontSize:17,fontWeight:800,color:"var(--text)",marginBottom:6}}>{title}</div>
      <div style={{fontSize:13,color:"var(--text2)",marginBottom:action?16:0,lineHeight:1.6}}>{sub}</div>
      {action&&<button className="btn btn-p btn-sm" onClick={onAction}>{action}</button>}
    </div>
  );
}

function Skeleton({h=16,w="100%",mb=8}) {
  return <div style={{height:h,width:w,borderRadius:6,background:"var(--bg3)",marginBottom:mb}}/>
}

// ─── Connect Wallet Prompt ────────────────────────────────────
function ConnectWalletPrompt({ open, onClose, onConnected }) {
  const { linkWalletToAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [step,    setStep]    = useState("");

  const handleConnect = async () => {
    setLoading(true); setError(""); setStep("Opening VeWorld...");
    try {
      setStep("Sign the message in VeWorld...");
      await linkWalletToAccount();
      setStep("");
      onConnected();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Connection failed");
      setStep("");
    } finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <div className="mo open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mbox" style={{maxWidth:400}}>
        <button className="mclose" onClick={onClose}>x</button>
        <div className="mhead">
          <div className="mico" style={{background:"var(--vbg)",fontSize:26}}>🔷</div>
          <div className="mtitle">Connect VeWorld to Predict</div>
          <div className="msub" style={{lineHeight:1.6}}>
            You are signed in with email or Google. To place predictions and stake VET,
            you need to connect a VeChain wallet.
          </div>
        </div>
        {error && <div style={{background:"var(--rbg)",border:"1px solid var(--rbd)",color:"var(--red)",padding:"10px 14px",borderRadius:9,fontSize:13,marginBottom:14}}>{error}</div>}
        {step  && <div style={{fontSize:12,color:"var(--amber)",textAlign:"center",marginBottom:12}}>{step}</div>}
        <div style={{background:"var(--bg3)",borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:12,color:"var(--text2)",lineHeight:1.7}}>
          <div style={{marginBottom:4}}>📱 <strong>Don't have VeWorld?</strong></div>
          <div>Download from <strong style={{color:"var(--vet)"}}>veworld.net</strong> — free, 2 mins to set up.</div>
          <div style={{marginTop:6}}>🔑 Get testnet VET at <strong style={{color:"var(--vet)"}}>faucet.vecha.in</strong></div>
        </div>
        <button className="btn btn-p btn-bl" onClick={handleConnect} disabled={loading}>
          {loading ? step || "Connecting..." : "Connect VeWorld Wallet →"}
        </button>
        <button className="btn btn-g btn-bl" style={{marginTop:8}} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Predict Modal ────────────────────────────────────────────
function PredictModal({ market, user, open, onClose, onSuccess }) {
  const { toUsd, refreshUser } = useAuth();
  const [sel, setSel]     = useState("YES");
  const [amt, setAmt]     = useState("50");
  const [loading, setLoading] = useState(false);
  const [step, setStep]   = useState("");
  const [msg, setMsg]     = useState({ text:"", ok:false });
  const [showConnect, setShowConnect] = useState(false);

  if (!open || !market) return null;

  const yp    = yesPercent(market);
  const yOdds = yp > 0 ? (100/yp).toFixed(2) : "2.00";
  const nOdds = (100-yp) > 0 ? (100/(100-yp)).toFixed(2) : "2.00";
  const odds  = sel === "YES" ? parseFloat(yOdds) : parseFloat(nOdds);
  const pot   = (parseFloat(amt||0) * odds).toFixed(0);

  const handlePlace = async () => {
    const stakeVet = parseFloat(amt);
    if (isNaN(stakeVet) || stakeVet < 1) { setMsg({text:"Minimum stake is 1 VET",ok:false}); return; }
    if (!user.walletUser) { setShowConnect(true); return; }
    if (!hasConnex()) { setMsg({text:"VeWorld wallet not detected.",ok:false}); return; }
    setLoading(true); setMsg({text:"",ok:false});
    try {
      setStep("Confirm in VeWorld...");
      // const txHash = await placePredictionOnChain({ contractMarketId: market.contractMarketId || market._id, isYes: sel === "YES", stakeVet });
      const txHash = await placePredictionOnChain({ 
  contractMarketId: market.contractMarketId, // remove the || market._id fallback
  isYes: sel === "YES", 
  stakeVet 
});
      setStep("Waiting for confirmation...");
      await waitForTx(txHash);
      setStep("Recording prediction...");
      await placePrediction({ marketId: market._id, side: sel, stakeVet, txHash });
      setMsg({text:"Prediction placed successfully! 🎉",ok:true});
      setTimeout(() => { onSuccess?.(); onClose(); }, 2000);
    } catch (e) {
      setMsg({text: e.response?.data?.error || e.message || "Failed",ok:false});
    } finally { setLoading(false); setStep(""); }
  };

  return (
    <>
      <div className="mo open" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="mbox" style={{maxWidth:440}}>
          <button className="mclose" onClick={onClose}>x</button>
          <div className="mhead">
            <div className="mico" style={{background:"var(--gbg)",fontSize:24}}>{market.emoji||"📊"}</div>
            <div className="mtitle" style={{fontSize:15,lineHeight:1.4}}>{market.title}</div>
            <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:6}}>
              <span className={`pill ${catBadge(market.category)}`}>{market.category}</span>
              <span className="pill pill-g">{timeLeft(market.closesAt)}</span>
            </div>
          </div>
          <div style={{margin:"0 0 16px",padding:"12px 14px",background:"var(--bg3)",borderRadius:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
              <span style={{color:"var(--green)",fontWeight:700}}>YES {yp}%</span>
              <span style={{color:"var(--text3)"}}>Pool: {fmtVet(market.totalPool)}</span>
              <span style={{color:"var(--red)",fontWeight:700}}>NO {100-yp}%</span>
            </div>
            <div style={{height:6,borderRadius:3,background:"var(--rbg)",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${yp}%`,background:"var(--green)",borderRadius:3}}/>
            </div>
          </div>
          <div className="qb-opts" style={{marginBottom:14}}>
            {["YES","NO"].map(o=>(
              <div key={o} className={`qb-opt${sel===o?" sel":""}`} onClick={()=>setSel(o)}>
                <div className="qb-lbl">{o}</div>
                <div className="qb-pct">{o==="YES"?yp:100-yp}% · {o==="YES"?yOdds:nOdds}x</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Amount (VET)</div>
          <div className="qb-chips" style={{marginBottom:8}}>
            {["25","50","100","250"].map(a=>(
              <div key={a} className={`chip${amt===a?" sel":""}`} onClick={()=>setAmt(a)}>{a}</div>
            ))}
          </div>
          <input className="inp" type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="Min 1 VET"/>
          <div className="qb-sum" style={{marginBottom:14}}>
            <div className="qb-sumrow"><span style={{color:"var(--text2)"}}>Stake</span><span>{amt||0} VET ({toUsd(amt)})</span></div>
            <div className="qb-sumrow"><span style={{color:"var(--text2)"}}>Odds</span><span>{odds}x</span></div>
            <div className="qb-sumrow"><span style={{color:"var(--text2)"}}>Platform fee</span><span style={{color:"var(--text3)"}}>1.5%</span></div>
            <div className="qb-sumrow" style={{borderTop:"1px solid var(--border)",paddingTop:8,marginTop:4}}>
              <span style={{fontWeight:700}}>Potential win</span>
              <span style={{color:"var(--green)",fontWeight:700}}>+{pot} VET ({toUsd(pot)})</span>
            </div>
          </div>
          {step&&<div style={{fontSize:11,color:"var(--amber)",textAlign:"center",marginBottom:8}}>{step}</div>}
          {msg.text&&<div style={{fontSize:12,color:msg.ok?"var(--green)":"var(--red)",textAlign:"center",marginBottom:8}}>{msg.text}</div>}
          <button className="btn btn-p btn-bl" onClick={handlePlace} disabled={loading}>
            {loading ? step||"Processing..." : user.walletUser ? `Predict ${sel} →` : "Connect Wallet to Predict"}
          </button>
        </div>
      </div>
      <ConnectWalletPrompt
        open={showConnect}
        onClose={()=>setShowConnect(false)}
        onConnected={()=>{ setShowConnect(false); refreshUser(); }}
      />
    </>
  );
}

// ─── QuickBet ─────────────────────────────────────────────────
function QuickBet({onNavigate, user}) {
  const { data: markets, reload } = useMarkets({status:"active",limit:5});
  const { toUsd, refreshUser } = useAuth();
  const [marketIdx,setMarketIdx] = useState(0);
  const [sel,setSel]   = useState("YES");
  const [amt,setAmt]   = useState("50");
  const [loading,setLoading] = useState(false);
  const [step,setStep] = useState("");
  const [showConnect, setShowConnect] = useState(false);
  const [msg,setMsg]   = useState({text:"",ok:false});

  const market = markets?.[marketIdx];
  const yp    = market ? yesPercent(market) : 50;
  const yOdds = yp > 0 ? (100/yp).toFixed(2) : "2.00";
  const nOdds = (100-yp) > 0 ? (100/(100-yp)).toFixed(2) : "2.00";
  const odds  = sel==="YES" ? parseFloat(yOdds) : parseFloat(nOdds);
  const pot   = (parseFloat(amt||0)*odds).toFixed(0);

  const handlePlace = async () => {
    if(!market) return;
    const stakeVet = parseFloat(amt);
    if(isNaN(stakeVet)||stakeVet < 1) { setMsg({text:"Minimum stake is 1 VET",ok:false}); return; }
    if(user.walletUser) {
      if(!hasConnex()) { setMsg({text:"VeWorld wallet not detected.",ok:false}); return; }
      setLoading(true); setMsg({text:"",ok:false});
      try {
        setStep("Confirm in VeWorld...");
        // const txHash = await placePredictionOnChain({ contractMarketId: market.contractMarketId || market._id, isYes: sel === "YES", stakeVet });
        const txHash = await placePredictionOnChain({ 
      contractMarketId: market.contractMarketId, // remove the || market._id fallback
      isYes: sel === "YES", 
      stakeVet 
    });
        setStep("Waiting for confirmation...");
        await waitForTx(txHash);
        setStep("Recording prediction...");
        await placePrediction({ marketId: market._id, side: sel, stakeVet, txHash });
        setMsg({text:"Prediction placed!",ok:true});
        setTimeout(()=>{ setMsg({text:"",ok:false}); reload(); },3000);
      } catch(e) {
        setMsg({text: e.response?.data?.error || e.message || "Failed",ok:false});
      } finally { setLoading(false); setStep(""); }
      return;
    }
    setShowConnect(true);
  };

  if(!market) return (
    <div className="card">
      <div className="ph"><span className="pt">Quick Predict</span></div>
      <EmptyState icon="📊" title="No markets yet" sub="Markets will appear here once created." action="Browse Markets" onAction={()=>onNavigate("markets")}/>
    </div>
  );

  return (
    <>
      <div className="card">
        <div className="ph">
          <span className="pt">Quick Predict</span>
          <span className="pa" onClick={()=>setMarketIdx(i=>(i+1)%(markets?.length||1))}>Next →</span>
        </div>
        <div style={{padding:"14px 16px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:12,lineHeight:1.4}}>{market.title}</div>
          <div className="qb-opts">
            {["YES","NO"].map(o=>(
              <div key={o} className={`qb-opt${sel===o?" sel":""}`} onClick={()=>setSel(o)}>
                <div className="qb-lbl">{o}</div>
                <div className="qb-pct">{o==="YES"?yp:100-yp}% chance</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Amount (VET)</div>
          <div className="qb-chips">
            {["25","50","100","250"].map(a=>(
              <div key={a} className={`chip${amt===a?" sel":""}`} onClick={()=>setAmt(a)}>{a}</div>
            ))}
          </div>
          <input className="inp" type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="Min 1 VET"/>
          <div className="qb-sum">
            <div className="qb-sumrow"><span style={{color:"var(--text2)"}}>Stake</span><span>{amt||0} VET</span></div>
            <div className="qb-sumrow"><span style={{color:"var(--text2)"}}>Odds</span><span>{odds}x</span></div>
            <div className="qb-sumrow"><span>Potential win</span><span>+{pot} VET ({toUsd(pot)})</span></div>
            <div className="qb-sumrow"><span style={{color:"var(--text3)"}}>Platform fee</span><span style={{color:"var(--text3)"}}>1.5%</span></div>
          </div>
          {step&&<div style={{fontSize:11,color:"var(--amber)",marginBottom:8,textAlign:"center"}}>{step}</div>}
          {msg.text&&<div style={{fontSize:12,color:msg.ok?"var(--green)":"var(--red)",marginBottom:8,textAlign:"center"}}>{msg.text}</div>}
          <button className="btn btn-p btn-bl" onClick={handlePlace} disabled={loading}>
            {loading ? step||"Processing..." : user.walletUser ? "Place Prediction →" : "Connect Wallet to Predict"}
          </button>
        </div>
      </div>
      <ConnectWalletPrompt
        open={showConnect}
        onClose={() => setShowConnect(false)}
        onConnected={() => { setShowConnect(false); refreshUser(); }}
      />
    </>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────
function DashboardPage({setActive,user}) {
  const { toUsd, liveBalance } = useAuth();
  const { predictions, loading: predLoading } = useMyPredictions({status:"active",limit:4});
  const { markets: trendingMarkets, loading: mktLoading } = useMarkets({status:"active",limit:4});
  const { notifications, loading: notifLoading } = useNotifications();
  const dn = getDisplayName(user);
  const winRate = user.totalPredictions > 0 ? Math.round((user.correctPredictions/user.totalPredictions)*100) : 0;
  const incorrect = user.totalPredictions - user.correctPredictions;
  const ringOffset = 200-(200*(winRate/100));
  const displayBalance = user.walletUser && liveBalance !== null ? liveBalance : user.vetBalance;

  return (
    <div className="pg">
      <div className="welcome">
        <div className="wt">
          <h2>Welcome back, {dn} 👋</h2>
          <p>{predictions.length > 0 ? `You have ${predictions.length} active prediction${predictions.length>1?"s":""}.` : "You have no active predictions yet."}</p>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          {user.winStreak > 0 && (
            <div className="streak">
              <div><div className="snum">{user.winStreak}</div></div>
              <div className="sinfo"><strong>Win Streak 🔥</strong>Keep it going!</div>
            </div>
          )}
          <button className="btn btn-p btn-sm" onClick={()=>setActive("markets")}>Browse Markets →</button>
        </div>
      </div>
      <div className="stats4">
        {[
          {ico:"💰",bg:"var(--gbg)",val:fmtVet(user.totalEarnedVet),usd:toUsd(user.totalEarnedVet),lbl:"Total Earned",up:true},
          {ico:"🎯",bg:"var(--bbg)",val:`${winRate}%`,lbl:"Win Rate",up:winRate>=50},
          {ico:"📊",bg:"var(--abg)",val:String(user.totalPredictions),lbl:"Total Predictions",up:true},
          {ico:"💎",bg:"var(--pbg)",val:fmtVet(displayBalance),usd:toUsd(displayBalance),lbl:"Wallet Balance",up:true},
        ].map(s=>(
          <div className="sc" key={s.lbl}>
            <div className="sc-top">
              <div className="sc-ico" style={{background:s.bg}}>{s.ico}</div>
              <span className="sc-ch" style={{background:s.up?"var(--gbg)":"var(--rbg)",color:s.up?"var(--green)":"var(--red)"}}>{s.up?"UP":"—"}</span>
            </div>
            <div className="sc-val">{s.val}</div>
            {s.usd&&<div style={{fontSize:11,color:"var(--text3)",marginBottom:2}}>{s.usd}</div>}
            <div className="sc-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>
      <div className="dbcols">
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="card">
            <div className="ph"><span className="pt">🎯 Active Predictions</span><span className="pa" onClick={()=>setActive("my-bets")}>View all</span></div>
            {predLoading ? (
              <div style={{padding:16}}><Skeleton/><Skeleton/><Skeleton/></div>
            ) : predictions.length === 0 ? (
              <EmptyState icon="🎯" title="No active predictions" sub="Place your first prediction to see it here." action="Browse Markets" onAction={()=>setActive("markets")}/>
            ) : predictions.map(p=>(
              <div className="prow" key={p._id}>
                <div className="pcat" style={{background:catBadge(p.market?.category)==="pill-g"?"var(--gbg)":catBadge(p.market?.category)==="pill-b"?"var(--bbg)":"var(--abg)"}}>{p.market?.emoji||"📊"}</div>
                <div className="pi">
                  <div className="pq">{p.market?.title||"Market"}</div>
                  <div className="pm">
                    <span className={`ptag ${p.side==="YES"?"yes":"no"}`}>{p.side}</span>
                    <span className="ptimer">{p.market?.closesAt ? timeLeft(p.market.closesAt) : ""}</span>
                  </div>
                </div>
                <div className="pr">
                  <div className="pstake">{fmtVet(p.stakeVet)}</div>
                  <div style={{fontSize:10,color:"var(--text3)"}}>{toUsd(p.stakeVet)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="ph"><span className="pt">📰 Recent Activity</span></div>
            {notifLoading ? (
              <div style={{padding:16}}><Skeleton/><Skeleton/><Skeleton/></div>
            ) : notifications.length === 0 ? (
              <EmptyState icon="🔔" title="No activity yet" sub="Your notifications will appear here."/>
            ) : notifications.slice(0,5).map((n,i)=>(
              <div className="arow" key={i}>
                <div className="aico" style={{background:notifBg(n.type)}}>{notifIcon(n.type)}</div>
                <div><div className="atxt">{n.message}</div><div className="atime">{fmtDate(n.createdAt)}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <QuickBet onNavigate={setActive} user={user}/>
          <div className="card">
            <div className="ph"><span className="pt">📈 Performance</span></div>
            <div style={{padding:"16px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <div className="rring">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle className="ring-bg" cx="40" cy="40" r="32"/>
                  <circle className="ring-fill" cx="40" cy="40" r="32" style={{strokeDashoffset:ringOffset}}/>
                </svg>
                <div className="ring-txt"><div className="ring-pct">{winRate}%</div><div className="ring-sub">Win Rate</div></div>
              </div>
              <div style={{flex:1}}>
                {[["Total",user.totalPredictions],["Correct",user.correctPredictions],["Incorrect",incorrect],["Best Streak",user.winStreak+" 🔥"]].map(([l,v])=>(
                  <div className="wrrow" key={l}><span style={{color:"var(--text2)"}}>{l}</span><span style={{fontWeight:700}}>{v}</span></div>
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="ph"><span className="pt">🔥 Trending Now</span><span className="pa" onClick={()=>setActive("markets")}>All markets</span></div>
            {mktLoading ? (
              <div style={{padding:16}}><Skeleton/><Skeleton/><Skeleton/></div>
            ) : trendingMarkets.length === 0 ? (
              <EmptyState icon="📊" title="No markets yet" sub="Markets will appear here once created."/>
            ) : trendingMarkets.map((m,i)=>(
              <div className="trow" key={i} onClick={()=>setActive("markets")}>
                <div className="ttop"><span>{m.emoji||"📊"}</span><span className="tq">{m.title}</span><span style={{fontSize:10,color:"var(--text3)",whiteSpace:"nowrap"}}>{fmtVet(m.totalPool)}</span></div>
                <div className="tbar"><div className="tbf" style={{width:`${yesPercent(m)}%`}}/></div>
                <div className="todds"><span style={{color:"var(--green)"}}>YES {yesPercent(m)}%</span><span style={{color:"var(--red)"}}>NO {100-yesPercent(m)}%</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Markets Page ─────────────────────────────────────────────
function MarketsPage({searchQuery="", user}) {
  const cats = ["All","Crypto","Sports","Politics","Entertainment","Gaming","Stocks","Meme","Other"];
  const [cat,setCat]         = useState("All");
  const [predictMarket,setPM]= useState(null);
  const [copied,setCopied]   = useState(null);
  const params = {status:"active",limit:50};
  if(cat!=="All") params.category = cat;
  const { markets, loading, reload } = useMarkets(params);

  const filtered = searchQuery.trim()
    ? markets.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : markets;

  const handleShare = (m) => {
    const url = `${window.location.origin}/?market=${m._id}`;
    navigator.clipboard?.writeText(url);
    setCopied(m._id);
    setTimeout(()=>setCopied(null), 2000);
  };

  const handleTwitter = (m) => {
    const text = encodeURIComponent(`Will it happen? Predict on PredictChain 🔮\n\n"${m.title}"\n\nYES ${yesPercent(m)}% · NO ${100-yesPercent(m)}%`);
    const url  = encodeURIComponent(`${window.location.origin}/?market=${m._id}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  return (
    <div className="pg">
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:4}}>Markets</div>
        <div style={{fontSize:13,color:"var(--text2)"}}>Browse and predict on live markets</div>
      </div>
      <div className="filter-tabs">
        {cats.map(c=><div key={c} className={`ftab${cat===c?" active":""}`} onClick={()=>setCat(c)}>{c}</div>)}
      </div>
      {loading ? (
        <div className="mkt-grid">{[1,2,3,4,5,6].map(i=><div key={i} className="mkt"><Skeleton h={120}/></div>)}</div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon="📊" title={searchQuery ? `No markets matching "${searchQuery}"` : "No markets in this category"} sub="Check back soon or try a different category."/></div>
      ) : (
        <div className="mkt-grid">
          {filtered.map(m=>(
            <div className="mkt" key={m._id} style={{border:m.featured?"1.5px solid var(--gbd)":undefined,background:m.featured?"linear-gradient(135deg,var(--bg2),var(--gbg))":undefined,position:"relative"}}>
              {m.featured && <div style={{position:"absolute",top:10,right:10,fontSize:9,fontWeight:800,background:"var(--green)",color:"#fff",padding:"2px 7px",borderRadius:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Featured</div>}
              <div className="mkt-head">
                <span className="mkt-ico">{m.emoji||"📊"}</span>
                <span className={`pill ${catBadge(m.category)}`}>{m.category}</span>
              </div>
              <div className="mkt-q">{m.title}</div>
              <div className="mkt-bar-wrap"><div className="mkt-bar-fill" style={{width:`${yesPercent(m)}%`}}/></div>
              <div className="mkt-odds">
                <span style={{color:"var(--green)",fontWeight:700}}>YES {yesPercent(m)}%</span>
                <span style={{color:"var(--red)",fontWeight:700}}>NO {100-yesPercent(m)}%</span>
              </div>
              <div className="mkt-foot"><span>Pool: {fmtVet(m.totalPool)}</span><span>{timeLeft(m.closesAt)}</span></div>
              <div style={{display:"flex",gap:6,marginTop:10}}>
                <button className="btn btn-p btn-sm" style={{flex:1,justifyContent:"center"}} onClick={()=>setPM(m)}>Predict →</button>
                <button className="btn btn-g btn-sm" style={{padding:"6px 10px"}} title="Copy link" onClick={()=>handleShare(m)}>{copied===m._id ? "✓" : "🔗"}</button>
                <button className="btn btn-g btn-sm" style={{padding:"6px 10px"}} title="Share on Twitter" onClick={()=>handleTwitter(m)}>𝕏</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <PredictModal market={predictMarket} user={user} open={!!predictMarket} onClose={()=>setPM(null)} onSuccess={()=>{ setPM(null); reload(); }}/>
    </div>
  );
}

// ─── My Predictions Page ──────────────────────────────────────
function MyPredictionsPage({user}) {
  const { toUsd } = useAuth();
  const tabs = ["All","Active","Won","Lost"];
  const [tab,setTab] = useState("All");
  const [claiming,setClaiming] = useState({});
  const [claimMsg,setClaimMsg] = useState({});
  const params = {};
  if(tab!=="All") params.status = tab.toLowerCase();
  const { predictions, loading, reload } = useMyPredictions(params);

  const handleClaim = async (p) => {
    if(!hasConnex()) { setClaimMsg(m=>({...m,[p._id]:"Install VeWorld to claim winnings"})); return; }
    setClaiming(c=>({...c,[p._id]:true}));
    setClaimMsg(m=>({...m,[p._id]:"Confirm in VeWorld..."}));
    try {
      // contractPredictionId tracks the on-chain prediction index
      const predId = p.contractPredictionId || p.predictionIndex || 1;
      const txHash = await claimWinningsOnChain({ contractPredictionId: predId });
      setClaimMsg(m=>({...m,[p._id]:"Waiting for confirmation..."}));
      await waitForTx(txHash);
      await import("../services/api").then(api => api.claimWinnings(p._id, { claimTxHash: txHash }));
      setClaimMsg(m=>({...m,[p._id]:"Claimed! "+fmtVet(p.payoutVet)+" sent to your wallet 🎉"}));
      setTimeout(()=>{ setClaimMsg(m=>({...m,[p._id]:""})); reload(); }, 4000);
    } catch(e) {
      const msg = e.message || "Claim failed";
      // If no VTHO, show helpful message
      if (msg.includes("VTHO") || msg.includes("vtho") || msg.includes("gas") || msg.includes("fee")) {
        setClaimMsg(m=>({...m,[p._id]:"No VTHO for gas fees. Get VTHO at faucet.vecha.in"}));
      } else {
        setClaimMsg(m=>({...m,[p._id]:msg}));
      }
    } finally { setClaiming(c=>({...c,[p._id]:false})); }
  };

  return (
    <div className="pg">
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:4}}>My Predictions</div>
        <div style={{fontSize:13,color:"var(--text2)"}}>Track all your prediction history</div>
      </div>
      <div className="filter-tabs" style={{marginBottom:18}}>
        {tabs.map(t=><div key={t} className={`ftab${tab===t?" active":""}`} onClick={()=>setTab(t)}>{t}</div>)}
      </div>
      {loading ? (
        <div className="pred-grid">{[1,2,3,4].map(i=><div key={i} className="card" style={{margin:0}}><Skeleton h={140}/></div>)}</div>
      ) : predictions.length === 0 ? (
        <div className="card"><EmptyState icon="🎯" title="No predictions yet" sub={tab==="All"?"Place your first prediction to see it here.":"No "+tab.toLowerCase()+" predictions found."}/></div>
      ) : (
        <div className="pred-grid">
          {predictions.map(p=>(
            <div className="pred-card" key={p._id}>
              <div className="pc-head">
                <span style={{fontSize:20}}>{p.market?.emoji||"📊"}</span>
                <div className="pc-q">{p.market?.title||"Market"}</div>
                <span className={`pill ${p.side==="YES"?"pill-g":"pill-r"}`}>{p.side}</span>
              </div>
              {[
                ["Stake", fmtVet(p.stakeVet)],
                ["USD Value", toUsd(p.stakeVet)],
                ["Status", p.status.charAt(0).toUpperCase()+p.status.slice(1)],
                ["Closes", p.market?.closesAt ? timeLeft(p.market.closesAt) : "—"],
                ...(p.status==="won" ? [["Payout", fmtVet(p.payoutVet)+" ("+toUsd(p.payoutVet)+")"]] : []),
              ].map(([l,v])=>(
                <div className="pc-row" key={l}>
                  <span style={{color:"var(--text2)"}}>{l}</span>
                  <span style={{fontWeight:600,color:(p.status==="won"&&l==="Status")?"var(--green)":(p.status==="lost"&&l==="Status")?"var(--red)":(l==="Payout")?"var(--green)":"var(--text)"}}>{v}</span>
                </div>
              ))}
              {p.status==="won"&&!p.claimed&&(
                <div style={{marginTop:10}}>
                  {claimMsg[p._id]&&<div style={{fontSize:11,color:"var(--amber)",marginBottom:6,textAlign:"center"}}>{claimMsg[p._id]}</div>}
                  <button className="btn btn-p btn-bl btn-sm" onClick={()=>handleClaim(p)} disabled={claiming[p._id]}>
                    {claiming[p._id] ? "Processing..." : `Claim ${fmtVet(p.payoutVet)} →`}
                  </button>
                </div>
              )}
              {p.status==="won"&&p.claimed&&<div style={{marginTop:8,textAlign:"center",fontSize:12,color:"var(--green)",fontWeight:600}}>Claimed ✓</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Leaderboard Page ─────────────────────────────────────────
function LeaderboardPage({user}) {
  const { toUsd } = useAuth();
  const [tab,setTab] = useState("earnings");
  const { data, loading } = useLeaderboard(tab);

  return (
    <div className="pg">
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:4}}>Leaderboard</div>
        <div style={{fontSize:13,color:"var(--text2)"}}>Top predictors on PredictChain</div>
      </div>
      <div className="my-rank-bar">
        <div>
          <div style={{fontSize:12,color:"var(--text2)",marginBottom:2}}>Your rank</div>
          <div style={{fontFamily:"var(--fh)",fontSize:20,fontWeight:800,color:"var(--green)"}}>{user.rank > 0 ? `#${user.rank}` : "Unranked"}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:12,color:"var(--text2)",marginBottom:2}}>Win Rate</div>
          <div style={{fontFamily:"var(--fh)",fontSize:20,fontWeight:800,color:"var(--text)"}}>{user.totalPredictions>0 ? Math.round((user.correctPredictions/user.totalPredictions)*100)+"%" : "—"}</div>
        </div>
      </div>
      <div className="lb-tabs">
        {[["earnings","💰 Earnings"],["streaks","🔥 Streaks"]].map(([id,lbl])=>(
          <button key={id} className={`lb-tab${tab===id?" active":""}`} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>
      <div className="card">
        {loading ? (
          <div style={{padding:16}}>{[1,2,3,4,5].map(i=><Skeleton key={i} h={50} mb={12}/>)}</div>
        ) : data.length === 0 ? (
          <EmptyState icon="🏆" title="No rankings yet" sub="Rankings appear once users start predicting."/>
        ) : data.map((r,i)=>{
          const isMe = r._id === user._id || r.walletAddress === user.walletAddress;
          const initials = r.walletAddress ? r.walletAddress.slice(2,4).toUpperCase() : (r.displayName||"??").slice(0,2).toUpperCase();
          const name = r.displayName || (r.walletAddress ? truncAddr(r.walletAddress) : "Unknown");
          const rank = i+1;
          return (
            <div key={r._id} className={`lb-row${isMe?" me":""}`}>
              <div className="lb-rank">{rank<=3?["🥇","🥈","🥉"][rank-1]:rank}</div>
              <div className="lb-av" style={isMe?{background:"var(--gbg)",border:"2px solid var(--gbd)",color:"var(--green)"}:{}}>{initials}</div>
              <div className="lb-info">
                <div className="lb-name">{name}{isMe?" (You)":""}</div>
                <div className="lb-sub">{r.correctPredictions||0} correct · {r.totalPredictions||0} total</div>
              </div>
              <div className="lb-right">
                <div className="lb-val">{tab==="earnings" ? fmtVet(r.totalEarnedVet) : `${r.winStreak||0} streak`}</div>
                {tab==="earnings"&&<div style={{fontSize:10,color:"var(--text3)"}}>{toUsd(r.totalEarnedVet)}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Wallet Page ──────────────────────────────────────────────
function WalletPage({user}) {
  const { toUsd, liveBalance, linkWalletToAccount, refreshUser } = useAuth();
  const { balance, transactions, loading, reload } = useWallet();
  const isW = user.walletUser;
  const [connecting,  setConnecting]  = useState(false);
  const [connectMsg,  setConnectMsg]  = useState({ text:"", ok:false });

  const vetBal    = isW && liveBalance !== null ? liveBalance : (balance?.vetBalance || 0);
  const lockedVet = balance?.lockedVet || 0;
  const availVet  = Math.max(0, vetBal - lockedVet);
  const totalEarned    = transactions.filter(t=>t.type==="win").reduce((s,t)=>s+t.amountVet,0);
  const totalDeposited = transactions.filter(t=>t.type==="deposit").reduce((s,t)=>s+t.amountVet,0);
  const totalWithdrawn = Math.abs(transactions.filter(t=>t.type==="withdrawal").reduce((s,t)=>s+t.amountVet,0));

  return (
    <div className="pg">
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:4}}>Wallet</div>
        <div style={{fontSize:13,color:"var(--text2)"}}>Your VET balance and transaction history</div>
      </div>
      <div className="w-hero">
        <div className="w-top">
          <div>
            <div style={{fontSize:11,color:"var(--text3)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>{isW ? "Live Wallet Balance" : "Platform Balance"}</div>
            <div className="w-bal">{loading && !liveBalance ? "..." : `${availVet.toFixed(2)} VET`}</div>
            <div className="w-usd">{`≈ ${toUsd(availVet)} USD`}</div>
            {lockedVet>0&&<div style={{fontSize:11,color:"var(--amber)",marginTop:3}}>{lockedVet.toFixed(2)} VET locked in active predictions</div>}
            {isW&&<div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>Updates every 30 seconds from VeChain</div>}
          </div>
          <div className="wacts">
            <button className="btn btn-p btn-sm">+ Deposit</button>
            <button className="btn btn-o btn-sm">Withdraw</button>
          </div>
        </div>
        <div className="wstats">
          {[["Total Earned",fmtVet(totalEarned),toUsd(totalEarned)],["In Predictions",fmtVet(lockedVet),toUsd(lockedVet)],["Withdrawn",fmtVet(totalWithdrawn),toUsd(totalWithdrawn)],["Deposited",fmtVet(totalDeposited),toUsd(totalDeposited)]].map(([l,v,u])=>(
            <div className="wstat" key={l}>
              <div className="wsl">{l}</div>
              <div className="wsv">{loading?"...":v}</div>
              <div style={{fontSize:10,color:"var(--text3)",fontWeight:500,marginTop:2}}>{loading?"":u}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-cols">
        <div className="card" style={{margin:0}}>
          <div className="ph"><span className="pt">🔗 Connected Wallet</span></div>
          {isW ? (
            <div className="wcrow">
              <div className="wcico" style={{background:"var(--vbg)"}}>🔷</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="wcname">VeChain — VeWorld</div>
                <div className="wcaddr">{user.walletAddress}</div>
              </div>
              <span className="wcpill">Connected</span>
            </div>
          ) : (
            <div style={{padding:"20px 16px"}}>
              <div style={{fontSize:13,color:"var(--text2)",marginBottom:8,lineHeight:1.6}}>Connect a VeChain wallet to start predicting.</div>
              <div style={{fontSize:12,color:"var(--text3)",marginBottom:14}}>Get VeWorld at <strong style={{color:"var(--vet)"}}>veworld.net</strong> · Testnet VET at <strong style={{color:"var(--vet)"}}>faucet.vecha.in</strong></div>
              {connectMsg.text && <div style={{fontSize:12,color:connectMsg.ok?"var(--green)":"var(--red)",marginBottom:10}}>{connectMsg.text}</div>}
              <button className="btn btn-vet btn-sm" disabled={connecting} onClick={async()=>{
                setConnecting(true);
                setConnectMsg({text:"Sign in VeWorld...",ok:false});
                try {
                  await linkWalletToAccount();
                  setConnectMsg({text:"Wallet connected!",ok:true});
                  setTimeout(()=>{ refreshUser(); reload(); },1500);
                } catch(e) {
                  setConnectMsg({text:e.response?.data?.error||e.message||"Connection failed",ok:false});
                } finally { setConnecting(false); }
              }}>
                {connecting ? "Connecting..." : "🔷 Connect VeWorld Wallet"}
              </button>
            </div>
          )}
        </div>
        <div className="card" style={{margin:0}}>
          <div className="ph"><span className="pt">📊 Quick Stats</span></div>
          {[
            ["Win Rate", user.totalPredictions>0?Math.round((user.correctPredictions/user.totalPredictions)*100)+"%":"—"],
            ["Active Stakes", String(transactions.filter(t=>t.type==="stake"&&t.status==="confirmed").length||0)],
            ["Best Win", fmtVet(Math.max(0,...[0,...transactions.filter(t=>t.type==="win").map(t=>t.amountVet)]))],
            ["Total Predictions", String(user.totalPredictions)],
            ["Platform Fee", "1.5%"],
          ].map(([l,v])=>(
            <div className="wcrow" key={l}>
              <div style={{flex:1,fontSize:13,color:"var(--text2)"}}>{l}</div>
              <div style={{fontFamily:"var(--fh)",fontWeight:700,fontSize:14,color:"var(--text)"}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="ph"><span className="pt">📋 Transaction History</span></div>
        {loading ? (
          <div style={{padding:16}}>{[1,2,3,4].map(i=><Skeleton key={i} h={52} mb={12}/>)}</div>
        ) : transactions.length === 0 ? (
          <EmptyState icon="📋" title="No transactions yet" sub="Your deposits, withdrawals, and prediction stakes will appear here."/>
        ) : transactions.map((t,i)=>(
          <div className="txrow" key={i}>
            <div className="txic" style={{background:txBg(t.type)}}>{txIcon(t.type)}</div>
            <div className="txi">
              <div className="txn">{t.description||t.type}</div>
              <div className="txm">{t.market?.title||""} {t.market?.title?"·":""} {fmtDate(t.createdAt)}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div className={`txa ${t.amountVet>=0?"pos":"neg"}`}>{t.amountVet>=0?"+":""}{fmtVet(Math.abs(t.amountVet))}</div>
              <div style={{fontSize:10,color:"var(--text3)"}}>{toUsd(Math.abs(t.amountVet))}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────
function ProfilePage({user}) {
  const { toUsd } = useAuth();
  const dn  = getDisplayName(user);
  const ini = getInitials(user);
  const isW = user.walletUser;
  const isEmail = user.authMethod === "email";
  const [copied,setCopied]   = useState(false);
  const [showPwForm,setPwForm] = useState(false);
  const [pwForm,setPwData]   = useState({current:"",newPw:"",confirm:""});
  const [pwLoading,setPwLoad]= useState(false);
  const [pwMsg,setPwMsg]     = useState({text:"",ok:false});
  const winRate = user.totalPredictions>0 ? Math.round((user.correctPredictions/user.totalPredictions)*100) : 0;

  const copy = () => { navigator.clipboard?.writeText(user.walletAddress); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const handleChangePw = async () => {
    if (!pwForm.newPw || !pwForm.current) { setPwMsg({text:"All fields required",ok:false}); return; }
    if (pwForm.newPw !== pwForm.confirm)  { setPwMsg({text:"Passwords do not match",ok:false}); return; }
    setPwLoad(true); setPwMsg({text:"",ok:false});
    try {
      await changePassword({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwMsg({text:"Password changed successfully!",ok:true});
      setPwData({current:"",newPw:"",confirm:""});
      setTimeout(()=>{ setPwForm(false); setPwMsg({text:"",ok:false}); }, 2000);
    } catch(e) {
      setPwMsg({text:e.response?.data?.error||e.response?.data?.errors?.[0]?.msg||"Failed",ok:false});
    } finally { setPwLoad(false); }
  };

  return (
    <div className="pg">
      <div className="prof-hero">
        <div className="prof-top">
          <div className="prof-av">{ini}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="prof-name" style={isW?{fontFamily:"monospace",fontSize:15}:{}}>{dn}</div>
            {isW&&(
              <div className="prof-addr">
                <span style={{fontSize:9,background:"var(--vbg)",color:"var(--vet)",padding:"1px 4px",borderRadius:3,fontWeight:800,flexShrink:0}}>V</span>
                <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{user.walletAddress}</span>
                <span onClick={copy} style={{cursor:"pointer",flexShrink:0}}>{copied?"Copied":"Copy"}</span>
              </div>
            )}
            <div style={{fontSize:12,color:"var(--text2)",marginBottom:8}}>{user.bio||"PredictChain user"}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {user.correctPredictions>0&&<span className="pill pill-g">🎯 First Win</span>}
              {user.winStreak>=3&&<span className="pill pill-a">🔥 {user.winStreak} Streak</span>}
              {isW&&<span className="pill pill-v">🔷 Wallet User</span>}
            </div>
          </div>
          <button className="btn btn-o btn-sm">Edit</button>
        </div>
        <div className="prof-stats">
          {[[fmtVet(user.totalEarnedVet),"Total Earned"],[`${winRate}%`,"Win Rate"],[String(user.totalPredictions),"Predictions"],[`#${user.rank||"—"}`,"Rank"]].map(([v,l])=>(
            <div className="prof-stat" key={l}>
              <div className="psv">{v}</div>
              {l==="Total Earned"&&<div style={{fontSize:10,color:"var(--text3)",margin:"2px 0"}}>{toUsd(user.totalEarnedVet)}</div>}
              <div className="psl">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="prof-two">
        <div className="card" style={{margin:0}}>
          <div className="ph"><span className="pt">👤 Account Details</span></div>
          <div style={{padding:"4px 16px 12px"}}>
            {[{l:"Account Type",v:isW?"Wallet User":"Email User"},{l:"Wallet",v:isW?truncAddr(user.walletAddress):"Not connected",mono:true},{l:"Email",v:user.email||"—"},{l:"Joined",v:user.joinedDate||"Recently"},{l:"Level",v:`Level ${user.level||1}`},{l:"Win Streak",v:`${user.winStreak||0} 🔥`}].map(r=>(
              <div className="prof-row" key={r.l}>
                <span className="prof-row-lbl">{r.l}</span>
                <span className={`prof-row-val${r.mono?"":" nm"}`}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{margin:0}}>
          <div className="ph"><span className="pt">📊 Prediction Stats</span></div>
          <div style={{padding:"4px 16px 12px"}}>
            {[{l:"Total",v:String(user.totalPredictions)},{l:"Correct",v:String(user.correctPredictions)},{l:"Incorrect",v:String(user.totalPredictions-user.correctPredictions)},{l:"Win Rate",v:`${winRate}%`},{l:"Best Streak",v:String(user.winStreak||0)},{l:"Total Earned",v:fmtVet(user.totalEarnedVet)}].map(r=>(
              <div className="prof-row" key={r.l}>
                <span className="prof-row-lbl">{r.l}</span>
                <span className="prof-row-val nm">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {isEmail && (
        <div className="card" style={{marginTop:14}}>
          <div className="ph">
            <span className="pt">🔐 Change Password</span>
            <span className="pa" onClick={()=>{ setPwForm(v=>!v); setPwMsg({text:"",ok:false}); }}>{showPwForm ? "Cancel" : "Change"}</span>
          </div>
          {showPwForm && (
            <div style={{padding:"14px 16px"}}>
              {pwMsg.text && <div style={{fontSize:12,color:pwMsg.ok?"var(--green)":"var(--red)",marginBottom:10,padding:"8px 12px",borderRadius:8,background:pwMsg.ok?"var(--gbg)":"var(--rbg)"}}>{pwMsg.text}</div>}
              {[{label:"Current Password",key:"current",ph:"Enter current password"},{label:"New Password",key:"newPw",ph:"Min 8 chars, 1 uppercase, 1 number"},{label:"Confirm New",key:"confirm",ph:"Repeat new password"}].map(f=>(
                <div key={f.key} style={{marginBottom:10}}>
                  <div style={{fontSize:11,color:"var(--text3)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>{f.label}</div>
                  <input className="inp" type="password" placeholder={f.ph} value={pwForm[f.key]} onChange={e=>setPwData(p=>({...p,[f.key]:e.target.value}))} style={{marginBottom:0}}/>
                </div>
              ))}
              <button className="btn btn-p btn-sm" onClick={handleChangePw} disabled={pwLoading} style={{marginTop:6}}>{pwLoading ? "Changing..." : "Change Password →"}</button>
            </div>
          )}
          {!showPwForm && <div style={{padding:"10px 16px",fontSize:13,color:"var(--text3)"}}>Last changed: unknown · <span style={{color:"var(--green)",cursor:"pointer"}} onClick={()=>setPwForm(true)}>Change now</span></div>}
        </div>
      )}
    </div>
  );
}

// ─── Support Page ─────────────────────────────────────────────
function SupportPage() {
  const [open,setOpen] = useState(null);
  const faqs = [
    {q:"How do predictions work?",a:"You stake VET on the outcome of a market. If correct, you win a share of the total pool proportional to your stake."},
    {q:"How are markets resolved?",a:"Markets are resolved by the admin manually based on real-world outcomes. Results are recorded on the VeChain blockchain."},
    {q:"Is my VET safe?",a:"All funds are held in smart contracts on VeChain — fully non-custodial. PredictChain never holds your assets directly."},
    {q:"What are the fees?",a:"PredictChain charges a 1.5% platform fee on winning payouts only. No fees for deposits, withdrawals, or losing predictions."},
    {q:"How do I withdraw?",a:"Go to the Wallet page and tap Withdraw. Funds arrive in your connected wallet within 1–3 minutes on VeChain."},
  ];
  return (
    <div className="pg">
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:"var(--fh)",fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:4}}>Support Center</div>
        <div style={{fontSize:13,color:"var(--text2)"}}>Find answers, get help, contact the team</div>
      </div>
      <div className="sup-grid">
        {[{ico:"💬",bg:"var(--gbg)",title:"Live Chat",desc:"Available 9am-6pm UTC Mon-Fri"},{ico:"📧",bg:"var(--bbg)",title:"Email Support",desc:"support@predictchain.io"},{ico:"🐦",bg:"var(--vbg)",title:"Twitter / X",desc:"@PredictChain"},{ico:"💬",bg:"var(--pbg)",title:"Discord",desc:"Join our community"}].map(c=>(
          <div className="sup-card" key={c.title}>
            <div className="sup-ico" style={{background:c.bg}}>{c.ico}</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:3}}>{c.title}</div>
              <div style={{fontSize:12,color:"var(--text2)"}}>{c.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="ph"><span className="pt">Frequently Asked Questions</span></div>
        {faqs.map((f,i)=>(
          <div className="faq-item" key={i}>
            <div className="faq-q" onClick={()=>setOpen(open===i?null:i)}>{f.q}<span className="faq-ch" style={{transform:open===i?"rotate(45deg)":"rotate(0deg)"}}>+</span></div>
            {open===i&&<div className="faq-a">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────
function Topbar({title,setOpen,user,onSearch}) {
  const { notifications, unreadCount, reload } = useNotifications();
  const [notifOpen,setNotifOpen] = useState(false);
  const [searchVal,setSearchVal] = useState("");
  const ref = useRef(null);

  useEffect(()=>{
    const h = e => { if(ref.current&&!ref.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  useEffect(()=>{
    const handler = () => reload();
    window.addEventListener("pc_notification", handler);
    return ()=>window.removeEventListener("pc_notification", handler);
  },[reload]);

  const handleMarkRead = async () => { try { await markNotifsRead(); reload(); } catch {} };
  const handleSearch = (e) => { const val=e.target.value; setSearchVal(val); if(onSearch) onSearch(val); };

  return (
    <header className="tb">
      <div className="tb-l">
        <button className="hbtn" onClick={()=>setOpen(v=>!v)}>=</button>
        <span className="tb-title">{title}</span>
      </div>
      <div className="tb-r">
        <div className="srch">
          <span style={{fontSize:12,color:"var(--text3)"}}>🔍</span>
          <input placeholder="Search markets..." value={searchVal} onChange={handleSearch}/>
        </div>
        <div className="notif-wrap" ref={ref}>
          <div className="ibtn" onClick={()=>setNotifOpen(v=>!v)}>
            🔔{unreadCount>0&&<div className="ndot"/>}
          </div>
          {notifOpen&&(
            <div className="notif-popup">
              <div className="np-head">
                <span className="np-title">Notifications</span>
                {unreadCount>0&&<span className="np-mark" onClick={handleMarkRead}>Mark all read</span>}
              </div>
              {notifications.length===0 ? (
                <div style={{padding:"20px 16px",textAlign:"center",fontSize:13,color:"var(--text3)"}}>No notifications yet</div>
              ) : notifications.slice(0,5).map((n,i)=>(
                <div key={i} className="np-item">
                  <div className="np-ico" style={{background:notifBg(n.type)}}>{notifIcon(n.type)}</div>
                  <div className="np-body">
                    <div className="np-text">{n.message}</div>
                    <div className="np-time">{fmtDate(n.createdAt)}</div>
                  </div>
                  {!n.read&&<div className="np-dot"/>}
                </div>
              ))}
              <div className="np-footer"><span className="np-see">See all notifications</span></div>
            </div>
          )}
        </div>
        <div className="uav" style={{cursor:"pointer",width:30,height:30,fontSize:11}}>{getInitials(user)}</div>
      </div>
    </header>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────
function Sidebar({active,setActive,open,setOpen,theme,setTheme,user,onSignOut}) {
  const nav = [
    {id:"dashboard",  ico:"🏠",lbl:"Dashboard"},
    {id:"markets",    ico:"📊",lbl:"Markets"},
    {id:"my-bets",    ico:"🎯",lbl:"My Predictions"},
    {id:"leaderboard",ico:"🏆",lbl:"Leaderboard"},
    {id:"wallet",     ico:"💰",lbl:"Wallet"},
    {id:"profile",    ico:"👤",lbl:"Profile"},
  ];
  const sec = [{id:"support",ico:"💬",lbl:"Support"}];
  const go  = id => { setActive(id); setOpen(false); };
  const dn  = getDisplayName(user);
  const ini = getInitials(user);
  return (
    <>
      <div className={`sbo${open?" open":""}`} onClick={()=>setOpen(false)}/>
      <aside className={`sb${open?" open":""}`}>
        <div className="sb-logo" onClick={()=>go("dashboard")}><div className="lmark">P</div>PredictChain</div>
        <nav className="sb-nav">
          <div className="nlbl">Main</div>
          {nav.map(n=>(
            <div key={n.id} className={`ni${active===n.id?" active":""}`} onClick={()=>go(n.id)}>
              <span className="ni-i">{n.ico}</span>{n.lbl}
            </div>
          ))}
          <div className="nlbl" style={{marginTop:8}}>Other</div>
          {sec.map(n=>(
            <div key={n.id} className={`ni${active===n.id?" active":""}`} onClick={()=>go(n.id)}>
              <span className="ni-i">{n.ico}</span>{n.lbl}
            </div>
          ))}
          <div className="ni" onClick={()=>setTheme(t=>t==="light"?"dark":"light")}>
            <span className="ni-i">{theme==="dark"?"☀️":"🌙"}</span>
            {theme==="dark"?"Light Mode":"Dark Mode"}
          </div>
          <div className="ni" style={{color:"var(--red)",marginTop:4}} onClick={onSignOut}>
            <span className="ni-i">🚪</span>Sign Out
          </div>
        </nav>
        <div className="sb-foot">
          <div className="ucard" onClick={()=>go("profile")}>
            <div className="uav">{ini}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="uname-sb">{dn}</div>
              <div className="urank-sb">Rank #{user.rank||"—"} · Level {user.level||1}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Sign Out Modal ───────────────────────────────────────────
function SignOutModal({open,onClose,onConfirm}) {
  if(!open) return null;
  return (
    <div className="mo open" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mbox" style={{maxWidth:360}}>
        <div className="mhead">
          <div className="mico" style={{background:"var(--rbg)",fontSize:28}}>🚪</div>
          <div className="mtitle">Sign Out?</div>
          <div className="msub">You will need to log in again to access your account.</div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn btn-g btn-bl" onClick={onClose}>Cancel</button>
          <button className="btn btn-p btn-bl" style={{background:"var(--red)"}} onClick={onConfirm}>Yes, Sign Out</button>
        </div>
      </div>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────
export default function App() {
  const { user: authUser, logout } = useAuth();
  const [theme,setTheme]         = useState("light");
  const [active,setActive]       = useState("dashboard");
  const [sbOpen,setSbOpen]       = useState(false);
  const [signOutOpen,setSignOut] = useState(false);
  const [searchQuery,setSearch]  = useState("");

  useEffect(()=>{ injectStyles(theme); },[theme]);
  useEffect(()=>{ injectStyles("light"); },[]);

  const handleSearch = (val) => { setSearch(val); if(val.trim()) setActive("markets"); };

  const user = authUser ? {
    _id:                authUser.id || authUser._id,
    walletUser:         !!authUser.walletAddress,
    walletAddress:      authUser.walletAddress || null,
    displayName:        authUser.displayName || null,
    email:              authUser.email || null,
    authMethod:         authUser.authMethod || "email",
    bio:                authUser.bio || "",
    rank:               authUser.rank || 0,
    level:              authUser.level || 1,
    joinedDate:         authUser.createdAt ? new Date(authUser.createdAt).toLocaleDateString("en-US",{month:"long",year:"numeric"}) : "Recently",
    totalPredictions:   authUser.totalPredictions || 0,
    correctPredictions: authUser.correctPredictions || 0,
    totalEarnedVet:     authUser.totalEarnedVet || 0,
    winStreak:          authUser.winStreak || 0,
    vetBalance:         authUser.vetBalance || 0,
    isAdmin:            authUser.isAdmin || false,
  } : null;

  if(!user) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"var(--text2)"}}>Loading...</div>;

  const titles = { dashboard:"Dashboard", markets:"Markets", "my-bets":"My Predictions", leaderboard:"Leaderboard", wallet:"Wallet", profile:"Profile", support:"Support" };

  const page = () => {
    if(active==="dashboard")   return <DashboardPage   setActive={setActive} user={user}/>;
    if(active==="markets")     return <MarketsPage searchQuery={searchQuery} user={user}/>;
    if(active==="my-bets")     return <MyPredictionsPage user={user}/>;
    if(active==="leaderboard") return <LeaderboardPage  user={user}/>;
    if(active==="wallet")      return <WalletPage       user={user}/>;
    if(active==="profile")     return <ProfilePage      user={user}/>;
    if(active==="support")     return <SupportPage/>;
    return null;
  };

  return (
    <div className="shell">
      <Sidebar active={active} setActive={setActive} open={sbOpen} setOpen={setSbOpen} theme={theme} setTheme={setTheme} user={user} onSignOut={()=>setSignOut(true)}/>
      <div className="main">
        <Topbar title={titles[active]||"Dashboard"} setOpen={setSbOpen} user={user} onSearch={handleSearch}/>
        {page()}
      </div>
      <SignOutModal open={signOutOpen} onClose={()=>setSignOut(false)} onConfirm={()=>{setSignOut(false);logout();}}/>
    </div>
  );
}