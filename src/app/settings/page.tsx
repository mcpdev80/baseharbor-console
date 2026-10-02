import { SectionPage } from "@/components/section/section-page";
export default function Page() {
  return <SectionPage eyebrow="Console" title="Settings" description="Console presentation settings only. BaseHarbor operational truth, credentials and policy do not live here." capabilities={["Appearance","API endpoint","Session information","Feature discovery","About / versions","Diagnostics"]} />;
}
