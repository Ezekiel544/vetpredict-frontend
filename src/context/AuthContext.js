import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, loginEmail, signupEmail, getNonce, loginWallet, fetchVetPrice, linkWallet } from "../services/api";
import { getWalletAddress, signAuthMessage, getVetBalance, waitForConnex } from "../services/vechain";
import { io } from "socket.io-client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]       = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [vetPrice,    setVetPrice]   = useState(0.045);
  const [socket,      setSocket]     = useState(null);
  const [liveBalance, setLiveBalance]= useState(null);

  // ── Load user on mount ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("pc_token");
    if (token) {
      getMe()
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem("pc_token");
          localStorage.removeItem("pc_user");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Live VET price every 5 minutes ─────────────────────────
  useEffect(() => {
    const load = () => fetchVetPrice().then(r => setVetPrice(r.data.usd || 0.045)).catch(() => {});
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Live wallet balance when user has wallet ────────────────
  useEffect(() => {
    if (!user?.walletAddress) return;
    const load = async () => {
      const bal = await getVetBalance(user.walletAddress);
      if (bal !== null) setLiveBalance(bal);
    };
    load();
    const interval = setInterval(load, 30 * 1000);
    return () => clearInterval(interval);
  }, [user?.walletAddress]);

  // ── Socket.io for real-time notifications ──────────────────
  useEffect(() => {
    if (!user) return;
    const s = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5001");
    s.emit("join_user", user._id || user.id);
    s.on("notification",    (notif) => window.dispatchEvent(new CustomEvent("pc_notification", { detail: notif })));
    s.on("market_created",  ()      => window.dispatchEvent(new Event("pc_market_update")));
    s.on("market_resolved", ()      => window.dispatchEvent(new Event("pc_market_update")));
    setSocket(s);
    return () => s.disconnect();
  }, [user?._id]);

  const saveSession = (token, userData) => {
    localStorage.setItem("pc_token", token);
    localStorage.setItem("pc_user", JSON.stringify(userData));
    setUser(userData);
  };

  // ── Email login ─────────────────────────────────────────────
  const loginWithEmail = async (email, password) => {
    const res = await loginEmail({ email, password });
    saveSession(res.data.token, res.data.user);
    return res.data.user;
  };

  // ── Email signup ────────────────────────────────────────────
  const signupWithEmail = async (email, password, displayName) => {
    const res = await signupEmail({ email, password, displayName });
    saveSession(res.data.token, res.data.user);
    return res.data.user;
  };

  // ── VeChain wallet login ────────────────────────────────────
  const loginWithWallet = async () => {
    // DEBUG — remove after testing
    // alert(
    //   "connex: " + typeof window.connex +
    //   " | vechain: " + typeof window.vechain +
    //   " | vendor: " + typeof window.vechain_vendor
    // );
//     alert(
//   "vechain keys: " + Object.keys(window.vechain || {}).join(", ")
// );

    // Wait up to 5 seconds for VeWorld to inject
    const ready = await waitForConnex(5000);

    if (!ready) {
      throw new Error("VeWorld wallet not detected. Please open this site inside VeWorld browser.");
    }

    const address  = await getWalletAddress();
    const nonceRes = await getNonce(address);
    const { message } = nonceRes.data;

    const certResult = await signAuthMessage(address, message);

    const authRes = await loginWallet({
      address,
      signature: certResult.signature,
      signer:    certResult.signer,
    });

    saveSession(authRes.data.token, authRes.data.user);
    return authRes.data.user;
  };

  // ── Link wallet to existing email/Google account ────────────
  const linkWalletToAccount = async () => {
    // Wait up to 5 seconds for VeWorld to inject
    const ready = await waitForConnex(5000);

    if (!ready) {
      throw new Error("VeWorld wallet not detected. Please open this site inside VeWorld browser.");
    }

    const address = await getWalletAddress();
    const res = await linkWallet({ address });
    saveSession(res.data.token, res.data.user);
    return res.data.user;
  };

  // ── Logout ──────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("pc_token");
    localStorage.removeItem("pc_user");
    setUser(null);
    setLiveBalance(null);
    if (socket) socket.disconnect();
    setSocket(null);
  }, [socket]);

  // ── Refresh user data ───────────────────────────────────────
  const refreshUser = async () => {
    try {
      const res = await getMe();
      setUser(res.data.user);
    } catch {}
  };

  // ── VET to USD converter ────────────────────────────────────
  const toUsd = (vet) => {
    const n = parseFloat(String(vet).replace(/[^0-9.]/g, ""));
    if (isNaN(n) || n === 0) return "$0.00";
    const usd = n * vetPrice;
    if (usd >= 1000000) return `$${(usd / 1000000).toFixed(2)}M`;
    if (usd >= 1000)    return `$${(usd / 1000).toFixed(1)}K`;
    return `$${usd.toFixed(2)}`;
  };

  return (
    <AuthContext.Provider value={{
      user, loading, socket, vetPrice, toUsd,
      liveBalance,
      loginWithEmail, signupWithEmail, loginWithWallet,
      linkWalletToAccount,
      logout, refreshUser, setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};