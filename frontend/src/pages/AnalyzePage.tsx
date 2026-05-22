import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, GitBranch, Zap, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { analyzeApi, historyApi } from "../api/client";
import toast from "react-hot-toast";

const PIPELINE_STEPS = [
  "Fetching repository tree…",
  "Filtering directories…",
  "Downloading file contents…",
  "Analyzing tokens…",
  "Building repo card…",
  "Generating AI prompt…",
];

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isValidUrl = /^https?:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/.test(url.trim());

  const handleAnalyze = async () => {
    if (!isValidUrl) {
      toast.error("Please enter a valid GitHub repository URL");
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate step-by-step progress display
    let stepInterval: ReturnType<typeof setInterval>;
    let step = 0;
    setCurrentStep(0);
    stepInterval = setInterval(() => {
      step++;
      if (step < PIPELINE_STEPS.length - 1) {
        setCurrentStep(step);
      }
    }, 3000);

    try {
      const { data } = await analyzeApi.analyzeRepo(url.trim());
      clearInterval(stepInterval);
      setCurrentStep(PIPELINE_STEPS.length - 1);

      // ── Save to Supabase history ──
      try {
        const saved = await historyApi.save({
          repo_url: data.repo_card.repo_url ?? url.trim(),
          repo_card: data.repo_card,
          directory_tree: data.directory_tree,
          token_metrics: data.token_metrics,
          generated_prompt: data.generated_prompt,
        });
        toast.success("Analysis complete! Saved to history.");
        setTimeout(() => navigate(`/results/${saved.data.id}`), 800);
      } catch {
        // Save failed — navigate with state instead
        toast.success("Analysis complete!");
        setTimeout(
          () =>
            navigate("/results/new", {
              state: { result: data, fromUrl: url.trim() },
            }),
          800
        );
      }
    } catch (err: unknown) {
      clearInterval(stepInterval);
      setCurrentStep(-1);
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Analysis failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="mb-10">
          <div className="badge mb-3">
            <Search size={11} /> Analyzer
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white mb-3">
            Analyze a <span className="gradient-text">Repository</span>
          </h1>
          <p className="text-white/50">
            Enter any public GitHub URL. The 6-node LangGraph pipeline will process
            it and generate a complete AI-ready analysis.
          </p>
        </div>

        {/* Input */}
        <div className="glass rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-white/70 mb-3">
            GitHub Repository URL
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <GitBranch
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
                placeholder="https://github.com/owner/repo"
                className="input-dark pl-11"
                disabled={loading}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAnalyze}
              disabled={loading || !url.trim()}
              className="btn-primary flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              ) : (
                <>
                  <Zap size={16} />
                  Analyze
                </>
              )}
            </motion.button>
          </div>

          {url && !isValidUrl && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              <AlertCircle size={11} />
              Must be a valid GitHub URL like https://github.com/owner/repo
            </p>
          )}
        </div>

        {/* Pipeline progress */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-2xl p-6 mb-6 overflow-hidden"
            >
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                Pipeline Running…
              </h3>
              <div className="space-y-3">
                {PIPELINE_STEPS.map((step, i) => {
                  const isDone = i < currentStep;
                  const isActive = i === currentStep;
                  return (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                        isDone
                          ? "text-neon"
                          : isActive
                          ? "text-white"
                          : "text-white/25"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 size={16} className="shrink-0" />
                      ) : isActive ? (
                        <div className="w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                      )}
                      {step}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl p-4 border border-red-500/30 mb-6"
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-red-300 mb-1">Analysis Failed</div>
                  <div className="text-xs text-red-400/70">{error}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Example repos */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-medium text-white/60 mb-3">Try an example</h3>
          <div className="flex flex-wrap gap-2">
            {[
              "https://github.com/tiangolo/fastapi",
              "https://github.com/facebook/react",
              "https://github.com/vercel/next.js",
            ].map((example) => (
              <button
                key={example}
                onClick={() => setUrl(example)}
                disabled={loading}
                className="text-xs py-1.5 px-3 rounded-lg bg-white/05 border border-white/10 text-white/50 hover:text-white hover:border-brand-400/40 hover:bg-brand-400/10 transition-all duration-200 flex items-center gap-1.5"
              >
                <GitBranch size={10} />
                {example.replace("https://github.com/", "")}
                <ArrowRight size={10} />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
