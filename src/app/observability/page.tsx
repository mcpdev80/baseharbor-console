import { SectionPage } from "@/components/section/section-page";
export default function Page() {
  return <SectionPage eyebrow="Signals" title="Observability" description="Application and provider telemetry through BaseHarbor's provider-neutral metrics, logs and traces semantics." capabilities={["Metrics","Logs","Traces","OTLP state","Provider signal health","Application observability"]} />;
}
