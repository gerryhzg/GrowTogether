"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-context";
import { LoginPage } from "@/components/screens/login-page";

const childNavItems = [
  { href: "/", label: "🏠 Home" },
  { href: "/discover", label: "🔍 Discover" },
  { href: "/check-in", label: "✅ Check-In" },
  { href: "/memory", label: "📖 Memory" },
];

const parentNavItems = [
  { href: "/", label: "🏠 Dashboard" },
  { href: "/discover", label: "🔍 Discover" },
  { href: "/parent", label: "💛 Parent Center" },
  { href: "/memory", label: "📖 Memory" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

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

  const isChild = user.role === "child";
  const navItems = isChild ? childNavItems : parentNavItems;

  // Block child from parent page
  if (isChild && pathname === "/parent") {
    return (
      <div data-role="child" className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl float-emoji">🔒</div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Oops! This page is for parents 😊</h2>
          <p className="mt-2 text-muted">Head back to your dashboard!</p>
          <Link href="/" className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white">
            Go Home 🏠
          </Link>
        </div>
      </div>
    );
  }

  // Block parent from check-in page
  if (!isChild && pathname === "/check-in") {
    return (
      <div data-role="parent" className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl">🔒</div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">This page is for your child</h2>
          <p className="mt-2 text-muted">Ask your child to log in and do their check-in.</p>
          <Link href="/" className="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div data-role={user.role} className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8" style={{ background: isChild ? "linear-gradient(135deg, #fff0f8 0%, #f0e6ff 100%)" : "linear-gradient(135deg, #f0f4f8 0%, #e8f4f0 100%)" }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">

        {/* Header */}
        <header className="glass-panel warm-ring relative overflow-hidden rounded-[2rem] px-6 py-5 sm:px-8">
          <div className="absolute -right-12 -top-10 h-32 w-32 rounded-full blur-2xl" style={{ background: isChild ? "rgba(255,107,181,0.2)" : "rgba(45,106,79,0.15)" }} />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-secondary">
                GrowTogether {isChild ? "🌈" : ""}
              </p>
              <h1 className="mt-2 font-display text-3xl leading-tight text-foreground sm:text-4xl">
                {isChild
                  ? `Hey ${user.emoji} ${user.name}! Ready to grow? 🌱`
                  : `Welcome back, ${user.name} ${user.emoji}`}
              </h1>
              <p className="mt-2 text-sm text-muted">
                {isChild
                  ? "You're doing amazing! Keep going! ⭐"
                  : "Supporting your child's growth journey."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`rounded-[1.5rem] px-5 py-4 shadow-sm ${isChild ? "bg-pink-100" : "bg-slate-100"}`}>
                <p className="text-xs uppercase tracking-[0.25em] text-muted">Family</p>
                <p className="mt-1 text-sm font-bold text-foreground">{user.familyCode}</p>
              </div>
              <button
                onClick={logout}
                className="rounded-full border border-border bg-white/60 px-4 py-2 text-sm text-muted transition hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Nav */}
        <nav className="glass-panel hidden flex-wrap gap-2 rounded-[1.75rem] p-3 sm:flex">
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

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-border px-2 py-3 backdrop-blur sm:hidden" style={{ background: isChild ? "rgba(255,240,255,0.95)" : "rgba(240,244,248,0.95)" }}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            const emoji = item.label.split(" ")[0];
            const label = item.label.split(" ").slice(1).join(" ");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-xs transition ${
                  active ? "text-accent font-semibold" : "text-muted"
                }`}
              >
                <span className="text-xl">{emoji}</span>
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
