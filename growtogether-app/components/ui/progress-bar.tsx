export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      ) : null}
      <div className="h-3 overflow-hidden rounded-full bg-secondary-soft">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-sun transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
