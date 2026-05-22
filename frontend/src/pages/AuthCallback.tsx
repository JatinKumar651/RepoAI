import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "../api/client";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    // Supabase puts tokens in the URL hash fragment
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      toast.error("Auth failed — tokens missing in URL");
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        // Temporarily set the auth store so that apiClient uses the new access_token
        setAuth({} as any, access_token, refresh_token);
        
        // Fetch user data from the backend to verify the token is valid
        const { data: user } = await authApi.me();
        
        // Now set the full user profile
        setAuth(user, access_token, refresh_token);
        toast.success(`Welcome, ${user.full_name ?? user.email}!`);
        navigate("/dashboard", { replace: true });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Authentication failed";
        toast.error(msg);
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate, setAuth]);

  return (
    <div className="min-h-screen bg-space flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="w-20 h-20 rounded-full border-2 border-brand-400/30 animate-spin-slow" />
          <div className="absolute inset-2 rounded-full border-2 border-t-brand-400 border-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-brand-400 animate-pulse" />
          </div>
        </div>
        <h2 className="font-display font-bold text-xl text-white mb-2">Authenticating…</h2>
        <p className="text-white/40 text-sm">Exchanging tokens with Supabase</p>
      </motion.div>
    </div>
  );
}
