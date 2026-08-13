import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { database, ensureStore } from "../_store";

export async function POST(request: Request) {
  if (!(await getChatGPTUser())) return Response.json({ error: "Sign in required" }, { status: 401 });
  await ensureStore();
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a file to upload" }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return Response.json({ error: "Files must be smaller than 50 MB" }, { status: 400 });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const key = `${Date.now()}-${safeName}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
  const url = `/api/media?key=${encodeURIComponent(key)}`;
  await database().prepare("INSERT INTO media (key, filename, content_type, url, created_at) VALUES (?, ?, ?, ?, ?)").bind(key, file.name, file.type || "application/octet-stream", url, new Date().toISOString()).run();
  return Response.json({ success: true, url, key });
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key) return new Response("Missing key", { status: 400 });
  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
}
