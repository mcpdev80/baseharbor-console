import { SectionPage } from "@/components/section/section-page";
export default function Page() {
  return <SectionPage eyebrow="Development" title="Workspaces" description="Manage BaseHarbor workspace declarations and local source mappings using the authoritative workspace contract." capabilities={["Workspace list","Create / delete declaration","Component/source mapping","Resolved source identity","Git/worktree status","Workspace update"]} />;
}
