import { FlaskConical } from "lucide-react";
import { consoleRuntimeInfo } from "@/lib/baseharbor/runtime-info";

export function PreviewModeBadge() {
  if (consoleRuntimeInfo.dataMode !== "fixture") return null;
  return (
    <span className="hidden items-center gap-1.5 rounded-md border border-amber-400/20 bg-amber-400/[.035] px-2.5 py-1.5 text-[10px] font-medium text-amber-200 xl:inline-flex" title="UI is using contract-shaped fixture data; live Core binding is not enabled.">
      <FlaskConical className="size-3.5" />
      Fixture preview
    </span>
  );
}
