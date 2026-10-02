import { SectionPage } from "@/components/section/section-page";
export default function Page() {
  return <SectionPage eyebrow="Applications" title="Applications" description="Portable application intent, deployment state and lifecycle through the same BaseHarbor semantics as the CLI." capabilities={["Inspect / adopt repository","Graphical app init wizard","Plan / apply","Status / doctor","Update / repair","Backup / restore / destroy"]} />;
}
