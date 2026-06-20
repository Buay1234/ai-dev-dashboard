"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-slate-400">{error.message}</p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
