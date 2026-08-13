import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  shortDescription: text("short_description").notNull(),
  fullDescription: text("full_description").notNull(),
  features: text("features", { mode: "json" }).$type<string[]>().notNull(),
  benefits: text("benefits", { mode: "json" }).$type<string[]>().notNull(),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  pdfUrl: text("pdf_url").notNull().default(""),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  requireLead: integer("require_lead", { mode: "boolean" }).notNull().default(true),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
}, (table) => [index("idx_products_active_order").on(table.active, table.displayOrder)]);

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description").notNull(),
  features: text("features", { mode: "json" }).$type<string[]>().notNull(),
  cta: text("cta").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  pdfUrl: text("pdf_url").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
}, (table) => [index("idx_services_active_order").on(table.active, table.displayOrder)]);

export const caseStudies = sqliteTable("case_studies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientName: text("client_name").notNull(),
  challenge: text("challenge").notNull(),
  solution: text("solution").notNull(),
  impact: text("impact").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
});

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  notes: text("notes").notNull(),
  productInterest: text("product_interest").notNull().default("None"),
  serviceInterest: text("service_interest").notNull().default("None"),
  source: text("source").notNull(),
  contentAccessed: text("content_accessed").notNull().default(""),
  status: text("status").notNull().default("New"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_leads_created_at").on(table.createdAt)]);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  url: text("url").notNull(),
  createdAt: text("created_at").notNull(),
});
