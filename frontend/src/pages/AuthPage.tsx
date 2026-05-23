import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, GitBranch, Globe, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { authApi } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useNavigate, Link } from "react-router-dom";
import ParticleField from "../components/3d/ParticleField";
import toast from "react-hot-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    setLoading(true);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      toast.error("VITE_SUPABASE_URL is not defined in .env");
      setLoading(false);
      return;
    }
    const redirectUrl = `${window.location.origin}/auth/callback`;
    // Using implicit grant flow by constructing the URL manually
    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !fullName)) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const payload = isLogin
        ? { email, password }
        : { email, password, full_name: fullName };

      const { data } = isLogin
        ? await authApi.login(payload)
        : await authApi.signup(payload);

      setAuth(data.user, data.access_token, data.refresh_token);
      toast.success(`Welcome, ${data.user.full_name ?? data.user.email}!`);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.detail ?? "Authentication failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-space">
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <ParticleField />
      </div>

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass rounded-3xl p-8 gradient-border">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-cyan-500 mb-4 shadow-glow-violet animate-float">
              <GitBranch size={32} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-2xl text-white mb-2">
              Welcome to <span className="gradient-text">RepoAI</span>
            </h1>
            <p className="text-white/50 text-sm">
              {isLogin ? "Sign in to continue analyzing repositories" : "Create an account to start analyzing"}
            </p>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      className="input-dark pl-11 w-full"
                      disabled={loading}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="input-dark pl-11 w-full"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input-dark pl-11 w-full"
                disabled={loading}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl font-semibold bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-white mt-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex justify-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </motion.button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="text-center mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="text-sm text-brand-300 hover:text-brand-200 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google sign-in */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
              boxShadow: "0 0 20px rgba(124,58,237,0.25)",
            }}
          >
            <Globe size={18} className="text-white" />
            <span>Continue with Google</span>
          </motion.button>

          {/* Alternative — About Us link */}
          <Link
            to="/about"
            className="w-full btn-ghost flex items-center justify-center gap-2 text-sm mt-4"
          >
            <Book size={16} />
            About Us
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
