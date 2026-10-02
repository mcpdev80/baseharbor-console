import { SectionPage } from "@/components/section/section-page";
export default function Page() {
  return <SectionPage eyebrow="Source" title="Repositories" description="Register local repositories known to BaseHarbor, inspect source evidence and enter the application adoption flow without turning Console into a Git server." capabilities={["Register local repository","Inspect source evidence","Branch / commit / dirty state","Open application init","Source identity","Quick config view"]} />;
}
