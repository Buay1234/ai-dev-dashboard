"use client";

import type { AgentMessage } from "@/app/types/conversation";

interface Props {
  messages: AgentMessage[];
}

export default function LiveConversation({ messages }: Props) {
  const recent = messages.slice(-20);

  if (recent.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-xs text-slate-500">
        Agent dialogue will appear here during missions.
      </p>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {recent.map((msg, index) => (
        <div
          key={`${msg.timestamp}-${msg.agent}-${index}`}
          className="rounded-xl border border-cyan-500/20 bg-slate-900/70 p-3"
        >
          <div className="text-sm font-semibold text-cyan-400">{msg.agent}</div>
          <div className="text-sm text-white">{msg.message}</div>
          <div className="text-xs text-slate-500">{msg.timestamp}</div>
        </div>
      ))}
    </div>
  );
}
