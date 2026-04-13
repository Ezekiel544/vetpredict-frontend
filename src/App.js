import { useAuth } from "./context/AuthContext";
import Landing          from "./pages/Landing";
import Dashboard        from "./pages/Dashboard";
import AdminPanel       from "./pages/admin/AdminPanel";
import { ForgotPasswordPage, ResetPasswordPage } from "./pages/PasswordReset";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";

export default function App() {
  const { user, loading } = useAuth();
  const path  = window.location.pathname;
  const query = new URLSearchParams(window.location.search);

  if (loading) {
    return (
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        height:"100vh", background:"#F4F6FA",
        fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, color:"#6B7280"
      }}>
        Loading PredictChain...
      </div>
    );
  }

  if (path.startsWith("/admin"))              return <AdminPanel/>;
  if (path === "/forgot-password")            return <ForgotPasswordPage onBack={()=>window.location.href="/"}/>;
  if (path === "/reset-password")             return <ResetPasswordPage token={query.get("token")} onSuccess={()=>window.location.href="/"}/>;
  if (path === "/auth/google/success")        return <GoogleAuthSuccess/>;

  // 404 — unknown path
  if (path !== "/") return (
    <div style={{
      display:"flex",alignItems:"center",justifyContent:"center",
      height:"100vh",background:"#F7F8FA",flexDirection:"column",gap:12,
      fontFamily:"'Plus Jakarta Sans',sans-serif"
    }}>
      <div style={{fontSize:64}}>🔮</div>
      <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:28,fontWeight:800,color:"#111827"}}>404</div>
      <div style={{fontSize:14,color:"#6B7280",marginBottom:8}}>This page doesn't exist.</div>
      <button
        onClick={()=>window.location.href="/"}
        style={{background:"#0BAB64",color:"#fff",border:"none",borderRadius:10,
          padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer"}}
      >
        Back to PredictChain →
      </button>
    </div>
  );

  return user ? <Dashboard /> : <Landing />;
}
