import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchMarkets } from "../services/api";

// ─── Style Injection ──────────────────────────────────────────
const injectStyles = (theme) => {
  const id = "vp-styles";
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const isDark = theme === "dark";

  const bgVars = isDark
    ? "--bg:#0A0D14;--bg2:#111420;--bg3:#181D2E;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.13);--text:#F0F2F8;--text2:#8B95B0;--text3:#555E7A;--card:#111420;--shadow:0 4px 28px rgba(0,0,0,0.4);--shadow-lg:0 16px 56px rgba(0,0,0,0.5);"
    : "--bg:#F5F6FA;--bg2:#FFFFFF;--bg3:#EDF0F7;--border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.13);--text:#0D1117;--text2:#4A5568;--text3:#9AA3B8;--card:#FFFFFF;--shadow:0 2px 14px rgba(0,0,0,0.07);--shadow-lg:0 10px 48px rgba(0,0,0,0.12);";

  const navBg = isDark ? "rgba(10,13,20,0.90)" : "rgba(255,255,255,0.90)";

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    :root{
      --font-head:'Bricolage Grotesque',sans-serif;
      --font-body:'Plus Jakarta Sans',sans-serif;
      ${bgVars}
      --green:#22C55E;--green-d:#16A34A;--green-bg:rgba(34,197,94,0.10);--green-bd:rgba(34,197,94,0.22);
      --red:#EF4444;--red-bg:rgba(239,68,68,0.08);--red-bd:rgba(239,68,68,0.18);
      --blue:#3B82F6;--blue-bg:rgba(59,130,246,0.08);--blue-bd:rgba(59,130,246,0.18);
      --amber:#F59E0B;--purple:#8B5CF6;--indigo:#6366F1;
      --radius:12px;--radius-lg:18px;--radius-xl:24px;
    }
    body{background:var(--bg);color:var(--text);font-family:var(--font-body);line-height:1.6;-webkit-font-smoothing:antialiased;}

    /* Buttons */
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--font-body);font-weight:600;font-size:14px;border:none;border-radius:10px;cursor:pointer;transition:all 0.18s;text-decoration:none;white-space:nowrap;padding:10px 20px;}
    .btn-primary{background:var(--green);color:#fff;}
    .btn-primary:hover{background:var(--green-d);transform:translateY(-1px);box-shadow:0 6px 20px rgba(34,197,94,0.35);}
    .btn-outline{background:transparent;color:var(--text);border:1.5px solid var(--border2);}
    .btn-outline:hover{border-color:var(--green);color:var(--green);background:var(--green-bg);}
    .btn-ghost{background:transparent;color:var(--text2);border:1.5px solid var(--border);}
    .btn-ghost:hover{color:var(--text);border-color:var(--border2);background:var(--bg3);}
    .btn-sm{padding:7px 14px;font-size:13px;border-radius:8px;}
    .btn-lg{padding:13px 28px;font-size:15px;border-radius:12px;}
    .btn-block{width:100%;}
    .btn-vechain{background:${isDark?"#1A1E35":"#EEEEFF"};color:#5C6BC0;border:1.5px solid rgba(92,107,192,0.4);}
    .btn-vechain:hover{background:rgba(92,107,192,0.12);border-color:#5C6BC0;}
    .btn-google{background:var(--bg3);color:var(--text);border:1.5px solid var(--border);}
    .btn-google:hover{border-color:var(--border2);}
    .btn-white{background:#fff;color:var(--green);font-weight:700;}
    .btn-white:hover{background:#f0fff5;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,0.15);}
    .btn-dark{background:#111;color:#fff;}
    .btn-dark:hover{background:#222;transform:translateY(-1px);}

    /* Badges & Pills */
    .badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:4px 10px;border-radius:100px;}
    .badge-green{background:var(--green-bg);color:var(--green);border:1px solid var(--green-bd);}
    .badge-blue{background:var(--blue-bg);color:var(--blue);border:1px solid var(--blue-bd);}
    .badge-amber{background:rgba(245,158,11,.1);color:var(--amber);border:1px solid rgba(245,158,11,.2);}
    .badge-purple{background:rgba(139,92,246,.1);color:var(--purple);border:1px solid rgba(139,92,246,.2);}
    .badge-red{background:var(--red-bg);color:var(--red);border:1px solid var(--red-bd);}
    .badge-indigo{background:rgba(99,102,241,.1);color:var(--indigo);border:1px solid rgba(99,102,241,.2);}
    .pill{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:100px;font-size:13px;font-weight:500;cursor:pointer;border:1.5px solid var(--border);background:var(--card);color:var(--text2);transition:all 0.18s;white-space:nowrap;}
    .pill:hover,.pill.active{background:var(--green-bg);border-color:var(--green-bd);color:var(--green);}

    /* Form */
    .divider{display:flex;align-items:center;gap:12px;color:var(--text3);font-size:12px;margin:18px 0;}
    .divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border);}
    .input{width:100%;background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;padding:11px 14px;color:var(--text);font-size:14px;font-family:var(--font-body);outline:none;transition:all 0.18s;}
    .input:focus{border-color:var(--green);background:var(--bg2);box-shadow:0 0 0 3px rgba(34,197,94,0.10);}
    .input::placeholder{color:var(--text3);}
    .input-label{font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px;display:block;}
    .form-group{margin-bottom:14px;}
    .error-msg{background:var(--red-bg);border:1px solid var(--red-bd);color:var(--red);padding:10px 14px;border-radius:9px;font-size:13px;margin-bottom:14px;}

    /* Navbar */
    .navbar{position:fixed;top:0;left:0;right:0;z-index:200;height:64px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;background:${navBg};backdrop-filter:blur(18px);border-bottom:1px solid var(--border);}
    .navbar-desktop-pad{padding:8px 74px;}
    .navbar-logo{font-family:var(--font-head);font-weight:800;font-size:20px;color:var(--text);display:flex;align-items:center;gap:9px;cursor:pointer;text-decoration:none;}
    .logo-icon{width:32px;height:32px;border-radius:9px;background:var(--green);display:flex;align-items:center;justify-content:center;font-size:15px;color:#fff;font-weight:800;}
    .navbar-links{display:flex;gap:4px;list-style:none;}
    .navbar-links a{color:var(--text2);text-decoration:none;font-size:14px;font-weight:500;padding:6px 13px;border-radius:8px;transition:all 0.18s;}
    .navbar-links a:hover{color:var(--text);background:var(--bg3);}
    .navbar-right{display:flex;align-items:center;gap:10px;}
    .theme-btn{width:36px;height:36px;border-radius:9px;border:1.5px solid var(--border);background:var(--card);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:all 0.18s;color:var(--text2);}
    .theme-btn:hover{border-color:var(--border2);color:var(--text);}
    .mobile-menu-btn{display:none;width:36px;height:36px;border-radius:9px;border:1.5px solid var(--border);background:var(--card);cursor:pointer;align-items:center;justify-content:center;font-size:18px;color:var(--text);}
    .mobile-nav{display:none;position:fixed;top:64px;left:0;right:0;z-index:190;background:var(--bg2);border-bottom:1px solid var(--border);padding:16px;flex-direction:column;gap:8px;box-shadow:var(--shadow);}
    .mobile-nav.open{display:flex;}
    .mobile-nav a{color:var(--text);text-decoration:none;font-size:15px;font-weight:500;padding:12px 16px;border-radius:10px;transition:background 0.18s;}
    .mobile-nav a:hover{background:var(--bg3);}
    .mobile-nav-actions{display:flex;flex-direction:column;gap:8px;margin-top:8px;padding-top:12px;border-top:1px solid var(--border);}
    .mobile-theme-row{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-radius:10px;background:var(--bg3);font-size:14px;font-weight:500;color:var(--text);}

    /* Hero */
    .hero{padding:100px 24px 64px;max-width:1200px;margin:0 auto;}
    .hero-inner{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;}
    .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:var(--green-bg);border:1px solid var(--green-bd);color:var(--green);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;padding:6px 14px;border-radius:100px;margin-bottom:22px;}
    .live-dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:livePulse 1.8s infinite;}
    @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
    .hero h1{font-family:var(--font-head);font-size:clamp(38px,5vw,60px);font-weight:800;line-height:1.08;letter-spacing:-1.5px;color:var(--text);margin-bottom:20px;}
    .hero h1 em{color:var(--green);font-style:normal;}
    .hero-sub{font-size:16px;color:var(--text2);line-height:1.75;max-width:480px;margin-bottom:34px;}
    .hero-ctas{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:44px;}
    .hero-stats{display:flex;gap:32px;padding-top:30px;border-top:1px solid var(--border);flex-wrap:wrap;}
    .stat-item{display:flex;flex-direction:column;gap:3px;}
    .stat-val{font-family:var(--font-head);font-size:20px;font-weight:800;color:var(--text);}
    .stat-lbl{font-size:11px;color:var(--text3);font-weight:500;text-transform:uppercase;letter-spacing:.4px;}

    /* Hero Phone */
    .hero-img-wrap{position:relative;display:flex;justify-content:center;align-items:center;}
    .hero-phone-img{width:100%;max-width:990px;filter:drop-shadow(0 24px 60px rgba(0,0,0,0.22));animation:floatPhone 5s ease-in-out infinite;}
    @keyframes floatPhone{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    .float-badge{position:absolute;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:11px 16px;box-shadow:var(--shadow);font-size:12px;z-index:2;}
    .float-win{bottom:24px;right:-10px;display:flex;align-items:center;gap:12px;animation:floatUp 3.5s ease-in-out infinite;}
    .float-hot{top:28px;left:-10px;animation:floatUp 3.5s 1.8s ease-in-out infinite;}
    @keyframes floatUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    .float-win-amt{font-family:var(--font-head);font-weight:800;font-size:18px;color:var(--green);}
    .float-tag{font-size:10px;color:var(--text3);margin-top:1px;}

    /* Sections */
    .section{max-width:1200px;margin:0 auto;padding:64px 24px;scroll-margin-top:80px;}
    .section-hd{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:12px;}
    .section-title{font-family:var(--font-head);font-size:26px;font-weight:800;letter-spacing:-.5px;color:var(--text);}
    .section-sub{font-size:14px;color:var(--text2);margin-top:4px;}
    .see-all{color:var(--green);font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;text-decoration:none;}

    /* Markets */
    .filters{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:28px;}
    .filters::-webkit-scrollbar{display:none;}
    .markets-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;}
    .mcard{background:var(--card);border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:20px;cursor:pointer;transition:all 0.2s;display:flex;flex-direction:column;gap:14px;}
    .mcard:hover{border-color:var(--green-bd);transform:translateY(-3px);box-shadow:var(--shadow-lg);}
    .mcard.featured{grid-column:span 1;}
    .mcard-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
    .mcard-timer{font-size:11px;color:var(--text3);font-weight:500;white-space:nowrap;flex-shrink:0;}
    .mcard-timer.urgent{color:var(--red);font-weight:700;}
    .mcard-q{font-family:var(--font-head);font-size:15px;font-weight:700;line-height:1.4;color:var(--text);}
    .mcard.featured .mcard-q{font-size:18px;}
    .mcard-bar{background:var(--bg3);border-radius:100px;height:5px;overflow:hidden;}
    .mcard-bar-fill{height:100%;border-radius:100px;background:var(--green);}
    .mcard-odds{display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-top:2px;}
    .odds-y{color:var(--green);}
    .odds-n{color:var(--red);}
    .mcard-foot{display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border);}
    .mcard-pool{font-size:12px;color:var(--text2);}
    .mcard-pool strong{color:var(--text);font-weight:600;}

    /* How it Works */
    .how-step-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
    .how-card-img{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:28px;display:flex;align-items:center;justify-content:center;min-height:260px;}
    .how-card-img img{width:100%;max-width:220px;height:auto;object-fit:contain;}
    .how-card-text{background:var(--green);border-radius:var(--radius-lg);padding:36px 32px;display:flex;flex-direction:column;justify-content:center;min-height:260px;position:relative;overflow:hidden;}
    .how-card-text::after{content:'';position:absolute;top:-40px;right:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.08);}
    .how-step-num{font-family:var(--font-head);font-size:64px;font-weight:800;color:rgba(255,255,255,0.15);line-height:1;position:absolute;top:12px;right:20px;}
    .how-badge-pill{display:inline-flex;background:rgba(255,255,255,0.18);color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:5px 12px;border-radius:100px;margin-bottom:14px;width:fit-content;}
    .how-card-text h3{font-family:var(--font-head);font-size:22px;font-weight:800;color:#fff;margin-bottom:10px;position:relative;z-index:1;}
    .how-card-text p{font-size:14px;color:rgba(255,255,255,0.82);line-height:1.7;position:relative;z-index:1;}

    /* Why */
    .why-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
    .why-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;text-align:center;transition:all 0.2s;}
    .why-card:hover{border-color:var(--green-bd);transform:translateY(-2px);}
    .why-icon{width:52px;height:52px;border-radius:14px;background:var(--green-bg);display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 16px;}
    .why-card h3{font-family:var(--font-head);font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px;}
    .why-card p{font-size:13px;color:var(--text2);line-height:1.6;}

    /* FAQ */
    .faq-list{display:flex;flex-direction:column;gap:10px;max-width:768px;margin:0 auto;}
    .faq-item{background:var(--card);border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:border-color 0.2s;}
    .faq-item.open{border-color:var(--green-bd);}
    .faq-btn{width:100%;display:flex;align-items:center;justify-content:space-between;padding:18px 22px;background:none;border:none;cursor:pointer;font-family:var(--font-body);font-size:15px;font-weight:600;color:var(--text);text-align:left;gap:16px;}
    .faq-arrow{font-size:12px;color:var(--text3);transition:transform 0.2s;flex-shrink:0;}
    .faq-item.open .faq-arrow{transform:rotate(180deg);}
    .faq-body{padding:0 22px 18px;font-size:14px;color:var(--text2);line-height:1.7;}

    /* Newsletter */
    .newsletter-box{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-xl);padding:52px 40px;text-align:center;}
    .newsletter-box h2{font-family:var(--font-head);font-size:28px;font-weight:800;letter-spacing:-.5px;color:var(--text);margin-bottom:10px;}
    .newsletter-box p{font-size:15px;color:var(--text2);max-width:420px;margin:0 auto 28px;}
    .newsletter-form{display:flex;gap:10px;max-width:440px;margin:0 auto;}
    .newsletter-form input{flex:1;background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;padding:12px 16px;color:var(--text);font-size:14px;font-family:var(--font-body);outline:none;transition:border-color .18s;}
    .newsletter-form input:focus{border-color:var(--green);}
    .newsletter-form input::placeholder{color:var(--text3);}

    /* CTA */
    .cta-wrap{max-width:1200px;margin:0 auto;padding:0 24px 80px;}
    .cta-box{background:var(--green);border-radius:var(--radius-xl);padding:72px 48px;text-align:center;position:relative;overflow:hidden;}
    .cta-box::before{content:'';position:absolute;top:-60px;left:-60px;width:280px;height:280px;border-radius:50%;background:rgba(255,255,255,0.07);}
    .cta-box::after{content:'';position:absolute;bottom:-80px;right:-60px;width:340px;height:340px;border-radius:50%;background:rgba(0,0,0,0.06);}
    .cta-box h2{font-family:var(--font-head);font-size:clamp(28px,4vw,46px);font-weight:800;letter-spacing:-1px;color:#fff;margin-bottom:14px;position:relative;z-index:1;}
    .cta-box p{font-size:16px;color:rgba(255,255,255,0.82);max-width:440px;margin:0 auto 36px;line-height:1.7;position:relative;z-index:1;}
    .cta-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1;}

    /* Footer */
    .footer-wrap{border-top:1px solid var(--border);}
    .footer{padding:32px 24px;max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;}
    .footer-brand{font-family:var(--font-head);font-weight:800;font-size:17px;color:var(--text);margin-bottom:4px;}
    .footer-copy{font-size:13px;color:var(--text3);}
    .footer-links{display:flex;gap:20px;}
    .footer-links a{font-size:13px;color:var(--text3);text-decoration:none;transition:color .18s;}
    .footer-links a:hover{color:var(--text);}
    .social-links{display:flex;gap:10px;}
    .social-btn{width:36px;height:36px;border-radius:50%;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text2);cursor:pointer;text-decoration:none;transition:all .18s;}
    .social-btn:hover{background:var(--green-bg);border-color:var(--green-bd);color:var(--green);}

    /* Modal */
    .modal-overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.55);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity 0.25s;}
    .modal-overlay.open{opacity:1;pointer-events:all;}
    .modal{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-xl);width:100%;max-width:420px;transform:translateY(18px) scale(0.97);transition:all 0.28s cubic-bezier(0.34,1.4,0.64,1);position:relative;max-height:90vh;overflow-y:auto;}
    .modal-overlay.open .modal{transform:translateY(0) scale(1);}
    .modal-head{padding:28px 28px 0;text-align:center;}
    .modal-ico{width:54px;height:54px;border-radius:15px;background:var(--green-bg);border:1px solid var(--green-bd);display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 16px;}
    .modal h2{font-family:var(--font-head);font-size:22px;font-weight:800;color:var(--text);margin-bottom:6px;}
    .modal-desc{font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:22px;}
    .modal-body{padding:0 28px 28px;}
    .modal-tabs{display:flex;background:var(--bg3);border-radius:10px;padding:4px;margin-bottom:22px;gap:4px;}
    .modal-tab{flex:1;padding:8px;border-radius:7px;border:none;background:transparent;color:var(--text2);font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font-body);transition:all 0.18s;}
    .modal-tab.active{background:var(--bg2);color:var(--text);box-shadow:0 1px 6px rgba(0,0,0,0.1);}
    .modal-close{position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);font-size:14px;transition:all .18s;}
    .modal-close:hover{color:var(--text);}

    /* Responsive */
    @media(max-width:1024px){
      .hero-inner{grid-template-columns:1fr;gap:40px;}
      .hero-img-wrap{order:-1;}
      .hero-phone-img{max-width:280px;}
      .markets-grid{grid-template-columns:repeat(2,1fr);}
      .mcard.featured{grid-column:span 1;}
      .why-grid{grid-template-columns:repeat(2,1fr);}
    }
    @media(max-width:768px){
      .navbar-links{display:none;}
      .navbar-desktop-pad{padding:0 24px;}
      .navbar-right .btn-ghost{display:none;}
      .navbar-right .btn-primary{display:none;}
      .navbar-right .theme-btn{display:none;}
      .mobile-menu-btn{display:flex;}
      .hero{padding:80px 20px 48px;}
      .hero-ctas{flex-direction:column;}
      .hero-stats{gap:20px;}
      .how-step-row{grid-template-columns:1fr;}
      .section{padding:48px 20px;}
      .newsletter-form{flex-direction:column;}
      .float-win,.float-hot{display:none;}
    }
    @media(max-width:600px){
      .markets-grid{grid-template-columns:1fr;}
      .why-grid{grid-template-columns:1fr 1fr;}
      .cta-box{padding:44px 24px;}
      .newsletter-box{padding:36px 20px;}
    }
  `;

  const el = document.createElement("style");
  el.id = id; el.textContent = css;
  document.head.appendChild(el);
};
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
// ─── Static Data ──────────────────────────────────────────────
const FILTERS = ["All","Sports","Crypto","Entertainment","Politics","Gaming","Stocks"];

const HOW_IT_WORKS = [
  { step:"01", badge:"Account", title:"Create Account", desc:"Get started in seconds — sign up with your email or securely connect your VeChain / MetaMask wallet. No crypto experience? No problem.", image:"https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Zg71uaaFt5haRvdIV8HHEDlJUL9DD9.png" },
  { step:"02", badge:"Wallet", title:"Fund Your Wallet", desc:"Deposit VET directly from your wallet. Your balance is visible in the dashboard instantly, ready to use.", image:"https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JTNLuzTttMaXgDYUwVjEWV20bwQE9K.png" },
  { step:"03", badge:"Markets", title:"Pick a Market", desc:"Explore live markets across sports, crypto, politics, entertainment, and beyond — every moment brings a new opportunity.", image:"https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-aGLkk9w49TQmxDgdlGWqasiaJstgfH.png" },
  { step:"04", badge:"Payout", title:"Win and Withdraw", desc:"Make your predictions and watch your winnings flow straight into your wallet automatically. Withdraw anytime, instantly.", image:"https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-RRlF6sGVYeL8WAjbpvTslwZchAGlq0.png" },
];

const WHY_CHOOSE_US = [
  { icon:"🔒", title:"Non-Custodial", desc:"Your funds remain in your wallet at all times. We never hold your assets." },
  { icon:"👁️", title:"Fully Transparent", desc:"All predictions and outcomes are verified on-chain. Anyone can audit." },
  { icon:"⚡", title:"Instant Settlements", desc:"Winnings are automatically sent to your wallet the moment markets resolve." },
  { icon:"🛡️", title:"Audited Contracts", desc:"Smart contracts audited by leading security firms. Your funds are safe." },
];

const FAQS = [
  { q:"What is VetPredict?", a:"VetPredict is a decentralized prediction market built on VeChain. You can predict outcomes of real-world events across sports, crypto, politics, entertainment, and more. If your prediction is correct, you win VET tokens." },
  { q:"How do I get started?", a:"Simply connect your VeChain wallet (VeWorld or compatible) or sign up with email. Fund your account with VET, browse live markets, make your predictions, and earn when you're right!" },
  { q:"Is my money safe?", a:"Yes! VetPredict is fully non-custodial, meaning your funds stay in your wallet until you make a prediction. Our smart contracts are audited by leading security firms, and all transactions are transparent on-chain." },
  { q:"What are the fees?", a:"We charge a flat 2% platform fee on winnings only. There are no fees for losing predictions, deposits, or withdrawals. One of the lowest fee structures in the industry." },
  { q:"How are markets resolved?", a:"Markets are resolved using a combination of trusted oracles and decentralized verification. Once an event concludes, the outcome is verified on-chain and winnings are automatically distributed to correct predictors." },
  { q:"Can I create my own markets?", a:"Yes! Verified users can propose new markets. Once approved by the community, your market goes live and you earn a small percentage of the pool as the market creator." },
];

// ─── Helpers ──────────────────────────────────────────────────
function getCategoryBadge(cat) {
  return { Sports:"badge-blue", Crypto:"badge-green", Entertainment:"badge-amber", Politics:"badge-purple", Gaming:"badge-indigo", Stocks:"badge-green" }[cat] || "badge-blue";
}

function formatTimeLeft(closesAt) {
  if (!closesAt) return "Open";
  const ms = new Date(closesAt) - new Date();
  if (ms <= 0) return "Closed";
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(ms / 86400000);
  const mo = Math.floor(d / 30);
  const yr = Math.floor(d / 365);
  if (yr >= 1) return `${yr}y left`;
  if (mo >= 1) return `${mo}mo left`;
  if (d >= 1) return `${d}d left`;
  return `${h}h left`;
}

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 80, behavior:"smooth" });
};

// ─── Auth Modal ───────────────────────────────────────────────
function AuthModal({ open, onClose, defaultTab, marketTitle }) {
  const { loginWithEmail, signupWithEmail, loginWithWallet } = useAuth();
  const [tab, setTab]                     = useState(defaultTab || "signup");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [form, setForm]                   = useState({ email:"", password:"", displayName:"" });
  const [showVeWorldRedirect, setShowVeWorldRedirect] = useState(false);

  useEffect(() => {
    setTab(defaultTab || "signup");
    setError("");
    setShowVeWorldRedirect(false);
  }, [defaultTab, open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleEmail = async () => {
    setError(""); setLoading(true);
    try {
      if (tab === "signup") await signupWithEmail(form.email, form.password, form.displayName);
      else await loginWithEmail(form.email, form.password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Something went wrong");
    } finally { setLoading(false); }
  };

  const handleWallet = async () => {
    setError("");

    // On mobile: wait up to 3s for VeWorld to inject before deciding
    if (isMobile()) {
      setLoading(true);
      const available = await new Promise((resolve) => {
        if (window.connex || window.vechain || window.vechain_vendor) return resolve(true);
        const interval = setInterval(() => {
          if (window.connex || window.vechain || window.vechain_vendor) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
        setTimeout(() => { clearInterval(interval); resolve(false); }, 3000);
      });
      setLoading(false);

      if (!available) {
        // VeWorld not found even after waiting → show redirect UI
        setShowVeWorldRedirect(true);
        return;
      }
    }

    // Desktop or mobile with VeWorld detected → proceed
    setLoading(true);
    try {
      await loginWithWallet();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Wallet connection failed. Make sure VeWorld is installed.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal-overlay open" onClick={e => e.target.className === "modal-overlay open" && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-head">
          <div className="modal-ico">🎯</div>
          <h2>{tab === "signup" ? (marketTitle ? "Sign Up to Predict" : "Create Account") : "Welcome Back"}</h2>
          <p className="modal-desc">{tab === "signup" ? "Join free. Start predicting in seconds." : "Log in to continue predicting and earning."}</p>
        </div>
        <div className="modal-body">
          {marketTitle && (
            <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:8,background:"var(--green-bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🎯</div>
              <div>
                <div style={{fontSize:13,color:"var(--text)",fontWeight:500,lineHeight:1.4}}>{marketTitle}</div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>Sign in to place your prediction</div>
              </div>
            </div>
          )}
          <div className="modal-tabs">
            <button className={`modal-tab${tab==="signup"?" active":""}`} onClick={()=>{setTab("signup");setError("");setShowVeWorldRedirect(false);}}>Sign Up</button>
            <button className={`modal-tab${tab==="login"?" active":""}`} onClick={()=>{setTab("login");setError("");setShowVeWorldRedirect(false);}}>Log In</button>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {/* VeWorld Button or Mobile Redirect UI */}
          {showVeWorldRedirect ? (
            <div style={{background:"#EEEEFF",border:"1.5px solid rgba(92,107,192,0.4)",borderRadius:10,padding:"16px",marginBottom:8,textAlign:"center"}}>
              <div style={{fontSize:13,color:"#5C6BC0",fontWeight:600,marginBottom:12}}>
                Open VeWorld app to connect your wallet
              </div>
              <a
                href={`veworld://browser?url=${encodeURIComponent(window.location.href)}`}
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#5C6BC0",color:"#fff",padding:"11px 20px",borderRadius:8,fontWeight:600,fontSize:14,textDecoration:"none",marginBottom:10}}
              >
                <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
                  <path d="M20 4L36 13v14l-16 9L4 27V13L20 4z" stroke="#fff" strokeWidth="2.5" fill="none"/>
                </svg>
                Open in VeWorld
              </a>
              <a
                href={/iPhone|iPad|iPod/i.test(navigator.userAgent)
                  ? "https://apps.apple.com/app/veworld/id1633613910"
                  : "https://play.google.com/store/apps/details?id=com.vechain.wallet"}
                target="_blank"
                rel="noopener noreferrer"
                style={{fontSize:12,color:"#5C6BC0",fontWeight:600,display:"block",marginBottom:10}}
              >
                Don't have VeWorld? Download it →
              </a>
              <span
                style={{fontSize:12,color:"var(--text3)",cursor:"pointer"}}
                onClick={()=>setShowVeWorldRedirect(false)}
              >
                ← Back
              </span>
            </div>
          ) : (
            <button className="btn btn-vechain btn-block" style={{marginBottom:8}} onClick={handleWallet} disabled={loading}>
              <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
                <path d="M20 4L36 13v14l-16 9L4 27V13L20 4z" stroke="#5C6BC0" strokeWidth="2.5" fill="none"/>
              </svg>
              {loading ? "Detecting wallet..." : "Connect with VeWorld"}
            </button>
          )}

          <button className="btn btn-google btn-block" style={{marginBottom:4}} onClick={()=>window.location.href=`${process.env.REACT_APP_API_URL}/auth/google`}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider">or with email</div>
          {tab === "signup" && (
            <div className="form-group">
              <label className="input-label">Display Name</label>
              <input className="input" type="text" placeholder="Your name" value={form.displayName} onChange={set("displayName")}/>
            </div>
          )}
          <div className="form-group">
            <label className="input-label">Email</label>
            <input className="input" type="email" placeholder="email@example.com" value={form.email} onChange={set("email")} onKeyDown={e=>e.key==="Enter"&&handleEmail()}/>
          </div>
          <div className="form-group">
            <label className="input-label">Password</label>
            <input className="input" type="password" placeholder={tab==="signup"?"Min 8 chars, 1 uppercase, 1 number":"Your password"} value={form.password} onChange={set("password")} onKeyDown={e=>e.key==="Enter"&&handleEmail()}/>
          </div>
          {tab === "login" && (
            <div style={{textAlign:"right",marginBottom:4,marginTop:-6}}>
              <span style={{fontSize:12,color:"var(--green)",cursor:"pointer",fontWeight:600}} onClick={()=>{onClose();window.location.href="/forgot-password";}}>Forgot password?</span>
            </div>
          )}
          <button className="btn btn-primary btn-block btn-lg" style={{marginTop:6}} onClick={handleEmail} disabled={loading}>
            {loading ? "Please wait..." : tab==="signup" ? "Create Free Account →" : "Log In →"}
          </button>
          <p style={{textAlign:"center",fontSize:12,color:"var(--text3)",marginTop:14}}>
            {tab==="signup"
              ? <span>Already have an account? <span style={{color:"var(--green)",cursor:"pointer",fontWeight:600}} onClick={()=>setTab("login")}>Log in</span></span>
              : <span>No account? <span style={{color:"var(--green)",cursor:"pointer",fontWeight:600}} onClick={()=>setTab("signup")}>Sign up free</span></span>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
// ─── Market Card ──────────────────────────────────────────────
function MarketCard({ market, onPredict }) {
  const yesPercent = market.yesPercent ?? (market.totalPool > 0 ? Math.round(market.yesPool / market.totalPool * 100) : 50);
  const poolVet    = ((market.totalPool || 0) / 1e18).toFixed(0);
  const urgent     = new Date(market.closesAt) - new Date() < 3 * 60 * 60 * 1000;
  const timeLeft   = formatTimeLeft(market.closesAt) || market.timeLeft || "Open";
  const poolDisplay = parseFloat(poolVet) > 0 ? `${poolVet} VET` : market.pool || "New";

  return (
    <div className={`mcard${market.featured?" featured":""}`} onClick={()=>onPredict(market)}>
      <div className="mcard-top">
        <span className={`badge ${getCategoryBadge(market.category)}`}>{market.category}</span>
        <span className={`mcard-timer${urgent?" urgent":""}`}>{timeLeft}</span>
      </div>
      <div className="mcard-q">{market.title}</div>
      <div className="mcard-bar"><div className="mcard-bar-fill" style={{width:`${yesPercent}%`}}/></div>
      <div className="mcard-odds">
        <span className="odds-y">YES {yesPercent}%</span>
        <span className="odds-n">NO {100-yesPercent}%</span>
      </div>
      <div className="mcard-foot">
        <span className="mcard-pool">Pool: <strong>{poolDisplay}</strong></span>
        <button className="btn btn-primary btn-sm" onClick={e=>{e.stopPropagation();onPredict(market);}}>Predict →</button>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────
export default function Landing() {
  const { vetPrice } = useAuth();
  const [theme, setTheme]         = useState("light");
  const [modal, setModal]         = useState({ open:false, tab:"signup", market:null });
  const [menuOpen, setMenuOpen]   = useState(false);
  const [markets, setMarkets]     = useState([]);
  const [activeFilter, setFilter] = useState("All");
  const [loadingMarkets, setLM]   = useState(true);
  const [openFaq, setOpenFaq]     = useState(null);
  const [email, setEmail]         = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => { injectStyles(theme); }, [theme]);

  useEffect(() => {
    const params = { status:"active", limit:6 };
    if (activeFilter !== "All") params.category = activeFilter;
    setLM(true);
    fetchMarkets(params)
      .then(res => setMarkets(res.data.markets || []))
      .catch(() => setMarkets([]))
      .finally(() => setLM(false));
  }, [activeFilter]);

  const openAuth    = (tab)    => setModal({ open:true, tab, market:null });
  const openPredict = (market) => setModal({ open:true, tab:"signup", market });
  const closeModal  = ()       => setModal(m => ({ ...m, open:false }));

  const livePrice = typeof vetPrice === "number" && vetPrice > 0
    ? `$${vetPrice < 0.01 ? vetPrice.toFixed(4) : vetPrice.toFixed(3)}`
    : "$0.033";

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-desktop-pad">
        <a className="navbar-logo" href="/"><div className="logo-icon">V</div>VetPredict</a>
        <ul className="navbar-links">
          <li><a href="#markets" onClick={e=>{e.preventDefault();scrollTo("markets");}}>Markets</a></li>
          <li><a href="#how" onClick={e=>{e.preventDefault();scrollTo("how");}}>How it Works</a></li>
          <li><a href="#faq" onClick={e=>{e.preventDefault();scrollTo("faq");}}>FAQ</a></li>
        </ul>
        <div className="navbar-right">
          {/* Desktop only: theme toggle, log in, get started */}
          <button className="theme-btn" onClick={()=>setTheme(t=>t==="light"?"dark":"light")}>{theme==="dark"?"☀️":"🌙"}</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>openAuth("login")}>Log In</button>
          <button className="btn btn-primary btn-sm" onClick={()=>openAuth("signup")}>Get Started</button>
          {/* Mobile only: hamburger */}
          <button className="mobile-menu-btn" onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?"✕":"☰"}</button>
        </div>
      </nav>

      {/* Mobile Nav — hamburger dropdown */}
      <div className={`mobile-nav${menuOpen?" open":""}`}>
        <a href="#markets" onClick={e=>{e.preventDefault();setMenuOpen(false);scrollTo("markets");}}>Markets</a>
        <a href="#how" onClick={e=>{e.preventDefault();setMenuOpen(false);scrollTo("how");}}>How it Works</a>
        <a href="#faq" onClick={e=>{e.preventDefault();setMenuOpen(false);scrollTo("faq");}}>FAQ</a>
        <div className="mobile-nav-actions">
          {/* Theme toggle row */}
          <div className="mobile-theme-row">
            <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
            <button className="theme-btn" onClick={()=>setTheme(t=>t==="light"?"dark":"light")} style={{flexShrink:0}}>
              {theme==="dark"?"☀️":"🌙"}
            </button>
          </div>
          <button className="btn btn-outline btn-block" onClick={()=>{openAuth("login");setMenuOpen(false);}}>Log In</button>
          <button className="btn btn-primary btn-block" onClick={()=>{openAuth("signup");setMenuOpen(false);}}>Get Started Free</button>
        </div>
      </div>

      <div style={{paddingTop:64}}>

        {/* Hero */}
        <section className="hero">
          <div className="hero-inner">
            <div>
              <div className="hero-eyebrow"><div className="live-dot"/> Live Prediction Markets</div>
              <h1>Predict.<br/><em>Win.</em><br/>Earn Real Money.</h1>
              <p className="hero-sub">Turn your knowledge of sports, crypto, music and trending moments into real earnings. Connect your wallet or sign up with email.</p>
              <div className="hero-ctas">
                <button className="btn btn-primary btn-lg" onClick={()=>openAuth("signup")}>Start Predicting Free →</button>
                <a className="btn btn-outline btn-lg" href="#markets" onClick={e=>{e.preventDefault();scrollTo("markets");}}>Browse Markets</a>
              </div>
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-val" style={{color:"var(--green)"}}>{livePrice}</span>
                  <span className="stat-lbl">VET Price (Live)</span>
                </div>
                {[["VeChain","Blockchain"],["2% Fee","Platform Fee"],["Non-Custodial","Your Keys"],["Instant","Payouts"]].map(([v,l])=>(
                  <div className="stat-item" key={l}><span className="stat-val">{v}</span><span className="stat-lbl">{l}</span></div>
                ))}
              </div>
            </div>

            {/* Phone image */}
            <div className="hero-img-wrap">
              <img
                className="hero-phone-img"
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-qJxos9ksqd1o7HUswM5kazXBHFzvM2.png"
                alt="VetPredict App"
              />
            </div>
          </div>
        </section>

        {/* Live Markets */}
        <section className="section" id="markets">
          <div className="section-hd">
            <div><div className="section-title">Live Markets</div><div className="section-sub">Predict on real events happening right now</div></div>
            <a className="see-all" href="#" onClick={e=>{e.preventDefault();openAuth("signup");}}>View all →</a>
          </div>
          <div className="filters">
            {FILTERS.map(f=>(
              <div key={f} className={`pill${activeFilter===f?" active":""}`} onClick={()=>setFilter(f)}>{f}</div>
            ))}
          </div>
          {loadingMarkets ? (
            <div style={{textAlign:"center",padding:"40px 0",color:"var(--text3)"}}>Loading markets...</div>
          ) : markets.length > 0 ? (
            <div className="markets-grid">
              {markets.map(m=><MarketCard key={m._id} market={m} onPredict={openPredict}/>)}
            </div>
          ) : (
            <div style={{textAlign:"center",padding:"40px 0",color:"var(--text3)"}}>No markets available in this category yet.</div>
          )}
          <div style={{textAlign:"center",marginTop:40}}>
            <p style={{color:"var(--text3)",fontSize:14,marginBottom:14}}>Ready to put your knowledge to work?</p>
            <button className="btn btn-primary btn-lg" onClick={()=>openAuth("signup")}>Start Predicting Free →</button>
          </div>
        </section>

        {/* How it Works */}
        <section className="section" id="how">
          <div className="section-hd">
            <div><div className="section-title">How it Works</div><div className="section-sub">Start earning in under 5 minutes</div></div>
          </div>
          {HOW_IT_WORKS.map((item, i) => (
            <div key={item.step} className="how-step-row">
              <div style={i%2===1?{order:2}:{}}>
                <div className="how-card-img">
                  <img src={item.image} alt={item.title}/>
                </div>
              </div>
              <div style={i%2===1?{order:1}:{}}>
                <div className="how-card-text">
                  <span className="how-step-num">{item.step}</span>
                  <span className="how-badge-pill">{item.badge}</span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Why Choose Us */}
        <section className="section">
          <div style={{textAlign:"center",marginBottom:40}}>
            <span className="badge badge-green" style={{marginBottom:14,display:"inline-flex"}}>Why VetPredict</span>
            <div className="section-title" style={{textAlign:"center",fontSize:"clamp(22px,3vw,32px)"}}>Built for Trust &amp; Transparency</div>
            <p style={{color:"var(--text2)",maxWidth:480,margin:"10px auto 0",fontSize:15,lineHeight:1.7}}>We leverage VeChain's enterprise-grade blockchain to deliver a prediction market you can truly trust.</p>
          </div>
          <div className="why-grid">
            {WHY_CHOOSE_US.map(w=>(
              <div className="why-card" key={w.title}>
                <div className="why-icon">{w.icon}</div>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq">
          <div style={{textAlign:"center",marginBottom:40}}>
            <span className="badge badge-green" style={{marginBottom:14,display:"inline-flex"}}>FAQ</span>
            <div className="section-title" style={{textAlign:"center",fontSize:"clamp(22px,3vw,32px)"}}>Frequently Asked Questions</div>
            <p style={{color:"var(--text2)",maxWidth:440,margin:"10px auto 0",fontSize:14}}>Everything you need to know about VetPredict</p>
          </div>
          <div className="faq-list">
            {FAQS.map((faq,i)=>(
              <div key={i} className={`faq-item${openFaq===i?" open":""}`}>
                <button className="faq-btn" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                  <span>{faq.q}</span><span className="faq-arrow">▼</span>
                </button>
                {openFaq===i && <div className="faq-body">{faq.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="section">
          <div className="newsletter-box">
            <div style={{fontSize:32,marginBottom:14}}>🎁</div>
            <h2>Get Exclusive Market Alerts</h2>
            <p>Be the first to know about trending markets, special events, and exclusive promotions. Join 10,000+ predictors.</p>
            {subscribed ? (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:"var(--green)",fontWeight:600,fontSize:15}}>✅ You're subscribed! Check your inbox.</div>
            ) : (
              <>
                <div className="newsletter-form">
                  <input type="email" placeholder="Enter your email" value={email} onChange={e=>setEmail(e.target.value)}/>
                  <button className="btn btn-primary" onClick={()=>{if(email){setSubscribed(true);setEmail("");}}}>Subscribe →</button>
                </div>
                <p style={{fontSize:12,color:"var(--text3)",marginTop:12}}>No spam. Unsubscribe anytime.</p>
              </>
            )}
          </div>
        </section>

        {/* CTA */}
        <div className="cta-wrap">
          <div className="cta-box">
            <h2>Your Knowledge Is Worth Money</h2>
            <p>Join VetPredict and turn your knowledge into earnings. Fully non-custodial, transparently secure, and powered by VeChain.</p>
            <div className="cta-btns">
              <button className="btn btn-white btn-lg" onClick={()=>openAuth("signup")}>Create Free Account →</button>
              <button className="btn btn-dark btn-lg" onClick={()=>openAuth("signup")}>
                <svg width="16" height="16" viewBox="0 0 40 40" fill="none"><path d="M20 4L36 13v14l-16 9L4 27V13L20 4z" stroke="currentColor" strokeWidth="2.5" fill="none"/></svg>
                Connect Wallet
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer-wrap">
          <footer className="footer">
            <div>
              <div className="footer-brand">VetPredict</div>
              <div className="footer-copy">Built on VeChain. Non-custodial. Transparent. © 2026</div>
            </div>
            <div className="social-links">
              <a className="social-btn" href="https://twitter.com/vetpredict" target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a className="social-btn" href="https://t.me/vetpredict" target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a className="social-btn" href="https://discord.gg/vetpredict" target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/></svg>
              </a>
            </div>
            <nav className="footer-links">
              {["Terms","Privacy","Support","About"].map(l=><a key={l} href="#">{l}</a>)}
            </nav>
          </footer>
        </div>

      </div>

      <AuthModal open={modal.open} onClose={closeModal} defaultTab={modal.tab} marketTitle={modal.market?.title}/>
    </>
  );
}