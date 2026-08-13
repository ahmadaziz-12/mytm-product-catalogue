import { env } from "cloudflare:workers";
import { defaultSettings, seedCases, seedProducts, seedServices, type CaseStudy, type Product, type Service, type SiteSettings } from "../catalog-data";

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, category TEXT NOT NULL, short_description TEXT NOT NULL, full_description TEXT NOT NULL, features TEXT NOT NULL, benefits TEXT NOT NULL, video_url TEXT NOT NULL DEFAULT '', pdf_url TEXT NOT NULL DEFAULT '', featured INTEGER NOT NULL DEFAULT 0, require_lead INTEGER NOT NULL DEFAULT 1, active INTEGER NOT NULL DEFAULT 1, display_order INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, short_description TEXT NOT NULL, features TEXT NOT NULL, cta TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, display_order INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS case_studies (id INTEGER PRIMARY KEY AUTOINCREMENT, client_name TEXT NOT NULL, challenge TEXT NOT NULL, solution TEXT NOT NULL, impact TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, display_order INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, company TEXT NOT NULL, notes TEXT NOT NULL, product_interest TEXT NOT NULL DEFAULT 'None', service_interest TEXT NOT NULL DEFAULT 'None', source TEXT NOT NULL, content_accessed TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'New', created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, filename TEXT NOT NULL, content_type TEXT NOT NULL, url TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_products_active_order ON products(active, display_order)`,
  `CREATE INDEX IF NOT EXISTS idx_services_active_order ON services(active, display_order)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`,
];

let ready: Promise<void> | null = null;

export function database() {
  if (!env.DB) throw new Error("The catalogue database is not available.");
  return env.DB;
}

export async function ensureStore() {
  if (!ready) {
    ready = (async () => {
      const db = database();
      for (const sql of schemaStatements) await db.prepare(sql).run();
      await seedStore();
      await db.prepare("PRAGMA optimize").run();
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

async function seedStore() {
  const db = database();
  const productCount = await db.prepare("SELECT COUNT(*) AS count FROM products").first<{ count: number }>();
  if (!productCount?.count) {
    for (const p of seedProducts) {
      await db.prepare(`INSERT INTO products (name, slug, category, short_description, full_description, features, benefits, video_url, pdf_url, featured, require_lead, active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(p.name, p.slug, p.category, p.shortDescription, p.fullDescription, JSON.stringify(p.features), JSON.stringify(p.benefits), p.videoUrl, p.pdfUrl, Number(p.featured), Number(p.requireLead), Number(p.active), p.displayOrder).run();
    }
  }
  const serviceCount = await db.prepare("SELECT COUNT(*) AS count FROM services").first<{ count: number }>();
  if (!serviceCount?.count) {
    for (const s of seedServices) {
      await db.prepare(`INSERT INTO services (name, slug, short_description, features, cta, active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(s.name, s.slug, s.shortDescription, JSON.stringify(s.features), s.cta, Number(s.active), s.displayOrder).run();
    }
  }
  const caseCount = await db.prepare("SELECT COUNT(*) AS count FROM case_studies").first<{ count: number }>();
  if (!caseCount?.count) {
    for (const item of seedCases) {
      await db.prepare(`INSERT INTO case_studies (client_name, challenge, solution, impact, active, display_order) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(item.clientName, item.challenge, item.solution, item.impact, Number(item.active), item.displayOrder).run();
    }
  }
  const setting = await db.prepare("SELECT value FROM settings WHERE key = 'site'").first();
  if (!setting) await db.prepare("INSERT INTO settings (key, value) VALUES ('site', ?)").bind(JSON.stringify(defaultSettings)).run();
}

type ProductRow = { id: number; name: string; slug: string; category: string; short_description: string; full_description: string; features: string; benefits: string; video_url: string; pdf_url: string; featured: number; require_lead: number; active: number; display_order: number };
type ServiceRow = { id: number; name: string; slug: string; short_description: string; features: string; cta: string; active: number; display_order: number };
type CaseRow = { id: number; client_name: string; challenge: string; solution: string; impact: string; active: number; display_order: number };

export function productFromRow(p: ProductRow): Product {
  return { id: p.id, name: p.name, slug: p.slug, category: p.category, shortDescription: p.short_description, fullDescription: p.full_description, features: JSON.parse(p.features), benefits: JSON.parse(p.benefits), videoUrl: p.video_url, pdfUrl: p.pdf_url, featured: Boolean(p.featured), requireLead: Boolean(p.require_lead), active: Boolean(p.active), displayOrder: p.display_order };
}

export function serviceFromRow(s: ServiceRow): Service {
  return { id: s.id, name: s.name, slug: s.slug, shortDescription: s.short_description, features: JSON.parse(s.features), cta: s.cta, active: Boolean(s.active), displayOrder: s.display_order };
}

export function caseFromRow(c: CaseRow): CaseStudy {
  return { id: c.id, clientName: c.client_name, challenge: c.challenge, solution: c.solution, impact: c.impact, active: Boolean(c.active), displayOrder: c.display_order };
}

export async function getSettings(): Promise<SiteSettings> {
  await ensureStore();
  const row = await database().prepare("SELECT value FROM settings WHERE key = 'site'").first<{ value: string }>();
  return row ? JSON.parse(row.value) : defaultSettings;
}
