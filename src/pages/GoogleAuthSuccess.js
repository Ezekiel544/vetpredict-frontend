import { useEffect } from "react";
import { getMe } from "../services/api";

// This page is the redirect target after Google OAuth succeeds.
// URL looks like: /auth/google/success?token=xxxxx
// We read the token, store it, fetch the user, then redirect to dashboard.

export default function GoogleAuthSuccess() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");

    if (!token) {
      window.location.href = "/?error=no_token";
      return;
    }

    // Store token
    localStorage.setItem("pc_token", token);

    // Fetch user profile with the token
    getMe()
      .then(res => {
        localStorage.setItem("pc_user", JSON.stringify(res.data.user));
        // Redirect to dashboard — full reload so AuthContext picks up the token
        window.location.href = "/";
      })
      .catch(() => {
        localStorage.removeItem("pc_token");
        window.location.href = "/?error=google_failed";
      });
  }, []);

  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#F7F8FA",
      fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, color:"#6B7280",
      flexDirection:"column", gap:12
    }}>
      <div style={{
        width:40, height:40, borderRadius:10, background:"#0BAB64",
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"#fff", fontWeight:800, fontSize:18, marginBottom:8
      }}>P</div>
      Signing you in with Google...
    </div>
  );
}
