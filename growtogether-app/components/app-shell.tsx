"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/discover", label: "Discover" },
  { href: "/check-in", label: "Daily Check-In" },
  { href: "/parent", label: "Parent Center" },
  { href: "/memory", label: "Growth Memory" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="glass-panel warm-ring relative overflow-hidden rounded-[2rem] px-6 py-5 sm:px-8">
          <div className="absolute -right-12 -top-10 h-32 w-32 rounded-full bg-accent/18 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-secondary/15 blur-2xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-secondary">
                GrowTogether
              </p>
              <h1 className="mt-2 font-display text-4xl leading-tight text-foreground sm:text-5xl">
                Build one shared growth story at a time.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-muted sm:text-base">
                Help kids grow in the things they care about, and help parents show up with encouragement that feels specific, warm, and timely.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-surface-strong/90 px-5 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-muted">
                Hackathon MVP
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                Local-first browser app with AI-assisted guidance
              </p>
            </div>
          </div>
        </header>

        <nav className="glass-panel flex flex-wrap gap-2 rounded-[1.75rem] p-3">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-accent text-white shadow-sm"
                    : "bg-white/60 text-muted hover:bg-white hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}
