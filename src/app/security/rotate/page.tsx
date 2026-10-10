import { RotationWizard } from "@/components/wizard/rotation-wizard";
import { LiveCoreRotation } from "@/components/live/core-rotation";

export default function RotateSecurityMaterialPage() {
  return <LiveCoreRotation><RotationWizard /></LiveCoreRotation>;
}
