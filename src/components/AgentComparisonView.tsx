import React, { useState, useMemo, useEffect } from "react";
import { Agent } from "../types";
import { 
  Users, 
  Trash2, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Layers, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
  Briefcase
} from "lucide-react";

interface AgentComparisonViewProps {
  agents: Agent[];
  selectedCompareIds: string[];
  onRemoveFromCompare: (id: string) => void;
  onAddToCompare: (id: string) => void;
  onSelectAgent: (id: string) => void;
  onOpenBooking: (id: string) => void;
}

export default function AgentComparisonView({
  agents,
  selectedCompareIds,
  onRemoveFromCompare,
  onAddToCompare,
  onSelectAgent,
  onOpenBooking
}: AgentComparisonViewProps) {
  const [slot1, setSlot1] = useState<string>("");
  const [slot2, setSlot2] = useState<string>("");
  const [slot3, setSlot3] = useState<string>("");

  // Sync state from properties if any were passed in from the global directory
  useEffect(() => {
    if (selectedCompareIds.length > 0) {
      if (selectedCompareIds[0]) setSlot1(selectedCompareIds[0]);
      if (selectedCompareIds[1]) setSlot2(selectedCompareIds[1]);
      if (selectedCompareIds[2]) setSlot3(selectedCompareIds[2]);
    }
  }, [selectedCompareIds]);

  // Keep internal slot states synchronized with direct updates
  const chosenAgent1 = useMemo(() => agents.find(a => a.id === slot1), [agents, slot1]);
  const chosenAgent2 = useMemo(() => agents.find(a => a.id === slot2), [agents, slot2]);
  const chosenAgent3 = useMemo(() => agents.find(a => a.id === slot3), [agents, slot3]);

  // Active agents being compared currently
  const comparedAgents = useMemo(() => {
    return [chosenAgent1, chosenAgent2, chosenAgent3].filter((a): a is Agent => !!a);
  }, [chosenAgent1, chosenAgent2, chosenAgent3]);

  // Pricing helper per experience tier
  // Executive Expert: $45 / hour, $3,200 monthly retainer (approx 80 hours)
  // Senior: $35 / hour, $2,450 monthly retainer (approx 70 hours)
  // Intermediate: $25 / hour, $1,800 monthly retainer (approx 72 hours)
  const getPricingInfoForTier = (tier: string) => {
    switch (tier) {
      case "Executive Expert":
        return { hourly: "$45", monthly: "$3,200", hoursIncluded: "Approx 80 hrs/mo" };
      case "Senior":
        return { hourly: "$35", monthly: "$2,450", hoursIncluded: "Approx 70 hrs/mo" };
      case "Intermediate":
      default:
        return { hourly: "$25", monthly: "$1,800", hoursIncluded: "Approx 72 hrs/mo" };
    }
  };

  // Find overlapping skills to highlight common competency areas
  const overlappingSkills = useMemo(() => {
    if (comparedAgents.length < 2) return new Set<string>();
    
    // Count occurrences of each skill in currently selected agents
    const occurrences: Record<string, number> = {};
    comparedAgents.forEach(agent => {
      agent.skills.forEach(skill => {
        occurrences[skill] = (occurrences[skill] || 0) + 1;
      });
    });

    // Overlapping skills are those that exist in more than 1 of compared agents
    const overlap = new Set<string>();
    Object.entries(occurrences).forEach(([skill, count]) => {
      if (count > 1) {
        overlap.add(skill);
      }
    });
    return overlap;
  }, [comparedAgents]);

  // Match Highlight Matrix
  // Identifies the top rated and most available among compared ones
  const matchHighlights = useMemo(() => {
    if (comparedAgents.length === 0) return { highestRatedId: null, mostAvailableId: null };

    let highestRated = comparedAgents[0];
    let mostAvailable = comparedAgents[0];

    comparedAgents.forEach(agent => {
      if (agent.rating > highestRated.rating) {
        highestRated = agent;
      }
      // availability defined as lowest loadنسبة (currentLoad / maxCapacity) or highest free capacity in active slots
      const agentFreeSlots = agent.maxCapacity - agent.currentLoad;
      const highestFreeSlots = mostAvailable.maxCapacity - mostAvailable.currentLoad;
      if (agentFreeSlots > highestFreeSlots) {
        mostAvailable = agent;
      }
    });

    return {
      highestRatedId: highestRated.id,
      mostAvailableId: mostAvailable.id
    };
  }, [comparedAgents]);

  const handleClearAllSlots = () => {
    setSlot1("");
    setSlot2("");
    setSlot3("");
  };

  // List of available agents that can be added to standard dropdown slots (excluding already selected ones to keep selections distinct)
  const getAvailableForSlot = (currentSlotId: string) => {
    const selectedElsewhere = [slot1, slot2, slot3].filter(id => id !== currentSlotId);
    return agents.filter(a => !selectedElsewhere.includes(a.id));
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-blue-400 uppercase tracking-widest text-[10px] font-bold font-mono tracking-wider block mb-2">Decision Matrix</span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white animate-fade-in">
            Agent Comparison Matrix
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Compare 2 to 3 virtual human assistants side-by-side to match the exact pricing, capacity, and specialized skills required.
          </p>
        </div>
        
        {comparedAgents.length > 0 && (
          <button
            onClick={handleClearAllSlots}
            className="text-xs text-rose-400 hover:text-rose-300 font-mono font-medium flex items-center gap-1.5 transition-all bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 px-3.5 py-2 rounded-xl cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Comparison Grid</span>
          </button>
        )}
      </div>

      {/* DROPDOWN SELECTORS SLOTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* SLOT 1 Selector */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 space-y-3">
          <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">
            Comparison Slot 01
          </label>
          <div className="relative">
            <select
              value={slot1}
              onChange={(e) => setSlot1(e.target.value)}
              className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none relative"
            >
              <option value="">-- Choose First Assistant --</option>
              {getAvailableForSlot(slot1).map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.experienceLevel})</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          {chosenAgent1 && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="text-emerald-400 font-semibold">• Loaded Successfully</span>
              <button onClick={() => setSlot1("")} className="text-rose-400 hover:text-rose-300 font-bold">Remove</button>
            </div>
          )}
        </div>

        {/* SLOT 2 Selector */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 space-y-3">
          <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">
            Comparison Slot 02
          </label>
          <div className="relative">
            <select
              value={slot2}
              onChange={(e) => setSlot2(e.target.value)}
              className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none relative"
            >
              <option value="">-- Choose Second Assistant --</option>
              {getAvailableForSlot(slot2).map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.experienceLevel})</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          {chosenAgent2 && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="text-emerald-400 font-semibold">• Loaded Successfully</span>
              <button onClick={() => setSlot2("")} className="text-rose-400 hover:text-rose-300 font-bold">Remove</button>
            </div>
          )}
        </div>

        {/* SLOT 3 Selector */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 space-y-3">
          <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">
            Comparison Slot 03
          </label>
          <div className="relative">
            <select
              value={slot3}
              onChange={(e) => setSlot3(e.target.value)}
              className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none relative"
            >
              <option value="">-- Choose Third Assistant --</option>
              {getAvailableForSlot(slot3).map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.experienceLevel})</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          {chosenAgent3 && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="text-emerald-400 font-semibold font-bold">• Loaded Successfully</span>
              <button onClick={() => setSlot3("")} className="text-rose-400 hover:text-rose-300 font-bold pointer-events-auto">Remove</button>
            </div>
          )}
        </div>

      </div>

      {/* NO AGENTS SELECTED - WELCOME HELP GRID */}
      {comparedAgents.length === 0 ? (
        <div className="bg-slate-900/20 border border-slate-800 rounded-3xl p-12 text-center max-w-4xl mx-auto py-16">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-5 border border-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="font-display font-semibold text-lg text-white mb-2">No Assistants Selected for Side-by-Side View</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto mb-8">
            Begin evaluating candidates by choosing 2 or 3 virtual assistants inside the comparison slots above, or view our active team directory to add coordinates instantly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            <div className="border border-slate-800 bg-slate-950/40 p-4.5 rounded-2xl">
              <span className="font-mono text-[10px] text-blue-400 font-bold block mb-1">STACE 1: SELECT</span>
              <h4 className="text-xs font-semibold text-slate-200 mb-1">Pick Candidate Slots</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">Map up to three individual profiles to compare their timezone coordinates, hours, and rates.</p>
            </div>

            <div className="border border-slate-800 bg-slate-950/40 p-4.5 rounded-2xl">
              <span className="font-mono text-[10px] text-blue-400 font-bold block mb-1">STAGE 2: EVALUATE</span>
              <h4 className="text-xs font-semibold text-slate-200 mb-1">Verify Competencies</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">Our system actively highlights matched skill intersections so you easily spot general overlap.</p>
            </div>

            <div className="border border-slate-800 bg-slate-950/40 p-4.5 rounded-2xl">
              <span className="font-mono text-[10px] text-blue-400 font-bold block mb-1">STAGE 3: SECURE</span>
              <h4 className="text-xs font-semibold text-slate-200 mb-1">Initialize Sync</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">Go straight to bookings or start a direct secure video kickoff from the comparison table.</p>
            </div>
          </div>
        </div>
      ) : (
        /* COMPARISON TABLE MATRIX - Swipeable/Over-scrollable on mobile grids */
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/20">
          <div className="min-w-[800px] divide-y divide-slate-800/80">
            
            {/* Row 1: Profile Identites & Badges */}
            <div className="grid grid-cols-4 items-stretch">
              <div className="p-6 bg-slate-950/30 flex items-center font-display font-bold text-xs uppercase tracking-wider text-slate-400 border-r border-slate-800/60 font-mono">
                Team Assistant Identity
              </div>
              
              {/* Assign slots */}
              {[chosenAgent1, chosenAgent2, chosenAgent3].map((agent, colIdx) => (
                <div key={colIdx} className="p-6 border-r last:border-r-0 border-slate-800/60 relative flex flex-col justify-between">
                  {agent ? (
                    <div>
                      {/* Highlight badges */}
                      {matchHighlights.highestRatedId === agent.id && (
                        <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 shrink-0 fill-amber-400/20" />
                          <span>Highest Rated</span>
                        </div>
                      )}
                      {matchHighlights.mostAvailableId === agent.id && matchHighlights.highestRatedId !== agent.id && (
                        <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5 shrink-0" />
                          <span>Highest Capacity</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3.5 mb-3.5">
                        <img 
                          src={agent.avatar} 
                          alt={agent.name} 
                          className="w-14 h-14 rounded-xl object-cover border-2 border-slate-850" 
                        />
                        <div>
                          <h3 className="font-display font-bold text-sm text-white leading-tight">{agent.name}</h3>
                          <span className="text-[10px] text-blue-400 font-mono uppercase tracking-wider block mt-0.5">{agent.title}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-slate-300 font-mono text-xs">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="font-bold">{agent.rating}</span>
                        <span className="text-slate-550 text-[10px]">({agent.reviewsCount} verified endorsements)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-6">
                      <span className="text-xs font-mono">Slot Unoccupied</span>
                      <span className="text-[10px] text-slate-600 mt-1">Select an agent above to populate</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Row 2: Experience Rank and Availability status */}
            <div className="grid grid-cols-4 items-stretch">
              <div className="p-6 bg-slate-950/30 flex items-center font-display font-bold text-xs uppercase tracking-wider text-slate-400 border-r border-slate-800/60 font-mono">
                Seniority & Availability
              </div>
              {[chosenAgent1, chosenAgent2, chosenAgent3].map((agent, colIdx) => (
                <div key={colIdx} className="p-6 border-r last:border-r-0 border-slate-800/60 flex flex-col justify-center">
                  {agent ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Vesta Tier Rank:</span>
                        <span className="font-bold text-white text-[11px] bg-slate-950 border border-slate-850 py-0.5 px-2 rounded-full">
                          {agent.experienceLevel}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Active Status:</span>
                        <span className={`font-bold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${
                          agent.isAvailable 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {agent.isAvailable ? "● Accepting Matches" : "● At Max capacity"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-600 text-center">-</span>
                  )}
                </div>
              ))}
            </div>

            {/* Row 3: Transparent Pricing & Service Tiers */}
            <div className="grid grid-cols-4 items-stretch">
              <div className="p-6 bg-slate-950/30 flex flex-col justify-center font-display font-bold text-xs uppercase tracking-wider text-slate-400 border-r border-slate-800/60 font-mono">
                <span>Direct Compensation Rates</span>
                <span className="text-[9px] text-slate-500 font-normal lowercase mt-1 text-slate-550 italic">Corporate retainers index</span>
              </div>
              {[chosenAgent1, chosenAgent2, chosenAgent3].map((agent, colIdx) => {
                const pricing = agent ? getPricingInfoForTier(agent.experienceLevel) : null;
                return (
                  <div key={colIdx} className="p-6 border-r last:border-r-0 border-slate-800/60 flex flex-col justify-center">
                    {agent && pricing ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-slate-950/80 p-2.5 border border-slate-850 rounded-xl">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono uppercase font-semibold block leading-none">Hourly Equivalent</span>
                            <span className="text-base font-bold text-white font-mono mt-1 block">{pricing.hourly}</span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500">per hour billing</span>
                        </div>

                        <div className="flex items-center justify-between bg-slate-950/80 p-2.5 border border-slate-850 rounded-xl">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono uppercase font-semibold block leading-none">Monthly Retainer</span>
                            <span className="text-sm font-bold text-blue-400 font-mono mt-1 block">{pricing.monthly}</span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 font-semibold uppercase">{pricing.hoursIncluded}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-600 text-center">-</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Row 4: Live Workload & Capacity Progress Bar */}
            <div className="grid grid-cols-4 items-stretch">
              <div className="p-6 bg-slate-950/30 flex items-center font-display font-bold text-xs uppercase tracking-wider text-slate-400 border-r border-slate-800/60 font-mono">
                Active Client Allocations
              </div>
              {[chosenAgent1, chosenAgent2, chosenAgent3].map((agent, colIdx) => {
                if (!agent) {
                  return (
                    <div key={colIdx} className="p-6 border-r last:border-r-0 border-slate-800/60 flex items-center justify-center">
                      <span className="text-[10px] font-mono text-slate-600">-</span>
                    </div>
                  );
                }
                const loadPercentage = Math.round((agent.currentLoad / agent.maxCapacity) * 100);
                const isAtMax = agent.currentLoad >= agent.maxCapacity;

                return (
                  <div key={colIdx} className="p-6 border-r last:border-r-0 border-slate-800/60 flex flex-col justify-center">
                    <div className="flex justify-between text-[10px] mb-1.5 font-mono">
                      <span className="text-slate-500 font-semibold">Active Assignments:</span>
                      <span className="text-slate-200 font-semibold">{agent.currentLoad} / {agent.maxCapacity} clients</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          isAtMax ? "bg-rose-500" : loadPercentage > 75 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${loadPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-mono mt-1.5 uppercase leading-normal">
                      {isAtMax ? "AI matching limits new allocations" : `Has capacity for ${agent.maxCapacity - agent.currentLoad} slots`}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Row 5: Top Core Specialties */}
            <div className="grid grid-cols-4 items-stretch">
              <div className="p-6 bg-slate-950/30 flex items-center font-display font-bold text-xs uppercase tracking-wider text-slate-400 border-r border-slate-800/60 font-mono">
                Target Specialties
              </div>
              {[chosenAgent1, chosenAgent2, chosenAgent3].map((agent, colIdx) => (
                <div key={colIdx} className="p-6 border-r last:border-r-0 border-slate-800/60 flex flex-col justify-center">
                  {agent ? (
                    <ul className="text-xs space-y-2">
                      {agent.specialties.map((spec, sIdx) => (
                        <li key={sIdx} className="flex items-center gap-2 text-slate-300">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></span>
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-600 text-center">-</span>
                  )}
                </div>
              ))}
            </div>

            {/* Row 6: Skills intersection matrix */}
            <div className="grid grid-cols-4 items-stretch">
              <div className="p-6 bg-slate-950/30 flex flex-col justify-center font-display font-bold text-xs uppercase tracking-wider text-slate-400 border-r border-slate-800/60 font-mono">
                <span>Verified Skills Index</span>
                <span className="text-[9px] text-slate-500 font-normal lowercase mt-1 text-slate-550 italic">Highlights represent shared overlap</span>
              </div>
              {[chosenAgent1, chosenAgent2, chosenAgent3].map((agent, colIdx) => (
                <div key={colIdx} className="p-4.5 border-r last:border-r-0 border-slate-800/60 flex flex-col justify-center">
                  {agent ? (
                    <div className="flex flex-wrap gap-1">
                      {agent.skills.map((skill, sIdx) => {
                        const isShared = overlappingSkills.has(skill);
                        return (
                          <span 
                            key={sIdx} 
                            className={`text-[9.5px] font-mono px-2 py-0.5 rounded border transition-colors ${
                              isShared 
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold" 
                                : "bg-slate-950 border-slate-850 text-slate-400"
                            }`}
                            title={isShared ? "Skill shared with another compared assistant" : ""}
                          >
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-600 text-center">-</span>
                  )}
                </div>
              ))}
            </div>

            {/* Row 7: Kickoff Scheduler & Action Triggers */}
            <div className="grid grid-cols-4 items-stretch">
              <div className="p-6 bg-slate-950/30 flex items-center font-display font-bold text-xs uppercase tracking-wider text-slate-400 border-r border-slate-800/60 font-mono">
                Engagement Pipeline
              </div>
              {[chosenAgent1, chosenAgent2, chosenAgent3].map((agent, colIdx) => (
                <div key={colIdx} className="p-6 border-r last:border-r-0 border-slate-800/60 flex flex-col justify-center gap-3">
                  {agent ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => onOpenBooking(agent.id)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-display font-semibold text-xs py-2 px-3 rounded-xl transition text-center cursor-pointer shadow shadow-blue-500/10 flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Schedule Consultation</span>
                      </button>

                      <button
                        onClick={() => onSelectAgent(agent.id)}
                        className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-display font-semibold text-[11px] py-1.5 px-3 rounded-xl transition text-center cursor-pointer"
                      >
                        Inspect Full Profile
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-600 text-center">-</span>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* QUICK RETOUR COMPONENT - FLOATING HELPER */}
      <div className="mt-8 bg-slate-950 border border-slate-850 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-9 h-9 bg-blue-500/10 rounded-xl border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Need to update comparison candidates?</h4>
            <p className="text-[10px] text-slate-500 leading-normal">Return to the live Agent Directory to evaluate candidate reviews, star ratings, or check bio summaries before finalizing.</p>
          </div>
        </div>

        <button
          onClick={() => onSelectAgent("")} // triggers general directory view back
          className="text-xs text-blue-400 hover:text-white font-semibold font-display bg-blue-500/10 border border-blue-500/20 hover:border-blue-500 py-2 px-4 rounded-xl transition flex items-center gap-1 cursor-pointer"
        >
          <span>Return to Agent Directory</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
