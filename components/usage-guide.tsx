"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, CopyIcon } from "lucide-react";
import { buildSchtasksCommand, type RobocopyOptions } from "@/lib/robocopy";

interface Props {
  opts: RobocopyOptions;
}

export function UsageGuide({ opts }: Props) {
  const schtasks = buildSchtasksCommand(opts);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Guarda el .bat</CardTitle>
          <CardDescription>
            Coloca el archivo en una carpeta estable, por ejemplo{" "}
            <code>C:\Scripts\</code>. Evita rutas que puedan moverse o eliminarse
            (Escritorio, Descargas, OneDrive).
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Pruébalo manualmente</CardTitle>
          <CardDescription>
            Antes de programarlo, ejecútalo desde una consola para validar
            permisos y que el destino sea accesible.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <CodeBlock>{`cd C:\\Scripts\n${opts.jobName || "robocopy"}.bat`}</CodeBlock>
          <p className="text-sm text-muted-foreground">
            Si las unidades de red (como <code>Z:</code>) están mapeadas solo en
            tu sesión interactiva, una tarea programada puede no verlas. Considera
            usar la ruta UNC directa (<code>\\nas\share\carpeta</code>) o
            re-mapear la unidad dentro del .bat con <code>net use</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Regístralo en el Programador de tareas</CardTitle>
          <CardDescription>
            Vía <code>schtasks</code> es reproducible y rápido. Abre una consola
            como administrador y ejecuta:
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <CodeBlock>{schtasks}</CodeBlock>
          <ul className="grid gap-1 text-sm text-muted-foreground">
            <li>
              <code>/SC DAILY /ST 03:00</code> — diario a las 3 AM. Cambia a{" "}
              <code>HOURLY</code>, <code>WEEKLY</code>, <code>ONLOGON</code>,
              etc.
            </li>
            <li>
              <code>/RL HIGHEST</code> — corre con privilegios elevados (necesario
              para <code>/COPYALL</code>).
            </li>
            <li>
              Para que corra aunque no haya sesión iniciada, usa la GUI{" "}
              <code>taskschd.msc</code> y marca &ldquo;Ejecutar tanto si el usuario
              inició sesión como si no&rdquo;.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Interpreta los códigos de salida</CardTitle>
          <CardDescription>
            Robocopy es atípico: <strong>0–7 son éxito</strong>. Si no se manejan
            como tales, el Programador de tareas marcará la tarea como fallida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm">
            <ExitCode code="0" label="Sin cambios" tone="ok">
              Origen y destino ya estaban sincronizados.
            </ExitCode>
            <ExitCode code="1" label="Copia OK" tone="ok">
              Archivos copiados correctamente.
            </ExitCode>
            <ExitCode code="2" label="Extras detectados" tone="ok">
              Hay archivos en destino que no están en origen.
            </ExitCode>
            <ExitCode code="3" label="1 + 2" tone="ok">
              Copia OK y además había extras.
            </ExitCode>
            <ExitCode code="4–7" label="Avisos" tone="warn">
              Algunos archivos no se copiaron pero el job no falló.
            </ExitCode>
            <ExitCode code="8+" label="Error" tone="error">
              Fallo real. El .bat generado devuelve <code>exit /b 1</code> en
              este caso.
            </ExitCode>
          </ul>
          <p className="text-sm text-muted-foreground pt-3">
            El script generado ya hace esa traducción: devuelve <code>0</code>{" "}
            cuando Robocopy retorna 0–7 y <code>1</code> en cualquier otro caso,
            así el Programador de tareas refleja el estado real.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Consejos para NAS por SMB</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-muted-foreground list-disc pl-5">
            <li>
              Usa <code>/ZB</code> (modo reanudable) para sobrevivir cortes de
              red.
            </li>
            <li>
              Si el NAS expone permisos POSIX que no mapean a NTFS, evita{" "}
              <code>/COPYALL</code> — puede fallar al copiar ACLs. Usa{" "}
              <code>/COPY:DAT</code>.
            </li>
            <li>
              <code>/MT</code> entre 4 y 16 suele ser óptimo en SMB; valores muy
              altos saturan la conexión.
            </li>
            <li>
              Para destinos en Windows con archivos abiertos (OneDrive, bases de
              datos), considera VSS — Robocopy por sí solo no toma snapshot.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ExitCode({
  code,
  label,
  tone,
  children,
}: {
  code: string;
  label: string;
  tone: "ok" | "warn" | "error";
  children: React.ReactNode;
}) {
  const variant =
    tone === "ok" ? "secondary" : tone === "warn" ? "outline" : "destructive";
  return (
    <li className="flex items-start gap-3">
      <Badge variant={variant} className="font-mono">
        {code}
      </Badge>
      <div>
        <span className="font-medium">{label}</span>{" "}
        <span className="text-muted-foreground">— {children}</span>
      </div>
    </li>
  );
}

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative">
      <pre className="overflow-auto rounded-lg border bg-muted/40 p-3 pr-12 text-xs leading-relaxed font-mono whitespace-pre">
        {children}
      </pre>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        onClick={handleCopy}
        className="absolute right-2 top-2"
        aria-label="Copiar"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
}
