import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { ArtifactBundle } from "@/app/types/artifacts";
import type { GeneratedProjectBundle } from "@/lib/project-generator/types";
import { prepareZipExportFiles } from "@/lib/artifacts/artifact-service";

export async function exportGeneratedProjectZip(
  project: GeneratedProjectBundle,
  artifacts?: ArtifactBundle | null
): Promise<void> {
  const zip = new JSZip();

  for (const file of project.sourceFiles) {
    const fullPath = file.path ? `${file.path}/${file.fileName}` : file.fileName;
    zip.file(fullPath, file.content);
  }

  if (artifacts) {
    const docFiles = prepareZipExportFiles(artifacts.artifacts);
    for (const doc of docFiles) {
      zip.file(`docs/artifacts/${doc.path}`, doc.content);
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "ai-generated-project.zip");
}

export function downloadSourceFile(file: GeneratedProjectBundle["sourceFiles"][0]) {
  const blob = new Blob([file.content], {
    type: file.language === "sql" ? "application/sql" : "text/plain;charset=utf-8",
  });
  saveAs(blob, file.fileName);
}

export async function copySourceFileContent(
  file: GeneratedProjectBundle["sourceFiles"][0]
): Promise<void> {
  await navigator.clipboard.writeText(file.content);
}
