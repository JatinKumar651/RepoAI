import { motion } from "framer-motion";
import { Settings, User, Mail, Shield, LogOut, Moon, ExternalLink } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../api/client";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function SettingRow({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value?: string | null;
  icon: React.ElementType<any>;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-white/06 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-white/05 flex items-center justify-center shrink-0">
        {(() => { const IconComp = Icon as any; return <IconComp size={18} className="text-brand-400" />; })()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/40">{label}</div>
        <div className="text-sm text-white font-medium truncate">{value ?? "—"}</div>
        {sub && <div className="text-[10px] text-white/30 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl"
      >
        {/* Header */}
        <div className="mb-10">
          <div className="badge mb-2">
            <Settings size={11} /> Settings
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Account Settings</h1>
        </div>

        {/* Profile card */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl border-2 border-brand-400/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-cyan-500 flex items-center justify-center text-2xl font-bold">
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div>
              <div className="font-display font-bold text-xl text-white">
                {user?.full_name ?? "Unknown User"}
              </div>
              <div className="badge mt-1">
                <Shield size={10} /> {user?.provider ?? "google"} account
              </div>
            </div>
          </div>

          <SettingRow icon={User} label="Full Name" value={user?.full_name} />
          <SettingRow icon={Mail} label="Email" value={user?.email} />
          <SettingRow
            icon={Shield}
            label="User ID"
            value={user?.id}
            sub="Supabase auth UID"
          />
          <SettingRow
            icon={Moon}
            label="Provider"
            value={user?.provider}
            sub="OAuth provider"
          />
        </div>

        {/* Backend info */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-white mb-4">Connected Services</h3>
          <div className="space-y-3">
            {[
              { name: "FastAPI Backend", url: "http://localhost:8000", status: "Running" },
            ].map(({ name, url, status }) => (
              <div key={name} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-white">{name}</div>
                  <div className="text-xs text-white/30">{url}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="badge badge-green text-[10px]">{status}</div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg hover:bg-white/05 text-white/40 hover:text-white transition-colors"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="glass rounded-2xl p-6 border border-red-500/15">
          <h3 className="font-semibold text-white mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Sign out of RepoAI</div>
              <div className="text-xs text-white/30 mt-0.5">
                Clears your local session. History remains in Supabase.
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
            >
              <LogOut size={14} />
              Sign Out
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
