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

test("server-renders the MYTM Product OS catalogue and conversion actions", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /class="product-os"/);
  assert.match(html, /Product <em>OS<\/em>/);
  assert.match(html, /Talk to Sales/);
  assert.match(html, /Finova AI Financial Analyst/);
  assert.match(html, /AI Collection Management/);
  assert.match(html, /CompliClear AML\/KYC/);
  assert.match(html, /Request Demo/);
  assert.match(html, /Request PDF/);
  assert.match(html, /Preferred date/);
  assert.match(html, /Designation/);
});

test("persists request-specific lead details and exposes them to the backoffice", async () => {
  const [leadRoute, store, admin] = await Promise.all([
    readFile(new URL("../app/api/leads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/_store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/AdminClient.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(leadRoute, /requestType === "Demo"/);
  assert.match(leadRoute, /preferredDate/);
  assert.match(leadRoute, /designation/);
  assert.match(store, /preferred_date TEXT NOT NULL DEFAULT ''/);
  assert.match(store, /request_type TEXT NOT NULL DEFAULT 'General'/);
  assert.match(admin, /Preferred:/);
  assert.match(admin, /request_type/);
  assert.match(admin, /designation/);
});
