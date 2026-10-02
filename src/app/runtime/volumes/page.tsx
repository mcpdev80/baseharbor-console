import { SectionPage } from "@/components/section/section-page";
export default function Page() {
  return <SectionPage eyebrow="Runtime" title="Volumes & PVCs" description="Persistent runtime resources with ownership, relationships and reconciliation context." capabilities={["Volume/PVC list","Mount relationships","Ownership","Usage","Capacity/metadata","Safe removal semantics"]} />;
}
