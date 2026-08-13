import { getChatGPTUser } from "../chatgpt-auth";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getChatGPTUser();
  return <AdminClient user={{ name: user?.displayName || "MYTM Admin", email: user?.email || "Private catalogue workspace" }} />;
}
