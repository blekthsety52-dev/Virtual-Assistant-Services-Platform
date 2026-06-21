import React, { useState } from "react";
import { Agent } from "../types";
import { Search, Eye, Star, AlertCircle, Sparkles, ArrowRight } from "lucide-react";

interface AgentDirectoryViewProps {
  agents: Agent[];
  onSelectAgent: (agentId: string) => void;
  onOpenMatcher: () => void;
  selectedCompareIds: string[];
  onAddToCompare: (agentId: string) => void;
  onRemoveFromCompare: (agentId: string) => void;
  onNavigateToCompare: () => void;
}

export default function AgentDirectoryView({
  agents,
  onSelectAgent,
  onOpenMatcher,
  selectedCompareIds,
  onAddToCompare,
  onRemoveFromCompare,
  onNavigateToCompare
}: AgentDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("all");

  // Get unique list of skills for filter suggestions
  const allSkills = Array.from(new Set(agents.flatMap(a => a.skills))).slice(0, 10);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      agent.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesExperience =
      experienceFilter === "all" || agent.experienceLevel === experienceFilter;

    return matchesSearch && matchesExperience;
  });

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-blue-400 uppercase tracking-widest text-[10px] font-bold font-mono tracking-wider block mb-2">Our Core Team</span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white animate-fade-in">
            Intelligent Agent Directory
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Meet the actual, world-class human assistants running and powering current workloads.
          </p>
        </div>
        <button
          onClick={onOpenMatcher}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-blue-400 text-[11px] font-display font-medium py-2 px-4 rounded-xl transition cursor-pointer"
        >
          Auto-Match with AI Assistant
        </button>
      </div>

      {/* Control Filters Area */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, specialist skills (e.g., Zendesk, Shopify, Zapier)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">EXPERIENCE:</span>
          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="border border-slate-800 p-2.5 text-xs rounded-xl bg-slate-950 text-slate-300 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Experiences</option>
            <option value="Intermediate">Intermediate Group</option>
            <option value="Senior">Senior Level</option>
            <option value="Executive Expert">Executive Expert</option>
          </select>
        </div>
      </div>

      {/* Quick Skill Tags Suggestions */}
      <div className="flex flex-wrap gap-1.5 mb-8 items-center">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold mr-2">Top Skills:</span>
        {allSkills.map(skill => (
          <button
            key={skill}
            onClick={() => setSearchQuery(skill)}
            className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded px-2.5 py-1 text-slate-400 hover:text-white transition cursor-pointer"
          >
            {skill}
          </button>
        ))}
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-[10px] font-bold text-rose-450 hover:text-rose-400 underline font-mono cursor-pointer"
          >
            (Clear Search)
          </button>
        )}
      </div>

      {/* Agents Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAgents.map((agent) => {
          const loadPercentage = Math.round((agent.currentLoad / agent.maxCapacity) * 100);
          const isAtMax = agent.currentLoad >= agent.maxCapacity;

          return (
            <div
              key={agent.id}
              className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden transition-all duration-350 hover:border-slate-750 flex flex-col justify-between"
            >
              {/* Profile Card Header with Status Tag */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-800 shadow-sm"
                    />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                      agent.isAvailable && !isAtMax ? "bg-emerald-500" : "bg-amber-400"
                    }`} title={agent.isAvailable ? "Online & Available" : "Offline / Full Workload"}></span>
                  </div>

                  <div className="text-right">
                    <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase inline-block ${
                      agent.experienceLevel === "Executive Expert"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : agent.experienceLevel === "Senior"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-slate-950 text-slate-400 border border-slate-850"
                    }`}>
                      {agent.experienceLevel}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] justify-end mt-2 font-mono text-slate-300">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      <span>{agent.rating} ({agent.reviewsCount})</span>
                    </div>
                  </div>
                </div>

                {/* Name, Title, and Bio */}
                <h3 className="font-display font-bold text-lg text-white leading-tight mb-1">{agent.name}</h3>
                <p className="text-[10px] text-blue-400 font-mono uppercase mb-3 tracking-wider">{agent.title}</p>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4 min-h-[48px]">
                  {agent.bio}
                </p>

                {/* Skill Grid */}
                <div className="mb-5">
                  <div className="flex flex-wrap gap-1">
                    {agent.skills.slice(0, 5).map((skill) => (
                      <span key={skill} className="text-[10px] bg-slate-950 border border-slate-850 px-2 py-0.5 text-slate-400 rounded font-mono">
                        {skill}
                      </span>
                    ))}
                    {agent.skills.length > 5 && (
                      <span className="text-[10px] text-slate-500 font-mono py-0.5 px-1.5 font-bold">
                        +{agent.skills.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Real-time Workload indicator */}
                <div className="border-t border-slate-800 pt-4">
                  <div className="flex justify-between text-[10px] mb-1.5 font-mono">
                    <span className="text-slate-500 uppercase font-bold tracking-wide">Project Load Capacity:</span>
                    <span className={isAtMax ? "text-rose-400 font-bold" : "text-slate-300"}>
                      {agent.currentLoad} / {agent.maxCapacity} clients
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isAtMax
                          ? "bg-rose-500"
                          : loadPercentage > 75
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${loadPercentage}%` }}
                    ></div>
                  </div>
                  {isAtMax && (
                    <div className="flex items-center gap-1.5 text-[10px] text-rose-450 mt-2 font-medium leading-normal">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Allocated capacity exceeded. AI-gated router will override leads.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking CTAs */}
              <div className="bg-slate-955/50 border-t border-slate-800/80 py-3.5 px-6 flex items-center justify-between gap-2 border-r last:border-r-0">
                {(() => {
                  const isCompared = selectedCompareIds.includes(agent.id);
                  return (
                    <button
                      onClick={() => {
                        if (isCompared) {
                          onRemoveFromCompare(agent.id);
                        } else {
                          onAddToCompare(agent.id);
                        }
                      }}
                      className={`text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
                        isCompared
                          ? "bg-blue-500/20 border-blue-500/40 text-blue-400 font-bold"
                          : "bg-slate-950 border-slate-800/85 text-slate-400 hover:text-white hover:border-slate-700"
                      }`}
                      title={isCompared ? "Click to remove from comparison selection" : "Select up to 3 assistants to compare side-by-side"}
                    >
                      {isCompared ? "✓ Added" : "+ Compare"}
                    </button>
                  );
                })()}

                <button
                  onClick={() => onSelectAgent(agent.id)}
                  className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-550 font-bold font-display px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Profile & Inquire</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredAgents.length === 0 && (
          <div className="col-span-full bg-slate-900/20 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 font-mono text-sm leading-relaxed">
            No virtual human assistants currently match that search query. Try typing something broader!
          </div>
        )}
      </div>

      {/* FLOAT COMPARISON TRAY TRIGGER BANNER */}
      {selectedCompareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border-2 border-blue-500/35 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-6 animate-slide-up backdrop-blur-md max-w-lg w-[90%] sm:w-auto justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-550/20 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
              {selectedCompareIds.length}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase font-display tracking-wide">Assistant Comparison Slot List</h4>
              <p className="text-[10px] text-slate-400 leading-normal font-medium mt-0.5">Ready to inspect side-by-side criteria details.</p>
            </div>
          </div>

          <button
            onClick={onNavigateToCompare}
            className="bg-blue-600 hover:bg-blue-500 text-white font-display font-semibold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer shadow shadow-blue-500/20 hover:shadow-blue-500/30 shrink-0 flex items-center gap-1"
          >
            <span>Compare Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
