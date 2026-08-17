import { caseFromRow, database, ensureStore, getSettings, productFromRow, serviceFromRow } from "../_store";

export async function GET() {
  try {
    await ensureStore();
    const db = database();
    const [products, services, cases, settings] = await Promise.all([
      db.prepare("SELECT * FROM products WHERE active = 1 ORDER BY display_order, id").all(),
      db.prepare("SELECT * FROM services WHERE active = 1 ORDER BY display_order, id").all(),
      db.prepare("SELECT * FROM case_studies WHERE active = 1 ORDER BY display_order, id").all(),
      getSettings(),
    ]);
    return Response.json({ products: products.results.map((row: any) => productFromRow(row as never)), services: services.results.map((row: any) => serviceFromRow(row as never)), cases: cases.results.map((row: any) => caseFromRow(row as never)), settings });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load catalogue" }, { status: 500 });
  }
}
