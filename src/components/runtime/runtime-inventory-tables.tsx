import type { RuntimeImageSummary, RuntimeNetworkSummary, RuntimeVolumeSummary } from "@/lib/baseharbor/types";
import { OwnershipBadge } from "@/components/ui/badge";

function bytes(value?: number) {
  if (value == null) return "—";
  const units = ["B","KB","MB","GB","TB"]; let n=value, i=0;
  while(n>=1024 && i<units.length-1){n/=1024;i++;}
  return `${n.toFixed(i>1?1:0)} ${units[i]}`;
}

export function ImageInventoryTable({ images }: { images: RuntimeImageSummary[] }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-3">Image</th><th className="px-4 py-3">Runtime / Target</th><th className="px-4 py-3">Ownership</th><th className="px-4 py-3">Usage</th><th className="px-4 py-3">Size</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{images.map((image)=><tr key={image.id}><td className="px-5 py-4"><div className="font-medium text-slate-200">{image.reference}</div><div className="mt-1 font-mono text-[10px] text-slate-700">{image.digest ?? image.id}</div></td><td className="px-4 py-4 text-xs text-slate-400">{image.runtime} / {image.target}</td><td className="px-4 py-4"><OwnershipBadge value={image.ownership} /></td><td className="px-4 py-4 text-xs text-slate-400">{image.inUse ? `in use · ${image.relationships} relations` : "unused"}</td><td className="px-4 py-4 text-xs text-slate-400">{bytes(image.sizeBytes)}</td></tr>)}</tbody></table></div>;
}

export function VolumeInventoryTable({ volumes }: { volumes: RuntimeVolumeSummary[] }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-3">Volume / PVC</th><th className="px-4 py-3">Runtime / Target</th><th className="px-4 py-3">Ownership</th><th className="px-4 py-3">Attachments</th><th className="px-4 py-3">Capacity</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{volumes.map((volume)=><tr key={volume.id}><td className="px-5 py-4"><div className="font-medium text-slate-200">{volume.name}</div><div className="mt-1 text-xs text-slate-600">{volume.driver ?? "default driver"}</div></td><td className="px-4 py-4 text-xs text-slate-400">{volume.runtime} / {volume.target}</td><td className="px-4 py-4"><OwnershipBadge value={volume.ownership} /></td><td className="px-4 py-4 text-xs text-slate-400">{volume.attachedResources}{volume.inUse ? " · in use" : " · unused"}</td><td className="px-4 py-4 text-xs text-slate-400">{bytes(volume.capacityBytes)}</td></tr>)}</tbody></table></div>;
}

export function NetworkInventoryTable({ networks }: { networks: RuntimeNetworkSummary[] }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-white/[.018] text-[11px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-3">Network</th><th className="px-4 py-3">Runtime / Target</th><th className="px-4 py-3">Ownership</th><th className="px-4 py-3">Driver</th><th className="px-4 py-3">Connected</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{networks.map((network)=><tr key={network.id}><td className="px-5 py-4 font-medium text-slate-200">{network.name}</td><td className="px-4 py-4 text-xs text-slate-400">{network.runtime} / {network.target}</td><td className="px-4 py-4"><OwnershipBadge value={network.ownership} /></td><td className="px-4 py-4 text-xs text-slate-400">{network.driver ?? "—"}</td><td className="px-4 py-4 text-xs text-slate-400">{network.connectedResources} resources</td></tr>)}</tbody></table></div>;
}
