type Props = {
  logs: string[];
};

export default function ActivityLog({
  logs,
}: Props) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg mt-4">
      <h2 className="font-bold mb-3">
        📜 Activity Log
      </h2>

      <div className="max-h-60 overflow-y-auto">
        {logs.map((log, index) => (
          <div
            key={index}
            className="border-b border-slate-700 py-2 text-sm"
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}