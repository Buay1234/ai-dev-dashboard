type Props = {
  icon?: string;
  title: string;
  description: string;
};

export default function EmptyState({ icon = "📭", title, description }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
      role="status"
    >
      <span className="text-3xl mb-3 opacity-60" aria-hidden>
        {icon}
      </span>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      <p className="mt-1 text-xs text-text-muted max-w-xs">{description}</p>
    </div>
  );
}

export function LoadingState({ label = "Processing..." }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3 py-8 px-6" role="status" aria-live="polite">
      <div className="h-3 rounded-full animate-shimmer w-full max-w-md mx-auto" />
      <div className="h-3 rounded-full animate-shimmer w-3/4 max-w-sm mx-auto" />
      <div className="h-3 rounded-full animate-shimmer w-1/2 max-w-xs mx-auto" />
      <p className="text-xs text-text-muted text-center mt-2">{label}</p>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "The agent encountered an error. Check the activity log for details.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-10 px-6 text-center rounded-lg bg-error-muted border border-error/20"
      role="alert"
    >
      <span className="text-2xl mb-2" aria-hidden>
        ⚠️
      </span>
      <p className="text-sm font-medium text-error">{title}</p>
      <p className="mt-1 text-xs text-text-muted max-w-sm">{description}</p>
    </div>
  );
}
