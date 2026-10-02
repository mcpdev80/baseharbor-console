import { SectionPage } from "@/components/section/section-page";
export default function Page() {
  return <SectionPage eyebrow="Recovery" title="Backup & recovery" description="Recovery remains a BaseHarbor lifecycle operation with ownership-safe backup, restore and verification." capabilities={["Backup","Backup verification","Restore preflight","Restore","Recovery evidence","Contributor state"]} />;
}
