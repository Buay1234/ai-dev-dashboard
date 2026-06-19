"use client";

const ZOOM_LEVELS = [
  { label: "100%", value: 1 },
  { label: "125%", value: 1.25 },
  { label: "150%", value: 1.5 },
] as const;

type Props = {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

export default function OfficeViewportControls({
  zoom,
  onZoomChange,
  isFullscreen,
  onToggleFullscreen,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="flex rounded-lg border border-cyan-500/25 bg-slate-900/80 p-0.5"
        role="group"
        aria-label="Office zoom level"
      >
        {ZOOM_LEVELS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => onZoomChange(value)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition ${
              zoom === value
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            aria-pressed={zoom === value}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggleFullscreen}
        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-300 transition hover:bg-amber-500/20"
        aria-pressed={isFullscreen}
      >
        {isFullscreen ? "Exit Fullscreen" : "Expand Office"}
      </button>
    </div>
  );
}

export { ZOOM_LEVELS };
