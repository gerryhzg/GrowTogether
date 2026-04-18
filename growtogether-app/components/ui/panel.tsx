import { ReactNode } from "react";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-panel rounded-[1.75rem] p-5 sm:p-6 ${className}`}>
      {children}
    </section>
  );
}
