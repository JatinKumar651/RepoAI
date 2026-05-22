import { useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  GitBranch, Code2, Zap, Copy, Check, ChevronDown, ChevronRight,
  FolderTree, ArrowLeft, ExternalLink,
} from "lucide-react";
import { historyApi } from "../api/client";
import toast from "react-hot-toast";

interface RepoCard {
  owner: string;
  repo: string;
  repo_url: string;
  default_branch: string;
  project_type: string;
  frameworks: string[];
  languages: string[];
  dependencies: Record<string, string[]>;
  build_tools: string[];
  directory_summary: string;
  file_count: number;
  total_dirs: number;
}

interface TokenMetrics {
  per_file: Record<string, number>;
  total_tokens: number;
  truncated_files: string[];
}

interface AnalysisResult {
  repo_card: RepoCard;
  directory_tree: string[];
  whitelisted_files: Record<string, string>;
  token_metrics: TokenMetrics;
  generated_prompt: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/05 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-all duration-200 border border-white/10"
    >
      {copied ? <Check size={12} className="text-neon" /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <div className="text-2xl font-display font-bold gradient-text">{value}</div>
      <div className="text-xs text-white/60 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-white/30 mt-0.5">{sub}</div>}
    </div>
  );
}

function DirectoryTree({ tree }: { tree: string[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/03 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FolderTree size={18} className="text-cyan-400" />
          <span className="font-semibold text-white">Directory Tree</span>
          <span className="badge badge-cyan">{tree.length} paths</span>
        </div>
        {open ? <ChevronDown size={16} className="text-white/40" /> : <ChevronRight size={16} className="text-white/40" />}
      </button>
      {open && (
        <div className="border-t border-white/08">
          <div className="code-block max-h-64 overflow-y-auto rounded-none border-0 text-xs">
            {tree.map((line, i) => (
              <div key={i} className="text-cyan-300/80 hover:text-white hover:bg-white/03 px-1 rounded transition-colors">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationResult: AnalysisResult | null = location.state?.result ?? null;

  const { data: historyEntry, isLoading } = useQuery({
    queryKey: ["history-entry", id],
    queryFn: () => historyApi.get(id!).then((r) => r.data),
    enabled: !!id && id !== "new",
  });

  const result: AnalysisResult | null = locationResult ?? (historyEntry as AnalysisResult | null);

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-screen">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl text-white/60 mb-4">Result not found</h2>
        <Link to="/history" className="btn-ghost text-sm inline-flex items-center gap-2">
          <ArrowLeft size={14} /> Back to History
        </Link>
      </div>
    );
  }

  const { repo_card, directory_tree, token_metrics, generated_prompt } = result;

  return (
    <div className="p-6 md:p-10 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link to="/history" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-4 transition-colors">
          <ArrowLeft size={14} /> Back to History
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-cyan-500 flex items-center justify-center">
                <GitBranch size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-white">
                  {repo_card.owner}/{repo_card.repo}
                </h1>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span>{repo_card.project_type}</span>
                  <span>·</span>
                  <span>{repo_card.default_branch}</span>
                </div>
              </div>
            </div>
          </div>
          <a href={repo_card.repo_url} target="_blank" rel="noreferrer" className="btn-ghost flex items-center gap-2 text-sm">
            <ExternalLink size={14} /> View on GitHub
          </a>
        </div>
      </motion.div>

      {/* Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <MetricCard label="Total Files" value={repo_card.file_count} />
        <MetricCard label="Directories" value={repo_card.total_dirs} />
        <MetricCard label="Total Tokens" value={token_metrics.total_tokens.toLocaleString()} />
        <MetricCard label="Truncated Files" value={token_metrics.truncated_files?.length ?? 0} sub="due to token limit" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Languages & Frameworks */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Code2 size={16} className="text-brand-400" /> Stack Detection
          </h2>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-white/40 mb-2">Languages</div>
              <div className="flex flex-wrap gap-2">
                {repo_card.languages?.map((l) => (
                  <span key={l} className="badge">{l}</span>
                ))}
                {!repo_card.languages?.length && <span className="text-white/30 text-sm">None detected</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-2">Frameworks</div>
              <div className="flex flex-wrap gap-2">
                {repo_card.frameworks?.map((f) => (
                  <span key={f} className="badge badge-cyan">{f}</span>
                ))}
                {!repo_card.frameworks?.length && <span className="text-white/30 text-sm">None detected</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-2">Build Tools</div>
              <div className="flex flex-wrap gap-2">
                {repo_card.build_tools?.map((b) => (
                  <span key={b} className="badge badge-green">{b}</span>
                ))}
                {!repo_card.build_tools?.length && <span className="text-white/30 text-sm">None detected</span>}
              </div>
            </div>
            {repo_card.directory_summary && (
              <div>
                <div className="text-xs text-white/40 mb-1">Summary</div>
                <p className="text-sm text-white/60">{repo_card.directory_summary}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Token metrics */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Zap size={16} className="text-cyan-400" /> Token Metrics
          </h2>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1 no-scrollbar">
            {Object.entries(token_metrics.per_file ?? {})
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 15)
              .map(([file, count]) => (
                <div key={file} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0 text-xs text-white/60 truncate">{file}</div>
                  <div className="shrink-0 text-xs font-mono text-brand-300">
                    {(count as number).toLocaleString()}
                  </div>
                  <div className="shrink-0 w-16 h-1 bg-white/05 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-400 to-cyan-500"
                      style={{
                        width: `${Math.min(100, ((count as number) / token_metrics.total_tokens) * 100 * 5)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      </div>

      {/* Directory Tree */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
        <DirectoryTree tree={directory_tree} />
      </motion.div>

      {/* Generated Prompt */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/08">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-brand-400" />
            <span className="font-semibold text-white">Generated AI Prompt</span>
            <span className="badge">Cursor / Antigravity Ready</span>
          </div>
          <CopyButton text={generated_prompt} />
        </div>
        <div className="code-block max-h-96 overflow-y-auto rounded-none border-0 text-xs text-white/80 whitespace-pre-wrap">
          {generated_prompt || "No prompt generated."}
        </div>
      </motion.div>
    </div>
  );
}
