import Card, { CardHeader } from "./ui/Card";
import EmptyState, { ErrorState, LoadingState } from "./ui/EmptyState";

type Props = {
  title: string;
  result: string;
  status?: string;
};

export default function ResultCard({ title, result, status = "Idle" }: Props) {
  const renderContent = () => {
    if (status === "Working" && !result) {
      return <LoadingState label="Agent is generating output..." />;
    }

    if (status === "Error") {
      return (
        <ErrorState
          title="Agent failed"
          description="This agent encountered an error during execution."
        />
      );
    }

    if (!result) {
      return (
        <EmptyState
          icon="📄"
          title="No output yet"
          description="Start a mission or wait for this agent to complete its task."
        />
      );
    }

    return (
      <pre className="whitespace-pre-wrap text-xs leading-relaxed text-text-secondary font-mono max-h-[420px] overflow-y-auto">
        {result}
      </pre>
    );
  };

  return (
    <Card padding="md" className="min-h-[320px] flex flex-col">
      <CardHeader title={title} />
      <div className="flex-1">{renderContent()}</div>
    </Card>
  );
}
