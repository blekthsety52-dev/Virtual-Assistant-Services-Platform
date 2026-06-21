import React, { useState, useMemo } from "react";
import { HelpCircle, X, Search, ChevronDown, ChevronUp, ArrowRight, ExternalLink, MessageSquare, Sparkles } from "lucide-react";
import AIChatView from "./AIChatView";

interface QuickHelpFABProps {
  onRedirectToFAQ: () => void;
}

interface MiniFAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function QuickHelpFAB({ onRedirectToFAQ }: QuickHelpFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [helpMode, setHelpMode] = useState<"faq" | "ai-chat">("faq");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // High-intent pocket questions for immediate customer relief
  const quickQuestions: MiniFAQItem[] = useMemo(() => [
    {
      category: "Matchmaking",
      question: "How does Vesta pair me with a virtual assistant?",
      answer: "We use a smart, capacity-checked matching algorithm taking into account experience level, ratings, and skill filters. You can use the AI Matching Portal (text or voice) or select directly from the Agent Directory."
    },
    {
      category: "Scheduling",
      question: "Is there a charge to schedule an initial consultation?",
      answer: "No, consultations are completely free. You can view the assistant's live slots on their profile tab and lock a session with zero upfront commitments."
    },
    {
      category: "Billing",
      question: "Are there any hidden costs in Vesta's pricing?",
      answer: "None at all. We utilize clean, transparent monthly retainer tiers adjusted to your team's size (Growth, Pro, or Executive). All rates are displayed fully before kickoff and there are no setup fees."
    },
    {
      category: "Scope",
      question: "What tasks can my virtual assistant handle?",
      answer: "Administrative planning, CRM updates, custom email triage, calendar gatekeeping, documents curation, and technical custom automations using tools like Zapier or Make."
    }
  ], []);

  // Filter based on pocket search input
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return quickQuestions;
    return quickQuestions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [quickQuestions, searchQuery]);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleOpenFullFAQ = () => {
    setIsOpen(false);
    onRedirectToFAQ();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Floating Action Button (FAB) Trigger */}
      <button
        id="quick-help-fab"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer relative group ${
          isOpen 
            ? "bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/20" 
            : "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/20 animate-bounce-slow"
        }`}
        aria-label={isOpen ? "Close Quick Help panel" : "Open Quick Help panel"}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform rotate-0 group-hover:rotate-95" />
        ) : (
          <div className="relative">
            <HelpCircle className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
        )}

        {/* Tooltip on non-open hover */}
        {!isOpen && (
          <span className="absolute right-16 bg-slate-950 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-slate-800 pointer-events-none">
            Quick Help Center
          </span>
        )}
      </button>

      {/* QUICK HELP POCKET PANEL */}
      {isOpen && (
        <div 
          className="absolute bottom-18 right-0 w-[350px] max-w-[calc(100vw-32px)] bg-slate-950 border-2 border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up"
          role="dialog"
          aria-labelledby="quick-help-title"
        >
          {/* Header Banner */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <h3 id="quick-help-title" className="font-display font-bold text-xs text-white uppercase tracking-wider">
                Vesta Assistant Co-Pilot
              </h3>
            </div>
            <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
              v2.1
            </span>
          </div>

          {/* Premium Selector Tabs */}
          <div className="grid grid-cols-2 bg-slate-900 border-b border-slate-850 p-1">
            <button
              onClick={() => setHelpMode("faq")}
              className={`py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                helpMode === "faq"
                  ? "bg-slate-800 text-blue-400 border border-slate-700/60"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📖 Quick Answers
            </button>
            <button
              onClick={() => setHelpMode("ai-chat")}
              className={`py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                helpMode === "ai-chat"
                  ? "bg-slate-800 text-blue-400 border border-slate-700/60 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
              <span>AI Concierge</span>
            </button>
          </div>

          {helpMode === "faq" ? (
            <>
              {/* Search Input */}
              <div className="p-3 bg-slate-950 border-b border-slate-900">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search quick answers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-550 focus:outline-none focus:border-blue-500 transition-colors font-medium font-sans"
                  />
                </div>
              </div>

              {/* Scrollable Pocket QA List */}
              <div className="p-3 max-h-[240px] overflow-y-auto space-y-2 select-none">
                {filteredQuestions.map((item, idx) => {
                  const isExpanded = expandedIndex === idx;
                  return (
                    <div 
                      key={idx}
                      className="border border-slate-850/80 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 transition-colors"
                    >
                      <button
                        onClick={() => toggleExpand(idx)}
                        className="w-full text-left px-3 py-2 flex items-center justify-between gap-2.5 font-display text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        <span className="font-semibold leading-tight pr-2">
                          {item.question}
                        </span>
                        <span className="shrink-0 text-slate-550">
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-0.5 text-[10.5px] text-slate-450 leading-normal border-t border-slate-900/50">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredQuestions.length === 0 && (
                  <div className="text-center py-8 text-[11px] font-mono text-slate-500">
                    No immediate matches found. 
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="block mx-auto mt-1 text-blue-400 underline font-semibold"
                    >
                      Show all questions
                    </button>
                  </div>
                )}
              </div>

              {/* Redirect to Full FAQ tab Trigger CTA */}
              <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex flex-col gap-2">
                <button
                  onClick={handleOpenFullFAQ}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-[11px] py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow shadow-blue-500/10 cursor-pointer"
                >
                  <span>View Full FAQ Help Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono px-1">
                  <span>Need live smart support?</span>
                  <button 
                    onClick={() => setHelpMode("ai-chat")}
                    className="text-blue-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Launch Chat bot</span>
                    <Sparkles className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Render active multi-turn support chatbot directly in embedded format! */
            <AIChatView embeddedMode={true} />
          )}

        </div>
      )}

    </div>
  );
}
