type Props = {
  projectCount: number;
  successCount: number;
};

export default function DashboardStats({
  projectCount,
  successCount,
}: Props) {

  return (
    <div className="grid md:grid-cols-2 gap-4 mt-4">

      <div className="bg-slate-800 p-4 rounded-lg">
        <h3>Total Projects</h3>

        <p className="text-2xl font-bold">
          {projectCount}
        </p>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg">
        <h3>Success</h3>

        <p className="text-2xl font-bold text-green-400">
          {successCount}
        </p>
      </div>

    </div>
  );
}