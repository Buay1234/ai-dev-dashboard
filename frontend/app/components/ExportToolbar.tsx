"use client";

import Button from "./ui/Button";

type Props = {
  onExportMarkdown: () => void;
  onExportPdf: () => void;
  onGenerateZip: () => void;
  zipLocked?: boolean;
  onTestExtract: () => void;
  onDebugFiles: () => void;
  onShowZoroResult: () => void;
};

export default function ExportToolbar({
  onExportMarkdown,
  onExportPdf,
  onGenerateZip,
  zipLocked = false,
  onTestExtract,
  onDebugFiles,
  onShowZoroResult,
}: Props) {
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
        disabled={zipLocked}
        title={
          zipLocked
            ? "Complete Usopp build verification first"
            : "Download project ZIP"
        }
      >
        {zipLocked ? "ZIP Locked" : "Download ZIP"}
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
