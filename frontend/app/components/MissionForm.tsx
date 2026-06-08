type Props = {
  requirement: string;
  setRequirement: (
    value: string
  ) => void;

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
    <>
      <textarea
        value={requirement}
        onChange={(e) =>
          setRequirement(e.target.value)
        }
        className="
          w-full
          h-32
          bg-white
          text-black
          p-4
          rounded-lg
        "
        placeholder="สร้างระบบ Login..."
      />

      <button
        disabled={loading}
        onClick={startMission}
        className={`
          mt-4 px-5 py-2 rounded-lg
          flex items-center gap-2
          ${
            loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }
        `}
      >
        {loading && (
          <span className="animate-spin">
            ⚙️
          </span>
        )}

        {loading
          ? "Running..."
          : "Start Mission"}
      </button>
    </>
  );
}