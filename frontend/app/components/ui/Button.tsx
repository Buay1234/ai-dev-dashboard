import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "success" | "danger";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover border border-accent/80 shadow-sm",
  secondary:
    "bg-surface-3 text-text-primary hover:bg-surface-elevated border border-border-default",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-3 border border-transparent",
  success:
    "bg-success/10 text-success hover:bg-success/20 border border-success/30",
  danger:
    "bg-error/10 text-error hover:bg-error/20 border border-error/30",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
};

export default function Button({
  children,
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span
          className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
