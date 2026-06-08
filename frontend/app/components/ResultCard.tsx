type Props = {
  title: string;
  result: string;
};

export default function ResultCard({
  title,
  result,
}: Props) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg min-h-[400px]">

      <h2 className="font-bold mb-2">
        {title}
      </h2>

      <pre className="whitespace-pre-wrap text-sm">
        {result}
      </pre>

    </div>
  );
}