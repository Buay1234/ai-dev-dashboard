"use client";

import Button from "./ui/Button";

type Props = {
  onExportMarkdown: () => void;
  onExportPdf: () => void;
  onGenerateZip: () => void;
  exportReady?: boolean;
  zipLocked?: boolean;
  onTestExtract: () => void;
  onDebugFiles: () => void;
  onShowZoroResult: () => void;
};

export default function ExportToolbar({
  onExportMarkdown,
  onExportPdf,
  onGenerateZip,
  exportReady = false,
  zipLocked = false,
  onTestExtract,
  onDebugFiles,
  onShowZoroResult,
}: Props) {
  const zipEnabled = exportReady || !zipLocked;

  return (
    <div
      className="flex flex-wrap gap-2"
      role="toolbar"
      aria-label="Export and debug actions"
    >
      <Button variant="success" size="sm" onClick={onExportMarkdown}>
        Export Markdown
      </Button>
      <Button variant="danger" size="sm" onClick={onExportPdf}>
        Export PDF
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={onGenerateZip}
        disabled={!zipEnabled}
        title={
          exportReady
            ? "Download verified project ZIP"
            : "Complete mission with build & tests passed"
        }
      >
        {exportReady ? "Export Ready ✅" : "Download ZIP"}
      </Button>
      <Button variant="ghost" size="sm" onClick={onTestExtract}>
        Test Extract
      </Button>
      <Button variant="ghost" size="sm" onClick={onDebugFiles}>
        Debug Files
      </Button>
      <Button variant="ghost" size="sm" onClick={onShowZoroResult}>
        Show Zoro Result
      </Button>
    </div>
  );
}
