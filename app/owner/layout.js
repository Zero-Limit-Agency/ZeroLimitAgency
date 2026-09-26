import { redirect } from "next/navigation";
import { OwnerShell } from "@/components/owner/owner-shell";
import { requireOwnerSession } from "@/lib/owner/access";
import { OwnerAccessError } from "@/lib/owner/errors";
export const dynamic = "force-dynamic";
export const metadata = { title: "OWNER Console | Zero Limit" };
function environmentLabel() { if (process.env.VERCEL_ENV === "production") return "Production"; if (process.env.VERCEL_ENV === "preview") return "Preview"; if (process.env.ZERO_LIMIT_ENV === "staging") return "Staging"; return "Development"; }
export default async function OwnerLayout({ children }) { let owner; try { owner = await requireOwnerSession(); } catch (error) { if (error instanceof OwnerAccessError) redirect(error.status === 401 ? "/identite/connexion?next=%2Fowner" : "/espace"); throw error; } return <OwnerShell owner={owner} environment={environmentLabel()}>{children}</OwnerShell>; }
