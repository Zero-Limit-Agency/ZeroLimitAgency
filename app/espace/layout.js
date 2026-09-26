import "./workspace.css";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export const dynamic = "force-dynamic";

export default function SpaceLayout({ children }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
