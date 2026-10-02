import { SectionPage } from "@/components/section/section-page";
export default function Page() {
  return <SectionPage eyebrow="Security" title="Security & access" description="Machine Operator Authorization, credentials, trust and runtime access are displayed here but remain enforced by BaseHarbor Core." capabilities={["Operator authentication","Authorization decisions","Credential lifecycle","Certificate / trust state","Target access security","Audit attribution"]} />;
}
