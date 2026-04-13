import { useState } from "react";
import { forgotPassword, resetPassword } from "../services/api";

const inputStyle = {
  width:"100%", background:"#EEF0F6", border:"1.5px solid rgba(0,0,0,0.07)",
  borderRadius:10, padding:"11px 14px", color:"#111827", fontSize:14,
  fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none",
  transition:"border-color 0.18s", marginBottom:12,
};
const btnStyle = {
  width:"100%", background:"#0BAB64", color:"#fff", border:"none",
  borderRadius:10, padding:"13px 20px", fontSize:14, fontWeight:700,
  cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
  transition:"all 0.18s",
};
const cardStyle = {
  background:"#fff", border:"1px solid rgba(0,0,0,0.07)",
  borderRadius:20, padding:36, width:"100%", maxWidth:400,
  boxShadow:"0 4px 24px rgba(0,0,0,0.08)",
};
const logoStyle = {
  width:44, height:44, borderRadius:12, background:"#0BAB64",
  display:"flex", alignItems:"center", justifyContent:"center",
  fontSize:20, color:"#fff", fontWeight:800, margin:"0 auto 16px",
};
const errStyle = {
  background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)",
  color:"#EF4444", padding:"10px 14px", borderRadius:9, fontSize:13, marginBottom:14,
};
const okStyle = {
  background:"rgba(11,171,100,0.09)", border:"1px solid rgba(11,171,100,0.22)",
  color:"#0BAB64", padding:"10px 14px", borderRadius:9, fontSize:13, marginBottom:14,
};
const wrap = {
  display:"flex", alignItems:"center", justifyContent:"center",
  minHeight:"100vh", background:"#F7F8FA", padding:20,
  fontFamily:"'Plus Jakarta Sans',sans-serif",
};

// ─── Forgot Password Page ─────────────────────────────────────
export function ForgotPasswordPage({ onBack }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { setError("Enter your email address"); return; }
    setLoading(true); setError("");
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div style={wrap}>
      <div style={cardStyle}>
        <div style={logoStyle}>P</div>
        <h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:22,fontWeight:800,color:"#111827",textAlign:"center",marginBottom:6}}>
          Reset Password
        </h2>
        <p style={{fontSize:13,color:"#4B5563",textAlign:"center",marginBottom:24,lineHeight:1.6}}>
          Enter your email and we will send you a reset link.
        </p>

        {error && <div style={errStyle}>{error}</div>}
        {sent  && (
          <div style={okStyle}>
            Reset link sent! Check your inbox (and spam folder).
          </div>
        )}

        {!sent && (
          <>
            <input
              style={inputStyle} type="email" placeholder="your@email.com"
              value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
              onFocus={e=>e.target.style.borderColor="#0BAB64"}
              onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.07)"}
            />
            <button style={btnStyle} onClick={handleSubmit} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link →"}
            </button>
          </>
        )}

        <p style={{textAlign:"center",fontSize:13,color:"#9CA3AF",marginTop:16}}>
          <span style={{color:"#0BAB64",cursor:"pointer",fontWeight:600}} onClick={onBack}>
            Back to login
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Reset Password Page ──────────────────────────────────────
export function ResetPasswordPage({ token, onSuccess }) {
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [showPass,  setShowPass]  = useState(false);

  const validate = () => {
    if (password.length < 8)           return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password))       return "Password must contain an uppercase letter";
    if (!/[0-9]/.test(password))       return "Password must contain a number";
    if (password !== confirm)          return "Passwords do not match";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (!token) { setError("Invalid or missing reset token"); return; }
    setLoading(true); setError("");
    try {
      await resetPassword(token, password);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Reset failed");
    } finally { setLoading(false); }
  };

  const inputFocus = e => e.target.style.borderColor = "#0BAB64";
  const inputBlur  = e => e.target.style.borderColor = "rgba(0,0,0,0.07)";

  return (
    <div style={wrap}>
      <div style={cardStyle}>
        <div style={logoStyle}>P</div>
        <h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:22,fontWeight:800,color:"#111827",textAlign:"center",marginBottom:6}}>
          Set New Password
        </h2>
        <p style={{fontSize:13,color:"#4B5563",textAlign:"center",marginBottom:24,lineHeight:1.6}}>
          Choose a strong password for your account.
        </p>

        {error && <div style={errStyle}>{error}</div>}

        <div style={{position:"relative",marginBottom:0}}>
          <input
            style={{...inputStyle,paddingRight:56}}
            type={showPass?"text":"password"}
            placeholder="New password"
            value={password} onChange={e=>setPassword(e.target.value)}
            onFocus={inputFocus} onBlur={inputBlur}
          />
          <button
            onClick={()=>setShowPass(s=>!s)}
            style={{position:"absolute",right:12,top:12,background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:12,fontFamily:"inherit"}}
          >
            {showPass?"Hide":"Show"}
          </button>
        </div>

        <input
          style={inputStyle} type="password" placeholder="Confirm new password"
          value={confirm} onChange={e=>setConfirm(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
          onFocus={inputFocus} onBlur={inputBlur}
        />

        <div style={{fontSize:11,color:"#9CA3AF",marginBottom:14,lineHeight:1.6}}>
          Must be 8+ characters, include an uppercase letter and a number.
        </div>

        <button style={btnStyle} onClick={handleSubmit} disabled={loading}>
          {loading ? "Resetting..." : "Reset Password →"}
        </button>
      </div>
    </div>
  );
}
