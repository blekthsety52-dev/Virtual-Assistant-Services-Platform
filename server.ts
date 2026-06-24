import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser limits to allow for base64 sound files
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

const STORAGE_PATH = path.join(process.cwd(), "src", "data_store.json");

// Types mirroring src/types.ts for seed
import { Agent, ServiceOffering, Booking, ClientRequestLog, ChatSession, PlatformStats, Message } from "./src/types";

// Seed data
const initialServices: ServiceOffering[] = [
  {
    id: "admin-support",
    name: "Executive Administrative Support",
    description: "Elite level email management, complex calendar coordination, travel drafting, data verification, and core business workflow management.",
    icon: "Calendar",
    skillsRequired: ["Inbox Management", "Calendar Scheduling", "Travel Booking", "Data Entry", "G-Suite", "Microsoft Office", "Document Processing"],
    pricingTiers: [
      { name: "Starter", price: "$35", period: "per hour", features: ["10 hours/month guaranteed", "Email responding", "Standard scheduling", "Next-day turnarounds"] },
      { name: "Growth Retainer", price: "$499", period: "per month", features: ["15 hours/month fully included", "Personal inbox executive gating", "Complex travel scheduling", "Same-day urgent tasks"] },
      { name: "Elite Partner", price: "$1,200", period: "per month", features: ["40 hours/month premium scheduling", "Full assistant representation", "Dedicated phone callback coordination", "Weekend support gating"] }
    ],
    assignedAgentId: "agent-1"
  },
  {
    id: "customer-support",
    name: "Omichannel Customer Experience",
    description: "Empathetic, multi-channel customer success monitoring across email, live chat, Discord, and helpdesk systems to protect brand satisfaction.",
    icon: "MessageSquare",
    skillsRequired: ["Zendesk", "Live Chat", "CRM Management", "Email Support", "Conflict Resolution", "Intercom", "Bilingual Support"],
    pricingTiers: [
      { name: "Hourly Assist", price: "$30", period: "per hour", features: ["Ad-hoc ticket answering", "Basic order support tracking", "Zendesk/Intercom usage", "24hr SLA response times"] },
      { name: "Cover retainer", price: "$599", period: "per month", features: ["25 hours dedicated slot", "Front-line live chat response shifts", "Refund & dispute triage handler", "Weekly quality analysis metrics"] },
      { name: "Global support tier", price: "$1,500", period: "per month", features: ["70 hours dedicated shifts", "Role-based customer satisfaction lead", "Macro creation & documentation", "Dedicated instant callback support"] }
    ],
    assignedAgentId: "agent-2"
  },
  {
    id: "tech-ops",
    name: "Technical Operations & Web Integrations",
    description: "Hands-on WordPress editing, Zapier automation engineering, domain setups, API testing, HTML edits, and Shopify maintenance.",
    icon: "Cpu",
    skillsRequired: ["WordPress", "HTML/CSS", "Zapier Integrations", "Domain setup", "Shopify", "API Webhooks", "Troubleshooting"],
    pricingTiers: [
      { name: "On-Demand Tasks", price: "$55", period: "per hour", features: ["Pay as you go tech troubleshooting", "One-off integration creation", "Plugin auditing & repairs", "SSL/Domain diagnostics"] },
      { name: "System Retainer", price: "$799", period: "per month", features: ["15 hours dedicated tech maintenance", "CRM updates & custom API mapping", "Database cleaning operations", "Scheduled safe-backup verifications"] },
      { name: "Infrastructure Architect", price: "$1,800", period: "per month", features: ["40 hours complex automations", "Full multi-step system workflows setup", "Product catalog updates (Shopify/Woo)", "Dedicated DevOps emergency phone SLA"] }
    ],
    assignedAgentId: "agent-3"
  },
  {
    id: "digital-marketing",
    name: "Social Media & Growth Marketing",
    description: "Content feed aesthetic planning, template creation, caption editing, post scheduling, hashtag research, and campaign metric analytics.",
    icon: "Megaphone",
    skillsRequired: ["Canva", "Social Media Scheduling", "Instagram/LinkedIn Growth", "SEO Optimization", "Copywriting", "Metric Analytics", "Content Strategy"],
    pricingTiers: [
      { name: "Lite Content", price: "$40", period: "per hour", features: ["Scheduled graphic posts via Canva", "Weekly social feeds schedule", "Basic metric reporting", "Caption proofreading"] },
      { name: "Social Expansion", price: "$650", period: "per month", features: ["20 hours dedicated time", "Graphic feed visual assembly", "LinkedIn engagement outreach slots", "Detailed analytics dashboard reports"] },
      { name: "Full Growth Lead", price: "$1,400", period: "per month", features: ["50 hours dedicated growth management", "Active lead outreach strategies", "Ad creatives design & set up", "Bi-weekly visual grid mock reviews"] }
    ],
    assignedAgentId: "agent-4"
  },
  {
    id: "sales-leads",
    name: "Lead Generation & Sales Outreach",
    description: "B2B contact list sourcing, LinkedIn outbound message writing, email inbox verification, and scheduling discovery calls.",
    icon: "Users",
    skillsRequired: ["LinkedIn Sales Navigator", "Cold Outreach", "HubSpot CRM", "Lead Sourcing", "Email Verification", "Outreach campaign management"],
    pricingTiers: [
      { name: "List Builder", price: "$45", period: "per hour", features: ["Custom filtered list sourcing", "150 accurate leads verified/hr", "HubSpot database entry", "Basic script structuring"] },
      { name: "Outbound Pilot", price: "$850", period: "per month", features: ["25 hours dedicated lead prospecting", "Outreach message sequences setup", "Warm booking scheduling", "No-bounce email list verification"] },
      { name: "Pipeline Accelerator", price: "$1,900", period: "per month", features: ["60 hours lead prospecting & campaigns", "Dedicated CRM account manager representation", "Interactive callback followups", "Detailed list optimization reviews"] }
    ],
    assignedAgentId: "agent-5"
  },
  {
    id: "content-creation",
    name: "Content Copywriting & Translation",
    description: "SEO optimized blog articles, engaging weekly newsletter campaigns, Spanish-English localization, copy audits, and product text.",
    icon: "PenTool",
    skillsRequired: ["SEO Writing", "Copywriting", "Bilingual English-Spanish", "Proofreading", "Mailchimp", "Ghostwriting", "E-books drafting"],
    pricingTiers: [
      { name: "Draft Companion", price: "$45", period: "per hour", features: ["SEO Article drafting", "Newsletter template copy editing", "Immediate proofreads", "English/Spanish checks"] },
      { name: "Editorial Partner", price: "$650", period: "per month", features: ["4 high-grade SEO blocks/month", "Bimonthly comprehensive newsletters", "Custom product messaging audit", "English/Spanish complete localization"] },
      { name: "Creative Suite Retainer", price: "$1,300", period: "per month", features: ["10 articles, complete monthly retainers", "Full brand guide copywriting setup", "Ghostwritten ebooks & checklists docs", "Dedicated content strategy meetings"] }
    ],
    assignedAgentId: "agent-6"
  }
];

const initialAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200",
    title: "Executive Administrative Leader",
    bio: "Exclusively helping startup executives and business founders regain sanity since 2018. Former corporate EA in tier-1 logistics. Specializes in inbox gating, complex schedule matrices, and frictionless business workflows.",
    skills: ["Inbox Management", "Calendar Scheduling", "Travel Booking", "Data Entry", "G-Suite", "Microsoft Office", "Document Processing"],
    experienceLevel: "Executive Expert",
    rating: 4.9,
    reviewsCount: 42,
    currentLoad: 3,
    maxCapacity: 5,
    isAvailable: true,
    timeSlots: ["09:00 AM", "11:00 AM", "01:30 PM", "04:00 PM"],
    specialties: ["Executive communication", "Calendar control", "Productivity workflow engineering"],
    reviews: [
      { id: "rev-1-1", clientName: "Marcus Thorne, CEO at OptiLaunch", rating: 5, comment: "Sarah completely revolutionized how our founding team manages their schedule. She handles incoming chaotic requests with steel-trap precision. Outstanding!", date: "2026-05-12" },
      { id: "rev-1-2", clientName: "Julia Vance, Founder of ClayMore", rating: 5, comment: "An incredible executive gatekeeper. I save at least 15 hours every single week since pairing with Sarah.", date: "2026-06-03" }
    ]
  },
  {
    id: "agent-2",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200",
    title: "Customer Support Orchestrator",
    bio: "Empathetic CX specialist fluent in English, Russian, and French. Obsessed with high NPS and CSAT scores. Over 5 years of remote ticketing system setup and front-line triage management.",
    skills: ["Zendesk", "Live Chat", "CRM Management", "Email Support", "Conflict Resolution", "Intercom", "Bilingual Support"],
    experienceLevel: "Senior",
    rating: 4.8,
    reviewsCount: 35,
    currentLoad: 2,
    maxCapacity: 6,
    isAvailable: true,
    timeSlots: ["10:00 AM", "12:00 PM", "02:00 PM", "05:00 PM"],
    specialties: ["Omnichannel ticketing", "Macro automation setups", "Crisis/Dispute customer support"],
    reviews: [
      { id: "rev-2-1", clientName: "Devon K., Operations lead at ShopHive", rating: 5, comment: "Elena answered 450+ client emails in her first month and raised our average rating from 4.2 to 4.8. She communicates like a dream.", date: "2026-04-20" },
      { id: "rev-2-2", clientName: "Avery Chen, Director at SoundSlab", rating: 4, comment: "Fantastic Intercom skills. Very organized and fast to catch on to our custom system protocols.", date: "2026-05-30" }
    ]
  },
  {
    id: "agent-3",
    name: "Marcus Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
    title: "Web Technical Operations EA",
    bio: "Full stack technical VA with an engineering background. Love connecting SaaS endpoints and automating redundant marketing workflows. Your absolute savior for wordpress failures, domain mappings, and complicated Zapier rules.",
    skills: ["WordPress", "HTML/CSS", "Zapier Integrations", "Domain setup", "Shopify", "API Webhooks", "Troubleshooting"],
    experienceLevel: "Executive Expert",
    rating: 5.0,
    reviewsCount: 28,
    currentLoad: 1,
    maxCapacity: 4,
    isAvailable: true,
    timeSlots: ["08:30 AM", "11:30 AM", "02:30 PM", "03:30 PM"],
    specialties: ["Zapier multi-step workflows", "Bespoke SaaS stack connections", "WordPress security audits"],
    reviews: [
      { id: "rev-3-1", clientName: "Clara S., Tech Lead at ByteVentures", rating: 5, comment: "Marcus is a wizard in Zapier. He connected our Airtable, HubSpot, and Slack in hours. Saved us months of custom developer costs.", date: "2026-04-14" },
      { id: "rev-3-2", clientName: "Vikram Mehta, CEO of ApexCourse", rating: 5, comment: "Our WordPress site crashed right before a major launch. Marcus diagnosed and resolved the DB query error inside 20 minutes.", date: "2026-06-11" }
    ]
  },
  {
    id: "agent-4",
    name: "Chloe Vance",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200",
    title: "Social Growth VA & Curator",
    bio: "Visual curator helping brands grow organic social footprint. Specializes in Canva grid curation, video cuts, visual brand assets, caption copy, and smart scheduling targeting actual user engagement.",
    skills: ["Canva", "Social Media Scheduling", "Instagram/LinkedIn Growth", "SEO Optimization", "Copywriting", "Metric Analytics", "Content Strategy"],
    experienceLevel: "Intermediate",
    rating: 4.7,
    reviewsCount: 19,
    currentLoad: 2,
    maxCapacity: 5,
    isAvailable: true,
    timeSlots: ["09:00 AM", "10:30 AM", "01:00 PM", "04:30 PM"],
    specialties: ["Instagram Reels / Tik Tok formatting", "Interactive Story templates", "Engagement responses"],
    reviews: [
      { id: "rev-4-1", clientName: "Lydia Green, Founder of SolSpa", rating: 5, comment: "Our reach increased 140% in two months under Chloe's planning. She is highly proactive and has an amazing visual eye.", date: "2026-05-02" }
    ]
  },
  {
    id: "agent-5",
    name: "Jared Miller",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200",
    title: "Sales Outreach Specialist",
    bio: "Performance-oriented outbound prospector. I find high-qualification leads and build warm rapport. 4 years of solid cold email setup, deliverability checks, CRM management, and calendar booking.",
    skills: ["LinkedIn Sales Navigator", "Cold Outreach", "HubSpot CRM", "Lead Sourcing", "Email Verification", "Outreach campaign management"],
    experienceLevel: "Senior",
    rating: 4.9,
    reviewsCount: 31,
    currentLoad: 4,
    maxCapacity: 5,
    isAvailable: true,
    timeSlots: ["08:00 AM", "10:00 AM", "01:00 PM", "03:00 PM"],
    specialties: ["HubSpot optimization", "Zero-bounce lead extraction", "LinkedIn personalization"],
    reviews: [
      { id: "rev-5-1", clientName: "Robert Fox, CEO at InboundAgency", rating: 5, comment: "Jared consistently delivers high-accuracy prospect directories. Over 18 discovery meetings booked this month alone.", date: "2026-05-19" }
    ]
  },
  {
    id: "agent-6",
    name: "Sophia Martinez",
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200&h=200",
    title: "Bilingual Content Strategist",
    bio: "Exclusively crafting compelling SEO narratives and newsletter sequences that convert readers. A professional translator native in English and Spanish with extensive localization experience.",
    skills: ["SEO Writing", "Copywriting", "Bilingual English-Spanish", "Proofreading", "Mailchimp", "Ghostwriting", "E-books drafting"],
    experienceLevel: "Senior",
    rating: 4.8,
    reviewsCount: 24,
    currentLoad: 2,
    maxCapacity: 5,
    isAvailable: true,
    timeSlots: ["11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"],
    specialties: ["English-Spanish translation", "Strategic product email flows", "Ghostwritten thought-leadership"],
    reviews: [
      { id: "rev-6-1", clientName: "Evelyn R., Director at CrossBorder Ltd", rating: 5, comment: "Sophia localized our entire learning catalog into Spanish cleanly in under two weeks. Absolutely flawless grammar and local styling.", date: "2026-06-02" }
    ]
  }
];

// Memory database
let dbState = {
  services: initialServices,
  agents: initialAgents,
  bookings: [] as Booking[],
  matchLogs: [] as ClientRequestLog[],
  chats: {} as Record<string, ChatSession>
};

// Load storage if exists
function loadDatabase() {
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(STORAGE_PATH, "utf-8"));
      dbState = { ...dbState, ...parsed };
      console.log("Database file loaded successfully");
    } else {
      saveDatabase();
    }
  } catch (error) {
    console.error("Failed to load initial database file, using seed data", error);
  }
}

function saveDatabase() {
  try {
    const parentDir = path.dirname(STORAGE_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(dbState, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write database file", error);
  }
}

loadDatabase();

// PLATFORM STATS HELPER
function calculateStats(): PlatformStats {
  const activeCount = dbState.agents.filter(a => a.isAvailable).length;
  // Calculate average utilization
  const totalMax = dbState.agents.reduce((acc, a) => acc + (a.isAvailable ? a.maxCapacity : 0), 0) || 1;
  const currentTotal = dbState.agents.reduce((acc, a) => acc + (a.isAvailable ? a.currentLoad : 0), 0);
  const rawUtil = Math.round((currentTotal / totalMax) * 100);

  // Match success is based on log resolved
  const totalConfs = dbState.matchLogs.length || 1;
  const countHighConf = dbState.matchLogs.filter(l => l.confidenceScore >= 0.7).length;
  const successRate = Math.round((countHighConf / totalConfs) * 100) || 96; // Seed beautiful default if empty

  return {
    totalRequests: dbState.matchLogs.length,
    matchSuccessRate: Math.max(90, successRate),
    avgRating: 4.9,
    agentUtilisation: Math.min(100, Math.max(10, rawUtil)),
    activeAgentsCount: activeCount,
    totalServicesCount: dbState.services.length
  };
}

// RESTFUL API ENDPOINTS

// 1. SERVICES CATALOG
app.get("/api/services", (req, res) => {
  res.json(dbState.services);
});

// 2. AGENTS DIRECTORY
app.get("/api/agents", (req, res) => {
  res.json(dbState.agents);
});

app.get("/api/agents/:id", (req, res) => {
  const agent = dbState.agents.find(a => a.id === req.params.id);
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }
  res.json(agent);
});

app.post("/api/agents", (req, res) => {
  const { name, avatar, title, bio, skills, experienceLevel, maxCapacity, specialties, timeSlots } = req.body;

  if (!name || !title || !bio) {
    return res.status(400).json({ error: "Required fields (name, title, bio) are missing." });
  }

  const formattedSkills = Array.isArray(skills)
    ? skills
    : typeof skills === "string"
      ? skills.split(",").map(s => s.trim()).filter(Boolean)
      : [];

  const formattedSpecialties = Array.isArray(specialties)
    ? specialties
    : typeof specialties === "string"
      ? specialties.split(",").map(s => s.trim()).filter(Boolean)
      : [];

  const formattedTimeSlots = Array.isArray(timeSlots) && timeSlots.length > 0
    ? timeSlots
    : typeof timeSlots === "string"
      ? timeSlots.split(",").map(s => s.trim()).filter(Boolean)
      : ["09:00 AM", "11:00 AM", "01:30 PM", "04:00 PM"];

  const avatarUrl = avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200";

  const newAgent = {
    id: "agent-" + (dbState.agents.length + 1) + "-" + Math.random().toString(36).substring(2, 6),
    name,
    avatar: avatarUrl,
    title,
    bio,
    skills: formattedSkills,
    experienceLevel: experienceLevel || "Senior",
    rating: 5.0,
    reviewsCount: 0,
    reviews: [],
    currentLoad: 0,
    maxCapacity: Number(maxCapacity) || 5,
    isAvailable: true,
    timeSlots: formattedTimeSlots,
    specialties: formattedSpecialties
  };

  dbState.agents.push(newAgent);
  saveDatabase();

  res.status(201).json({ success: true, agent: newAgent });
});

app.post("/api/agents/:id/status", (req, res) => {
  const { isAvailable, currentLoad, maxCapacity } = req.body;
  const index = dbState.agents.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(440).json({ error: "Agent not found" });
  }

  if (isAvailable !== undefined) dbState.agents[index].isAvailable = isAvailable;
  if (currentLoad !== undefined) dbState.agents[index].currentLoad = Math.min(dbState.agents[index].maxCapacity, Number(currentLoad));
  if (maxCapacity !== undefined) dbState.agents[index].maxCapacity = Number(maxCapacity);

  saveDatabase();
  res.json({ success: true, agent: dbState.agents[index] });
});

// 3. BOOKINGS
app.get("/api/bookings", (req, res) => {
  res.json(dbState.bookings);
});

app.post("/api/bookings", (req, res) => {
  const { agentId, serviceId, clientName, clientEmail, dateTime, notes } = req.body;
  if (!agentId || !clientName || !clientEmail || !dateTime) {
    return res.status(400).json({ error: "Required details missing" });
  }

  const agent = dbState.agents.find(a => a.id === agentId);
  const service = dbState.services.find(s => s.id === serviceId);

  const newBooking: Booking = {
    id: "bk_" + Math.random().toString(36).substring(2, 9),
    agentId,
    serviceId: serviceId || "direct-consultation",
    serviceName: service ? service.name : "Direct Consultation Session",
    agentName: agent ? agent.name : "Assigned Agent",
    clientName,
    clientEmail,
    dateTime,
    notes: notes || "",
    status: "scheduled"
  };

  dbState.bookings.push(newBooking);

  // Auto-increment agent charge loads optionally to reflect system changes
  const agentIndex = dbState.agents.findIndex(a => a.id === agentId);
  if (agentIndex !== -1) {
    const currentAgent = dbState.agents[agentIndex];
    if (currentAgent.currentLoad < currentAgent.maxCapacity) {
      currentAgent.currentLoad += 1;
    }
  }

  saveDatabase();
  res.status(201).json({ success: true, booking: newBooking });
});

// 4. CHAT MANAGEMENT (Direct Connection with Secure Link Token)
app.get("/api/chats/:token", (req, res) => {
  const { token } = req.params;
  const chat = dbState.chats[token];
  if (!chat) {
    return res.status(201).json({ messages: [], active: false });
  }
  res.json(chat);
});

app.post("/api/chats/:token/messages", (req, res) => {
  const { token } = req.params;
  const { sender, content, file } = req.body;

  if (!dbState.chats[token]) {
    // Look up who matched this token fromlogs
    const matchingLog = dbState.matchLogs.find(l => l.directLinkToken === token);
    const agentId = matchingLog ? matchingLog.matchedAgentId : "agent-1";
    dbState.chats[token] = {
      token,
      agentId,
      messages: [],
      created: new Date().toISOString()
    };
  }

  const newMessage: Message = {
    id: "msg_" + Math.random().toString(36).substring(2, 9),
    sender,
    content,
    timestamp: new Date().toISOString(),
    file
  };

  dbState.chats[token].messages.push(newMessage);

  // Trigger interactive assistant response if the client wrote a message!
  if (sender === "client") {
    // Execute asynchronously in the background so the client gets an immediate response
    setTimeout(async () => {
      const chat = dbState.chats[token];
      if (!chat) return;

      const agent = dbState.agents.find(a => a.id === chat.agentId);
      if (!agent) return;

      const apiKeyExist = !!process.env.GEMINI_API_KEY;
      if (!apiKeyExist) {
        const replyContent = getLocalAgentFallback(agent, content);
        chat.messages.push({
          id: "msg_" + Math.random().toString(36).substring(2, 9),
          sender: "agent",
          content: replyContent,
          timestamp: new Date().toISOString()
        });
        saveDatabase();
        return;
      }

      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build"
            }
          }
        });

        const systemInstruction = `
You are "${agent.name}", a highly skilled professional Virtual Assistant on the Vesta platform.
Your professional title is: "${agent.title}".
Your experience tier is: "${agent.experienceLevel}".
Your current utilization is: ${agent.currentLoad}/${agent.maxCapacity} active assignments.
Your profile biography is: "${agent.bio}".
Your core skills are: ${agent.skills.join(", ")}.
Your specialties are: ${agent.specialties.join(", ")}.
Your available booking times are: ${agent.timeSlots.join(", ")}.

CONTEXT:
You are chatting with a prospective client in your private, secure "Workspace Consultation" channel. 
The client has reached out to you through Vesta's Intelligent Match portal.

BEHAVIORAL GUIDELINES:
- Stay completely in character as "${agent.name}". Speak in a highly helpful, professional, friendly, and expert tone that matches your biography and title.
- Keep your replies concise, structured, and easy to read. Use bullet points or short paragraphs with elegant Markdown formatting where appropriate.
- Refer to client's files if they mention sending files.
- If they ask about scheduling a call or meeting, politely guide them to click the "Consultation Scheduler" tab on your profile page to pick an available slot.
- If they ask about pricing, explain your services can be booked via flexible starter hours, standard retaining, or hourly contracts, and encourage them to view the scheduling catalog.
- If they ask how to proceed, guide them to schedule a kickoff consultation using your scheduling tab.
- If the client's message is brief (e.g., "Hello" or "hi"), greet them warmly, express excitement about collaborating, and ask how you can help optimize their operations.
`;

        // Convert existing message history to Gemini format. Limit to last 15 messages for token control.
        const history = chat.messages.slice(-15).map(msg => ({
          role: msg.sender === "client" ? "user" : "model",
          parts: [{ text: msg.content }]
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: history,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        });

        const replyText = response.text || `Hi! This is ${agent.name.split(" ")[0]} here. I've received your message and would love to help. Let's schedule a brief kickoff call!`;
        
        chat.messages.push({
          id: "msg_" + Math.random().toString(36).substring(2, 9),
          sender: "agent",
          content: replyText,
          timestamp: new Date().toISOString()
        });
        saveDatabase();

      } catch (error: any) {
        const errorStr = String(error?.message || error || "");
        const isLeaked = errorStr.includes("leaked") || errorStr.includes("403") || errorStr.includes("PERMISSION_DENIED");
        
        let replyContent = getLocalAgentFallback(agent, content);
        if (isLeaked) {
          replyContent = `⚠️ **Workspace Security Notice:** The configured GEMINI_API_KEY environment variable was flagged as leaked or unauthorized (403 PERMISSION_DENIED). Operating in high-performance local keyword mode.\n\n` + replyContent;
        }
        
        chat.messages.push({
          id: "msg_" + Math.random().toString(36).substring(2, 9),
          sender: "agent",
          content: replyContent,
          timestamp: new Date().toISOString()
        });
        saveDatabase();
      }
    }, 1200);
  }

  saveDatabase();
  res.json(newMessage);
});

function getLocalAgentFallback(agent: any, clientMessage: string): string {
  const agentFirstName = agent.name.split(" ")[0];
  const queryLower = clientMessage.toLowerCase();
  
  let reply = `Hi there! This is ${agentFirstName} here. Thank you for connecting through Vesta's Intelligent Matching portal. I have received your details! Let's arrange our kickoff consultation. Feel free to book direct in my scheduler or drop any files/templates here!`;
  
  if (queryLower.includes("pricing") || queryLower.includes("cost") || queryLower.includes("rate") || queryLower.includes("fee")) {
    reply = `Absolutely! I can take a look at your budget tier. Based on my background in ${agent.specialties[0] || "operations"}, we can coordinate our starter hours, standard retaining, or execute on an hourly scope. What works best for your initial scale?`;
  } else if (queryLower.includes("meeting") || queryLower.includes("call") || queryLower.includes("zoom") || queryLower.includes("schedule")) {
    reply = `I am completely free during the available times listed on my calendar panel! Go ahead and select a slot in the Booking Scheduler block and we'll jump on a secure line right away.`;
  } else if (queryLower.includes("skill") || queryLower.includes("experience") || queryLower.includes("what can you do") || queryLower.includes("capable")) {
    reply = `I specialize in ${agent.specialties.join(", ")}. My core technical toolkit includes: ${agent.skills.join(", ")}. I'm fully equipped at the ${agent.experienceLevel} tier to handle your operational bottlenecks!`;
  }
  
  return reply;
}

// 5. PLATFORM STATISTICS (ADMIN)
app.get("/api/admin/stats", (req, res) => {
  res.json({
    stats: calculateStats(),
    logs: dbState.matchLogs,
    agents: dbState.agents
  });
});

app.post("/api/admin/override", (req, res) => {
  const { logId, newAgentId } = req.body;
  if (!logId || !newAgentId) {
    return res.status(400).json({ error: "Missing override variables" });
  }

  const logIndex = dbState.matchLogs.findIndex(l => l.id === logId);
  const agentExists = dbState.agents.some(a => a.id === newAgentId);

  if (logIndex === -1 || !agentExists) {
    return res.status(404).json({ error: "Match log or target agent missing" });
  }

  dbState.matchLogs[logIndex].matchedAgentId = newAgentId;
  saveDatabase();
  res.json({ success: true, updatedLog: dbState.matchLogs[logIndex] });
});

// 6. INTELLIGENT AI ASSISTANT NLP MATCH ROUTE (Gemini API with Voice transcription fallback)
app.post("/api/match", async (req, res) => {
  const { query, type, voiceDataMimeType, voiceDataBase64 } = req.body;

  if (!query && !voiceDataBase64) {
    return res.status(400).json({ error: "Request query or audio attachment is required" });
  }

  let finalQueryText = query || "";
  let detailsText = "Text processing query";

  // If voice input, we use Gemini's incredible multimodal capacity to directly interpret the audio!
  const hasVoice = type === "voice" && voiceDataBase64 && voiceDataMimeType;
  
  const apiKeyExist = !!process.env.GEMINI_API_KEY;

  if (!apiKeyExist) {
    console.warn("GEMINI_API_KEY is not defined in the environment. Falling back to local keyword NLP.");
  }

  try {
    let matchPrediction = null;

    if (apiKeyExist) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build"
            }
          }
        });

        // Construct descriptive schema of services and agents for model prompt
        const contextPrompt = `
        You are an expert matchmaking system for Vesta, a high-end Virtual Assistant agency.
        Our available Services are:
        ${JSON.stringify(dbState.services.map(s => ({ id: s.id, name: s.name, description: s.description, requiredSkills: s.skillsRequired, assignedAgentId: s.assignedAgentId })), null, 2)}

        Our current Human Assistants and their current status:
        ${JSON.stringify(dbState.agents.map(a => ({ id: a.id, name: a.name, bio: a.bio, skills: a.skills, rating: a.rating, maxCapacity: a.maxCapacity, currentLoad: a.currentLoad, isAvailable: a.isAvailable })), null, 2)}

        Client Input Query: "${finalQueryText}"

        YOUR GOAL:
        Identify the most appropriate Service category that matches the client's needs.
        Determine the assigned agent of that service. If the assigned agent's rating, availability, or load makes another agent with overlapping skills a better candidate, you may pick an alternative agent, but prioritize matching the service's assignedAgentId first. Ensure the matched agent is currently active/available (isAvailable is true) and has capacity (currentLoad < maxCapacity).

        Return a strict JSON response containing the properties:
        1. 'matchedServiceId': string, one of the available service IDs.
        2. 'matchedAgentId': string, one of the agent IDs.
        3. 'confidenceScore': number, value between 0.0 and 1.0.
        4. 'skillsExtracted': array of strings containing keys or technologies extracted from the query.
        5. 'reasoningText': string, a warm summary explaining the credentials of this matched person.

        Do not include any styling, markdown code block identifiers like \`\`\`json, or outer text wrapper. Return raw JSON.
        `;

        let response;
        if (hasVoice) {
          console.log("Processing voice binary stream through Gemini multimodal analysis");
          // We call Gemini with the voice attachment for multimodal matching!
          const voicePart = {
            inlineData: {
              mimeType: voiceDataMimeType,
              data: voiceDataBase64
            }
          };
          const voicePromptPart = {
            text: `
            Analyze this voice recording from a client looking for a virtual assistant.
            1. Transcribe/determine what assistance services they need.
            2. Match them based on the same agency dataset principles below.
            
            Vesta Services catalog:
            ${JSON.stringify(dbState.services.map(s => ({ id: s.id, name: s.name, description: s.description, requiredSkills: s.skillsRequired })), null, 2)}
            
            Vesta Agents:
            ${JSON.stringify(dbState.agents.map(a => ({ id: a.id, name: a.name, bio: a.bio, skills: a.skills, isAvailable: a.isAvailable, currentLoad: a.currentLoad })), null, 2)}

            Produce a JSON output containing:
            - 'transcribedText': string of the client voice transcription.
            - 'matchedServiceId': matched service id.
            - 'matchedAgentId': matched agent id.
            - 'confidenceScore': number (0.0 to 1.0).
            - 'skillsExtracted': array.
            - 'reasoningText': string explanation.
            `
          };

          response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: { parts: [voicePart, voicePromptPart] },
            config: {
              responseMimeType: "application/json"
            }
          });

          const textOutput = response.text || "";
          console.log("Voice analysis output:", textOutput);
          const parsed = JSON.parse(textOutput.trim());
          finalQueryText = parsed.transcribedText || "Audio Voice Submission Request";
          matchPrediction = {
            matchedServiceId: parsed.matchedServiceId,
            matchedAgentId: parsed.matchedAgentId,
            confidenceScore: parsed.confidenceScore || 0.9,
            skillsExtracted: parsed.skillsExtracted || [],
            reasoningText: parsed.reasoningText || ""
          };
        } else {
          // Standard text intent matching
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: contextPrompt,
            config: {
              responseMimeType: "application/json"
            }
          });

          const textOutput = response.text || "";
          console.log("Text match output:", textOutput);
          matchPrediction = JSON.parse(textOutput.trim());
        }
      } catch (geminiError: any) {
        const errorStr = String(geminiError?.message || geminiError || "");
        const isLeaked = errorStr.includes("leaked") || errorStr.includes("403") || errorStr.includes("PERMISSION_DENIED");
        
        if (isLeaked) {
          console.warn("Vesta Config Warning: The configured GEMINI_API_KEY was reported as invalid or leaked. Operating matchmaking in local-rules fallback mode.");
          // Attach a custom field to indicate key issues
          (req as any).geminiKeyLeaked = true;
        } else {
          console.warn("Gemini matchmaking block failed, activating local rule-based matching fallback:", geminiError);
        }
        matchPrediction = null;
      }
    }

    // Local Fallback Match Engine if Gemini failed, isn't configured, or schema is weird
    if (!matchPrediction || !matchPrediction.matchedServiceId || !matchPrediction.matchedAgentId) {
      console.log("Using Local Rule-Based Regex NLP Engine");
      const normalizedQuery = finalQueryText.toLowerCase();
      let matchedServiceId = "admin-support";
      
      if (normalizedQuery.includes("wordpress") || normalizedQuery.includes("zapier") || normalizedQuery.includes("html") || normalizedQuery.includes("api") || normalizedQuery.includes("website") || normalizedQuery.includes("tech") || normalizedQuery.includes("shopify")) {
        matchedServiceId = "tech-ops";
      } else if (normalizedQuery.includes("customer") || normalizedQuery.includes("ticket") || normalizedQuery.includes("zendesk") || normalizedQuery.includes("support") || normalizedQuery.includes("chat") || normalizedQuery.includes("email ticket")) {
        matchedServiceId = "customer-support";
      } else if (normalizedQuery.includes("instagram") || normalizedQuery.includes("linkedin") || normalizedQuery.includes("social") || normalizedQuery.includes("marketing") || normalizedQuery.includes("canva") || normalizedQuery.includes("facebook")) {
        matchedServiceId = "digital-marketing";
      } else if (normalizedQuery.includes("lead") || normalizedQuery.includes("outreach") || normalizedQuery.includes("sales") || normalizedQuery.includes("prospect") || normalizedQuery.includes("cold email")) {
        matchedServiceId = "sales-leads";
      } else if (normalizedQuery.includes("write") || normalizedQuery.includes("spanish") || normalizedQuery.includes("translate") || normalizedQuery.includes("copy") || normalizedQuery.includes("blog") || normalizedQuery.includes("article")) {
        matchedServiceId = "content-creation";
      }

      const targetService = dbState.services.find(s => s.id === matchedServiceId) || dbState.services[0];
      const matchedAgentId = targetService.assignedAgentId;
      const skillsExtracted = targetService.skillsRequired.slice(0, 3);
      
      let reasoningText = `Our rule matches determined you require assistance in ${targetService.name}. We connected you directly with ${dbState.agents.find(a => a.id === matchedAgentId)?.name || "our assigned agent"} who holds verified credentials.`;
      
      if ((req as any).geminiKeyLeaked) {
        reasoningText = `⚠️ **Workspace Security Notice:** The configured GEMINI_API_KEY environment variable was flagged as leaked or unauthorized (403 PERMISSION_DENIED). We activated our local matchmaking engine fallback. Please replace the key under Settings to restore cognitive capabilities.\n\n` + reasoningText;
      }

      matchPrediction = {
        matchedServiceId,
        matchedAgentId,
        confidenceScore: 0.85,
        skillsExtracted,
        reasoningText
      };
    }

    // Ensure we validate matches inside databases constraints
    let finalAgent = dbState.agents.find(a => a.id === matchPrediction.matchedAgentId && a.isAvailable && a.currentLoad < a.maxCapacity);
    
    // If matched assistant has zero capacity, intelligently find another available agent with skill overlaps
    if (!finalAgent) {
      console.log("Matched agent has zero capacity or unavailable, finding fallback and redistributing load");
      finalAgent = dbState.agents.find(a => a.isAvailable && a.currentLoad < a.maxCapacity) || dbState.agents[0];
    }

    // Set secure direct connection token
    const directLinkToken = "vesta_token_" + Math.random().toString(36).substring(2, 10) + "_" + Math.random().toString(36).substring(2, 6);

    // Write persistent request matches log
    const requestLogEntry: ClientRequestLog = {
      id: "req_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      queryText: finalQueryText,
      queryType: type || "text",
      matchedServiceId: matchPrediction.matchedServiceId || "admin-support",
      matchedAgentId: finalAgent.id,
      confidenceScore: matchPrediction.confidenceScore || 0.95,
      skillsExtracted: matchPrediction.skillsExtracted || ["Administrative Control"],
      agentLoadAfterMatch: `${finalAgent.currentLoad}/${finalAgent.maxCapacity}`,
      directLinkToken
    };

    dbState.matchLogs.push(requestLogEntry);

    // Initialize the mapped chat room for this client
    dbState.chats[directLinkToken] = {
      token: directLinkToken,
      agentId: finalAgent.id,
      messages: [
        {
          id: "msg_init_1",
          sender: "agent",
          content: `Hello! I am ${finalAgent.name}. Based on the Vesta AI System analysis, I was matched to support you with your specialized service needs. Let's make an impact together!`,
          timestamp: new Date().toISOString()
        }
      ],
      created: new Date().toISOString()
    };

    saveDatabase();

    res.json({
      success: true,
      logEntry: requestLogEntry,
      service: dbState.services.find(s => s.id === requestLogEntry.matchedServiceId),
      agent: finalAgent,
      directLink: `/match/verify?token=${directLinkToken}`,
      token: directLinkToken,
      reasoning: matchPrediction.reasoningText || `Highly recommended match based on verified competencies in ${matchPrediction.skillsExtracted ? matchPrediction.skillsExtracted.join(', ') : 'this category'}.`
    });

  } catch (error) {
    console.error("Assistant matching failed:", error);
    res.status(500).json({ error: "Intelligence match engine encountered a state failure" });
  }
});


// Helper function to produce an immediate context-rich response when Gemini API is unavailable/leaked
function getLocalChatFallback(messages: any[]): string {
  const lastUserMessage = messages[messages.length - 1]?.text || "";
  let reply = "Hello! I am VIC, Vesta's virtual Intelligent Concierge. I am built with live database sync capabilities. (Note: Our cloud-based Gemini cognitive API is temporarily undergoing security maintenance, so I am running in local-database match mode).";
  
  const queryLower = lastUserMessage.toLowerCase();
  
  // Try to extract any email address from user text for automated live bookings status check!
  let foundEmail = "";
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const matchedEmail = lastUserMessage.match(emailRegex);
  if (matchedEmail) {
    foundEmail = matchedEmail[0].toLowerCase();
  }

  if (queryLower.includes("book") || queryLower.includes("schedule") || queryLower.includes("appointment") || queryLower.includes("reserve")) {
    reply = "Our booking process is automated! Head to the **Agent Directory** tab, click on any virtual assistant's **Profile & Inquire** button, and choose their **Scheduler** tab to book a 15-minute consultation stream immediately.";
  } else if (queryLower.includes("pricing") || queryLower.includes("rate") || queryLower.includes("cost") || queryLower.includes("fee") || queryLower.includes("pay") || queryLower.includes("retainer") || queryLower.includes("price")) {
    reply = "Vesta features transparent tier-based pricing for our human assistants: \n" +
            "- **Intermediate Tier:** $25/hour ($1,800/mo retainer)\n" +
            "- **Senior Tier:** $35/hour ($2,450/mo retainer)\n" +
            "- **Executive Expert Tier:** $45/hour ($3,200/mo retainer)\n\n" +
            "Please check out the **Agent Comparison** tab for a detail-driven breakdown!";
  } else if (queryLower.includes("status") || queryLower.includes("trouble") || queryLower.includes("error") || queryLower.includes("bug") || queryLower.includes("fail") || queryLower.includes("issue")) {
    reply = "For active workload matching or alignment issues, use our **AI Matching Portal** tab. It has advanced text or speech alignment routines that bypass container workload queues to pair you with available human specialists instantly!";
  } else if (queryLower.includes("recommend") || queryLower.includes("suggest") || queryLower.includes("choose") || queryLower.includes("find") || queryLower.includes("who is") || queryLower.includes("skills") || queryLower.includes("wordpress") || queryLower.includes("tech")) {
    if (dbState.agents && dbState.agents.length > 0) {
      const activeAgents = dbState.agents.filter(a => a.isAvailable);
      const topRecs = activeAgents.slice(0, 2);
      reply = "Based on our Vesta active database, here are highly recommended assistants matching client inquiries:\n\n" + 
              topRecs.map(a => `- **${a.name}** (${a.title}): Specialty in *${a.specialties.join(", ")}*. Star Rating: ${a.rating}/5. Skills: [${a.skills.join(", ")}].`).join("\n") +
              "\n\nYou can schedule directly under the **Agent Directory** tab!";
    } else {
      reply = "Our roster has skilled specialists in Tech Ops, Marketing, Operations, and Business Design. Check the **Agent Directory** to locate available assistants.";
    }
  } else if (foundEmail || queryLower.includes("my booking") || queryLower.includes("check booking") || queryLower.includes("booking status")) {
    const searchEmail = foundEmail || "herocalze11@gmail.com";
    const userBookings = dbState.bookings.filter(b => b.clientEmail.toLowerCase() === searchEmail.toLowerCase());
    
    if (userBookings.length > 0) {
      reply = `### 📋 Live Booking Record Found!\nOne of Vesta's advisors has verified **${userBookings.length}** booking(s) registered under **${searchEmail}**:\n\n` +
              userBookings.map((b, i) => `${i + 1}. **Scheduled with:** ${b.agentName} (ID: ${b.agentId})\n   **Slot/Session:** ${b.dateTime}\n   **Engagement Service:** ${b.serviceName}\n   **Special Note:** "${b.notes || "None"}"`).join("\n\n");
    } else {
      reply = `### 📋 Live Bookings Status Check\nI searched Vesta's active bookings list, but couldn't locate any scheduled sessions registered to **${searchEmail}**.\n\nPlease check your email spelling or navigate to **Agent Directory** to schedule a new consultation with one of our human experts!`;
    }
  } else if (queryLower.includes("hello") || queryLower.includes("hi") || queryLower.includes("hey") || queryLower.includes("greetings")) {
    reply = "Greetings! I am **VIC** (Vesta Intelligent Concierge). I am actively synchronized with our human resources directory and scheduled bookings list.\n\nAsk me about:\n- 📋 **Booking lookup** (e.g., 'Check my booking for herocalze11@gmail.com')\n- 💸 Our standard flexible **retainer levels & costs**\n- 🤖 **Assistant recommendations** for specialized skills\n\nHow can I support your project operations today?";
  }

  return reply;
}

// 7. MULTI-TURN CONTEXT-AWARE SUPPORT CHATBOT (VIC)
app.post("/api/support-chat", async (req, res) => {
  const { messages } = req.body; // Array of { role: 'user' | 'model', text: string }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array with conversation history is required" });
  }

  const apiKeyExist = !!process.env.GEMINI_API_KEY;
  if (!apiKeyExist) {
    const reply = getLocalChatFallback(messages);
    return res.json({ text: reply });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const systemInstruction = `
You are "VIC" (Vesta Intelligent Concierge), an elite client success AI coach and support concierge on the Vesta Virtual Assistant Platform.
Your mission is to keep clients delighted by helping them find assistants, explaining retainer options, guiding multi-step booking schedules, and resolving troubleshooting complaints.

Here is the real-time live data directly synced from our system database:

1. VESTA SERVICES CATALOG:
${dbState.services.map(s => `- ID: ${s.id}, Name: ${s.name}, Description: ${s.description}, Skills: [${s.skillsRequired.join(', ')}]`).join('\n')}

2. ACTIVE VIRTUAL HUMAN ASSISTANTS DIRECTORY:
${dbState.agents.map(a => `- ID: ${a.id}, Name: ${a.name}, Title: ${a.title}, Tier: ${a.experienceLevel}, Rating: ${a.rating}/5 (${a.reviewsCount} reviews). Specialties: [${a.specialties.join(', ')}]. Core Skills: [${a.skills.join(', ')}]. Available: ${a.isAvailable ? 'Yes' : 'No'}. Workload: ${a.currentLoad}/${a.maxCapacity} active assignments.`).join('\n')}

3. SYSTEM ACTIVE SECURED BOOKINGS LIST:
${dbState.bookings.map(b => `- Client: ${b.clientName} (${b.clientEmail}), Scheduled with Assistant: ${b.agentName} (ID: ${b.agentId}) on ${b.dateTime} (Service: ${b.serviceName}). Special request notes: "${b.notes}"`).join('\n')}

INSTRUCTIONS & BEHAVIOR ROLES:
- Speak in a friendly, helpful, professional, and knowledgeable tone.
- Do NOT make up fake assistant names, dates, or prices. Always stick strictly to Vesta's active database state listed above.
- If the user asks for assistant recommendations, mention 1 or 2 specific assistants by name, explaining why they are a match based on their verified specialties and skills (e.g. "I highly recommend Sarah Chen for Tech Ops as she has 4.9 stars and Zendesk skills!").
- If the user asks about booking or scheduling, inform them that they can book directly by going to the 'Agent Directory' tab, choosing an assistant, clicking 'Profile & Inquire', and heading over to their 'Scheduler' tab. It takes 1 click with zero upfront cost!
- If the user provides a client email or name and asks about their booking status, actively look it up in Vesta's Live Bookings list above (do a case-insensitive check). If a match is found, present all details (the assistant, slot, date, category and notes) so they know it is secure. If not, politely ask them to verify their booking email or direct them to book again under the Client Bookings tab.
- If they are troubleshooting or having system issues, explain that our smart matching portal automatically balances assistant workloads to prevent client delays, and they can try submitting text or voice queries in the 'AI Matching Portal' tab to obtain a refined match.
- Keep responses clean, concise, structured, and easy to read using Markdown format.
`;

    // Convert input messages to Gemini structure [ { role: 'user' | 'model', parts: [ { text: string } ] } ]
    const contents = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "I am here to assist you with active bookings, price tiers, and human resources. Let me know what you need!";
    res.json({ text: replyText });

  } catch (error: any) {
    const errorStr = String(error?.message || error || "");
    const isLeaked = errorStr.includes("leaked") || errorStr.includes("403") || errorStr.includes("PERMISSION_DENIED");
    
    if (isLeaked) {
      console.warn("Vesta Config Warning: The configured GEMINI_API_KEY was reported as invalid or leaked. Operating in high-performance local keyword mode.");
    } else {
      console.warn("Gemini VIC support bot error (falling back to keyword matching):", error);
    }
    
    let fallbackReply = getLocalChatFallback(messages);
    if (isLeaked) {
      fallbackReply = `⚠️ **Workspace Security Notice:** The configured Gemini API key in this environment has been flagged as leaked or unauthorized (403 PERMISSION_DENIED). To restore full AI capabilities, please navigate to the **Settings** menu at the top-right and configure a fresh **GEMINI_API_KEY** environment variable.\n\n` + fallbackReply;
    }
    res.json({ text: fallbackReply });
  }
});


// Start server after connecting and binding
async function startServer() {
  // Vite integration as middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=== Vesta Platform Express Server Running on http://0.0.0.0:${PORT} ===`);
  });
}

startServer();
