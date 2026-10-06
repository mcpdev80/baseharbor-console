import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/shell/app-shell";
import { CoreSessionProvider } from "@/components/shell/core-session-provider";

export const metadata: Metadata = {
  title: {
    default: "BaseHarbor Console",
    template: "%s · BaseHarbor Console",
  },
  description: "Professional visual operations surface for BaseHarbor applications, targets, providers and runtime resources.",
  icons: {
    icon: "/baseharbor-icon-128.png",
    shortcut: "/baseharbor-icon-128.png",
    apple: "/baseharbor-icon-128.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <CoreSessionProvider><AppShell>{children}</AppShell></CoreSessionProvider>
      </body>
    </html>
  );
}
