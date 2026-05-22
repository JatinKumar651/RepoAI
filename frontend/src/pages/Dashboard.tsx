import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, History, ArrowRight, GitBranch, Zap, Clock, Code2, Users } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useQuery } from "@tanstack/react-query";
import { historyApi } from "../api/client";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: historyData } = useQuery({
    queryKey: ["history"],
    queryFn: () => historyApi.list(5, 0).then((r) => r.data),
    staleTime: 30_000,
  });

  const recentEntries = historyData?.entries ?? [];

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">

        {/* ── Header ── */}
        <motion.div variants={itemVariants} className="mb-10">
          <p className="text-white/40 text-sm mb-1">{timeOfDay()},</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">
            {user?.full_name ?? user?.email?.split("@")[0] ?? "Explorer"} 👋
          </h1>
          <p className="text-white/50 mt-2">
            Ready to decode a repository? Let's analyze some code.
          </p>
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Link
            to="/analyze"
            className="glass-hover rounded-2xl p-6 flex flex-col gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center shadow-glow-violet">
              <Search size={22} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-white mb-1 group-hover:text-brand-300 transition-colors">
                Analyze Repo
              </div>
              <div className="text-sm text-white/40">
                Drop a GitHub URL and run the full AI pipeline
              </div>
            </div>
            <div className="flex items-center gap-1 text-brand-400 text-sm font-medium mt-auto">
              Start now <ArrowRight size={14} />
            </div>
          </Link>

          <Link
            to="/history"
            className="glass-hover rounded-2xl p-6 flex flex-col gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-glow-cyan">
              <History size={22} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                View History
              </div>
              <div className="text-sm text-white/40">
                Browse your past analyses stored in Supabase
              </div>
            </div>
            <div className="flex items-center gap-1 text-cyan-400 text-sm font-medium mt-auto">
              {recentEntries.length} analyses <ArrowRight size={14} />
            </div>
          </Link>

          <Link
            to="/about"
            className="glass-hover rounded-2xl p-6 flex flex-col gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon to-emerald-600 flex items-center justify-center">
              <Users size={22} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-white mb-1 group-hover:text-neon transition-colors">
                About Us
              </div>
              <div className="text-sm text-white/40">
                Learn more about RepoAI and our mission
              </div>
            </div>
            <div className="flex items-center gap-1 text-neon text-sm font-medium mt-auto">
              Read more <ArrowRight size={14} />
            </div>
          </Link>
        </motion.div>

        {/* ── Pipeline Stats ── */}
        <motion.div variants={itemVariants} className="glass rounded-2xl p-6 mb-10">
          <h2 className="font-display font-semibold text-lg text-white mb-6">Pipeline Architecture</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: GitBranch, label: "Tree Fetcher", color: "badge" },
              { icon: Zap, label: "Tree Filter", color: "badge-cyan" },
              { icon: Clock, label: "Downloader", color: "badge" },
              { icon: Code2, label: "Token Analyzer", color: "badge-green" },
              { icon: Zap, label: "Card Builder", color: "badge-cyan" },
              { icon: GitBranch, label: "Prompt Gen", color: "badge" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className={`badge ${color} gap-1.5`}>
                <Icon size={11} />
                {label}
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 bg-white/05 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #7c3aed, #06b6d4, #10b981)" }}
            />
          </div>
        </motion.div>

        {/* ── Recent History ── */}
        {recentEntries.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg text-white">Recent Analyses</h2>
              <Link to="/history" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                See all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {recentEntries.map((entry: any) => (
                <Link
                  key={entry.id}
                  to={`/results/${entry.id}`}
                  className="glass-hover rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-800 to-brand-700 flex items-center justify-center shrink-0">
                    <GitBranch size={18} className="text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">
                      {entry.repo_owner}/{entry.repo_name}
                    </div>
                    <div className="text-xs text-white/40 truncate">{entry.repo_url}</div>
                  </div>
                  <div className="text-xs text-white/30 shrink-0">
                    {entry.created_at
                      ? new Date(entry.created_at).toLocaleDateString()
                      : "—"}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {recentEntries.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="glass rounded-2xl p-12 text-center"
          >
            <GitBranch size={40} className="text-white/20 mx-auto mb-4" />
            <h3 className="font-semibold text-white/60 mb-2">No analyses yet</h3>
            <p className="text-white/30 text-sm mb-6">Analyze your first repository to see results here</p>
            <Link to="/analyze" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Search size={15} />
              Start Analyzing
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
