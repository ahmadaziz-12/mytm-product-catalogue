import { env } from "cloudflare:workers";
import { database, ensureStore, productFromRow, serviceFromRow } from "../_store";

type ChatTurn = { role: "user" | "assistant"; content: string };
type Recommendation = { type: "product" | "service"; id: number; name: string; category: string; description: string };

const requestWindows = new Map<string, { count: number; resetAt: number }>();

function allowRequest(request: Request) {
  const key = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "anonymous";
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || current.resetAt < now) {
    requestWindows.set(key, { count: 1, resetAt: now + 10 * 60_000 });
    return true;
  }
  current.count += 1;
  return current.count <= 30;
}

function tokens(value: string) {
  const stopWords = new Set(["and", "the", "for", "with", "need", "want", "our", "your", "solution", "platform", "help", "about", "from", "that", "this"]);
  return Array.from(new Set(value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((token) => token.length > 2 && !stopWords.has(token))));
}

function recommend(message: string, items: Recommendation[]) {
  const query = tokens(message);
  const lower = message.toLowerCase();
  const intentProfiles = [
    { key: "lending", triggers: ["lending", "lend", "loan", "credit", "financing", "borrower", "origination"], categories: ["lending"], terms: ["loan", "lending", "financing", "los", "lms", "credit", "origination", "management"] },
    { key: "collections", triggers: ["collection", "collections", "recovery", "delinquency", "debt"], categories: [], terms: ["collection", "collections", "recovery", "delinquency", "prioritization"] },
    { key: "payments", triggers: ["payment", "payments", "merchant", "checkout", "settlement", "reconciliation", "wallet", "card"], categories: ["payments", "wallets", "cards"], terms: ["payment", "wallet", "card", "merchant", "settlement", "aggregation"] },
    { key: "banking", triggers: ["bank", "banking", "core banking", "agent banking", "open banking"], categories: ["banking"], terms: ["bank", "banking", "core", "agent", "account"] },
    { key: "ai", triggers: ["ai", "artificial intelligence", "forecast", "analyst", "automation", "insight"], categories: ["ai"], terms: ["ai", "analyst", "automation", "intelligence", "forecast", "agentic"] },
    { key: "compliance", triggers: ["aml", "kyc", "compliance", "fraud", "identity verification", "risk screening"], categories: ["compliance"], terms: ["aml", "kyc", "compliance", "fraud", "identity", "risk"] },
    { key: "cybersecurity", triggers: ["security", "cyber", "threat", "vulnerability", "protection", "siem"], categories: ["cybersecurity"], terms: ["security", "cyber", "threat", "audit", "protection", "siem"] },
    { key: "enterprise", triggers: ["enterprise", "workflow", "appointment", "operations", "digital transformation"], categories: ["enterprise"], terms: ["enterprise", "workflow", "appointment", "operations", "transformation"] },
  ];
  const matchedIntents = intentProfiles.filter((profile) => profile.triggers.some((trigger) => lower.includes(trigger)));
  const ranked = items.map((item) => {
    const haystack = `${item.name} ${item.category} ${item.description}`.toLowerCase();
    const itemName = item.name.toLowerCase();
    const itemCategory = item.category.toLowerCase();
    let score = query.reduce((total, token) => total + (haystack.includes(token) ? (itemName.includes(token) ? 6 : 2) : 0), 0);
    for (const profile of matchedIntents) {
      if (profile.categories.some((category) => itemCategory.includes(category))) score += 18;
      score += profile.terms.reduce((total, term) => total + (itemName.includes(term) ? 7 : haystack.includes(term) ? 3 : 0), 0);
    }
    return { item, score };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
  const relevanceFloor = Math.max(4, (ranked[0]?.score || 0) * 0.4);
  return ranked.filter(({ score }) => score >= relevanceFloor).slice(0, 3).map(({ item }) => item);
}

function fallbackReply(message: string, recommendations: Recommendation[]) {
  const lower = message.toLowerCase();
  if (/^(hi|hello|hey|salam|assalam)/.test(lower)) return "Hello — I’m the MYTM catalogue advisor. Tell me the business challenge you want to solve, and I’ll guide you to the most relevant products and services.";
  if (!recommendations.length) return "I can help with digital banking, payments, lending, AI, AML/KYC, cybersecurity and technology delivery. Tell me your goal, sector or current challenge and I’ll narrow the catalogue for you.";
  const [first] = recommendations;
  const names = recommendations.map((item) => item.name);
  const alternatives = names.length > 1 ? ` I also found ${names.slice(1).join(" and ")} for this requirement.` : "";
  return `For your requirement, the strongest match is ${first.name}. ${first.description}${alternatives} Open any recommendation below to compare the relevant product details.`;
}

async function openAIReply(message: string, history: ChatTurn[], items: Recommendation[], recommendations: Recommendation[]) {
  const apiKey = String((env as Record<string, unknown>).OPENAI_API_KEY || "");
  if (!apiKey) return null;
  const model = String((env as Record<string, unknown>).OPENAI_MODEL || "gpt-5.4-mini");
  const catalogue = items.map((item) => `${item.type.toUpperCase()}: ${item.name} | ${item.category} | ${item.description}`).join("\n");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 320,
      reasoning: { effort: "low" },
      instructions: `You are MYTM's concise product catalogue assistant for visitors exploring fintech and enterprise technology. Use only the supplied catalogue. Recommend at most three relevant solutions, explain why in plain business language, and never invent pricing, capabilities, clients, certifications or availability. Do not request sensitive personal or financial information. If the question is outside the catalogue, say so and offer a meeting with MYTM. Keep answers under 120 words.\n\nLIVE CATALOGUE:\n${catalogue}\n\nCURRENT LOCAL RECOMMENDATIONS:\n${recommendations.map((item) => item.name).join(", ")}`,
      input: [...history.slice(-6), { role: "user", content: message }],
    }),
  });
  if (!response.ok) return null;
  const result = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  return result.output_text || result.output?.flatMap((item) => item.content || []).find((content) => content.type === "output_text")?.text || null;
}

export async function POST(request: Request) {
  if (!allowRequest(request)) return Response.json({ error: "Please wait a moment before sending another question." }, { status: 429 });
  const body = await request.json() as { message?: string; history?: ChatTurn[] };
  const message = String(body.message || "").trim().slice(0, 700);
  if (!message) return Response.json({ error: "Ask a question about MYTM products or services." }, { status: 400 });

  await ensureStore();
  const db = database();
  const [productRows, serviceRows] = await Promise.all([
    db.prepare("SELECT * FROM products WHERE active = 1 ORDER BY display_order, id").all(),
    db.prepare("SELECT * FROM services WHERE active = 1 ORDER BY display_order, id").all(),
  ]);
  const items: Recommendation[] = [
    ...productRows.results.map((row: any) => { const item = productFromRow(row as never); return { type: "product" as const, id: item.id, name: item.name, category: item.category, description: `${item.shortDescription} ${item.features.join(" ")}` }; }),
    ...serviceRows.results.map((row: any) => { const item = serviceFromRow(row as never); return { type: "service" as const, id: item.id, name: item.name, category: "Services", description: `${item.shortDescription} ${item.features.join(" ")}` }; }),
  ];
  const recommendations = recommend(message, items);
  const history = Array.isArray(body.history) ? body.history.filter((turn) => turn && (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string").slice(-6).map((turn) => ({ ...turn, content: turn.content.slice(0, 700) })) : [];
  let reply: string | null = null;
  try { reply = await openAIReply(message, history, items, recommendations); } catch { reply = null; }
  return Response.json({
    reply: reply || fallbackReply(message, recommendations),
    recommendations: recommendations.map((item) => ({ type: item.type, id: item.id, name: item.name, category: item.category })),
    poweredBy: reply ? "openai" : "catalogue",
  }, { headers: { "cache-control": "no-store" } });
}
