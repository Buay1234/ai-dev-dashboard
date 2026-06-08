type Props = {
  history: string[];
};

export default function HistoryPanel({
  history,
}: Props) {

  return (
    <div className="mt-10 bg-slate-800 p-5 rounded-lg">

      <h2 className="text-xl mb-3">
        Project History
      </h2>

      {history.map((item, index) => (
        <div
          key={index}
          className="
            border-b
            border-slate-700
            py-2
          "
        >
          {item}
        </div>
      ))}
    </div>
  );
}