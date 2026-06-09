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

  const renderStatus = () => {
    if (status === "Working") {
      return (
        <>
          <motion.span
            className="inline-block"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            ⚙️
          </motion.span>
          {" "}Working...
        </>
      );
    }

    if (status === "Completed") {
      return <>✅ Completed</>;
    }

    if (status === "Error") {
      return <>❌ Error</>;
    }

    return status;
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
          {" "}{renderStatus()}
        </span>
      </p>
    </motion.div>
  );
}
