import React, { useState, useEffect, useRef } from "react";
import { Agent, Booking, Message } from "../types";
import { Star, ShieldAlert, Check, Calendar, MessageSquare, Video, FileText, Send, Paperclip, Loader, CheckCircle, ShieldCheck } from "lucide-react";

interface AgentProfileViewProps {
  agent: Agent;
  activeMatchToken: string | null;
  onGoBack: () => void;
  onBookingSuccess: (booking: Booking) => void;
  initialTab?: "about" | "booking" | "chat" | "collaboration";
}

export default function AgentProfileView({
  agent,
  activeMatchToken,
  onGoBack,
  onBookingSuccess,
  initialTab = "about"
}: AgentProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"about" | "booking" | "chat" | "collaboration">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Booking states
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingStep, setBookingStep] = useState<"form" | "success">("form");
  const [confirmedBookingInfo, setConfirmedBookingInfo] = useState<Booking | null>(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [fileToUpload, setFileToUpload] = useState<{ name: string; size: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Video Consultation states
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoState, setVideoState] = useState<"connecting" | "live" | "ended">("connecting");
  const [videoTimer, setVideoTimer] = useState(15); // mock countdown

  // Retrieve messages hourly/real-time if token is active
  useEffect(() => {
    if (activeMatchToken && activeTab === "chat") {
      fetchChatMessages();
    }
  }, [activeMatchToken, activeTab]);

  useEffect(() => {
    if (activeTab === "chat") {
      scrollToBottom();
    }
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatMessages = async () => {
    if (!activeMatchToken) return;
    try {
      const response = await fetch(`/api/chats/${activeMatchToken}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.messages) {
          setChatMessages(data.messages);
        }
      }
    } catch (e) {
      console.error("Unable to load securely encrypted chat messages", e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !fileToUpload) return;
    if (!activeMatchToken) return;

    const payload = {
      sender: "client",
      content: chatInput,
      file: fileToUpload ? { name: fileToUpload.name, size: fileToUpload.size, url: "#" } : undefined
    };

    setChatInput("");
    setFileToUpload(null);

    try {
      const response = await fetch(`/api/chats/${activeMatchToken}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Optimistic refresh
        await fetchChatMessages();
        // Give time for simulation reply trigger
        setTimeout(() => {
          fetchChatMessages();
        }, 1600);
      }
    } catch (error) {
      console.error("Transmission failed", error);
    }
  };

  const simulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileToUpload({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB"
      });
    }
  };

  // Create Booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !selectedDate || !selectedTimeSlot) {
      alert("Please fill in all required booking inputs");
      return;
    }

    setIsBookingSubmitting(true);
    try {
      const payload = {
        agentId: agent.id,
        serviceId: "direct-hire",
        clientName,
        clientEmail,
        dateTime: `${selectedDate} at ${selectedTimeSlot}`,
        notes: bookingNotes
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setConfirmedBookingInfo(data.booking);
        onBookingSuccess(data.booking);
        setBookingStep("success");
      }
    } catch (err) {
      console.error("Failed booking scheduler allocation", err);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Video call effect
  useEffect(() => {
    let interval: any;
    if (isVideoModalOpen && videoState === "connecting") {
      interval = setTimeout(() => {
        setVideoState("live");
      }, 2500);
    }
    return () => clearTimeout(interval);
  }, [isVideoModalOpen, videoState]);

  // Video count effect
  useEffect(() => {
    let interval: any;
    if (videoState === "live" && videoTimer > 0) {
      interval = setInterval(() => {
        setVideoTimer(prev => {
          if (prev <= 1) {
            setVideoState("ended");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [videoState, videoTimer]);

  const launchVideoConsultation = () => {
    setIsVideoModalOpen(true);
    setVideoState("connecting");
    setVideoTimer(20);
  };

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <button
        onClick={onGoBack}
        className="text-[11px] font-semibold text-slate-500 hover:text-blue-400 transition flex items-center gap-1.5 mb-6 font-mono cursor-pointer"
      >
        ← Return to Directory
      </button>

      {/* Main Agent Identity strip */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-800 shadow-sm"
          />
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2">
              <h2 className="font-display text-2xl font-bold text-white leading-tight">{agent.name}</h2>
              <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 py-0.5 px-2.5 rounded font-mono font-bold uppercase tracking-wider">
                {agent.experienceLevel}
              </span>
            </div>
            <p className="text-[10px] text-blue-400 font-mono uppercase tracking-wider mb-2.5">{agent.title}</p>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">{agent.bio}</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shrink-0 text-center md:text-right w-full md:w-auto">
          <div className="flex items-center gap-1 justify-center md:justify-end text-amber-400 font-bold mb-1.5 font-mono text-sm">
            <Star className="w-4 h-4 fill-amber-400 shrink-0" />
            <span>{agent.rating}</span>
            <span className="text-[10px] text-slate-500">({agent.reviewsCount} reviews)</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block mb-3.5 uppercase tracking-wide">Utilization: {agent.currentLoad}/{agent.maxCapacity} active</span>
          
          <button
            onClick={() => setActiveTab("booking")}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-display font-semibold text-xs py-2.5 px-4 rounded-xl transition shadow shadow-blue-500/10 cursor-pointer"
          >
            Direct Consultation
          </button>
        </div>
      </div>

      {/* Tabs Menu bar */}
      <div className="flex border-b border-slate-800 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("about")}
          className={`pb-3 px-4 font-display font-semibold text-xs uppercase tracking-wider transition-all border-b-2 shrink-0 cursor-pointer ${
            activeTab === "about" ? "border-blue-500 text-blue-400 font-bold" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Credentials & Reviews
        </button>
        <button
          onClick={() => setActiveTab("booking")}
          className={`pb-3 px-4 font-display font-semibold text-xs uppercase tracking-wider transition-all border-b-2 shrink-0 cursor-pointer ${
            activeTab === "booking" ? "border-blue-500 text-blue-400 font-bold" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Consultation Scheduler
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`pb-3 px-4 font-display font-semibold text-xs uppercase tracking-wider transition-all border-b-2 shrink-0 relative flex items-center gap-1.5 cursor-pointer ${
            activeTab === "chat" ? "border-blue-500 text-blue-400 font-bold" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Secure Messages</span>
          {!activeMatchToken && (
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("collaboration")}
          className={`pb-3 px-4 font-display font-semibold text-xs uppercase tracking-wider transition-all border-b-2 shrink-0 cursor-pointer ${
            activeTab === "collaboration" ? "border-blue-500 text-blue-400 font-bold" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Direct Collaboration Suite
        </button>
      </div>

      {/* Tab Contents: 1. About & Reviews */}
      {activeTab === "about" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Credentials details */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
              <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Competency Details</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Availability</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Mon - Fri (Standard Corporate Time)</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Experience Tier</span>
                  <span className="text-xs font-semibold text-slate-200">{agent.experienceLevel} Qualified</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1.5">Assigned Skills Hub</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.skills.map(s => (
                      <span key={s} className="text-[10px] bg-slate-950 text-slate-400 py-0.5 px-2 rounded border border-slate-850 font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1.5">Core Specialties</span>
                  <ul className="text-xs space-y-1.5 mt-1 font-medium text-slate-350">
                    {agent.specialties.map(spec => (
                      <li key={spec} className="flex items-start gap-1.5">
                        <span className="text-blue-400">•</span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="md:col-span-2">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
              <h3 className="font-display font-medium text-base text-white mb-4 border-b border-slate-800 pb-3">Client Endorsements ({agent.reviews.length})</h3>
              <div className="divide-y divide-slate-800/60 space-y-5">
                {agent.reviews.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-slate-200">{rev.clientName}</h4>
                      <span className="text-[10px] font-mono text-slate-500">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs mb-2">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-405 text-slate-400 italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: 2. Consultation Scheduler */}
      {activeTab === "booking" && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {bookingStep === "form" ? (
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Form entries */}
              <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-800">
                <h3 className="font-display text-lg font-bold text-white mb-1.5">Schedule a Gated Consultation</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Select an active meeting slot on local time coordinates. This matches your client account load with {agent.name}.
                </p>

                <form onSubmit={handleCreateBooking} className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1.5">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Jonathan Harker"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1.5">Corporate Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g., jonathan@agency.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1.5">Date *</label>
                      <input
                        type="date"
                        required
                        value={selectedDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1.5">Time Slot *</label>
                      <select
                        required
                        value={selectedTimeSlot}
                        onChange={(e) => setSelectedTimeSlot(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                      >
                        <option value="">Select a slot</option>
                        {agent.timeSlots.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1.5">Project Brief / Core Requirements</label>
                    <textarea
                      placeholder="Briefly state your requirements or technical objectives..."
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isBookingSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-display text-xs font-semibold py-3 px-4 rounded-xl transition mt-2 flex items-center justify-center gap-1.5 shadow shadow-blue-500/10 cursor-pointer"
                  >
                    {isBookingSubmitting ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        <span>Reserving Interactive Slot...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Confirm Appointment Reservation</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Informative Side */}
              <div className="bg-slate-950/40 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider mb-4">Service Guarantees</h4>
                  <ul className="space-y-3.5">
                    <li className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <span>Dedicated, personalized 30-minute introductory sync.</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <span>Skills gap analysis matched against your exact input logs.</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <span>Zero fee initialization; pricing tiers only lock on actual campaign kickoff.</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 border-t border-slate-800/80 pt-5">
                  <span className="text-[10px] text-slate-500 font-mono block uppercase mb-1">Lead Agent Security Signature</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span className="text-[10px] font-mono text-blue-400 font-bold tracking-wider">{agent.id.toUpperCase()}_VESTA_TRUSTED</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Successful Booking View */
            <div className="p-8 text-center max-w-lg mx-auto py-12">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-550/20 shadow-lg shadow-blue-500/5">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Booking Reserved Successfully!</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Excellent! Your introduction consultation slot has been securely preserved inside Vesta's in-memory storage logs. An onboarding template document has been coordinated.
              </p>

              {confirmedBookingInfo && (
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-left font-mono text-xs text-slate-400 space-y-2 mb-6">
                  <div><strong className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Meeting ID:</strong> <span className="text-blue-400">{confirmedBookingInfo.id}</span></div>
                  <div><strong className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Assistant:</strong> <span className="text-white">{agent.name}</span></div>
                  <div><strong className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Coordinates:</strong> <span className="text-white">{confirmedBookingInfo.dateTime}</span></div>
                  <div><strong className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Client Email:</strong> <span className="text-white">{confirmedBookingInfo.clientEmail}</span></div>
                </div>
              )}

              <button
                onClick={() => setBookingStep("form")}
                className="bg-blue-600 hover:bg-blue-500 text-white font-display text-xs font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Schedule Another Consultation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: 3. Secure Messaging Console */}
      {activeTab === "chat" && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[520px]">
          {/* Header */}
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${activeMatchToken ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
              <div>
                <span className="text-xs font-bold text-white block">Workspace Consultation: {agent.name}</span>
                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider leading-none">
                  {activeMatchToken ? "SECURE CLIENT CONNECTION ACTIVE" : "GATEWAY CODE DEACTIVATED"}
                </span>
              </div>
            </div>
          </div>

          {/* Secure Messaging Gateway Lock if no token */}
          {!activeMatchToken ? (
            <div className="flex-1 bg-slate-950/40 p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-10 h-10 rounded-full bg-rose-550/10 bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="font-display font-medium text-white text-base mb-1.5">Direct Messaging Lock</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                To protect client confidentiality and prevent random bot outreach loads, the real-time advisor chat panel is strictly lock-gated.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 text-xs text-amber-305 text-amber-300 p-3.5 rounded-xl leading-relaxed mb-2.5">
                <strong>How to unlock:</strong> Go to the <strong>AI Matching Portal</strong> tab, input your exact needs, and our model will supply you with a secure direct gateway link.
              </div>
            </div>
          ) : (
            /* Active Live Connection Chat Box */
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/20">
                {chatMessages.map((msg) => {
                  const isClient = msg.sender === "client";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isClient ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isClient
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow"
                      }`}>
                        <div className="mb-1 text-[9px] opacity-70 font-mono text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <p className="whitespace-pre-line">{msg.content}</p>

                        {/* File attachment preview */}
                        {msg.file && (
                          <div className="mt-2.5 bg-black/20 rounded-xl p-2.5 flex items-center justify-between gap-3 text-[10px] font-mono border border-white/5">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="truncate max-w-[150px] text-slate-300">{msg.file.name}</span>
                            </div>
                            <span className="opacity-80 text-slate-500 shrink-0">({msg.file.size})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat file indicator queue */}
              {fileToUpload && (
                <div className="bg-blue-500/10 border-t border-blue-500/20 py-2 px-4 flex items-center justify-between text-[11px] text-blue-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Paperclip className="w-3 h-3 text-blue-400" />
                    <span>Queued: <strong>{fileToUpload.name}</strong> ({fileToUpload.size})</span>
                  </div>
                  <button onClick={() => setFileToUpload(null)} className="text-rose-400 font-bold hover:text-rose-300">Cancel</button>
                </div>
              )}

              {/* Send Footer Panel */}
              <form onSubmit={handleSendMessage} className="bg-slate-950 border-t border-slate-805 border-slate-800 p-3 flex items-center gap-2">
                <input
                  type="file"
                  id="chat-file-upload-picker"
                  className="hidden"
                  onChange={simulatedFileUpload}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("chat-file-upload-picker")?.click()}
                  className="p-2.5 text-slate-400 hover:text-blue-400 bg-slate-900 hover:bg-slate-800 rounded-lg transition"
                  title="Share document mockup"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder={`Write a direct message to ${agent.name}...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-500 transition shadow shadow-blue-500/10 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Tab Contents: 4. Direct Collaboration Suite */}
      {activeTab === "collaboration" && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-display text-lg font-bold text-white mb-2">Simulated Collaboration Sync</h3>
          <p className="text-xs text-slate-450 text-slate-400 leading-relaxed mb-6">
            Access secure encrypted messaging pipelines, mock code/file storage systems, and trigger real meetings directly with your counselor.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Consultation Call Box */}
            <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950/40 flex flex-col justify-between">
              <div>
                <Video className="w-6 h-6 text-blue-400 mb-2.5" />
                <h4 className="text-sm font-semibold text-slate-200">Secure WebRTC Video consultation</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Initiate an instant peer-to-peer visual conversation stream right inside the frame workspace to coordinate priorities.
                </p>
              </div>
              <button
                onClick={launchVideoConsultation}
                className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-display text-xs font-semibold rounded-xl transition text-center cursor-pointer shadow shadow-blue-500/10"
              >
                Launch Instant Consultation call
              </button>
            </div>

            {/* Document Sharing Box */}
            <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950/40 flex flex-col justify-between">
              <div>
                <FileText className="w-6 h-6 text-blue-400 mb-2.5" />
                <h4 className="text-sm font-semibold text-slate-200">Document Sharing Vault</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Send system instructions, API keys templates, calendars, or custom PDFs securely. Files are automatically scanned and verified.
                </p>
              </div>
              <button
                onClick={() => {
                  if (activeMatchToken) {
                    setActiveTab("chat");
                  } else {
                    alert("Please activate an AI match gateway link to utilize the document Vault.");
                  }
                }}
                className="mt-6 w-full py-2.5 border border-slate-800 hover:bg-slate-900 text-slate-300 font-display text-xs font-semibold rounded-xl transition text-center cursor-pointer"
              >
                Access Share Vault
              </button>
            </div>
          </div>
        </div>
      )}


      {/* WEBRTC SIMULATED CALL OVERLAY */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-950 text-white border border-slate-800 rounded-3xl overflow-hidden max-w-2xl w-full">
            {/* Call State: Connecting */}
            {videoState === "connecting" && (
              <div className="p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="absolute inset-1 w-14 h-14 rounded-full object-cover"
                  />
                </div>
                <h3 className="font-display font-medium text-lg text-white">Acquiring Secure Line...</h3>
                <p className="text-xs text-slate-450 mt-1">Gating connection through Vesta WebRTC tunnel {agent.id.toUpperCase()}</p>
              </div>
            )}

            {/* Call State: Live */}
            {videoState === "live" && (
              <div className="relative min-h-[380px] bg-slate-900">
                {/* Agent Large Camera Placeholder */}
                <div className="absolute inset-0">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-full h-full object-cover opacity-85 animate-fade-in"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-left">
                    <span className="text-[10px] bg-rose-600 px-2 py-0.5 rounded font-mono font-bold tracking-widest text-white inline-block mb-1.5 leading-none">
                      LIVE STREAM
                    </span>
                    <h3 className="font-display text-lg font-bold text-white">{agent.name} (VA Partner)</h3>
                    <p className="text-xs text-white/70">"Hi! Glad we could connect. Let's outline the core operational bottlenecks today!"</p>
                  </div>
                </div>

                {/* Self Small Camera Overlay */}
                <div className="absolute top-4 right-4 w-28 h-36 bg-slate-950 border border-white/10 rounded-xl overflow-hidden shadow-lg flex items-center justify-center text-center p-2">
                  <div className="text-[9px] text-white/50 leading-normal font-mono">
                    Your WebRTC Channel Active
                  </div>
                </div>

                {/* Meeting Countdown Timer top */}
                <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-full text-xs font-mono select-none">
                  Consultation closes in: <span className="text-blue-400 font-bold">{videoTimer}s</span>
                </div>
              </div>
            )}

            {/* Call State: Ended */}
            {videoState === "ended" && (
              <div className="p-12 text-center min-h-[350px] flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-4">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">Consultation Call Completed</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  The initial secure connection slot has expired. To lock down custom schedules and deliverables packages, proceed with selecting a retainers tier in the scheduler catalog.
                </p>
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Return to Workspace
                </button>
              </div>
            )}

            {/* Footer triggers */}
            {videoState !== "ended" && (
              <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex justify-between items-center text-[11px] font-mono text-slate-500">
                <span>Room Protocol: Vesta-SSLv3_AES-256</span>
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-1.5 rounded-lg transition text-xs cursor-pointer"
                >
                  End Session
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
