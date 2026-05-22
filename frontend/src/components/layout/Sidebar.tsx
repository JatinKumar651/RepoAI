import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Zap,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { authApi } from "../../api/client";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/analyze",   icon: Search,          label: "Analyze"   },
  { to: "/history",   icon: History,         label: "History"   },
  { to: "/settings",  icon: Settings,        label: "Settings"  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      toast.success("Logged out");
      navigate("/");
    }
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col h-full glass border-r border-white/10 overflow-hidden shrink-0"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-cyan-500 shrink-0 shadow-glow-violet">
          <GitBranch size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-display font-bold text-base gradient-text whitespace-nowrap"
            >
              RepoAI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
              ${isActive
                ? "bg-brand-400/20 border border-brand-400/30 text-brand-300"
                : "text-white/50 hover:text-white hover:bg-white/05"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  className={`shrink-0 transition-colors ${isActive ? "text-brand-400" : "group-hover:text-white/80"}`}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User + Logout ── */}
      <div className="border-t border-white/10 p-3 space-y-2">
        <div className="flex items-center gap-3 px-2 py-1">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Avatar"
              className="w-8 h-8 rounded-full shrink-0 border border-brand-400/40"
            />
          ) : (
            <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-brand-400 to-cyan-500 flex items-center justify-center text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-white truncate">
                  {user?.full_name ?? "User"}
                </p>
                <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={18} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-brand-400/40 transition-all duration-200 z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ── Pro badge ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-r from-brand-800/60 to-cyan-900/40 border border-brand-400/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-300">AI Powered</span>
            </div>
            <p className="text-[10px] text-white/40">LangGraph · Groq · Supabase</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
