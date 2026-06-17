const META_START = "<<<META>>>";
const META_END = "<<<END_META>>>";

export function buildMetaInstructions() {
  return `
Before your main deliverable, output a metadata block EXACTLY in this format:

${META_START}
SUMMARY: One short sentence (max 120 chars) for a speech bubble
THOUGHTS:
- bullet 1 (your current reasoning step)
- bullet 2
- bullet 3
REASONING: 1-2 sentences explaining your approach for the activity log
${META_END}

Then output the full deliverable below the metadata block.
`;
}

export function parseAgentResponse(text: string): {
  result: string;
  thoughts: string[];
  summary: string;
  reasoning: string;
} {
  const metaMatch = text.match(
    new RegExp(`${escapeRe(META_START)}([\\s\\S]*?)${escapeRe(META_END)}`, "i")
  );

  if (!metaMatch) {
    return fallbackParse(text);
  }

  const meta = metaMatch[1];
  const result = text.slice(metaMatch.index! + metaMatch[0].length).trim();

  const summary =
    extractLine(meta, "SUMMARY:") ||
    firstSentence(result) ||
    "Analysis in progress…";

  const reasoning =
    extractLine(meta, "REASONING:") || summary;

  const thoughts = extractThoughtBullets(meta);

  return {
    result: result || text.trim(),
    thoughts: thoughts.length > 0 ? thoughts : fallbackThoughts(result),
    summary: summary.slice(0, 120),
    reasoning,
  };
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractLine(meta: string, key: string) {
  const re = new RegExp(`${key}\\s*(.+?)(?=\\n[A-Z]+:|$)`, "is");
  const m = meta.match(re);
  return m?.[1]?.trim().replace(/\n/g, " ");
}

function extractThoughtBullets(meta: string) {
  const section = meta.match(/THOUGHTS:\s*([\s\S]*?)(?=REASONING:|$)/i);
  if (!section) return [];

  return section[1]
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function fallbackThoughts(text: string) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^#+\s*/, "").replace(/^[-*•]\s*/, "").trim())
    .filter((l) => l.length > 8 && l.length < 120)
    .slice(0, 5);

  return lines.length > 0 ? lines : ["Processing deliverable…"];
}

function firstSentence(text: string) {
  const line = text.split("\n").find((l) => l.trim().length > 10);
  return line?.trim().slice(0, 120);
}

function fallbackParse(text: string) {
  const trimmed = text.trim();
  const thoughts = fallbackThoughts(trimmed);
  const summary = firstSentence(trimmed) || thoughts[0] || "Working…";
  return {
    result: trimmed,
    thoughts,
    summary: summary.slice(0, 120),
    reasoning: summary,
  };
}
