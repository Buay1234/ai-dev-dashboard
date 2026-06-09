import { motion } from "framer-motion";

type Props = {
  icon: string;
  name: string;
  role: string;
  status: string;
};

export default function AgentCard({
  icon,
  name,
  role,
  status,
}: Props) {
  const getColor = () => {
    if (status === "Completed") return "text-green-400";
    if (status === "Error") return "text-red-400";
    if (status === "Working") return "text-yellow-400";
    return "text-gray-400";
  };

  return (
    <motion.div
      className="bg-slate-800 p-4 rounded-lg"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <h2>{icon} {name}</h2>

      <p>{role}</p>

      <p>
        Status :
        <span className={getColor()}>
          {" "}{status}
        </span>
      </p>
    </motion.div>
  );
}
