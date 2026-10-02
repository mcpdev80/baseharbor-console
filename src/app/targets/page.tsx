import { SectionPage } from "@/components/section/section-page";
export default function Page() {
  return <SectionPage eyebrow="Deployment context" title="Targets" description="Targets combine runtime, access reference and scope while keeping Runtime Provider and Target Access Provider explicitly independent." capabilities={["List / inspect targets","Create / delete target","Default/effective target","Runtime provider","Target access reference","Connectivity / capability health"]} />;
}
