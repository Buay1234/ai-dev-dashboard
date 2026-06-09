type Props = {
  currentAgent: string;
  robinStatus: string;
  zoroStatus: string;
  namiStatus: string;
  frankyStatus: string;
  usoppStatus: string;
};

const AGENTS = ["Robin", "Zoro", "Nami", "Franky", "Usopp"];

export default function MissionTimeline({
  currentAgent,
  robinStatus,
  zoroStatus,
  namiStatus,
  frankyStatus,
  usoppStatus,
}: Props) {
  const statuses: Record<string, string> = {
    Robin: robinStatus,
    Zoro: zoroStatus,
    Nami: namiStatus,
    Franky: frankyStatus,
    Usopp: usoppStatus,
  };

  const getAgentClasses = (name: string) => {
    const status = statuses[name];

    if (status === "Completed") {
      return "text-green-400 font-semibold";
    }

    if (name === currentAgent || status === "Working") {
      return "text-yellow-400 font-semibold animate-pulse";
    }

    return "text-gray-500";
  };

  return (
    <div className="mt-4 bg-slate-800 p-4 rounded-lg">
      <h2 className="font-bold mb-3 text-slate-200">Mission Timeline</h2>
      <div className="flex flex-col items-center gap-1">
        {AGENTS.map((name, index) => (
          <div key={name} className="flex flex-col items-center">
            <span className={getAgentClasses(name)}>{name}</span>
            {index < AGENTS.length - 1 && (
              <span className="text-slate-500 my-1">↓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
