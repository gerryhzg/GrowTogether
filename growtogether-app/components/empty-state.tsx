import Link from "next/link";
import { Panel } from "@/components/ui/panel";

export function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <Panel className="text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-secondary">Ready to start</p>
      <h2 className="mt-3 font-display text-3xl text-foreground">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-muted">{description}</p>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
      >
        {ctaLabel}
      </Link>
    </Panel>
  );
}
