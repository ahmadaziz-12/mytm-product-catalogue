import { requireMYTMAdmin } from "../chatgpt-auth";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireMYTMAdmin("/admin");
  return <AdminClient user={{ name: user.displayName, email: user.email }} />;
}
