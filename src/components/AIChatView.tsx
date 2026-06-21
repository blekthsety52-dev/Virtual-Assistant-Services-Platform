import React, { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquare, Send, Sparkles, AlertCircle, RefreshCw, Star, Info, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

interface AIChatViewProps {
  embeddedMode?: boolean; // if true, styles appropriately for the small Help FAB popup
}

export default function AIChatView({ embeddedMode = false }: AIChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Initial welcome message from VIC
    return [
      {
        id: "msg-init-vic-1",
        role: "model",
        text: "Hello! I am **VIC** (Vesta Intelligent Concierge), your custom AI advisor. 🌌\n\nI am connected to Vesta's live database. Ask me to:\n- 📋 **Check current bookings** (tell me your email to look it up!)\n- 🤖 **Recommend specific virtual assistants** based on skills\n- 💸 Explain transparent hourly or monthly **retainer pricing**\n- 🔧 Solve **troubleshooting** or assist alignment errors\n\nHow can I support your operations today?",
        timestamp: new Date().toISOString()
      }
    ];
  });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest response
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Direct quick inquiry triggers
  const suggestionPrompts = useMemo(() => [
    { label: "🔍 Find tech assistant", prompt: "Can you recommend a virtual assistant with technical operations and WordPress skills?" },
    { label: "🗓️ Check my booking", prompt: "Check my booking status. My email is herocalze11@gmail.com" },
    { label: "💳 Compare retainer costs", prompt: "What are Vesta's retainer pricing plans and corresponding hours?" },
    { label: "🔧 Troubleshoot matching", prompt: "I am having trouble finding a match. What should I do next?" }
  ], []);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setErrorStatus(null);
    const userMsg: ChatMessage = {
      id: "msg-user-" + Math.random().toString(36).substring(2, 9),
      role: "user",
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    // Prepare full conversation history for context-aware multi-turn API
    const historyPayload = [...messages, userMsg].map(m => ({
      role: m.role,
      text: m.text
    }));

    try {
      const response = await fetch("/api/support-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: historyPayload })
      });

      if (!response.ok) {
        throw new Error("Intelligent Concierge node failed to report. Code: " + response.status);
      }

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        {
          id: "msg-vic-" + Math.random().toString(36).substring(2, 9),
          role: "model",
          text: data.text || "I was unable to formulate a response. Please check back shortly.",
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Network socket mismatch occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChatHistory = () => {
    if (window.confirm("Restore Vesta Intelligent Concierge context to default state?")) {
      setMessages([
        {
          id: "msg-init-vic-1",
          role: "model",
          text: "Hello! I am **VIC** (Vesta Intelligent Concierge), your custom AI advisor. 🌌\n\nI am connected to Vesta's live database. Ask me to:\n- 📋 **Check current bookings** (tell me your email to look it up!)\n- 🤖 **Recommend specific virtual assistants** based on skills\n- 💸 Explain transparent hourly or monthly **retainer pricing**\n- 🔧 Solve **troubleshooting** or assist alignment errors\n\nHow can I support your operations today?",
          timestamp: new Date().toISOString()
        }
      ]);
      setErrorStatus(null);
    }
  };

  return (
    <div className={`flex flex-col bg-slate-950 font-sans border border-slate-850 overflow-hidden ${
      embeddedMode ? "h-[380px] rounded-b-xl" : "min-h-[550px] max-w-4xl mx-auto rounded-3xl"
    }`}>
      {/* Title block for non-embedded view */}
      {!embeddedMode && (
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-semibold text-sm text-white tracking-wide uppercase">AI Concierge Assistant</h2>
                <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider">LIVE DATA</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Chat seamlessly to verify client bookings, query rates, or obtain agent referrals.</p>
            </div>
          </div>

          <button
            onClick={handleClearChatHistory}
            className="text-[10px] text-slate-400 hover:text-rose-400 font-mono font-semibold flex items-center gap-1 bg-slate-950/70 py-1.5 px-3 border border-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset History</span>
          </button>
        </div>
      )}

      {/* MESSAGES WATERFALL WINDOW */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[220px]">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slide-up`}
            >
              <div className={`max-w-[85%] rounded-2xl p-3 px-3.5 text-xs leading-relaxed border ${
                isUser 
                  ? "bg-blue-600 border-blue-500 text-white rounded-tr-none" 
                  : "bg-slate-900 border-slate-800 text-slate-300 rounded-tl-none font-medium"
              }`}>
                {/* Meta details */}
                <div className={`flex items-center gap-1.5 mb-1.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                  isUser ? "text-blue-200 justify-end" : "text-blue-400"
                }`}>
                  {!isUser && <Sparkles className="w-2.5 h-2.5 text-blue-400 animate-pulse fill-blue-500/20" />}
                  <span>{isUser ? "Client Explorer" : "VIC Concierge"}</span>
                  <span className="text-slate-500 font-normal">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="markdown-body space-y-1">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}

        {/* LOADING TYPING INDICATOR */}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-blue-400">VIC is fetching database logs...</span>
              <span className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        )}

        {/* LOCAL ERROR MESSAGE GATING */}
        {errorStatus && (
          <div className="bg-rose-500/10 border border-rose-500/25 p-3.5 rounded-xl flex items-start gap-2 text-rose-400 text-[11px] font-mono leading-tight">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-bold">Chat Synchronization Fault</p>
              <p className="mt-0.5 text-slate-400">{errorStatus}</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* QUICK SUGGESTIONS DRAWER */}
      {messages.length < 3 && (
        <div className="px-4 py-2 border-t border-slate-900 bg-slate-950 flex flex-wrap gap-1.5 overflow-x-auto hide-scrollbar">
          {suggestionPrompts.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s.prompt)}
              className="text-[10px] font-mono font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-850 px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* INPUT CONTROLS BAR */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Write message to search database & ask concierge..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-550 focus:outline-none focus:border-blue-500 transition-colors font-medium font-sans"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              inputValue.trim() && !isLoading
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[8px] text-slate-550 font-mono text-center mt-1.5 uppercase leading-none">
          Vesta AI Sync Engine • Powered by Gemini 3.5 Flash
        </p>
      </div>
    </div>
  );
}
