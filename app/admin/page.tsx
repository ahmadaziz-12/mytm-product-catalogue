import { requireMYTMAdmin } from "../chatgpt-auth";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (process.env.NODE_ENV === "development") {
    return <AdminClient user={{ name: "MYTM Admin Preview", email: "admin@mytm.co" }} />;
  }
  const user = await requireMYTMAdmin("/admin");
  return <AdminClient user={{ name: user.displayName, email: user.email }} />;
}
