export type CopyMode = "incremental" | "mirror" | "move";
export type ReplaceMode = "always" | "newer" | "never";
export type AttributesMode = "data" | "all";
export type RestartMode = "none" | "z" | "zb";

export interface RobocopyOptions {
  jobName: string;
  source: string;
  destination: string;
  copyMode: CopyMode;
  replaceMode: ReplaceMode;
  attributes: AttributesMode;
  includeEmpty: boolean;
  restartMode: RestartMode;
  multiThread: number;
  retries: number;
  waitSeconds: number;
  excludeFiles: string;
  excludeDirs: string;
  log: {
    enabled: boolean;
    path: string;
    append: boolean;
    tee: boolean;
    verbose: boolean;
    noProgress: boolean;
  };
  pauseAtEnd: boolean;
}

export const defaultOptions: RobocopyOptions = {
  jobName: "BackupNAS",
  source: "C:\\Users\\<usuario>\\Documents",
  destination: "Z:\\Backups\\Documents",
  copyMode: "incremental",
  replaceMode: "newer",
  attributes: "data",
  includeEmpty: true,
  restartMode: "z",
  multiThread: 8,
  retries: 2,
  waitSeconds: 5,
  excludeFiles: "",
  excludeDirs: "",
  log: {
    enabled: true,
    path: "%~dp0logs\\robocopy.log",
    append: true,
    tee: false,
    verbose: false,
    noProgress: true,
  },
  pauseAtEnd: false,
};

export interface ValidationIssue {
  field: keyof RobocopyOptions | "general";
  message: string;
}

export function validateOptions(opts: RobocopyOptions): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!opts.source.trim()) {
    issues.push({ field: "source", message: "El origen es obligatorio." });
  }
  if (!opts.destination.trim()) {
    issues.push({
      field: "destination",
      message: "El destino es obligatorio.",
    });
  }
  if (
    opts.source.trim() &&
    opts.destination.trim() &&
    normalizePath(opts.source) === normalizePath(opts.destination)
  ) {
    issues.push({
      field: "general",
      message: "Origen y destino no pueden ser la misma ruta.",
    });
  }
  if (!/^[A-Za-z0-9_\-]+$/.test(opts.jobName)) {
    issues.push({
      field: "jobName",
      message:
        "El nombre del job debe usar solo letras, números, guiones o guion bajo.",
    });
  }
  if (opts.multiThread < 1 || opts.multiThread > 128) {
    issues.push({
      field: "multiThread",
      message: "MultiThread debe estar entre 1 y 128.",
    });
  }
  if (opts.retries < 0 || opts.retries > 1_000_000) {
    issues.push({ field: "retries", message: "Reintentos fuera de rango." });
  }
  if (opts.waitSeconds < 0 || opts.waitSeconds > 3600) {
    issues.push({
      field: "waitSeconds",
      message: "La espera entre reintentos debe estar entre 0 y 3600s.",
    });
  }
  return issues;
}

function normalizePath(p: string): string {
  return p.trim().replace(/[\\/]+$/g, "").toLowerCase();
}

function quoteIfNeeded(p: string): string {
  const trimmed = p.trim().replace(/[\\/]+$/g, "");
  return /\s/.test(trimmed) ? `"${trimmed}"` : trimmed;
}

function splitPatterns(s: string): string[] {
  return s
    .split(/[\n,]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function buildRobocopyArgs(opts: RobocopyOptions): string[] {
  const args: string[] = [];

  args.push(quoteIfNeeded(opts.source));
  args.push(quoteIfNeeded(opts.destination));

  if (opts.copyMode === "mirror") {
    args.push("/MIR");
  } else {
    args.push(opts.includeEmpty ? "/E" : "/S");
  }

  if (opts.copyMode === "move") {
    args.push("/MOVE");
  }

  args.push(opts.attributes === "all" ? "/COPYALL" : "/COPY:DAT");

  if (opts.replaceMode === "newer") {
    args.push("/XO");
  } else if (opts.replaceMode === "never") {
    args.push("/XN");
    args.push("/XC");
  }

  if (opts.restartMode === "z") {
    args.push("/Z");
  } else if (opts.restartMode === "zb") {
    args.push("/ZB");
  }

  if (opts.multiThread > 1) {
    args.push(`/MT:${opts.multiThread}`);
  }

  args.push(`/R:${opts.retries}`);
  args.push(`/W:${opts.waitSeconds}`);

  const excludedFiles = splitPatterns(opts.excludeFiles);
  if (excludedFiles.length > 0) {
    args.push("/XF", ...excludedFiles.map(quoteIfNeeded));
  }
  const excludedDirs = splitPatterns(opts.excludeDirs);
  if (excludedDirs.length > 0) {
    args.push("/XD", ...excludedDirs.map(quoteIfNeeded));
  }

  if (opts.log.enabled) {
    if (opts.log.noProgress) args.push("/NP");
    if (opts.log.verbose) args.push("/V");
    if (opts.log.tee) args.push("/TEE");
    const logFlag = opts.log.append ? "/LOG+" : "/LOG";
    args.push(`${logFlag}:${quoteIfNeeded(opts.log.path)}`);
  }

  return args;
}

export function buildBatScript(opts: RobocopyOptions): string {
  const args = buildRobocopyArgs(opts);
  const lines: string[] = [];

  lines.push("@echo off");
  lines.push("setlocal");
  lines.push(`REM ${opts.jobName} - generado por Robocopy Bat Generator`);
  lines.push(`REM Origen:  ${opts.source}`);
  lines.push(`REM Destino: ${opts.destination}`);
  lines.push("");
  lines.push('set "ROBOCOPY=%SystemRoot%\\System32\\Robocopy.exe"');
  if (opts.log.enabled) {
    lines.push(`set "LOG=${opts.log.path}"`);
    lines.push('for %%I in ("%LOG%") do if not exist "%%~dpI" mkdir "%%~dpI"');
  }
  lines.push("");
  lines.push(`"%ROBOCOPY%" ${args.join(" ")}`);
  lines.push("");
  lines.push("set RC=%ERRORLEVEL%");
  lines.push("REM Robocopy: 0-7 son OK, 8+ es error real.");
  lines.push("if %RC% LSS 8 (");
  lines.push(`  echo [%date% %time%] ${opts.jobName} OK ^(rc=%RC%^)`);
  lines.push("  set EXITCODE=0");
  lines.push(") else (");
  lines.push(`  echo [%date% %time%] ${opts.jobName} FALLO ^(rc=%RC%^) 1>&2`);
  lines.push("  set EXITCODE=1");
  lines.push(")");
  lines.push("");
  if (opts.pauseAtEnd) {
    lines.push("pause");
  }
  lines.push("endlocal & exit /b %EXITCODE%");
  lines.push("");

  return lines.join("\r\n");
}

export function buildSchtasksCommand(opts: RobocopyOptions): string {
  return [
    "schtasks /Create",
    `/TN "${opts.jobName}"`,
    `/TR "C:\\Scripts\\${opts.jobName}.bat"`,
    "/SC DAILY",
    "/ST 03:00",
    "/RL HIGHEST",
    "/F",
  ].join(" ^\n  ");
}
