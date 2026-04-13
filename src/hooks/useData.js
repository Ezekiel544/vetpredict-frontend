import { useState, useEffect, useCallback } from "react";
import {
  fetchMarkets, fetchMyPredictions, fetchBalance,
  fetchTransactions, fetchLeaderboard, fetchNotifications,
  fetchProfile,
} from "../services/api";

// ─── useMarkets ───────────────────────────────────────────────
export function useMarkets(params = {}) {
  const [markets, setMarkets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [total, setTotal]       = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchMarkets(params);
      setMarkets(res.data.markets);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load markets");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [load]);
  return { markets, loading, error, total, reload: load };
}

// ─── useMyPredictions ─────────────────────────────────────────
export function useMyPredictions(params = {}) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchMyPredictions(params);
      setPredictions(res.data.predictions);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [load]);
  return { predictions, loading, error, reload: load };
}

// ─── useWallet ────────────────────────────────────────────────
export function useWallet() {
  const [balance, setBalance]         = useState(null);
  const [transactions, setTxs]        = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [balRes, txRes] = await Promise.all([
        fetchBalance(),
        fetchTransactions({ limit: 20 }),
      ]);
      setBalance(balRes.data);
      setTxs(txRes.data.transactions);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { balance, transactions, loading, error, reload: load };
}

// ─── useLeaderboard ───────────────────────────────────────────
export function useLeaderboard(type = "earnings") {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard({ type })
      .then(res => setData(res.data.leaderboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type]);

  return { data, loading };
}

// ─── useNotifications ─────────────────────────────────────────
export function useNotifications() {
  const [notifications, setNotifs] = useState([]);
  const [unreadCount, setUnread]   = useState(0);
  const [loading, setLoading]      = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetchNotifications({ limit: 20 });
      setNotifs(res.data.notifications);
      setUnread(res.data.unreadCount);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { notifications, unreadCount, loading, reload: load };
}

// ─── useProfile ───────────────────────────────────────────────
export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile()
      .then(res => setProfile(res.data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { profile, loading, setProfile };
}
