import { database, ensureStore, getSettings, productFromRow, serviceFromRow } from "../_store";

export async function GET() {
  await ensureStore();
  const db = database();
  const [products, services, leads, media, settings] = await Promise.all([
    db.prepare("SELECT * FROM products ORDER BY display_order, id").all(),
    db.prepare("SELECT * FROM services ORDER BY display_order, id").all(),
    db.prepare("SELECT * FROM leads ORDER BY created_at DESC LIMIT 100").all(),
    db.prepare("SELECT * FROM media ORDER BY created_at DESC").all(),
    getSettings(),
  ]);
  return Response.json({ products: products.results.map((r: any) => productFromRow(r as never)), services: services.results.map((r: any) => serviceFromRow(r as never)), leads: leads.results, media: media.results, settings });
}

export async function POST(request: Request) {
  await ensureStore();
  const body = await request.json() as Record<string, unknown>;
  const action = String(body.action || "");
  const db = database();

  if (action === "deleteProduct") {
    await db.prepare("DELETE FROM products WHERE id = ?").bind(Number(body.id)).run();
    return Response.json({ success: true });
  }
  if (action === "deleteService") {
    await db.prepare("DELETE FROM services WHERE id = ?").bind(Number(body.id)).run();
    return Response.json({ success: true });
  }
  if (action === "saveSettings") {
    await db.prepare("INSERT INTO settings (key, value) VALUES ('site', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(JSON.stringify(body.settings)).run();
    return Response.json({ success: true });
  }
  if (action === "saveProduct") {
    const p = body.product as Record<string, unknown>;
    const features = String(p.features || "").split("\n").map((x) => x.trim()).filter(Boolean);
    const benefits = String(p.benefits || "").split("\n").map((x) => x.trim()).filter(Boolean);
    const slug = String(p.name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (p.id) {
      await db.prepare(`UPDATE products SET name=?, slug=?, category=?, short_description=?, full_description=?, features=?, benefits=?, thumbnail_url=?, video_url=?, pdf_url=?, featured=?, require_lead=?, active=?, display_order=? WHERE id=?`)
        .bind(p.name, slug, p.category, p.shortDescription, p.fullDescription, JSON.stringify(features), JSON.stringify(benefits), p.thumbnailUrl || "", p.videoUrl || "", p.pdfUrl || "", Number(Boolean(p.featured)), Number(Boolean(p.requireLead)), Number(Boolean(p.active)), Number(p.displayOrder || 0), Number(p.id)).run();
    } else {
      await db.prepare(`INSERT INTO products (name, slug, category, short_description, full_description, features, benefits, thumbnail_url, video_url, pdf_url, featured, require_lead, active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(p.name, slug, p.category, p.shortDescription, p.fullDescription, JSON.stringify(features), JSON.stringify(benefits), p.thumbnailUrl || "", p.videoUrl || "", p.pdfUrl || "", Number(Boolean(p.featured)), Number(Boolean(p.requireLead)), Number(Boolean(p.active)), Number(p.displayOrder || 0)).run();
    }
    return Response.json({ success: true });
  }
  if (action === "saveService") {
    const s = body.service as Record<string, unknown>;
    const features = String(s.features || "").split("\n").map((x) => x.trim()).filter(Boolean);
    const slug = String(s.name || "service").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (s.id) {
      await db.prepare(`UPDATE services SET name=?, slug=?, short_description=?, features=?, cta=?, thumbnail_url=?, video_url=?, pdf_url=?, active=?, display_order=? WHERE id=?`).bind(s.name, slug, s.shortDescription, JSON.stringify(features), s.cta, s.thumbnailUrl || "", s.videoUrl || "", s.pdfUrl || "", Number(Boolean(s.active)), Number(s.displayOrder || 0), Number(s.id)).run();
    } else {
      await db.prepare(`INSERT INTO services (name, slug, short_description, features, cta, thumbnail_url, video_url, pdf_url, active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(s.name, slug, s.shortDescription, JSON.stringify(features), s.cta, s.thumbnailUrl || "", s.videoUrl || "", s.pdfUrl || "", Number(Boolean(s.active)), Number(s.displayOrder || 0)).run();
    }
    return Response.json({ success: true });
  }
  return Response.json({ error: "Unknown action" }, { status: 400 });
}
