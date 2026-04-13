import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("pc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("pc_token");
      localStorage.removeItem("pc_user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────
export const signupEmail   = (data)    => API.post("/auth/signup", data);
export const loginEmail    = (data)    => API.post("/auth/login", data);
export const getNonce      = (address) => API.get(`/auth/nonce/${address}`);
export const loginWallet   = (data)    => API.post("/auth/wallet", data);
export const getMe         = ()        => API.get("/auth/me");
export const forgotPassword = (email)           => API.post("/auth/forgot-password", { email });
export const resetPassword  = (token, password) => API.post("/auth/reset-password",  { token, password });
export const changePassword = (data) => API.post("/auth/change-password", data);
export const verifyAdminCode = (code) => API.post("/auth/admin-verify", { code });
export const linkWallet = (data) => API.post("/auth/link-wallet", data);

// ─── Markets ──────────────────────────────────────────────────
export const fetchMarkets  = (params)  => API.get("/markets", { params });
export const fetchMarket   = (id)      => API.get(`/markets/${id}`);
export const fetchTrending = ()        => API.get("/markets/meta/trending");

// ─── Predictions ──────────────────────────────────────────────
export const fetchMyPredictions = (params)   => API.get("/predictions/my", { params });
export const placePrediction    = (data)     => API.post("/predictions", data);
export const claimWinnings      = (id, data) => API.post(`/predictions/${id}/claim`, data);

// ─── Wallet ───────────────────────────────────────────────────
export const fetchBalance      = ()       => API.get("/wallet/balance");
export const fetchTransactions = (params) => API.get("/wallet/transactions", { params });
export const recordDeposit     = (data)   => API.post("/wallet/deposit", data);
export const recordWithdrawal  = (data)   => API.post("/wallet/withdraw", data);

// ─── Leaderboard ──────────────────────────────────────────────
export const fetchLeaderboard  = (params) => API.get("/leaderboard", { params });

// ─── User ─────────────────────────────────────────────────────
export const fetchProfile       = ()       => API.get("/users/profile");
export const updateProfile      = (data)   => API.patch("/users/profile", data);
export const fetchNotifications = (params) => API.get("/users/notifications", { params });
export const markNotifsRead     = ()       => API.patch("/users/notifications/read-all");

// ─── Price ────────────────────────────────────────────────────
export const fetchVetPrice = () => API.get("/price/vet");

// ─── Admin ────────────────────────────────────────────────────
export const adminFetchStats        = ()          => API.get("/admin/stats");
export const adminFetchMarkets      = ()          => API.get("/admin/markets");
export const adminFetchUsers        = (params)    => API.get("/admin/users", { params });
export const adminFetchTransactions = (params)    => API.get("/admin/transactions", { params });
export const adminCreateMarket      = (data)      => API.post("/admin/markets", data);
export const adminUpdateMarket      = (id, data)  => API.patch(`/admin/markets/${id}`, data);
export const adminResolveMarket     = (id, data)  => API.post(`/admin/markets/${id}/resolve`, data);
export const adminCancelMarket      = (id)        => API.post(`/admin/markets/${id}/cancel`);
export const adminToggleAdmin       = (id)        => API.patch(`/admin/users/${id}/toggle-admin`);
export const adminToggleActive      = (id)        => API.patch(`/admin/users/${id}/toggle-active`);
export const adminWithdrawFees      = (data)      => API.post("/admin/withdraw-fees", data);
export const adminNotifyAll         = (data)      => API.post("/admin/notify-all", data);

// ─── default export MUST be last ──────────────────────────────
export default API;