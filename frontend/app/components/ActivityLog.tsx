import Card, { CardHeader } from "./ui/Card";
import LiveConversation from "./LiveConversation";
import type { AgentMessage } from "@/app/types/conversation";

type Props = {
  logs: string[];
  messages: AgentMessage[];
};

export default function ActivityLog({ logs, messages }: Props) {
  return (
    <Card padding="md">
      <CardHeader
        title="Activity Log"
        description="Live AI conversation · V19"
      />
      <div
        className="max-h-80 overflow-y-auto rounded-lg border border-border-subtle bg-surface-1"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <LiveConversation messages={messages} />
      </div>
      {logs.length > 0 && (
        <details className="mt-3 text-xs text-text-muted">
          <summary className="cursor-pointer font-mono uppercase tracking-wider text-cyan-500/70">
            Pipeline events ({logs.length})
          </summary>
          <ul className="mt-2 max-h-32 overflow-y-auto divide-y divide-border-subtle rounded border border-border-subtle">
            {logs.slice(0, 15).map((log, index) => (
              <li key={index} className="px-3 py-1.5 font-mono text-text-secondary">
                {log}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}
