"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-context";
import {
  ChildTheme,
  ChildThemeProvider,
} from "@/components/providers/child-theme-context";
import { LoginPage } from "@/components/screens/login-page";

type NavItem = {
  href: string;
  icon: string;
  label: string;
  neonLabel?: string;
};

const CHILD_THEME_STORAGE_KEY = "growtogether-child-theme";

const childNavItems: NavItem[] = [
  { href: "/", icon: "Home", label: "Home", neonLabel: "Base" },
  { href: "/discover", icon: "Search", label: "Discover", neonLabel: "Quest Lab" },
  { href: "/check-in", icon: "Check", label: "Check-In", neonLabel: "Mission Log" },
  { href: "/memory", icon: "Book", label: "Memory", neonLabel: "Replay" },
];

const parentNavItems: NavItem[] = [
  { href: "/", icon: "Home", label: "Dashboard" },
  { href: "/discover", icon: "Search", label: "Discover" },
  { href: "/parent", icon: "Heart", label: "Parent Center" },
  { href: "/memory", icon: "Book", label: "Memory" },
];

function isChildTheme(value: string | null): value is ChildTheme {
  return value === "original" || value === "neon-quest";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const [childTheme, setChildTheme] = useState<ChildTheme>("original");

  const isChild = user?.role === "child";

  useEffect(() => {
    if (!isChild) {
      return;
    }

    queueMicrotask(() => {
      const storedTheme = window.localStorage.getItem(CHILD_THEME_STORAGE_KEY);
      if (isChildTheme(storedTheme)) {
        setChildTheme(storedTheme);
      }
    });
  }, [isChild]);

  function toggleChildTheme() {
    setChildTheme((currentTheme) => {
      const nextTheme = currentTheme === "original" ? "neon-quest" : "original";
      window.localStorage.setItem(CHILD_THEME_STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const navItems = isChild ? childNavItems : parentNavItems;
  const themeLabel = childTheme === "original" ? "Original" : "Neon Quest";

  if (isChild && pathname === "/parent") {
    return (
      <div
        data-role="child"
        data-child-theme={childTheme}
        className="flex min-h-screen items-center justify-center px-4"
      >
        <div className="text-center">
          <div className="text-6xl">Lock</div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">
            Parent zone is locked, bestie
          </h2>
          <p className="mt-2 text-muted">Back to base. Your quests are waiting.</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!isChild && pathname === "/check-in") {
    return (
      <div
        data-role="parent"
        className="flex min-h-screen items-center justify-center px-4"
      >
        <div className="text-center">
          <div className="text-6xl">Lock</div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">
            This page is for your child
          </h2>
          <p className="mt-2 text-muted">
            Ask your child to log in and do their check-in.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      data-role={user.role}
      data-child-theme={isChild ? childTheme : undefined}
      className="app-shell min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="glass-panel warm-ring relative overflow-hidden rounded-[2rem] px-6 py-5 sm:px-8">
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-secondary">
                {isChild && childTheme === "neon-quest"
                  ? "GrowTogether HQ"
                  : "GrowTogether"}
              </p>
              <h1 className="mt-2 font-display text-3xl leading-tight text-foreground sm:text-4xl">
                {isChild
                  ? childTheme === "neon-quest"
                    ? `${user.name}, lock in. The mission board is live.`
                    : `Hey ${user.name}! Ready to grow?`
                  : `Welcome back, ${user.name} ${user.emoji}`}
              </h1>
              <p className="mt-2 text-sm text-muted">
                {isChild
                  ? childTheme === "neon-quest"
                    ? "Stack XP, catch Ws, and keep the streak spicy. No cap."
                    : "You are doing amazing. Keep going."
                  : "Supporting your child's growth journey."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="family-code-card rounded-[1.5rem] px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-muted">
                  Family
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {user.familyCode}
                </p>
              </div>
              {isChild && (
                <button
                  type="button"
                  onClick={toggleChildTheme}
                  className="theme-toggle rounded-full border border-border bg-white/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
                >
                  Theme: {themeLabel}
                </button>
              )}
              <button
                onClick={logout}
                className="rounded-full border border-border bg-white/60 px-4 py-2 text-sm text-muted transition hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <nav className="glass-panel hidden flex-wrap gap-2 rounded-[1.75rem] p-3 sm:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const label =
              isChild && childTheme === "neon-quest" && item.neonLabel
                ? item.neonLabel
                : item.label;

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
                {label}
              </Link>
            );
          })}
        </nav>

        <ChildThemeProvider childTheme={isChild ? childTheme : "original"}>
          <main>{children}</main>
        </ChildThemeProvider>

        <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-border px-2 py-3 backdrop-blur sm:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const label =
              isChild && childTheme === "neon-quest" && item.neonLabel
                ? item.neonLabel
                : item.label;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-xs transition ${
                  active ? "font-semibold text-accent" : "text-muted"
                }`}
              >
                <span className="text-[0.65rem] uppercase tracking-[0.16em]">
                  {item.icon}
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="h-16 sm:hidden" />
      </div>
    </div>
  );
}
