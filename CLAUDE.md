@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Next.js 16.2.4** with the App Router (`app/`). Per `AGENTS.md`, this version has breaking changes vs. older Next.js — consult `node_modules/.pnpm/next@16.2.4_*/node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`) before writing routing, server-component, caching, or config code.
- **React 19.2.4** — server components by default; mark client components with `"use client"`.
- **Tailwind CSS v4** via `@tailwindcss/postcss` (`postcss.config.mjs`). Theme tokens are declared inline in `app/globals.css` using `@theme inline { ... }` — there is no `tailwind.config.*`. To add design tokens, edit `globals.css`.
- **TypeScript 5**, **ESLint 9 flat config** (`eslint.config.mjs` extends `eslint-config-next/core-web-vitals` + `/typescript`).
- **pnpm** is the package manager (`node_modules/.pnpm/` present). Use `pnpm <script>` rather than npm/yarn.

## Commands

```bash
pnpm dev      # next dev (Turbopack by default in Next 16)
pnpm build    # production build
pnpm start    # serve the production build
pnpm lint     # eslint (flat config)
```

There is no test runner configured. If adding tests, pick one and document the invocation here.

## Architecture

Currently a freshly-bootstrapped `create-next-app` template — no application logic yet. The repo name (`robocopy`) suggests a planned Windows file-copy / sync UI, but nothing is implemented. When adding features:

- Routes live under `app/<segment>/page.tsx`; shared chrome goes in `app/layout.tsx` (root layout already wires Geist fonts and the `min-h-full flex flex-col` body).
- Static assets go in `public/` and are served from `/`.
- Path alias: none configured yet — add to `tsconfig.json` (`compilerOptions.paths`) before relying on `@/...` imports.

## Environment

Windows host. The Bash tool is available, but prefer PowerShell-native syntax in scripts checked into the repo (this is a Windows-targeted project given the name). When invoking external binaries like `robocopy`, remember it returns non-zero exit codes (0–7) on success — do not treat any non-zero exit as failure.
