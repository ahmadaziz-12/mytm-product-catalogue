import { database, ensureStore, getSettings } from "../_store";

export async function POST(request: Request) {
  try {
    await ensureStore();
    const body = await request.json() as Record<string, string>;
    const config = (await getSettings()).formConfig;
    const required: Array<[string, boolean]> = [["name", config.requireName], ["phone", config.requirePhone], ["email", config.requireEmail], ["company", config.requireCompany], ["notes", config.requireNotes]];
    for (const [field, isRequired] of required) if (isRequired && !body[field]?.trim()) return Response.json({ error: `${field} is required` }, { status: 400 });
    const now = new Date().toISOString();
    const result = await database().prepare(`INSERT INTO leads (name, phone, email, company, notes, product_interest, service_interest, source, content_accessed, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?)`)
      .bind(body.name?.trim() || "", body.phone?.trim() || "", body.email?.trim() || "", body.company?.trim() || "", body.notes?.trim() || "", body.productInterest || "None", body.serviceInterest || "None", body.source || "Contact Form", body.contentAccessed || "", now).run();
    return Response.json({ success: true, id: result.meta.last_row_id }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save inquiry" }, { status: 500 });
  }
}
