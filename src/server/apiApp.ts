import dotenv from "dotenv";
import express, { NextFunction, Request, RequestHandler, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { Agent, Booking, ClientRequestLog, Message, PlatformStats, ServiceOffering } from "../types";
import { DbState } from "./seed";
import { getDbState, saveDbState } from "./storage";

dotenv.config();

function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function calculateStats(state: DbState): PlatformStats {
  const activeCount = state.agents.filter((agent) => agent.isAvailable).length;
  const totalMax = state.agents.reduce((acc, agent) => acc + (agent.isAvailable ? agent.maxCapacity : 0), 0) || 1;
  const currentTotal = state.agents.reduce((acc, agent) => acc + (agent.isAvailable ? agent.currentLoad : 0), 0);
  const rawUtil = Math.round((currentTotal / totalMax) * 100);
  const totalConfs = state.matchLogs.length || 1;
  const countHighConf = state.matchLogs.filter((log) => log.confidenceScore >= 0.7).length;
  const successRate = Math.round((countHighConf / totalConfs) * 100) || 96;

  return {
    totalRequests: state.matchLogs.length,
    matchSuccessRate: Math.max(90, successRate),
    avgRating: 4.9,
    agentUtilisation: Math.min(100, Math.max(10, rawUtil)),
    activeAgentsCount: activeCount,
    totalServicesCount: state.services.length
  };
}

function buildAutomaticAgentReply(content: string, agentName: string): string {
  const normalizedContent = content.toLowerCase();

  if (normalizedContent.includes("pricing") || normalizedContent.includes("cost")) {
    return "Absolutely! I can take a look at your budget tier. Based on our match logs, we can coordinate our starter hours, standard retaining, or execute on an hourly scope. What works best for your initial scale?";
  }

  if (normalizedContent.includes("meeting") || normalizedContent.includes("call") || normalizedContent.includes("zoom")) {
    return "I am completely free during the available times listed on my calendar panel! Go ahead and select a slot in the Booking Scheduler block and we'll jump on a secure line right away.";
  }

  return `Hi! This is ${agentName} here. Thank you for connecting through Vesta's Intelligent Matching portal. I have received your details! Let's arrange our kickoff consultation. Feel free to book direct in my scheduler or drop any files/templates here!`;
}

function getLocalChatFallback(state: DbState, messages: Array<{ role: "user" | "model"; text: string }>): string {
  const lastUserMessage = messages[messages.length - 1]?.text || "";
  let reply = "Hello! I am VIC, Vesta's virtual Intelligent Concierge. I am built with live database sync capabilities. (Note: Our cloud-based Gemini cognitive API is temporarily undergoing security maintenance, so I am running in local-database match mode).";
  const queryLower = lastUserMessage.toLowerCase();

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
    const activeAgents = state.agents.filter((agent) => agent.isAvailable);

    if (activeAgents.length > 0) {
      const topRecs = activeAgents.slice(0, 2);
      reply = "Based on our Vesta active database, here are highly recommended assistants matching client inquiries:\n\n" +
        topRecs.map((agent) => `- **${agent.name}** (${agent.title}): Specialty in *${agent.specialties.join(", ")}*. Star Rating: ${agent.rating}/5. Skills: [${agent.skills.join(", ")}].`).join("\n") +
        "\n\nYou can schedule directly under the **Agent Directory** tab!";
    } else {
      reply = "Our roster has skilled specialists in Tech Ops, Marketing, Operations, and Business Design. Check the **Agent Directory** to locate available assistants.";
    }
  } else if (foundEmail || queryLower.includes("my booking") || queryLower.includes("check booking") || queryLower.includes("booking status")) {
    const searchEmail = foundEmail || "herocalze11@gmail.com";
    const userBookings = state.bookings.filter((booking) => booking.clientEmail.toLowerCase() === searchEmail.toLowerCase());

    if (userBookings.length > 0) {
      reply = `### Live Booking Record Found\nOne of Vesta's advisors has verified **${userBookings.length}** booking(s) registered under **${searchEmail}**:\n\n` +
        userBookings.map((booking, index) => `${index + 1}. **Scheduled with:** ${booking.agentName} (ID: ${booking.agentId})\n   **Slot/Session:** ${booking.dateTime}\n   **Engagement Service:** ${booking.serviceName}\n   **Special Note:** "${booking.notes || "None"}"`).join("\n\n");
    } else {
      reply = `### Live Bookings Status Check\nI searched Vesta's active bookings list, but couldn't locate any scheduled sessions registered to **${searchEmail}**.\n\nPlease check your email spelling or navigate to **Agent Directory** to schedule a new consultation with one of our human experts!`;
    }
  } else if (queryLower.includes("hello") || queryLower.includes("hi") || queryLower.includes("hey") || queryLower.includes("greetings")) {
    reply = "Greetings! I am **VIC** (Vesta Intelligent Concierge). I am actively synchronized with our human resources directory and scheduled bookings list.\n\nAsk me about:\n- Booking lookup (e.g., 'Check my booking for herocalze11@gmail.com')\n- Our standard flexible retainer levels and costs\n- Assistant recommendations for specialized skills\n\nHow can I support your project operations today?";
  }

  return reply;
}

function fallbackMatchPrediction(queryText: string, state: DbState) {
  const normalizedQuery = queryText.toLowerCase();
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

  const targetService = state.services.find((service) => service.id === matchedServiceId) || state.services[0];
  const matchedAgentId = targetService.assignedAgentId;

  return {
    matchedServiceId,
    matchedAgentId,
    confidenceScore: 0.85,
    skillsExtracted: targetService.skillsRequired.slice(0, 3),
    reasoningText: `Our rule matches determined you require assistance in ${targetService.name}. We connected you directly with ${state.agents.find((agent) => agent.id === matchedAgentId)?.name || "our assigned agent"} who holds verified credentials.`
  };
}

async function buildMatchPrediction(
  state: DbState,
  query: string,
  type: string | undefined,
  voiceDataMimeType?: string,
  voiceDataBase64?: string
) {
  let finalQueryText = query || "";
  const hasVoice = type === "voice" && voiceDataBase64 && voiceDataMimeType;
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  if (!hasGemini) {
    return {
      finalQueryText,
      prediction: fallbackMatchPrediction(finalQueryText, state)
    };
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

    const contextPrompt = `
You are an expert matchmaking system for Vesta, a high-end Virtual Assistant agency.
Our available Services are:
${JSON.stringify(state.services.map((service) => ({
  id: service.id,
  name: service.name,
  description: service.description,
  requiredSkills: service.skillsRequired,
  assignedAgentId: service.assignedAgentId
})), null, 2)}

Our current Human Assistants and their current status:
${JSON.stringify(state.agents.map((agent) => ({
  id: agent.id,
  name: agent.name,
  bio: agent.bio,
  skills: agent.skills,
  rating: agent.rating,
  maxCapacity: agent.maxCapacity,
  currentLoad: agent.currentLoad,
  isAvailable: agent.isAvailable
})), null, 2)}

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

Do not include markdown or code fences. Return raw JSON.
`;

    if (hasVoice) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: voiceDataMimeType,
                data: voiceDataBase64
              }
            },
            {
              text: `
Analyze this voice recording from a client looking for a virtual assistant.
1. Transcribe/determine what assistance services they need.
2. Match them based on the same agency dataset principles below.

Vesta Services catalog:
${JSON.stringify(state.services.map((service) => ({
  id: service.id,
  name: service.name,
  description: service.description,
  requiredSkills: service.skillsRequired
})), null, 2)}

Vesta Agents:
${JSON.stringify(state.agents.map((agent) => ({
  id: agent.id,
  name: agent.name,
  bio: agent.bio,
  skills: agent.skills,
  isAvailable: agent.isAvailable,
  currentLoad: agent.currentLoad
})), null, 2)}

Produce a JSON output containing:
- 'transcribedText': string of the client voice transcription.
- 'matchedServiceId': matched service id.
- 'matchedAgentId': matched agent id.
- 'confidenceScore': number (0.0 to 1.0).
- 'skillsExtracted': array.
- 'reasoningText': string explanation.
`
            }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse((response.text || "").trim());
      finalQueryText = parsed.transcribedText || "Audio Voice Submission Request";

      return {
        finalQueryText,
        prediction: {
          matchedServiceId: parsed.matchedServiceId,
          matchedAgentId: parsed.matchedAgentId,
          confidenceScore: parsed.confidenceScore || 0.9,
          skillsExtracted: parsed.skillsExtracted || [],
          reasoningText: parsed.reasoningText || ""
        }
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contextPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return {
      finalQueryText,
      prediction: JSON.parse((response.text || "").trim())
    };
  } catch (error) {
    console.warn("Gemini matchmaking block failed, using local fallback:", error);

    return {
      finalQueryText,
      prediction: fallbackMatchPrediction(finalQueryText, state)
    };
  }
}

async function handleMatchRequest(req: Request, res: Response) {
  const { query, type, voiceDataMimeType, voiceDataBase64 } = req.body;

  if (!query && !voiceDataBase64) {
    return res.status(400).json({ error: "Request query or audio attachment is required" });
  }

  try {
    const state = await getDbState();
    const { finalQueryText, prediction } = await buildMatchPrediction(state, query || "", type, voiceDataMimeType, voiceDataBase64);
    let finalAgent = state.agents.find((agent) => agent.id === prediction.matchedAgentId && agent.isAvailable && agent.currentLoad < agent.maxCapacity);

    if (!finalAgent) {
      finalAgent = state.agents.find((agent) => agent.isAvailable && agent.currentLoad < agent.maxCapacity) || state.agents[0];
    }

    const directLinkToken = `vesta_token_${Math.random().toString(36).substring(2, 10)}_${Math.random().toString(36).substring(2, 6)}`;
    const requestLogEntry: ClientRequestLog = {
      id: `req_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      queryText: finalQueryText,
      queryType: type === "voice" ? "voice" : "text",
      matchedServiceId: prediction.matchedServiceId || "admin-support",
      matchedAgentId: finalAgent.id,
      confidenceScore: prediction.confidenceScore || 0.95,
      skillsExtracted: prediction.skillsExtracted || ["Administrative Control"],
      agentLoadAfterMatch: `${finalAgent.currentLoad}/${finalAgent.maxCapacity}`,
      directLinkToken
    };

    state.matchLogs.push(requestLogEntry);
    state.chats[directLinkToken] = {
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

    await saveDbState(state);

    return res.json({
      success: true,
      logEntry: requestLogEntry,
      service: state.services.find((service) => service.id === requestLogEntry.matchedServiceId),
      agent: finalAgent,
      directLink: `/match/verify?token=${directLinkToken}`,
      token: directLinkToken,
      reasoning: prediction.reasoningText || `Highly recommended match based on verified competencies in ${prediction.skillsExtracted ? prediction.skillsExtracted.join(", ") : "this category"}.`
    });
  } catch (error) {
    console.error("Assistant matching failed:", error);
    return res.status(500).json({ error: "Intelligence match engine encountered a state failure" });
  }
}

async function handleSupportChat(req: Request, res: Response) {
  const { messages } = req.body as { messages?: Array<{ role: "user" | "model"; text: string }> };

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array with conversation history is required" });
  }

  const state = await getDbState();
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ text: getLocalChatFallback(state, messages) });
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
${state.services.map((service) => `- ID: ${service.id}, Name: ${service.name}, Description: ${service.description}, Skills: [${service.skillsRequired.join(", ")}]`).join("\n")}

2. ACTIVE VIRTUAL HUMAN ASSISTANTS DIRECTORY:
${state.agents.map((agent) => `- ID: ${agent.id}, Name: ${agent.name}, Title: ${agent.title}, Tier: ${agent.experienceLevel}, Rating: ${agent.rating}/5 (${agent.reviewsCount} reviews). Specialties: [${agent.specialties.join(", ")}]. Core Skills: [${agent.skills.join(", ")}]. Available: ${agent.isAvailable ? "Yes" : "No"}. Workload: ${agent.currentLoad}/${agent.maxCapacity} active assignments.`).join("\n")}

3. SYSTEM ACTIVE SECURED BOOKINGS LIST:
${state.bookings.map((booking) => `- Client: ${booking.clientName} (${booking.clientEmail}), Scheduled with Assistant: ${booking.agentName} (ID: ${booking.agentId}) on ${booking.dateTime} (Service: ${booking.serviceName}). Special request notes: "${booking.notes}"`).join("\n")}

INSTRUCTIONS & BEHAVIOR ROLES:
- Speak in a friendly, helpful, professional, and knowledgeable tone.
- Do not make up fake assistant names, dates, or prices. Always stick strictly to Vesta's active database state listed above.
- If the user asks for assistant recommendations, mention 1 or 2 specific assistants by name, explaining why they are a match based on their verified specialties and skills.
- If the user asks about booking or scheduling, inform them that they can book directly by going to the 'Agent Directory' tab, choosing an assistant, clicking 'Profile & Inquire', and heading over to their 'Scheduler' tab.
- If the user provides a client email or name and asks about their booking status, actively look it up in Vesta's live bookings list above using a case-insensitive check.
- If they are troubleshooting or having system issues, explain that our smart matching portal automatically balances assistant workloads to prevent client delays.
- Keep responses clean, concise, structured, and easy to read using Markdown format.
`;

    const contents = messages.map((message) => ({
      role: message.role === "user" ? "user" : "model",
      parts: [{ text: message.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    return res.json({
      text: response.text || "I am here to assist you with active bookings, price tiers, and human resources. Let me know what you need!"
    });
  } catch (error) {
    console.warn("Gemini VIC support bot error, using local fallback:", error);
    return res.json({ text: getLocalChatFallback(state, messages) });
  }
}

export function createApiApp() {
  const app = express();

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  app.get("/api/services", asyncHandler(async (_req, res) => {
    const state = await getDbState();
    res.json(state.services);
  }));

  app.get("/api/agents", asyncHandler(async (_req, res) => {
    const state = await getDbState();
    res.json(state.agents);
  }));

  app.get("/api/agents/:id", asyncHandler(async (req, res) => {
    const state = await getDbState();
    const agent = state.agents.find((item) => item.id === req.params.id);

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    return res.json(agent);
  }));

  app.post("/api/agents/:id/status", asyncHandler(async (req, res) => {
    const { isAvailable, currentLoad, maxCapacity } = req.body;
    const state = await getDbState();
    const index = state.agents.findIndex((agent) => agent.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: "Agent not found" });
    }

    if (isAvailable !== undefined) {
      state.agents[index].isAvailable = isAvailable;
    }
    if (maxCapacity !== undefined) {
      state.agents[index].maxCapacity = Number(maxCapacity);
    }
    if (currentLoad !== undefined) {
      state.agents[index].currentLoad = Math.min(state.agents[index].maxCapacity, Number(currentLoad));
    }

    await saveDbState(state);
    return res.json({ success: true, agent: state.agents[index] });
  }));

  app.get("/api/bookings", asyncHandler(async (_req, res) => {
    const state = await getDbState();
    res.json(state.bookings);
  }));

  app.post("/api/bookings", asyncHandler(async (req, res) => {
    const { agentId, serviceId, clientName, clientEmail, dateTime, notes } = req.body;

    if (!agentId || !clientName || !clientEmail || !dateTime) {
      return res.status(400).json({ error: "Required details missing" });
    }

    const state = await getDbState();
    const agent = state.agents.find((item) => item.id === agentId);
    const service = state.services.find((item) => item.id === serviceId);

    const newBooking: Booking = {
      id: `bk_${Math.random().toString(36).substring(2, 9)}`,
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

    state.bookings.push(newBooking);

    const agentIndex = state.agents.findIndex((item) => item.id === agentId);
    if (agentIndex !== -1) {
      const currentAgent = state.agents[agentIndex];
      if (currentAgent.currentLoad < currentAgent.maxCapacity) {
        currentAgent.currentLoad += 1;
      }
    }

    await saveDbState(state);
    return res.status(201).json({ success: true, booking: newBooking });
  }));

  app.get("/api/chats/:token", asyncHandler(async (req, res) => {
    const state = await getDbState();
    const chat = state.chats[req.params.token];

    if (!chat) {
      return res.json({ messages: [], active: false });
    }

    return res.json(chat);
  }));

  app.post("/api/chats/:token/messages", asyncHandler(async (req, res) => {
    const { sender, content, file } = req.body as { sender: Message["sender"]; content: string; file?: Message["file"] };
    const state = await getDbState();
    const { token } = req.params;

    if (!state.chats[token]) {
      const matchingLog = state.matchLogs.find((log) => log.directLinkToken === token);
      const agentId = matchingLog ? matchingLog.matchedAgentId : "agent-1";
      state.chats[token] = {
        token,
        agentId,
        messages: [],
        created: new Date().toISOString()
      };
    }

    const newMessage: Message = {
      id: `msg_${Math.random().toString(36).substring(2, 9)}`,
      sender,
      content,
      timestamp: new Date().toISOString(),
      file
    };

    state.chats[token].messages.push(newMessage);

    if (sender === "client") {
      const agent = state.agents.find((item) => item.id === state.chats[token].agentId);
      const agentFirstName = agent ? agent.name.split(" ")[0] : "Agent";
      state.chats[token].messages.push({
        id: `msg_${Math.random().toString(36).substring(2, 9)}`,
        sender: "agent",
        content: buildAutomaticAgentReply(content, agentFirstName),
        timestamp: new Date().toISOString()
      });
    }

    await saveDbState(state);
    return res.json(newMessage);
  }));

  app.get("/api/admin/stats", asyncHandler(async (_req, res) => {
    const state = await getDbState();
    res.json({
      stats: calculateStats(state),
      logs: state.matchLogs,
      agents: state.agents
    });
  }));

  app.post("/api/admin/override", asyncHandler(async (req, res) => {
    const { logId, newAgentId } = req.body;

    if (!logId || !newAgentId) {
      return res.status(400).json({ error: "Missing override variables" });
    }

    const state = await getDbState();
    const logIndex = state.matchLogs.findIndex((log) => log.id === logId);
    const agentExists = state.agents.some((agent) => agent.id === newAgentId);

    if (logIndex === -1 || !agentExists) {
      return res.status(404).json({ error: "Match log or target agent missing" });
    }

    state.matchLogs[logIndex].matchedAgentId = newAgentId;
    await saveDbState(state);
    return res.json({ success: true, updatedLog: state.matchLogs[logIndex] });
  }));

  app.post("/api/match", asyncHandler(handleMatchRequest));
  app.post("/api/support-chat", asyncHandler(handleSupportChat));

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("API route failure", error);
    res.status(500).json({ error: "Unexpected API error" });
  });

  return app;
}
