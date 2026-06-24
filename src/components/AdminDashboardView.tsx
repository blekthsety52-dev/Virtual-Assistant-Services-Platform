import React, { useState, useEffect } from "react";
import { Agent, ClientRequestLog, PlatformStats, ServiceOffering } from "../types";
import { Activity, ShieldAlert, Cpu, Hammer, TrendingUp, AlertTriangle, ToggleLeft, ToggleRight, Settings, UserPlus, Sparkles, CheckCircle } from "lucide-react";

interface AdminDashboardViewProps {
  agents: Agent[];
  services: ServiceOffering[];
  onRefreshData: () => void;
}

export default function AdminDashboardView({
  agents,
  services,
  onRefreshData
}: AdminDashboardViewProps) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [logs, setLogs] = useState<ClientRequestLog[]>([]);
  const [isUpdatingAgentId, setIsUpdatingAgentId] = useState<string | null>(null);
  const [overridingLogId, setOverridingLogId] = useState<string | null>(null);

  // New assistant form states
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentTitle, setNewAgentTitle] = useState("");
  const [newAgentBio, setNewAgentBio] = useState("");
  const [newAgentExperience, setNewAgentExperience] = useState<"Intermediate" | "Senior" | "Executive Expert">("Senior");
  const [newAgentSkills, setNewAgentSkills] = useState("");
  const [newAgentSpecialties, setNewAgentSpecialties] = useState("");
  const [newAgentMaxCapacity, setNewAgentMaxCapacity] = useState(5);
  const [newAgentAvatar, setNewAgentAvatar] = useState("");
  const [newAgentTimeSlots, setNewAgentTimeSlots] = useState("09:00 AM, 11:00 AM, 01:30 PM, 04:00 PM");
  
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const presetAssistants = [
    {
      name: "Alex Rivera",
      title: "AI Specialist & Solutions Architect",
      bio: "Helping organizations streamline operations with custom AI workflows, prompt design patterns, and enterprise tools integration.",
      experienceLevel: "Executive Expert" as const,
      skills: "Prompt Engineering, Gemini API, Python, GPT-4, OpenAI, Zapier Integrations, LangChain",
      specialties: "Generative AI custom builds, API webhook automation, workflow streamlining",
      maxCapacity: 4,
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200",
      timeSlots: "09:00 AM, 10:30 AM, 02:00 PM, 04:30 PM"
    },
    {
      name: "Tanya Patel",
      title: "Bilingual Operations Coordinator",
      bio: "Frictionless multi-lingual customer experience operations manager with 4+ years of remote business process support. Expert in high retention strategy.",
      experienceLevel: "Senior" as const,
      skills: "Intercom, Zendesk, Customer Success, G-Suite, Spanish Translation, English Bilingual, Conflict Resolution",
      specialties: "Multi-lingual scaling, retention planning, ticket workflow setup",
      maxCapacity: 6,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200&h=200",
      timeSlots: "10:00 AM, 12:00 PM, 02:30 PM, 05:00 PM"
    },
    {
      name: "Liam O'Connor",
      title: "E-Commerce Growth Assistant",
      bio: "Dedicated Shopify virtual specialist. Focused on storefront listings audits, inventory management, Canva asset production, and CRM automation.",
      experienceLevel: "Intermediate" as const,
      skills: "Shopify, Canva, Inventory Management, Email Copywriting, Mailchimp, Klaviyo, Social Media Scheduling",
      specialties: "Shopify backend maintenance, retail visual templates, campaign execution",
      maxCapacity: 5,
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200&h=200",
      timeSlots: "08:00 AM, 11:00 AM, 01:00 PM, 03:30 PM"
    }
  ];

  const handleAutofillPreset = () => {
    const randomPreset = presetAssistants[Math.floor(Math.random() * presetAssistants.length)];
    setNewAgentName(randomPreset.name);
    setNewAgentTitle(randomPreset.title);
    setNewAgentBio(randomPreset.bio);
    setNewAgentExperience(randomPreset.experienceLevel);
    setNewAgentSkills(randomPreset.skills);
    setNewAgentSpecialties(randomPreset.specialties);
    setNewAgentMaxCapacity(randomPreset.maxCapacity);
    setNewAgentAvatar(randomPreset.avatar);
    setNewAgentTimeSlots(randomPreset.timeSlots);
    setFormError(null);
    setFormSuccess("Autofilled with a high-fidelity assistant preset! ✨");
    setTimeout(() => setFormSuccess(null), 3000);
  };

  const handleSubmitAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newAgentName.trim() || !newAgentTitle.trim() || !newAgentBio.trim()) {
      setFormError("Please fill out the name, professional title, and biography.");
      return;
    }

    setIsSubmittingForm(true);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAgentName.trim(),
          title: newAgentTitle.trim(),
          bio: newAgentBio.trim(),
          experienceLevel: newAgentExperience,
          skills: newAgentSkills.split(",").map(s => s.trim()).filter(Boolean),
          specialties: newAgentSpecialties.split(",").map(s => s.trim()).filter(Boolean),
          timeSlots: newAgentTimeSlots.split(",").map(s => s.trim()).filter(Boolean),
          maxCapacity: Number(newAgentMaxCapacity) || 5,
          avatar: newAgentAvatar.trim() || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormSuccess(`Successfully registered ${data.agent.name} as a new assistant!`);
        
        // Reset fields
        setNewAgentName("");
        setNewAgentTitle("");
        setNewAgentBio("");
        setNewAgentSkills("");
        setNewAgentSpecialties("");
        setNewAgentAvatar("");
        setNewAgentMaxCapacity(5);
        setNewAgentTimeSlots("09:00 AM, 11:00 AM, 01:30 PM, 04:00 PM");

        // Force reload parent list & admin stats
        onRefreshData();
        await fetchAdminData();
      } else {
        const errData = await response.json();
        setFormError(errData.error || "Failed to create new assistant.");
      }
    } catch (err) {
      console.error("Failed to submit assistant", err);
      setFormError("Network error. Could not connect to database.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setLogs(data.logs);
      }
    } catch (e) {
      console.error("Failed to load admin stats node", e);
    }
  };

  const handleUpdateAgentStatus = async (agentId: string, payload: Partial<Agent>) => {
    setIsUpdatingAgentId(agentId);
    try {
      const response = await fetch(`/api/agents/${agentId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        await fetchAdminData();
        onRefreshData();
      }
    } catch (err) {
      console.error("Capacity modification failed", err);
    } finally {
      setIsUpdatingAgentId(null);
    }
  };

  const handleManualOverride = async (logId: string, newAgentId: string) => {
    setOverridingLogId(logId);
    try {
      const response = await fetch("/api/admin/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, newAgentId })
      });
      if (response.ok) {
        await fetchAdminData();
        onRefreshData();
      }
    } catch (err) {
      console.error("Assignment override error", err);
    } finally {
      setOverridingLogId(null);
    }
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Intro Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-blue-400 uppercase tracking-widest text-xs font-bold font-mono block mb-1">Administrative Node</span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Agency Operations Console
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time control node to audit AI log extractions, alter capacities, and override matching assignments.
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-display font-medium py-2 px-4 rounded-lg transition"
        >
          Force Stats Sync
        </button>
      </div>

      {/* Global telemetry block */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Total AI Requests</span>
              <span className="font-display text-xl font-bold text-white">{stats.totalRequests} logs</span>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400 opacity-80" />
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Match Success SLA</span>
              <span className="font-display text-xl font-bold text-blue-400">{stats.matchSuccessRate}% accuracy</span>
            </div>
            <Cpu className="w-8 h-8 text-cyan-400 opacity-80" />
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Overall Utilisation</span>
              <span className="font-display text-xl font-bold text-white">{stats.agentUtilisation}% loaded</span>
            </div>
            <Activity className="w-8 h-8 text-purple-400 opacity-80" />
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Active Core Team</span>
              <span className="font-display text-xl font-bold text-white">{stats.activeAgentsCount} assistants</span>
            </div>
            <Hammer className="w-8 h-8 text-amber-500 opacity-80" />
          </div>
        </div>
      )}

      {/* Grid: Left column (Agent Capacity Control) / Right column (Audits Logs & Overrides) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core human assistants load gating */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Interactive registration form */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-display font-medium text-white text-sm">Add Virtual Assistant</h3>
              <button
                type="button"
                onClick={handleAutofillPreset}
                className="text-[10px] text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 transition"
                title="Autofill fields with high-quality presets"
              >
                <Sparkles className="w-3 h-3 text-blue-400" />
                Autofill Preset
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal mb-5">
              Register a new assistant profile directly into Vesta's active registry for live scheduling and matchmaking.
            </p>

            <form onSubmit={handleSubmitAssistant} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full bg-slate-950 border border-slate-800 outline-none px-3 py-2 text-xs text-slate-200 rounded-lg focus:border-blue-500/80 transition"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">Professional Title *</label>
                <input
                  type="text"
                  value={newAgentTitle}
                  onChange={(e) => setNewAgentTitle(e.target.value)}
                  placeholder="e.g. Operations & Automation Lead"
                  className="w-full bg-slate-950 border border-slate-800 outline-none px-3 py-2 text-xs text-slate-200 rounded-lg focus:border-blue-500/80 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">Experience Tier</label>
                  <select
                    value={newAgentExperience}
                    onChange={(e) => setNewAgentExperience(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 outline-none px-3 py-2 text-xs text-slate-200 rounded-lg focus:border-blue-500/80 transition cursor-pointer"
                  >
                    <option value="Intermediate">Intermediate</option>
                    <option value="Senior">Senior</option>
                    <option value="Executive Expert">Executive Expert</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">Max Workload</label>
                  <input
                    type="number"
                    value={newAgentMaxCapacity}
                    onChange={(e) => setNewAgentMaxCapacity(Number(e.target.value))}
                    min={1}
                    max={15}
                    className="w-full bg-slate-950 border border-slate-800 outline-none px-3 py-2 text-xs text-slate-200 rounded-lg focus:border-blue-500/80 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">Professional Biography *</label>
                <textarea
                  value={newAgentBio}
                  onChange={(e) => setNewAgentBio(e.target.value)}
                  placeholder="Summarize experience, client success indicators, and core specialties..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 outline-none px-3 py-2 text-xs text-slate-200 rounded-lg focus:border-blue-500/80 transition resize-none leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">Core Skills (comma separated)</label>
                <input
                  type="text"
                  value={newAgentSkills}
                  onChange={(e) => setNewAgentSkills(e.target.value)}
                  placeholder="e.g. Zendesk, CRM Management, Conflict Resolution"
                  className="w-full bg-slate-950 border border-slate-800 outline-none px-3 py-2 text-xs text-slate-200 rounded-lg focus:border-blue-500/80 transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">Specialties (comma separated)</label>
                <input
                  type="text"
                  value={newAgentSpecialties}
                  onChange={(e) => setNewAgentSpecialties(e.target.value)}
                  placeholder="e.g. High NPS ticket routing, SLA crisis management"
                  className="w-full bg-slate-950 border border-slate-800 outline-none px-3 py-2 text-xs text-slate-200 rounded-lg focus:border-blue-500/80 transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">Profile Photo / Avatar URL</label>
                <input
                  type="url"
                  value={newAgentAvatar}
                  onChange={(e) => setNewAgentAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-slate-950 border border-slate-800 outline-none px-3 py-2 text-xs text-slate-200 rounded-lg focus:border-blue-500/80 transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">Booking Time Slots (comma separated)</label>
                <input
                  type="text"
                  value={newAgentTimeSlots}
                  onChange={(e) => setNewAgentTimeSlots(e.target.value)}
                  placeholder="e.g. 09:00 AM, 11:00 AM, 02:00 PM"
                  className="w-full bg-slate-950 border border-slate-800 outline-none px-3 py-2 text-xs text-slate-200 rounded-lg focus:border-blue-500/80 transition"
                />
              </div>

              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] p-2.5 rounded-lg flex items-start gap-1.5 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] p-2.5 rounded-lg flex items-start gap-1.5 font-mono">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingForm}
                className="w-full bg-blue-600 hover:bg-blue-550 text-white font-display text-xs font-semibold py-2 px-4 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                {isSubmittingForm ? "Registering Assistant..." : "Add Assistant to Registry"}
              </button>
            </form>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
            <h3 className="font-display font-medium text-white text-sm mb-1.5">Core Capacity Controls</h3>
            <p className="text-[11px] text-slate-500 leading-normal mb-5">
              Instantly alter load indicators, state ceilings, and toggles. In-memory changes persist live.
            </p>

            <div className="space-y-5">
              {agents.map((agent) => {
                return (
                  <div key={agent.id} className="border-b border-slate-800 pb-4 last:border-b-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={agent.avatar} alt={agent.name} className="w-7 h-7 rounded-lg object-cover" />
                        <div>
                          <span className="text-xs font-semibold text-white block leading-none">{agent.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">{agent.id.toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Availability status click-toggle */}
                      <button
                        onClick={() => handleUpdateAgentStatus(agent.id, { isAvailable: !agent.isAvailable })}
                        disabled={isUpdatingAgentId === agent.id}
                        className="text-xs focus:outline-none transition-opacity"
                        title="Toggle accepting status"
                      >
                        {agent.isAvailable ? (
                          <span className="text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold leading-normal uppercase">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-[9px] text-rose-450 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-bold leading-normal uppercase">
                            PAUSED
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Numeric workload control details */}
                    <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-500 uppercase tracking-widest block mb-1">LOAD:</span>
                        <input
                          type="number"
                          value={agent.currentLoad}
                          min={0}
                          max={agent.maxCapacity}
                          onChange={(e) => handleUpdateAgentStatus(agent.id, { currentLoad: Number(e.target.value) })}
                          disabled={isUpdatingAgentId === agent.id}
                          className="w-full bg-slate-950 border border-slate-800 outline-none p-1 text-slate-200 rounded font-bold text-center focus:border-blue-550"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase tracking-widest block mb-1">CEILING:</span>
                        <input
                          type="number"
                          value={agent.maxCapacity}
                          min={1}
                          onChange={(e) => handleUpdateAgentStatus(agent.id, { maxCapacity: Number(e.target.value) })}
                          disabled={isUpdatingAgentId === agent.id}
                          className="w-full bg-slate-950 border border-slate-800 outline-none p-1 text-slate-200 rounded font-bold text-center focus:border-blue-550"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* NLP match outputs & override records logs */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
            <h3 className="font-display font-medium text-white text-sm mb-1.5">AI Matching Logs & Override Center</h3>
            <p className="text-[11px] text-slate-500 leading-normal mb-5">
              Inspect exactly how our modern NLP model interpreted customer statements, and reassign assistants if capacity shifts demand override.
            </p>

            {logs.length === 0 ? (
              <div className="text-center py-10 font-mono text-xs text-slate-500">
                AI matchmaking pipeline has zero transaction logs. Try matching some needs first.
              </div>
            ) : (
              <div className="space-y-4">
                {[...logs].reverse().map((log) => {
                  const currentAgent = agents.find(a => a.id === log.matchedAgentId);
                  const currentService = services.find(s => s.id === log.matchedServiceId);

                  return (
                    <div
                      key={log.id}
                      className="border border-slate-800 rounded-xl p-4 bg-slate-950/70 hover:bg-slate-900/40 transition"
                    >
                      {/* Log details bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-802 pb-2.5 mb-2.5 font-mono text-[10px]">
                        <span className="font-bold text-slate-400">ID: {log.id}</span>
                        <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          log.confidenceScore >= 0.8
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-550 mr-1 font-medium"
                        }`}>
                          NLP CONFIDENCE: {Math.round(log.confidenceScore * 100)}%
                        </span>
                      </div>

                      {/* Client raw query text */}
                      <div className="mb-3">
                        <span className="text-[9px] text-slate-550 font-mono uppercase block mb-0.5">Vocal/Text Client Query:</span>
                        <p className="text-xs text-slate-300 italic leading-relaxed">
                          "{log.queryText}"
                        </p>
                      </div>

                      {/* Matches stats details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-[11px]">
                        <div>
                          <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Service Match:</span>
                          <span className="font-semibold text-white block">{currentService ? currentService.name : log.matchedServiceId}</span>
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Skills Extracted:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {log.skillsExtracted.map((tag) => (
                              <span key={tag} className="bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-400 py-0.5 px-1.5 font-mono leading-none">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Manual Assignment Override Gating */}
                      <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                        <div className="flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
                          <span className="text-xs text-slate-350">Assigned Partner: <strong className="text-white">{currentAgent ? currentAgent.name : log.matchedAgentId}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-mono font-bold leading-none shrink-0">OVERRIDE ASSIGNMENT:</span>
                          <select
                            value={log.matchedAgentId}
                            onChange={(e) => handleManualOverride(log.id, e.target.value)}
                            disabled={overridingLogId === log.id}
                            className="bg-slate-900 border border-slate-800 text-slate-300 rounded p-1 text-[11px] font-mono outline-none focus:border-blue-500 cursor-pointer text-xs"
                          >
                            {agents.map(a => (
                              <option key={a.id} value={a.id} className="bg-slate-950 text-slate-300">{a.name} ({a.currentLoad}/{a.maxCapacity})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
