import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
};

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
}: Props) {
  return (
    <div
      className={`
        rounded-xl border border-border-subtle bg-surface-2
        shadow-[var(--shadow-card)]
        ${hover ? "transition-colors duration-200 hover:border-border-default hover:bg-surface-3" : ""}
        ${paddingMap[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-text-primary">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs text-text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
