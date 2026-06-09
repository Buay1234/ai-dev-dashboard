import Card, { CardHeader } from "./ui/Card";
import EmptyState from "./ui/EmptyState";

type Props = {
  history: string[];
};

export default function HistoryPanel({ history }: Props) {
  return (
    <Card padding="md">
      <CardHeader
        title="Project History"
        description="Past mission requirements and timestamps"
      />
      {history.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title="No history yet"
          description="Completed and started missions will be recorded here."
        />
      ) : (
        <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-surface-1 overflow-hidden">
          {history.map((item, index) => (
            <li
              key={index}
              className="px-4 py-3 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
