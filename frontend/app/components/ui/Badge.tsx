import type { ReactNode } from "react";

type Variant = "idle" | "working" | "completed" | "error" | "default";

type Props = {
  children: ReactNode;
  variant?: Variant;
  pulse?: boolean;
};

const variantStyles: Record<Variant, string> = {
  idle: "bg-surface-3 text-text-muted border-border-subtle",
  working: "bg-warning-muted text-warning border-warning/30",
  completed: "bg-success-muted text-success border-success/30",
  error: "bg-error-muted text-error border-error/30",
  default: "bg-accent-muted text-accent border-accent/30",
};

export default function Badge({
  children,
  variant = "default",
  pulse = false,
}: Props) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5
        text-xs font-medium tracking-wide
        ${variantStyles[variant]}
        ${pulse ? "animate-pulse" : ""}
      `}
    >
      {children}
    </span>
  );
}

export function statusToBadgeVariant(
  status: string
): Variant {
  if (status === "Working") return "working";
  if (status === "Completed") return "completed";
  if (status === "Error") return "error";
  if (status === "Idle") return "idle";
  return "default";
}
