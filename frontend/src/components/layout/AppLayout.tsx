import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import Sidebar from "./Sidebar";
import ParticleField from "../3d/ParticleField";

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Background particle field */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
        <ParticleField />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
