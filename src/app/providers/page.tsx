import { SectionPage } from "@/components/section/section-page";
export default function Page() {
  return <SectionPage eyebrow="Capabilities" title="Providers" description="Inspect and operate BaseHarbor capability providers without exposing product-specific lifecycle logic in the Console." capabilities={["Provider list","Inspect / verify","Placement and ownership","Credentials/trust references","Add / remove external provider","HA / availability status"]} />;
}
