import Card, { CardHeader } from "./ui/Card";
import Button from "./ui/Button";

type Props = {
  requirement: string;
  setRequirement: (value: string) => void;
  loading: boolean;
  startMission: () => void;
};

export default function MissionForm({
  requirement,
  setRequirement,
  loading,
  startMission,
}: Props) {
  return (
    <Card padding="lg">
      <CardHeader
        title="New Mission"
        description="Describe your software requirement. The AI crew will analyze, design, and deliver."
      />
      <label htmlFor="mission-requirement" className="sr-only">
        Mission requirement
      </label>
      <textarea
        id="mission-requirement"
        value={requirement}
        onChange={(e) => setRequirement(e.target.value)}
        disabled={loading}
        className="
          w-full min-h-[120px] resize-y rounded-lg border border-border-default
          bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50
          disabled:opacity-60 disabled:cursor-not-allowed
          font-sans leading-relaxed
        "
        placeholder="e.g. Build a login system with JWT authentication and role-based access..."
      />
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-text-muted">
          {requirement.trim().length > 0
            ? `${requirement.trim().length} characters`
            : "Enter a requirement to begin"}
        </p>
        <Button
          variant="primary"
          loading={loading}
          disabled={loading || !requirement.trim()}
          onClick={startMission}
          aria-label={loading ? "Mission in progress" : "Start mission"}
        >
          {loading ? "Running mission..." : "Start Mission"}
        </Button>
      </div>
    </Card>
  );
}
