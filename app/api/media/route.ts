import { env } from "cloudflare:workers";
import { database, ensureStore } from "../_store";
import { getChatGPTUser, isMYTMAdmin } from "../../chatgpt-auth";

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Your admin session has expired. Sign in again, then retry the upload." }, { status: 401 });
    if (!isMYTMAdmin(user)) return Response.json({ error: "Admin access is required to upload files." }, { status: 403 });
    await ensureStore();
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Choose a file to upload" }, { status: 400 });
    if (!file.size) return Response.json({ error: "The selected file is empty" }, { status: 400 });
    if (file.size > 95 * 1024 * 1024) return Response.json({ error: "Files must be smaller than 95 MB. Compress the deck and try again." }, { status: 400 });
    const extension = file.name.toLowerCase().split(".").pop() || "";
    const allowedExtensions = new Set(["pdf", "ppt", "pptx", "png", "jpg", "jpeg", "webp", "gif", "mp4", "webm", "mov"]);
    if (!allowedExtensions.has(extension)) return Response.json({ error: "Upload a PDF, PPT, PPTX, image or supported video file." }, { status: 400 });
    const mediaBucket = (env as any).MEDIA;
    if (!mediaBucket) return Response.json({ error: "Media storage is not connected. Contact the site administrator." }, { status: 503 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-") || `upload.${extension}`;
    const requestedKey = String(data.get("key") || "").replace(/[^a-zA-Z0-9._-]+/g, "-");
    const key = requestedKey || `${Date.now()}-${safeName}`;
    const contentType = file.type || (extension === "pdf" ? "application/pdf" : extension === "pptx" ? "application/vnd.openxmlformats-officedocument.presentationml.presentation" : extension === "ppt" ? "application/vnd.ms-powerpoint" : "application/octet-stream");
    await mediaBucket.put(key, file.stream(), { httpMetadata: { contentType } });
    const url = `/api/media?key=${encodeURIComponent(key)}`;
    await database().prepare("INSERT INTO media (key, filename, content_type, url, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET filename=excluded.filename, content_type=excluded.content_type, url=excluded.url, created_at=excluded.created_at").bind(key, file.name, contentType, url, new Date().toISOString()).run();
    return Response.json({ success: true, url, key, filename: file.name, contentType });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The file could not be uploaded. Please try again." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key) return new Response("Missing key", { status: 400 });
  const object = await (env as any).MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
}
