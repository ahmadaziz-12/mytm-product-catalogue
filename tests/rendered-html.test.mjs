import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the MYTM Product OS catalogue in browsing mode", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /class="product-os"/);
  assert.match(html, /AI Financial Analyst/);
  assert.match(html, /aria-label="Show LOS \/ LMS"/);
  assert.match(html, /Talk to Sales/);
  assert.match(html, /Finova AI Financial Analyst/);
  assert.match(html, /AI Collection Management/);
  assert.match(html, /CompliClear AML\/KYC/);
  assert.match(html, /BUILD WHAT FINANCE NEEDS NEXT/);
  assert.match(html, /SOLUTIONS BY AMBITION/);
  assert.match(html, /Start with the outcome you need/);
  assert.match(html, /FROM AMBITION TO OPERATIONS/);
  assert.doesNotMatch(html, /Backoffice admin/);
  assert.doesNotMatch(html, /Touch anywhere to explore/);
  assert.doesNotMatch(html, /class="os-product-rail"/);
});

test("opens product-specific forms and persists their details to the backoffice", async () => {
  const [leadRoute, store, admin, showcase, assistant, leadManagement] = await Promise.all([
    readFile(new URL("../app/api/leads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/_store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/AdminClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/Showcase.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/assistant/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/LeadManagement.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(leadRoute, /requestType === "Demo"/);
  assert.match(leadRoute, /preferredDate/);
  assert.match(leadRoute, /designation/);
  assert.match(store, /preferred_date TEXT NOT NULL DEFAULT ''/);
  assert.match(store, /request_type TEXT NOT NULL DEFAULT 'General'/);
  assert.match(leadManagement, /PREFERRED DEMO DATE/);
  assert.match(leadManagement, /request_type/);
  assert.match(leadManagement, /designation/);
  assert.match(showcase, /Request Demo/);
  assert.match(showcase, /Request PDF/);
  assert.match(showcase, /Preferred date/);
  assert.match(showcase, /Designation/);
  assert.match(showcase, /product-request-panel/);
  assert.match(showcase, /name="notes"/);
  assert.match(showcase, /Notes <span>Optional<\/span>/);
  assert.doesNotMatch(showcase, /Choose a time now/);
  assert.match(showcase, /const heroSlides = \[/);
  assert.match(showcase, /CompliClear AML\/KYC/);
  assert.match(showcase, /className="os-footer"/);
  assert.match(showcase, /exploreCategory\("Lending"\)/);
  assert.match(showcase, /How MYTM delivers/);
  assert.doesNotMatch(showcase, /setWelcomeOpen/);
  assert.doesNotMatch(showcase, /idle-experience/);
  assert.match(leadManagement, /LeadDetails/);
  assert.match(leadManagement, /Copy all details/);
  assert.match(admin, /DEMO REQUEST PIPELINE/);
  assert.match(admin, /Connect your Calendly event type to the Google Calendar/);
  assert.match(admin, /SYSTEM ONLINE/);
  assert.doesNotMatch(admin, /label="Welcome screen"/);
  assert.match(assistant, /relevanceFloor/);
  assert.match(assistant, /key: "collections"/);
  assert.match(assistant, /stopWords/);
});

test("keeps production admin access restricted to MYTM accounts", async () => {
  const [auth, adminPage, adminRoute] = await Promise.all([
    readFile(new URL("../app/chatgpt-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(auth, /endsWith\("@mytm\.co"\)/);
  assert.match(auth, /endsWith\("@mytm\.com"\)/);
  assert.match(adminPage, /process\.env\.NODE_ENV === "development"/);
  assert.match(adminRoute, /process\.env\.NODE_ENV === "development"/);
});

test("provides full lead management and filtered analytics in the backoffice", async () => {
  const [adminRoute, management, dashboard] = await Promise.all([
    readFile(new URL("../app/api/admin/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/LeadManagement.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/LeadAnalyticsDashboard.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(adminRoute, /action === "saveLead"/);
  assert.match(adminRoute, /action === "deleteLead"/);
  assert.match(adminRoute, /UPDATE leads SET name=/);
  assert.match(management, /Add manual lead/);
  assert.match(management, /Save changes/);
  assert.match(management, /Delete/);
  assert.match(dashboard, /Custom range/);
  assert.match(dashboard, /Lead activity over time/);
  assert.match(dashboard, /Top product and service interests/);
  assert.match(dashboard, /What prospects request/);
});

test("lets admins upload and attach product decks from the editor", async () => {
  const [admin, mediaRoute] = await Promise.all([
    readFile(new URL("../app/admin/AdminClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/media/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(admin, /function DeckUploadField/);
  assert.match(admin, /Choose deck from computer/);
  assert.match(admin, /accept="application\/pdf,.pdf,.ppt,.pptx/);
  assert.match(admin, /Replace with another file/);
  assert.match(mediaRoute, /allowedExtensions/);
  assert.match(mediaRoute, /Files must be smaller than 95 MB/);
});
