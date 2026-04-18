import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { AppStateProvider } from "@/components/providers/app-state-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrowTogether",
  description: "A local-first parent-kid growth journey app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AppStateProvider>
          <AppShell>{children}</AppShell>
        </AppStateProvider>
      </body>
    </html>
  );
}
