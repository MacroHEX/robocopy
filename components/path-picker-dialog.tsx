"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardPasteIcon,
  FolderOpenIcon,
  InfoIcon,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  onConfirm: (path: string) => void;
  title?: string;
  description?: string;
}

const PREFIXES = [
  "C:\\Users\\",
  "C:\\",
  "D:\\",
  "Z:\\",
  "\\\\nas\\",
];

const DRIVE_OR_UNC = /^(?:[a-zA-Z]:[\\/]+|\\\\[^\\]+[\\/]+[^\\/]+[\\/]?)/;

function applyPrefix(prev: string, prefix: string): string {
  const stripped = prev.replace(DRIVE_OR_UNC, "");
  return prefix + stripped;
}

function appendFolder(prev: string, name: string): string {
  const trimmed = prev.replace(/[\\/]+$/, "");
  return trimmed ? `${trimmed}\\${name}` : name;
}

interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: (options?: {
    mode?: "read" | "readwrite";
  }) => Promise<{ name: string }>;
}

export function PathPickerDialog({
  open,
  onOpenChange,
  initialValue,
  onConfirm,
  title = "Seleccionar ruta",
  description,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [pickedFolder, setPickedFolder] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  const inputRef = useRef<HTMLInputElement>(null);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setValue(initialValue);
      setPickedFolder(null);
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.warning("El portapapeles está vacío.");
        return;
      }
      setValue(text.trim().replace(/^["']|["']$/g, ""));
      toast.success("Ruta pegada desde el portapapeles");
      inputRef.current?.focus();
    } catch {
      toast.error(
        "El navegador bloqueó el acceso al portapapeles. Pega con Ctrl+V en el campo.",
      );
      inputRef.current?.focus();
    }
  };

  const handleBrowse = async () => {
    const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
    if (typeof picker !== "function") {
      toast.error(
        "Tu navegador no soporta el selector de carpetas. Usa Chrome o Edge, o pega la ruta manualmente.",
      );
      return;
    }
    try {
      const handle = await picker({ mode: "read" });
      setPickedFolder(handle.name);
      setValue((prev) => appendFolder(prev, handle.name));
      inputRef.current?.focus();
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        toast.error("No se pudo abrir el selector de carpeta.");
      }
    }
  };

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Indica una ruta antes de aceptar.");
      return;
    }
    onConfirm(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ??
              "Por seguridad, los navegadores no exponen rutas absolutas del PC. Usa una de estas formas para llenarla."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="picker-path">Ruta</Label>
            <Input
              id="picker-path"
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="C:\Users\martin\Documents"
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            />
          </div>

          <div className="grid gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Métodos
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePaste}
              >
                <ClipboardPasteIcon />
                Pegar del portapapeles
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBrowse}
              >
                <FolderOpenIcon />
                Examinar carpeta…
              </Button>
            </div>
            {pickedFolder && (
              <p className="text-xs text-muted-foreground">
                Carpeta seleccionada:{" "}
                <Badge variant="secondary" className="font-mono">
                  {pickedFolder}
                </Badge>{" "}
                — añadida al final de la ruta. Edita el inicio si hace falta.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Prefijos rápidos
            </span>
            <div className="flex flex-wrap gap-2">
              {PREFIXES.map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant="outline"
                  size="xs"
                  className="font-mono"
                  onClick={() => {
                    setValue((prev) => applyPrefix(prev, p));
                    inputRef.current?.focus();
                  }}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <InfoIcon className="size-3.5 mt-0.5 shrink-0" />
            <span>
              <strong>Tip:</strong> en el Explorador de Windows, abre la
              carpeta y pulsa <code>Ctrl+L</code> para enfocar la barra de
              direcciones, luego <code>Ctrl+C</code> para copiar la ruta.
              Después &laquo;Pegar del portapapeles&raquo; aquí.
            </span>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancelar</Button>} />
          <Button type="button" onClick={handleConfirm}>
            Usar esta ruta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
