"use client";

import { useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { GeneratorForm } from "@/components/generator-form";
import { ScriptPreview } from "@/components/script-preview";
import { UsageGuide } from "@/components/usage-guide";
import {
  defaultOptions,
  validateOptions,
  type RobocopyOptions,
} from "@/lib/robocopy";
import { HardDriveIcon } from "lucide-react";

export default function Page() {
  const [opts, setOpts] = useState<RobocopyOptions>(defaultOptions);
  const issues = useMemo(() => validateOptions(opts), [opts]);

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HardDriveIcon className="size-4" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-tight">
              Robocopy Bat Generator
            </h1>
            <p className="text-xs text-muted-foreground">
              Genera scripts <code>.bat</code> de Robocopy para Windows y los
              programa con el Programador de tareas.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Tabs defaultValue="generator">
          <TabsList className="mb-6">
            <TabsTrigger value="generator">Generador</TabsTrigger>
            <TabsTrigger value="guide">Guía de uso</TabsTrigger>
          </TabsList>

          <TabsContent value="generator">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
              <GeneratorForm
                opts={opts}
                setOpts={setOpts}
                issues={issues}
              />
              <ScriptPreview opts={opts} issues={issues} />
            </div>
          </TabsContent>

          <TabsContent value="guide">
            <UsageGuide opts={opts} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Hecho con Next.js, shadcn/ui y Tailwind. Robocopy es una utilidad
            nativa de Windows — este sitio solo genera el script, no se conecta
            a tu equipo.
          </span>
          <span className="shrink-0">© 2026 Martín Medina</span>
        </div>
      </footer>
    </div>
  );
}
