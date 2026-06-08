type Props = {
  progress: number;
  currentAgent: string;
};

export default function ProgressBar({
  progress,
  currentAgent,
}: Props) {
  return (
    <>
      <div className="mt-4">

        <div className="bg-slate-700 h-3 rounded-full">

          <div
            className="
              bg-green-500
              h-3
              rounded-full
              transition-all
              duration-500
            "
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

        <p className="text-sm text-slate-300 mt-2">
          Progress : {progress}%
        </p>

      </div>

      <div className="mt-2 text-yellow-400">
        Current Agent : {currentAgent}
      </div>
    </>
  );
}