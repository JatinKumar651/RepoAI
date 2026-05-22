import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AnalyzePage = lazy(() => import("./pages/AnalyzePage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen bg-space flex items-center justify-center">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected app shell */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analyze" element={<AnalyzePage />} />
                <Route path="/results/:id" element={<ResultsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AnimatePresence>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "rgba(15,15,30,0.95)",
              color: "#fff",
              border: "1px solid rgba(124,58,237,0.3)",
              backdropFilter: "blur(12px)",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#030712" },
            },
            error: {
              iconTheme: { primary: "#f87171", secondary: "#030712" },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
