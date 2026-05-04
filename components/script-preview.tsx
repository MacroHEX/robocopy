"use client";

import { useMemo } from "react";
import {
  buildBatScript,
  type RobocopyOptions,
  type ValidationIssue,
} from "@/lib/robocopy";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyIcon, DownloadIcon, FileCode2Icon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  opts: RobocopyOptions;
  issues: ValidationIssue[];
}

export function ScriptPreview({ opts, issues }: Props) {
  const script = useMemo(() => buildBatScript(opts), [opts]);
  const hasErrors = issues.length > 0;
  const filename = `${opts.jobName || "robocopy"}.bat`;

  const handleDownload = () => {
    if (hasErrors) {
      toast.error("Corrige los errores antes de descargar.");
      return;
    }
    const blob = new Blob([script], {
      type: "application/bat;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filename} descargado`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      toast.success("Script copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  };

  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode2Icon className="size-4" />
          Vista previa
        </CardTitle>
        <CardDescription>
          Se generará <code>{filename}</code> con codificación CRLF.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <pre className="max-h-[28rem] overflow-auto rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed font-mono whitespace-pre">
          {script}
        </pre>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleDownload}
            disabled={hasErrors}
            className="flex-1 min-w-32"
          >
            <DownloadIcon />
            Descargar .bat
          </Button>
          <Button onClick={handleCopy} variant="outline" disabled={hasErrors}>
            <CopyIcon />
            Copiar
          </Button>
        </div>
        {hasErrors && (
          <p className="text-xs text-destructive">
            {issues.length === 1
              ? "Hay 1 error que corregir."
              : `Hay ${issues.length} errores que corregir.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
