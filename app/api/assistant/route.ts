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
  return Array.from(new Set(value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((token) => token.length > 2)));
}

function recommend(message: string, items: Recommendation[]) {
  const query = tokens(message);
  const intentBoosts: Record<string, string[]> = {
    lending: ["loan", "los", "lms", "collection", "credit"],
    payments: ["payment", "wallet", "card", "banking", "merchant"],
    ai: ["ai", "analyst", "automation", "intelligence", "forecast"],
    compliance: ["aml", "kyc", "compliance", "fraud", "identity", "risk"],
    cybersecurity: ["security", "cyber", "threat", "audit", "protection"],
  };
  return items.map((item) => {
    const haystack = `${item.name} ${item.category} ${item.description}`.toLowerCase();
    let score = query.reduce((total, token) => total + (haystack.includes(token) ? (item.name.toLowerCase().includes(token) ? 5 : 2) : 0), 0);
    for (const [category, words] of Object.entries(intentBoosts)) {
      if (words.some((word) => query.includes(word)) && haystack.includes(category)) score += 5;
      score += words.filter((word) => query.includes(word) && haystack.includes(word)).length * 2;
    }
    return { item, score };
  }).sort((a, b) => b.score - a.score).slice(0, 3).map(({ item }) => item);
}

function fallbackReply(message: string, recommendations: Recommendation[]) {
  const lower = message.toLowerCase();
  if (/^(hi|hello|hey|salam|assalam)/.test(lower)) return "Hello — I’m the MYTM catalogue advisor. Tell me the business challenge you want to solve, and I’ll guide you to the most relevant products and services.";
  if (!recommendations.length) return "I can help with digital banking, payments, lending, AI, AML/KYC, cybersecurity and technology delivery. Tell me your goal, sector or current challenge and I’ll narrow the catalogue for you.";
  const [first, second] = recommendations;
  return `Based on your requirement, I’d start with ${first.name}. ${first.description}${second ? ` You may also want to explore ${second.name} as a complementary option.` : ""} Open a recommendation below for details, or book a conversation with MYTM for a tailored walkthrough.`;
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
