// Explicit preview-only data. Connected routes use LiveCoreAdapter with a verified browser session.
import { fixtureAdapter } from "./fixture-adapter";
import type { BaseHarborConsoleAdapter } from "./adapter";

export const previewData: BaseHarborConsoleAdapter = fixtureAdapter;
