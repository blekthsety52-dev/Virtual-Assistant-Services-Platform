/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ServiceCatalogView from "./components/ServiceCatalogView";
import AgentDirectoryView from "./components/AgentDirectoryView";
import AgentProfileView from "./components/AgentProfileView";
import RequestPortalView from "./components/RequestPortalView";
import BookingListView from "./components/BookingListView";
import AdminDashboardView from "./components/AdminDashboardView";
import PlatformDocumentationView from "./components/PlatformDocumentationView";
import FAQView from "./components/FAQView";
import AgentComparisonView from "./components/AgentComparisonView";
import QuickHelpFAB from "./components/QuickHelpFAB";
import AIChatView from "./components/AIChatView";

import { Agent, ServiceOffering, Booking } from "./types";
import { Sparkles, ShieldCheck, CheckCircle2, TrendingUp, Users, Calendar, ArrowRight } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Secure Match session state
  const [activeMatchToken, setActiveMatchToken] = useState<string | null>(null);
  const [matchedAgentId, setMatchedAgentId] = useState<string | null>(null);
  const [matchedAgentName, setMatchedAgentName] = useState<string | null>(null);

  // Selected Agent detailed profile view state
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Fetch Services
      const resServ = await fetch("/api/services");
      if (resServ.ok) {
        const bodyS = await resServ.json();
        setServices(bodyS);
      }

      // 2. Fetch Agents
      const resAg = await fetch("/api/agents");
      if (resAg.ok) {
        const bodyA = await resAg.json();
        setAgents(bodyA);
      }

      // 3. Fetch Bookings
      const resBk = await fetch("/api/bookings");
      if (resBk.ok) {
        const bodyB = await resBk.json();
        setBookings(bodyB);
      }
    } catch (e) {
      console.error("Node service sync failed", e);
    }
  };

  // Inspect URL parameters on mount to capture secure match tokens
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      console.log("Secure Match Token detected in URL:", token);
      handleLoadSecureMatchByToken(token);
    }
  }, []);

  const handleLoadSecureMatchByToken = async (token: string) => {
    try {
      const response = await fetch(`/api/chats/${token}`);
      if (response.ok) {
        const data = await response.json();
        // Lookup which agent this falls under
        // Or fetch admin stats to find mapped logs
        const adminRes = await fetch("/api/admin/stats");
        if (adminRes.ok) {
          const statsData = await adminRes.json();
          const mappedRequest = statsData.logs.find((l: any) => l.directLinkToken === token);
          if (mappedRequest) {
            const agent = statsData.agents.find((a: any) => a.id === mappedRequest.matchedAgentId);
            if (agent) {
              setActiveMatchToken(token);
              setMatchedAgentName(agent.name);
              setMatchedAgentId(agent.id);
              setSelectedAgentId(agent.id);
              setCurrentTab("agents"); // Redirect instantly to agent workspace!
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load secure matched gateway token rules", error);
    }
  };

  const handleActivateMatch = (token: string, agentName: string, agentId: string) => {
    setActiveMatchToken(token);
    setMatchedAgentName(agentName);
    setMatchedAgentId(agentId);
    setSelectedAgentId(agentId);
    setCurrentTab("agents"); // Redirect instantly to direct messaging and profile!
  };

  const handleClearMatchToken = () => {
    setActiveMatchToken(null);
    setMatchedAgentName(null);
    setMatchedAgentId(null);
    setSelectedAgentId(null);
    setCurrentTab("home");
    // Clear URL parameters
    window.history.pushState({}, document.title, window.location.pathname);
  };

  const handleBookingSuccess = (newBooking: Booking) => {
    setBookings(prev => [...prev, newBooking]);
    fetchInitialData(); // Refresh capacities and sync agent workloads!
  };

  // Comparison selection states
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [initialProfileTab, setInitialProfileTab] = useState<"about" | "booking" | "chat" | "collaboration">("about");

  const handleAddToCompare = (id: string) => {
    setSelectedCompareIds(prev => {
      if (prev.includes(id)) return prev;
      if (prev.length >= 3) {
        alert("You can compare up to 3 virtual assistants side-by-side. Please remove one before adding more.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleRemoveFromCompare = (id: string) => {
    setSelectedCompareIds(prev => prev.filter(item => item !== id));
  };

  const handleOpenBookingForAgentFromCompare = (agentId: string) => {
    setInitialProfileTab("booking");
    setSelectedAgentId(agentId);
    setCurrentTab("agents");
  };

  const handleNavigateToAgent = (agentId: string) => {
    setInitialProfileTab("about");
    setSelectedAgentId(agentId);
    setCurrentTab("agents");
  };

  const activeAgent = selectedAgentId ? agents.find(a => a.id === selectedAgentId) : null;

  return (
    <div className="min-h-screen bg-[#0A0C10] flex flex-col font-sans transition-colors duration-200 text-slate-300">
      
      {/* Header bar component */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== "agents") {
            // Keep active locked agent but clear individual details profile triggers
            setSelectedAgentId(null);
            setInitialProfileTab("about");
          } else if (activeMatchToken && matchedAgentId) {
            setSelectedAgentId(matchedAgentId);
          }
        }}
        activeMatchToken={activeMatchToken}
        matchedAgentName={matchedAgentName}
        clearMatchToken={handleClearMatchToken}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        
        {/* TAB 1: OVERVIEW HOME PAGE */}
        {currentTab === "home" && (
          <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Elegant Hero showcasing platform details */}
            <div className="relative rounded-3xl bg-slate-900/80 text-white overflow-hidden p-8 sm:p-12 mb-16 border border-slate-800">
              <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="max-w-xl position-relative z-10">
                <span className="text-blue-400 font-display text-xs uppercase tracking-widest font-bold bg-blue-500/10 px-3 py-1 rounded-full inline-block mb-4 leading-normal">
                  ★ Elite Virtual Assistants for Teams
                </span>
                <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6 text-white text-balance">
                  High-Trust Virtual Assistant Allocation
                </h1>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-8">
                  Vesta links growing corporate startup founders with elite, capacity-verified human assistants. Gated by modern AI request matching models for unyielding competencies.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setCurrentTab("matching")}
                    className="bg-blue-600 hover:bg-blue-500 font-display font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition duration-205 text-white shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
                  >
                    <span>Match with AI Assistant</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentTab("services")}
                    className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-350 font-display font-medium text-xs sm:text-sm px-6 py-3.5 rounded-xl transition"
                  >
                    Service Catalog
                  </button>
                </div>
              </div>
            </div>

            {/* Quick platform highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 font-bold w-12 h-12 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">95%+ Match Accuracy</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our server-side Gemini 3.5 Assistant scans requirements, transcribes local dictations, parses tags, and matches vetted experts.
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 font-bold w-12 h-12 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">Secure Workspace Gating</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Each match transaction secures an active client link. This shields your logs, activates direct hire gateways, and unlocks live chats.
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold w-12 h-12 flex items-center justify-center mb-4">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">Real Booking Schedulers</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Avoid back-and-forth coordinate swaps. Reserve schedules, view active calendars, and map introductory agreements immediately.
                </p>
              </div>
            </div>

            {/* Micro-directory highlights summary */}
            <div className="bg-slate-900/20 border border-slate-800 rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-display font-medium text-lg text-white leading-none">Featured Strategic Partners</h3>
                  <p className="text-xs text-slate-500 mt-1">Accepting active bookings and gated allocations on capacity.</p>
                </div>
                <button
                  onClick={() => setCurrentTab("agents")}
                  className="text-xs font-semibold text-blue-400 hover:text-white font-mono tracking-wider uppercase transition-colors"
                >
                  View team directory →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {agents.slice(0, 4).map((a) => (
                  <div key={a.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-center hover:border-slate-700 transition">
                    <img src={a.avatar} alt={a.name} className="w-12 h-12 rounded-xl object-cover border border-slate-800 mx-auto mb-2.5" />
                    <span className="text-xs font-semibold text-white block truncate">{a.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block truncate mb-3">{a.title}</span>
                    <button
                      onClick={() => handleNavigateToAgent(a.id)}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-800 select-none text-blue-400 hover:text-white rounded px-2.5 py-1.5 font-bold transition-all"
                    >
                      View profile
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SERVICE CATALOG VIEW */}
        {currentTab === "services" && (
          <ServiceCatalogView
            services={services}
            agents={agents}
            onSelectAgent={handleNavigateToAgent}
            onOpenMatcher={() => setCurrentTab("matching")}
          />
        )}

        {/* TAB 3: AGENTS DIRECTORY VIEW OR DETAILED PROFILE VIEW */}
        {currentTab === "agents" && (
          activeAgent ? (
            <AgentProfileView
              agent={activeAgent}
              activeMatchToken={activeMatchToken}
              onGoBack={() => {
                setSelectedAgentId(null);
                setInitialProfileTab("about");
              }}
              onBookingSuccess={handleBookingSuccess}
              initialTab={initialProfileTab}
            />
          ) : (
            <AgentDirectoryView
              agents={agents}
              onSelectAgent={handleNavigateToAgent}
              onOpenMatcher={() => setCurrentTab("matching")}
              selectedCompareIds={selectedCompareIds}
              onAddToCompare={handleAddToCompare}
              onRemoveFromCompare={handleRemoveFromCompare}
              onNavigateToCompare={() => setCurrentTab("compare")}
            />
          )
        )}

        {/* TAB 3.5: AGENT COOPERATIVE SIDE BY SIDE COMPARE VIEW */}
        {currentTab === "compare" && (
          <AgentComparisonView
            agents={agents}
            selectedCompareIds={selectedCompareIds}
            onAddToCompare={handleAddToCompare}
            onRemoveFromCompare={handleRemoveFromCompare}
            onSelectAgent={handleNavigateToAgent}
            onOpenBooking={handleOpenBookingForAgentFromCompare}
          />
        )}

        {/* TAB 4: INTENSIVE MATCH MATCHMAKING PORTAL */}
        {currentTab === "matching" && (
          <RequestPortalView onActivateMatch={handleActivateMatch} />
        )}

        {/* TAB 4.5: ACTIVE MULTI-TURN AI CONCIERGE CHATBOT */}
        {currentTab === "ai-chat" && (
          <div className="py-10 px-4 sm:px-6 lg:px-8">
            <AIChatView />
          </div>
        )}

        {/* TAB 5: BOOKINGS LIST CODES */}
        {currentTab === "bookings" && (
          <BookingListView bookings={bookings} />
        )}

        {/* TAB 6: ADMIN CONSOLE SETTINGS */}
        {currentTab === "admin" && (
          <AdminDashboardView
            agents={agents}
            services={services}
            onRefreshData={fetchInitialData}
          />
        )}

        {/* TAB 7: DETAILED SYSTEM KNOWLEDGE HUB DOCUMENTATION */}
        {currentTab === "documentation" && (
          <PlatformDocumentationView />
        )}

        {/* TAB 8: VESTA COMPREHENSIVE FAQ SYSTEM */}
        {currentTab === "faq" && (
          <FAQView />
        )}

      </main>

      {/* Footer component */}
      <footer className="bg-[#0A0C10] border-t border-slate-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-display font-medium text-white text-sm">
            <span>VESTA AI-MATCHED VA AGENTS SYSTEM</span>
          </div>
          <p>© 2026 Vesta Technologies. All rights reserved. Vetted competencies verified.</p>
        </div>
      </footer>

      {/* Quick Help floating action button */}
      <QuickHelpFAB onRedirectToFAQ={() => setCurrentTab("faq")} />
    </div>
  );
}

