import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Book, Zap, Shield, Code2, GitBranch, Star, Users, Clock } from "lucide-react";
import HeroCanvas from "../components/3d/HeroCanvas";

const FEATURES = [
  {
    icon: Zap,
    title: "AI-Powered Analysis",
    desc: "LangGraph pipeline processes your repo through 6 intelligent nodes — tree fetch, filter, download, tokenize, summarize, generate.",
    color: "from-brand-400 to-purple-400",
    glow: "group-hover:shadow-glow-violet",
  },
  {
    icon: Code2,
    title: "Prompt Generation",
    desc: "Outputs a rich Cursor/Antigravity-ready rebuild prompt with full context about your stack, frameworks, and architecture.",
    color: "from-cyan-400 to-blue-400",
    glow: "group-hover:shadow-glow-cyan",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Google OAuth via Supabase. Your GitHub token stays server-side. Analysis history stored privately in your Supabase account.",
    color: "from-neon to-emerald-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]",
  },
  {
    icon: GitBranch,
    title: "Smart Filtering",
    desc: "Intelligently skips node_modules, .git, dist and other bloated directories. Focuses on the code that matters.",
    color: "from-orange-400 to-rose-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]",
  },
];

const STATS = [
  { icon: Star, value: "6-Node", label: "LangGraph Pipeline" },
  { icon: Zap, value: "<30s", label: "Average Analysis Time" },
  { icon: Users, value: "Groq", label: "LLM Backend" },
  { icon: Clock, value: "100%", label: "Private History" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const canvasOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -150]);

  return (
    <div className="page-wrapper bg-space overflow-x-hidden">
      {/* ── Hero Section ── */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Canvas */}
        <motion.div style={{ opacity: canvasOpacity }} className="absolute inset-0 z-0">
          <HeroCanvas className="w-full h-full" />
        </motion.div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 z-1 bg-gradient-radial from-transparent via-space/50 to-space" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-space to-transparent z-1" />

        {/* Hero content */}
        <motion.div
          style={{ y: heroY }}
          className="relative z-10 text-center max-w-5xl mx-auto px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full glass border border-brand-400/30"
          >
            <div className="glow-dot" />
            <span className="text-sm text-brand-300 font-medium">Powered by LangGraph + Groq AI</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="section-heading text-5xl md:text-7xl lg:text-8xl mb-6 leading-[1.1]"
          >
            <span className="text-white">Understand Any</span>
            <br />
            <span className="gradient-text">GitHub Repo</span>
            <br />
            <span className="text-white/80 text-4xl md:text-5xl lg:text-6xl">In Seconds</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Drop a GitHub URL. Get a complete AI analysis — repo card, directory tree, token
            metrics, and a Cursor/Antigravity-ready rebuild prompt.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/login" className="btn-primary flex items-center gap-2 text-base">
              Start Analyzing
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/about"
              className="btn-ghost flex items-center gap-2 text-base"
            >
              <Book size={18} />
              About Us
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        >
          <span className="text-xs text-white/30">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1"
          >
            <div className="w-1 h-2 rounded-full bg-brand-400" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(({ icon: Icon, value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center gradient-border"
              >
                <Icon size={24} className="text-brand-400 mx-auto mb-3" />
                <div className="text-2xl font-display font-bold gradient-text">{value}</div>
                <div className="text-xs text-white/50 mt-1">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants} className="badge mb-4 mx-auto">
              <Zap size={12} /> Features
            </motion.div>
            <motion.h2 variants={itemVariants} className="section-heading text-4xl md:text-5xl mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Decode Any Repo</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="text-white/50 text-lg max-w-2xl mx-auto">
              A 6-step intelligent pipeline turns raw GitHub data into structured, actionable AI prompts.
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {FEATURES.map(({ icon: Icon, title, desc, color, glow }) => (
              <motion.div
                key={title}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className={`glass-hover rounded-2xl p-8 group ${glow} transition-shadow duration-300`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${color} mb-5 shadow-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3 text-white">{title}</h3>
                <p className="text-white/50 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pipeline visualization ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-glow-violet opacity-40" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="section-heading text-4xl mb-4">
              The <span className="gradient-text">6-Step Pipeline</span>
            </h2>
            <p className="text-white/50">LangGraph orchestrates every step with error recovery</p>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-brand-400/80 via-cyan-500/60 to-brand-400/20 hidden md:block" />

            {[
              { n: 1, name: "Tree Fetcher", desc: "Fetches repo tree via GitHub Git Trees API" },
              { n: 2, name: "Tree Filter", desc: "Removes bloated directories, identifies whitelisted files" },
              { n: 3, name: "Content Downloader", desc: "Concurrently downloads whitelisted file contents" },
              { n: 4, name: "Token Analyzer", desc: "Counts tokens with tiktoken, truncates to fit context" },
              { n: 5, name: "Repo Card Builder", desc: "Extracts stack, frameworks, languages, build tools" },
              { n: 6, name: "Prompt Generator", desc: "Generates Cursor/Antigravity-ready rebuild prompt via Groq" },
            ].map(({ n, name, desc }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-6 mb-6"
              >
                <div className="relative z-10 w-16 h-16 rounded-2xl glass border border-brand-400/30 flex items-center justify-center shrink-0 text-brand-400 font-display font-bold text-lg">
                  {n}
                </div>
                <div className="glass rounded-2xl p-5 flex-1">
                  <div className="font-semibold text-white mb-1">{name}</div>
                  <div className="text-sm text-white/50">{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-brand-400/10 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto"
        >
          <h2 className="section-heading text-4xl md:text-5xl mb-6">
            Ready to Analyze Your First{" "}
            <span className="gradient-text">Repository?</span>
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Sign in with Google and paste any public GitHub URL to get started instantly.
          </p>
          <Link to="/login" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
            Get Started Free
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-white/30 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GitBranch size={16} className="text-brand-400" />
          <span className="font-display font-semibold text-white/50">RepoAI</span>
        </div>
        <p>Powered by FastAPI · LangGraph · Groq · Supabase · React Three Fiber</p>
      </footer>
    </div>
  );
}
