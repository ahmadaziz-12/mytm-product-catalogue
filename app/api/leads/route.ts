import { database, ensureStore, getSettings } from "../_store";

export async function POST(request: Request) {
  try {
    await ensureStore();
    const body = await request.json() as Record<string, string>;
    const config = (await getSettings()).formConfig;
    const requestType = body.requestType === "Demo" || body.requestType === "PDF" ? body.requestType : "General";
    const required: Array<[string, boolean]> = requestType === "General"
      ? [["name", config.requireName], ["phone", config.requirePhone], ["email", config.requireEmail], ["company", config.requireCompany], ["notes", config.requireNotes]]
      : [["name", true], ["email", true], ["designation", true], ["preferredDate", requestType === "Demo"]];
    for (const [field, isRequired] of required) if (isRequired && !body[field]?.trim()) return Response.json({ error: `${field} is required` }, { status: 400 });
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
    const now = new Date().toISOString();
    const result = await database().prepare(`INSERT INTO leads (name, phone, email, company, designation, preferred_date, request_type, notes, product_interest, service_interest, source, content_accessed, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?)`)
      .bind(body.name?.trim() || "", body.phone?.trim() || "", body.email?.trim() || "", body.company?.trim() || "", body.designation?.trim() || "", body.preferredDate?.trim() || "", requestType, body.notes?.trim() || "", body.productInterest || "None", body.serviceInterest || "None", body.source || "Contact Form", body.contentAccessed || "", now).run();
    return Response.json({ success: true, id: result.meta.last_row_id }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save inquiry" }, { status: 500 });
  }
}
