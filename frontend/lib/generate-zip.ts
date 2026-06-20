import JSZip from "jszip";
import { saveAs } from "file-saver";
import { extractFiles } from "@/lib/extract-files";
import {
  API_CSPROJ,
  APPLICATION_CSPROJ,
  APPSETTINGS_JSON,
  buildSolutionFile,
  DEFAULT_PROGRAM_CS,
  DOMAIN_CSPROJ,
  INFRASTRUCTURE_CSPROJ,
  README_MD,
} from "@/lib/project-templates";

function getCleanArchitecturePath(fileName: string): string {
  if (fileName.includes("Controller")) {
    return "MyProject.API/Controllers";
  }

  if (fileName.includes("Request")) {
    return "MyProject.Application/DTOs";
  }

  if (fileName.includes("Service")) {
    return "MyProject.Application/Services";
  }

  if (fileName.includes("Repository")) {
    return "MyProject.Infrastructure/Repositories";
  }

  if (fileName.includes("User")) {
    return "MyProject.Domain/Entities";
  }

  if (fileName.includes("DbContext")) {
    return "MyProject.Infrastructure/Data";
  }

  if (fileName === "Program.cs") {
    return "MyProject.API";
  }

  return "MyProject.Shared";
}

export async function generateProjectZip(zoroResult: string): Promise<void> {
  const zip = new JSZip();
  const files = extractFiles(zoroResult);
  const hasProgram = files.some((x) => x.name === "Program.cs");

  files.forEach((file) => {
    const path = getCleanArchitecturePath(file.name);

    console.log("CLEAN ARCH:", file.name, "=>", path);

    zip.file(`${path}/${file.name}`, file.content);

    console.log("ZIP FILE:", `${path}/${file.name}`);
  });

  zip.file("MyProject.sln", buildSolutionFile());

  if (!hasProgram) {
    zip.file("MyProject.API/Program.cs", DEFAULT_PROGRAM_CS);
  }

  zip.file("MyProject.API/MyProject.API.csproj", API_CSPROJ);
  zip.file("MyProject.Application/MyProject.Application.csproj", APPLICATION_CSPROJ);
  zip.file("MyProject.Domain/MyProject.Domain.csproj", DOMAIN_CSPROJ);
  zip.file("MyProject.Infrastructure/MyProject.Infrastructure.csproj", INFRASTRUCTURE_CSPROJ);
  zip.file("MyProject.API/appsettings.json", APPSETTINGS_JSON);
  zip.file("README.md", README_MD);

  const blob = await zip.generateAsync({ type: "blob" });

  saveAs(blob, "ai-project.zip");
}
