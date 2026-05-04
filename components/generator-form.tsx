"use client";

import { useState } from "react";
import type {
  RobocopyOptions,
  CopyMode,
  ReplaceMode,
  AttributesMode,
  RestartMode,
  ValidationIssue,
} from "@/lib/robocopy";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FolderOpenIcon, TriangleAlertIcon } from "lucide-react";
import { PathPickerDialog } from "@/components/path-picker-dialog";

interface Props {
  opts: RobocopyOptions;
  setOpts: (updater: (prev: RobocopyOptions) => RobocopyOptions) => void;
  issues: ValidationIssue[];
}

function fieldError(
  issues: ValidationIssue[],
  field: keyof RobocopyOptions | "general",
) {
  return issues.find((i) => i.field === field)?.message;
}

export function GeneratorForm({ opts, setOpts, issues }: Props) {
  const [pickerField, setPickerField] = useState<
    "source" | "destination" | null
  >(null);

  const set = <K extends keyof RobocopyOptions>(
    key: K,
    value: RobocopyOptions[K],
  ) => setOpts((prev) => ({ ...prev, [key]: value }));

  const setLog = <K extends keyof RobocopyOptions["log"]>(
    key: K,
    value: RobocopyOptions["log"][K],
  ) =>
    setOpts((prev) => ({
      ...prev,
      log: { ...prev.log, [key]: value },
    }));

  const general = fieldError(issues, "general");

  return (
    <div className="flex flex-col gap-6">
      {general && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <TriangleAlertIcon className="size-4 mt-0.5 shrink-0" />
          <span>{general}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rutas</CardTitle>
          <CardDescription>
            Carpetas de origen y destino. En Windows, las rutas con espacios se
            citan automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="source">Origen</Label>
            <div className="flex gap-2">
              <Input
                id="source"
                value={opts.source}
                onChange={(e) => set("source", e.target.value)}
                placeholder="C:\Users\martin\Documents"
                spellCheck={false}
                aria-invalid={!!fieldError(issues, "source")}
              />
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => setPickerField("source")}
                aria-label="Examinar carpeta de origen"
              >
                <FolderOpenIcon />
                <span className="hidden sm:inline">Examinar</span>
              </Button>
            </div>
            {fieldError(issues, "source") && (
              <p className="text-xs text-destructive">
                {fieldError(issues, "source")}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="destination">Destino</Label>
            <div className="flex gap-2">
              <Input
                id="destination"
                value={opts.destination}
                onChange={(e) => set("destination", e.target.value)}
                placeholder="Z:\Backups\Documents"
                spellCheck={false}
                aria-invalid={!!fieldError(issues, "destination")}
              />
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => setPickerField("destination")}
                aria-label="Examinar carpeta de destino"
              >
                <FolderOpenIcon />
                <span className="hidden sm:inline">Examinar</span>
              </Button>
            </div>
            {fieldError(issues, "destination") && (
              <p className="text-xs text-destructive">
                {fieldError(issues, "destination")}
              </p>
            )}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="jobName">Nombre del job</Label>
            <Input
              id="jobName"
              value={opts.jobName}
              onChange={(e) => set("jobName", e.target.value)}
              placeholder="BackupNAS"
              spellCheck={false}
              aria-invalid={!!fieldError(issues, "jobName")}
            />
            <p className="text-xs text-muted-foreground">
              Se usa como nombre del .bat y de la tarea programada.
            </p>
            {fieldError(issues, "jobName") && (
              <p className="text-xs text-destructive">
                {fieldError(issues, "jobName")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modo de copia</CardTitle>
          <CardDescription>
            Determina qué hace Robocopy con archivos que están en el destino
            pero no en el origen.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <RadioGroup
            value={opts.copyMode}
            onValueChange={(v) => set("copyMode", v as CopyMode)}
            className="grid gap-3"
          >
            <RadioOption
              value="incremental"
              title="Incremental"
              flag="/E"
              description="Copia archivos nuevos y modificados. No elimina nada en el destino."
              selected={opts.copyMode === "incremental"}
            />
            <RadioOption
              value="mirror"
              title="Espejo (sincronizar)"
              flag="/MIR"
              description="Refleja exactamente el origen — borra del destino lo que ya no existe en origen."
              warning
              selected={opts.copyMode === "mirror"}
            />
            <RadioOption
              value="move"
              title="Mover"
              flag="/MOVE"
              description="Copia y luego borra del origen. Útil para archivar."
              warning
              selected={opts.copyMode === "move"}
            />
          </RadioGroup>

          {opts.copyMode !== "mirror" && (
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="includeEmpty"
                checked={opts.includeEmpty}
                onCheckedChange={(c) => set("includeEmpty", c === true)}
              />
              <Label htmlFor="includeEmpty" className="font-normal">
                Incluir subcarpetas vacías{" "}
                <span className="text-muted-foreground">(/E vs /S)</span>
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reemplazo y atributos</CardTitle>
          <CardDescription>
            Cómo tratar archivos que ya existen en el destino.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Reemplazar archivos existentes</Label>
            <Select
              value={opts.replaceMode}
              onValueChange={(v) => set("replaceMode", v as ReplaceMode)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Siempre</SelectItem>
                <SelectItem value="newer">
                  Solo si origen es más reciente (/XO)
                </SelectItem>
                <SelectItem value="never">No reemplazar (/XN /XC)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Atributos a copiar</Label>
            <Select
              value={opts.attributes}
              onValueChange={(v) => set("attributes", v as AttributesMode)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data">
                  Datos + atributos + timestamps (/COPY:DAT)
                </SelectItem>
                <SelectItem value="all">
                  Todo, incluye permisos NTFS (/COPYALL)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              /COPYALL requiere permisos de administrador en el destino.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rendimiento y tolerancia a fallos</CardTitle>
          <CardDescription>
            Multihilo y reintentos — relevantes para NAS por SMB.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="multiThread">Hilos (/MT)</Label>
            <Input
              id="multiThread"
              type="number"
              min={1}
              max={128}
              value={opts.multiThread}
              onChange={(e) =>
                set("multiThread", Number(e.target.value) || 1)
              }
              aria-invalid={!!fieldError(issues, "multiThread")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="retries">Reintentos (/R)</Label>
            <Input
              id="retries"
              type="number"
              min={0}
              value={opts.retries}
              onChange={(e) => set("retries", Number(e.target.value) || 0)}
              aria-invalid={!!fieldError(issues, "retries")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="waitSeconds">Espera entre reintentos (/W s)</Label>
            <Input
              id="waitSeconds"
              type="number"
              min={0}
              value={opts.waitSeconds}
              onChange={(e) =>
                set("waitSeconds", Number(e.target.value) || 0)
              }
              aria-invalid={!!fieldError(issues, "waitSeconds")}
            />
          </div>
          <div className="md:col-span-3 grid gap-2">
            <Label htmlFor="restartMode">Modo de reanudación</Label>
            <Select
              value={opts.restartMode}
              onValueChange={(v) => set("restartMode", v as RestartMode)}
            >
              <SelectTrigger id="restartMode" className="w-full md:w-fit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin reanudación</SelectItem>
                <SelectItem value="z">Reanudable (/Z)</SelectItem>
                <SelectItem value="zb">
                  Reanudable + modo backup (/ZB)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              <code>/Z</code> permite reanudar después de cortes de red — buena
              opción para NAS por SMB.{" "}
              <strong>
                <code>/ZB</code> requiere ejecutar como administrador
              </strong>{" "}
              (privilegio &laquo;Hacer copias de seguridad de archivos y
              directorios&raquo;); úsalo solo si necesitas leer archivos
              protegidos por ACL.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exclusiones</CardTitle>
          <CardDescription>
            Una entrada por línea o separadas por comas. Acepta wildcards
            (<code>*.tmp</code>, <code>~$*</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="excludeFiles">Archivos (/XF)</Label>
            <Textarea
              id="excludeFiles"
              value={opts.excludeFiles}
              onChange={(e) => set("excludeFiles", e.target.value)}
              placeholder={"*.tmp\nThumbs.db\ndesktop.ini"}
              rows={4}
              spellCheck={false}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="excludeDirs">Carpetas (/XD)</Label>
            <Textarea
              id="excludeDirs"
              value={opts.excludeDirs}
              onChange={(e) => set("excludeDirs", e.target.value)}
              placeholder={"node_modules\n.git\n$RECYCLE.BIN"}
              rows={4}
              spellCheck={false}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log</CardTitle>
          <CardDescription>
            Robocopy puede escribir un log de cada ejecución — fundamental para
            tareas programadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="logEnabled"
              checked={opts.log.enabled}
              onCheckedChange={(c) => setLog("enabled", c === true)}
            />
            <Label htmlFor="logEnabled" className="font-normal">
              Generar archivo de log
            </Label>
          </div>

          {opts.log.enabled && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="logPath">Ruta del log</Label>
                <Input
                  id="logPath"
                  value={opts.log.path}
                  onChange={(e) => setLog("path", e.target.value)}
                  placeholder="%~dp0logs\robocopy.log"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">
                  <code>%~dp0</code> apunta a la carpeta donde está el .bat.
                </p>
              </div>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="logAppend"
                    checked={opts.log.append}
                    onCheckedChange={(c) => setLog("append", c === true)}
                  />
                  <Label htmlFor="logAppend" className="font-normal">
                    Agregar al log (/LOG+){" "}
                    <span className="text-muted-foreground">
                      en vez de sobrescribir
                    </span>
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="logTee"
                    checked={opts.log.tee}
                    onCheckedChange={(c) => setLog("tee", c === true)}
                  />
                  <Label htmlFor="logTee" className="font-normal">
                    También a consola (/TEE)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="logVerbose"
                    checked={opts.log.verbose}
                    onCheckedChange={(c) => setLog("verbose", c === true)}
                  />
                  <Label htmlFor="logVerbose" className="font-normal">
                    Verbose (/V)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="logNp"
                    checked={opts.log.noProgress}
                    onCheckedChange={(c) => setLog("noProgress", c === true)}
                  />
                  <Label htmlFor="logNp" className="font-normal">
                    Sin progreso por byte (/NP){" "}
                    <span className="text-muted-foreground">
                      reduce ruido en el log
                    </span>
                  </Label>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ejecución</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="pauseAtEnd"
              checked={opts.pauseAtEnd}
              onCheckedChange={(c) => set("pauseAtEnd", c === true)}
            />
            <Label htmlFor="pauseAtEnd" className="font-normal">
              Pausar al terminar{" "}
              <span className="text-muted-foreground">
                (útil al probar manualmente, quítalo para tareas programadas)
              </span>
            </Label>
          </div>
        </CardContent>
      </Card>

      <PathPickerDialog
        open={pickerField !== null}
        onOpenChange={(open) => {
          if (!open) setPickerField(null);
        }}
        initialValue={pickerField ? opts[pickerField] : ""}
        onConfirm={(path) => {
          if (pickerField) set(pickerField, path);
        }}
        title={
          pickerField === "source"
            ? "Seleccionar carpeta de origen"
            : "Seleccionar carpeta de destino"
        }
      />
    </div>
  );
}

function RadioOption({
  value,
  title,
  flag,
  description,
  warning,
  selected,
}: {
  value: string;
  title: string;
  flag: string;
  description: string;
  warning?: boolean;
  selected: boolean;
}) {
  return (
    <Label
      htmlFor={`copy-${value}`}
      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-input hover:bg-muted/40"
      }`}
    >
      <RadioGroupItem
        value={value}
        id={`copy-${value}`}
        className="mt-0.5"
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          <Badge variant={warning ? "destructive" : "secondary"}>{flag}</Badge>
        </div>
        <span className="text-sm font-normal text-muted-foreground">
          {description}
        </span>
      </div>
    </Label>
  );
}
