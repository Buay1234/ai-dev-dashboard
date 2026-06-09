import type { ExtractedFile } from "@/lib/types/agent-results";

const FILE_BLOCK_REGEX =
  /# File:\s(.+?)\s+```[\w]*\n([\s\S]*?)```/g;

export function extractFiles(markdown: string): ExtractedFile[] {
  const files: ExtractedFile[] = [];
  let match: RegExpExecArray | null;

  while ((match = FILE_BLOCK_REGEX.exec(markdown)) !== null) {
    files.push({
      name: match[1].trim(),
      content: match[2].trim(),
    });
  }

  return files;
}
