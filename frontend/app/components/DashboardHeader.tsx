"use client";

import Badge from "./ui/Badge";

type Props = {
  loading: boolean;
  currentAgent: string;
};

export default function DashboardHeader({ loading, currentAgent }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface-0/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div
            className="flex size-8 items-center justify-center rounded-lg bg-accent-muted border border-accent/30 text-sm"
            aria-hidden
          >
            ⚡
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-text-primary">
              AI Development Crew
            </h1>
            <p className="text-[11px] text-text-muted hidden sm:block">
              Multi-agent orchestration platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <Badge variant="working" pulse>
              <span className="size-1.5 rounded-full bg-warning animate-pulse" />
              Running · {currentAgent}
            </Badge>
          ) : currentAgent === "Completed" ? (
            <Badge variant="completed">Mission complete</Badge>
          ) : (
            <Badge variant="idle">Ready</Badge>
          )}
          <Badge variant="default">v2.5</Badge>
        </div>
      </div>
    </header>
  );
}
