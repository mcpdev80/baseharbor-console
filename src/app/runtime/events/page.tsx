import { SectionPage } from "@/components/section/section-page";
export default function Page() {
  return <SectionPage eyebrow="Runtime" title="Events" description="Semantic and runtime events streamed through the BaseHarbor event contract rather than direct Docker/Kubernetes feeds in the browser." capabilities={["Operation events","Runtime resource events","Provider readiness","Target availability","Application/deployment changes","Filtering / live stream"]} />;
}
