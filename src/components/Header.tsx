import React from "react";
import { Sparkles, ShieldCheck, UserCheck, HelpCircle, Activity } from "lucide-react";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeMatchToken: string | null;
  matchedAgentName: string | null;
  clearMatchToken: () => void;
}

export default function Header({
  currentTab,
  setCurrentTab,
  activeMatchToken,
  matchedAgentName,
  clearMatchToken
}: HeaderProps) {
  const navItems = [
    { id: "home", label: "Overview" },
    { id: "services", label: "Service Catalog" },
    { id: "agents", label: "Agent Directory" },
    { id: "compare", label: "Agent Comparison" },
    { id: "matching", label: "AI Matching Portal" },
    { id: "ai-chat", label: "AI Concierge Chat" },
    { id: "bookings", label: "Client Bookings" },
    { id: "faq", label: "FAQ Help Center" },
    { id: "admin", label: "Admin Console" },
    { id: "documentation", label: "Documentation Hub" }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0A0C10]/80 backdrop-blur-md border-b border-slate-800">
      {/* Alert bar for active secure client session */}
      {activeMatchToken && matchedAgentName && (
        <div className="bg-blue-950/40 border-b border-blue-900/50 px-4 py-2.5 flex items-center justify-between text-xs text-blue-200 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span className="font-display font-semibold tracking-wide uppercase text-blue-400">SECURE WORKSPACE ENABLED:</span>
            <span>Matched to Assistant: <strong className="text-white">{matchedAgentName}</strong>. Standard rates apply. Access strictly private to you.</span>
          </div>
          <button
            onClick={() => {
              if (confirm("Disconnect secure consultation token and return to global view?")) {
                clearMatchToken();
              }
            }}
            className="underline hover:text-white transition-colors uppercase font-display font-bold tracking-wider"
          >
            Reset Client Gating
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab("home")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-450 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
              <span>V</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-display text-xl font-bold tracking-tight text-white font-sans uppercase">VESTA<span className="text-blue-400">.AI</span></span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-550/20 rounded px-1.5 py-0.5 font-bold leading-none uppercase">AI-Matched</span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-wide mt-1">Premium Virtual Assistants</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? "text-blue-400 bg-slate-800/40 border border-slate-700/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/50"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status Indicator / Mobile Toggle placeholder */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[11px] font-semibold text-slate-300">Vesta Node Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav rail */}
      <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 flex items-center justify-around py-2.5 px-2">
        {navItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
              currentTab === item.id ? "bg-slate-800 text-blue-400 border border-slate-705" : "text-slate-400"
            }`}
          >
            {item.label}
          </button>
        ))}
        {navItems.slice(4).map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`text-[10px] px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300 ${
              currentTab === item.id ? "border-blue-500 font-bold text-blue-400" : ""
            }`}
          >
            {item.id === "bookings" ? "Bookings" : item.id === "matching" ? "AI Match" : item.id === "ai-chat" ? "AI Chat" : item.id === "faq" ? "FAQ" : item.id === "admin" ? "Admin" : item.id === "compare" ? "Comparison" : "Docs"}
          </button>
        ))}
      </div>
    </header>
  );
}
