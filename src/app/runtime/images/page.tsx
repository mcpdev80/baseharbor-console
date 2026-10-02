import { SectionPage } from "@/components/section/section-page";
export default function Page() {
  return <SectionPage eyebrow="Runtime" title="Images" description="Runtime image inventory projected through BaseHarbor's runtime-resource contract." capabilities={["Image inventory","Digest / tag identity","Ownership relation","Runtime/target scope","Usage relationships","Removal where safely supported"]} />;
}
