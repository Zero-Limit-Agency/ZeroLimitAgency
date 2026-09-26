import { redirect } from "next/navigation";
import { buildLegacyAuthRedirect } from "@/lib/auth/public-routes";
export default function Page({ searchParams }) { redirect(buildLegacyAuthRedirect("/identite/confirmation", searchParams)); }
