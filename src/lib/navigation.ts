import {
  Activity,
  AppWindow,
  Boxes,
  FileKey2,
  FolderGit2,
  Gauge,
  HardDriveDownload,
  ListChecks,
  Network,
  PackageSearch,
  Settings,
  ShieldCheck,
  Target,
  Workflow,
} from "lucide-react";

export const navigation = [
  { label: "Overview", href: "/", icon: Gauge },
  { label: "Applications", href: "/applications", icon: AppWindow },
  { label: "Repositories", href: "/repositories", icon: FolderGit2 },
  { label: "Workspaces", href: "/workspaces", icon: Workflow },
  { label: "Targets", href: "/targets", icon: Target },
  {
    label: "Runtime",
    href: "/runtime",
    icon: Boxes,
    children: [
      { label: "Resources", href: "/runtime" },
      { label: "Images", href: "/runtime/images" },
      { label: "Volumes", href: "/runtime/volumes" },
      { label: "Networks", href: "/runtime/networks" },
      { label: "Events", href: "/runtime/events" },
    ],
  },
  { label: "Operations", href: "/operations", icon: ListChecks },
  { label: "Providers", href: "/providers", icon: PackageSearch },
  { label: "Observability", href: "/observability", icon: Activity },
  { label: "Recovery", href: "/recovery", icon: HardDriveDownload },
  { label: "Security", href: "/security", icon: ShieldCheck },
  { label: "Evidence", href: "/evidence", icon: FileKey2 },
  { label: "Platform", href: "/platform", icon: Network },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export const platformFacts = [
  { label: "Core", value: "BaseHarbor" },
  { label: "Authorization", value: "#770 shared machine auth" },
  { label: "HTTP/Streams", value: "#767" },
  { label: "Runtime model", value: "#768" },
  { label: "Target access", value: "#769" },
] as const;
