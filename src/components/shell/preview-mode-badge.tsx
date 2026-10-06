"use client";

import { FlaskConical } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCoreSession } from "./core-session-provider";

export function PreviewModeBadge() {
  const path = usePathname();
  const { machine, mode } = useCoreSession();
  const livePage = ["/applications", "/targets", "/workspaces", "/runtime", "/operations"].includes(path);
  const label = livePage && mode === "live" ? machine ? "Connected Core" : "Core session ended" : "Fixture preview";
  return <span className="hidden items-center gap-1.5 rounded-md border border-amber-400/20 bg-amber-400/[.035] px-2.5 py-1.5 text-[10px] font-medium text-amber-200 xl:inline-flex"><FlaskConical className="size-3.5" />{label}</span>;
}
