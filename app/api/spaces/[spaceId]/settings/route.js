import { NextResponse } from "next/server";
import { AuthenticationRequiredError } from "@/lib/zero-limit-id/profile";
import { archiveSpace, renameCreatorSpace, renamePersonalSpace, restoreSpace, updateTeamOrganizationName, updateTeamSlug, WorkspaceSettingsError } from "@/lib/zero-limit-id/workspace-settings";

const handlers = { rename_personal: renamePersonalSpace, rename_creator: renameCreatorSpace, rename_team: updateTeamOrganizationName, change_slug: updateTeamSlug, archive: archiveSpace, restore: restoreSpace };

export async function POST(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    const handler = handlers[body.operation];
    if (!handler) throw new WorkspaceSettingsError("invalid_operation");
    await handler(params.spaceId, body.value);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ success: false, code: "authentication_required" }, { status: 401 });
    if (error instanceof WorkspaceSettingsError) return NextResponse.json({ success: false, code: error.code }, { status: error.status });
    const correlationId = crypto.randomUUID();
    console.error("[workspace-settings] mutation failed", { correlationId, name: error?.name });
    return NextResponse.json({ success: false, code: "unexpected_error", correlationId }, { status: 500 });
  }
}
