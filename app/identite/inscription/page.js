import { redirect } from "next/navigation";
import { buildLegacyAuthRedirect } from "@/lib/auth/public-routes";
export default async function Page(props) {
  const searchParams = await props.searchParams;
  redirect(buildLegacyAuthRedirect("/inscription", searchParams));
}
