import { motion } from "framer-motion";
import { ArrowLeft, GitBranch, Shield, Zap, Code2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ParticleField from "../components/3d/ParticleField";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-space p-6">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <ParticleField />
      </div>

      <button 
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Go Back</span>
      </button>

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl glass rounded-3xl p-8 md:p-12 gradient-border"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-cyan-500 mb-6 shadow-glow-violet">
            <GitBranch size={32} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
            About <span className="gradient-text">RepoAI</span>
          </h1>
          <p className="text-white/60 text-lg">
            Decoding complex codebases with the power of artificial intelligence.
          </p>
        </div>

        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
              <Zap className="text-brand-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Our Mission</h3>
              <p className="text-white/50 leading-relaxed">
                We built RepoAI to eliminate the friction of understanding massive, undocumented repositories. By feeding GitHub repositories directly into advanced LLMs, we generate perfect architectural blueprints and ready-to-use coding prompts in seconds.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
              <Shield className="text-cyan-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Privacy First</h3>
              <p className="text-white/50 leading-relaxed">
                Your code is your business. We never train our models on your private code, and we strictly use your GitHub tokens entirely locally to fetch repositories securely.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <Code2 className="text-green-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Built for Engineers</h3>
              <p className="text-white/50 leading-relaxed">
                Designed to act as a bridge between human developers and AI assistants like Cursor, RepoAI intelligently truncates, maps, and analyzes your stack so you can get straight to building.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} RepoAI. Built for developers, by developers.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
