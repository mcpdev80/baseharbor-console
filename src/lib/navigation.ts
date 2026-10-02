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

export const navigationGroups = [
  {
    label: "Overview",
    items: [{ label: "Overview", href: "/", icon: Gauge }],
  },
  {
    label: "Develop",
    items: [
      { label: "Applications", href: "/applications", icon: AppWindow },
      { label: "Repositories", href: "/repositories", icon: FolderGit2 },
      { label: "Workspaces", href: "/workspaces", icon: Workflow },
    ],
  },
  {
    label: "Operate",
    items: [
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
    ],
  },
  {
    label: "Observe",
    items: [
      { label: "Observability", href: "/observability", icon: Activity },
      { label: "Evidence", href: "/evidence", icon: FileKey2 },
    ],
  },
  {
    label: "Protect",
    items: [
      { label: "Security", href: "/security", icon: ShieldCheck },
      { label: "Recovery", href: "/recovery", icon: HardDriveDownload },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Organization", href: "/platform", icon: Network },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
] as const;

export const platformFacts = [
  { label: "Core", value: "BaseHarbor" },
  { label: "Authorization", value: "#770 shared machine auth" },
  { label: "HTTP/Streams", value: "#767" },
  { label: "Runtime model", value: "#768" },
  { label: "Target access", value: "#769" },
] as const;
