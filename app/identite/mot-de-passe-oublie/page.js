import { redirect } from "next/navigation";
import { buildLegacyAuthRedirect } from "@/lib/auth/public-routes";
export default function Page({ searchParams }) { redirect(buildLegacyAuthRedirect("/mot-de-passe-oublie", searchParams)); }
