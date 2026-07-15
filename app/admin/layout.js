import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getUserRole, isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";

export default async function AdminLayout({ children }) {
  const session = await getClientSession();

  if (!session?.user) {
    redirect("/connexion");
  }

  const role = await getUserRole(session.user);

  if (!(await isAdminUser(session.user))) {
    if (role === "client") {
      redirect("/espace-client");
    }
    redirect("/connexion");
  }

  return <AdminShell adminEmail={session.user.email}>{children}</AdminShell>;
}
