import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  logs: string[];
};

export default function ActivityLog({ logs }: Props) {
  return (
    <Card padding="md">
      <CardHeader
        title="Activity Log"
        description="Real-time events from the mission pipeline"
      />
      <div
        className="max-h-64 overflow-y-auto rounded-lg border border-border-subtle bg-surface-1"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {logs.length === 0 ? (
          <EmptyState
            icon="📜"
            title="No activity yet"
            description="Logs will appear here when you start a mission."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {logs.map((log, index) => (
              <li
                key={index}
                className="px-4 py-2.5 text-xs font-mono text-text-secondary hover:bg-surface-2 transition-colors"
              >
                {log}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
