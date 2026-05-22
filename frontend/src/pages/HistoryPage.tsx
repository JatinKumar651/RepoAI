import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  History, GitBranch, Trash2, ExternalLink, Search, ArrowRight, Clock,
} from "lucide-react";
import { historyApi } from "../api/client";
import toast from "react-hot-toast";

interface HistoryEntry {
  id: string;
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  repo_card: {
    project_type?: string;
    languages?: string[];
    frameworks?: string[];
    file_count?: number;
    total_tokens?: number;
  };
  token_metrics: { total_tokens?: number };
  created_at: string | null;
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["history"],
    queryFn: () => historyApi.list(50, 0).then((r) => r.data),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => historyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
      toast.success("Entry deleted");
    },
    onError: () => toast.error("Failed to delete entry"),
  });

  const entries: HistoryEntry[] = data?.entries ?? [];

  const filtered = entries.filter(
    (e) =>
      e.repo_owner.toLowerCase().includes(search.toLowerCase()) ||
      e.repo_name.toLowerCase().includes(search.toLowerCase()) ||
      e.repo_url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="badge mb-2">
              <History size={11} /> Analysis History
            </div>
            <h1 className="font-display font-bold text-3xl text-white">
              Your <span className="gradient-text">Past Analyses</span>
            </h1>
            <p className="text-white/50 mt-1 text-sm">
              {data?.total ?? 0} analyses stored in Supabase
            </p>
          </div>
          <Link to="/analyze" className="btn-primary flex items-center gap-2 text-sm">
            <Search size={15} />
            New Analysis
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by owner, repo name…"
            className="input-dark pl-11"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex gap-2 py-20 justify-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="glass rounded-2xl p-8 text-center border border-red-500/20">
            <p className="text-red-400">Failed to load history. Check your connection and try again.</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="glass rounded-2xl p-16 text-center">
            <History size={48} className="text-white/10 mx-auto mb-4" />
            {search ? (
              <>
                <h3 className="font-semibold text-white/50 mb-2">No matches found</h3>
                <p className="text-white/30 text-sm">Try a different search term</p>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-white/50 mb-2">No analyses yet</h3>
                <p className="text-white/30 text-sm mb-6">
                  Run your first analysis and it will appear here
                </p>
                <Link to="/analyze" className="btn-primary inline-flex items-center gap-2 text-sm">
                  <Search size={14} /> Start Analyzing
                </Link>
              </>
            )}
          </div>
        )}

        {/* Grid */}
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="glass-hover rounded-2xl p-5 flex flex-col gap-4 group"
              >
                {/* Repo header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-800 to-brand-600 flex items-center justify-center shrink-0">
                    <GitBranch size={18} className="text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">
                      {entry.repo_owner}/{entry.repo_name}
                    </div>
                    <div className="text-xs text-white/40 truncate">{entry.repo_url}</div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {entry.repo_card?.project_type && (
                    <span className="badge">{entry.repo_card.project_type}</span>
                  )}
                  {entry.repo_card?.languages?.slice(0, 2).map((l) => (
                    <span key={l} className="badge badge-cyan">{l}</span>
                  ))}
                  {entry.token_metrics?.total_tokens && (
                    <span className="badge badge-green">
                      {entry.token_metrics.total_tokens.toLocaleString()} tokens
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-white/30">
                  <Clock size={11} />
                  {entry.created_at
                    ? new Date(entry.created_at).toLocaleString()
                    : "Unknown date"}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Link
                    to={`/results/${entry.id}`}
                    className="flex-1 btn-ghost flex items-center justify-center gap-1.5 text-xs py-2"
                  >
                    View Results <ArrowRight size={12} />
                  </Link>
                  <a
                    href={entry.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-400/05 text-white/40 hover:text-cyan-300 transition-all duration-200"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => deleteMutation.mutate(entry.id)}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-2 rounded-xl border border-white/10 hover:border-red-500/40 hover:bg-red-500/05 text-white/40 hover:text-red-400 transition-all duration-200"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
