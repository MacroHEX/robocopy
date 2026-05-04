# Robocopy Bat Generator

Generador web de scripts `.bat` para [Robocopy](https://learn.microsoft.com/windows-server/administration/windows-commands/robocopy), la utilidad nativa de copiado robusto de Windows. Pensado para crear backups y sincronizaciones recurrentes (PC ↔ NAS, carpetas locales, unidades externas) que se programan en el **Programador de tareas** de Windows.

100 % cliente — el `.bat` se genera en el navegador y se descarga; la app no recibe ni envía nada a un servidor.

## Qué hace

- Formulario visual para configurar **origen**, **destino**, modo de copia, política de reemplazo, atributos, multihilo, reintentos, exclusiones y log.
- **Vista previa en vivo** del script `.bat` mientras editas.
- Descarga del `.bat` con un click (Blob → archivo, codificación CRLF lista para `cmd.exe`).
- **Diálogo selector de rutas** con tres mecanismos: pegar del portapapeles, examinar carpeta nativa (Chrome/Edge) y prefijos rápidos (`C:\Users\`, `Z:\`, etc.).
- Pestaña **Guía de uso** con el `schtasks /Create` ya rellenado y la tabla de exit codes de Robocopy.
- El `.bat` generado **traduce los exit codes de Robocopy** (0–7 son éxito, 8+ son error) para que el Programador de tareas refleje el estado real.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) con tokens declarados inline en `app/globals.css`
- [shadcn/ui](https://ui.shadcn.com/) sobre [Base UI](https://base-ui.com/) — preset `base-nova`, color base `neutral`
- TypeScript 5 estricto
- Gestor de paquetes: **pnpm**

La página es estática (`○ Static` en el output de `next build`); se despliega en Vercel sin configuración adicional.

## Empezar

```powershell
pnpm install
pnpm dev      # http://localhost:3000
```

Otros scripts:

```powershell
pnpm build    # build de producción
pnpm start    # servir el build
pnpm lint     # ESLint flat config
```

Requisitos: Node.js 20.9+, pnpm.

## Cómo usarlo

1. **Llena el formulario.** Origen y destino se pueden escribir o usar el botón **Examinar** (limitación: por sandbox del navegador, solo se obtiene el nombre de la carpeta — pega la ruta desde la barra del Explorador con `Ctrl+L → Ctrl+C` para más comodidad).
2. **Elige el modo de copia**:
   - *Incremental (`/E`)* — copia archivos nuevos y modificados; no borra nada.
   - *Espejo (`/MIR`)* — sincroniza exactamente, **borra del destino lo que no esté en origen**.
   - *Mover (`/MOVE`)* — copia y borra del origen.
3. **Configura el log y reintentos** según tu red.
4. **Descarga el `.bat`** desde la vista previa.
5. **Pruébalo manualmente** desde una consola antes de programarlo:

   ```powershell
   .\BackupNAS.bat
   ```

6. **Regístralo en el Programador de tareas** con el `schtasks` que te genera la pestaña **Guía** (la GUI `taskschd.msc` es alternativa equivalente).

## Notas importantes

- **`/ZB` requiere privilegios de administrador** (privilegio _Hacer copias de seguridad de archivos y directorios_). Por defecto se usa `/Z`, que no necesita admin y cubre el caso típico de "reanudable tras corte de red".
- **Unidades de red mapeadas** (`Z:` desde tu sesión interactiva) pueden no estar visibles cuando una tarea programada corre con otra cuenta. Usa la ruta UNC (`\\nas\share\carpeta`) o re-mapea la unidad dentro del `.bat` con `net use`.
- **Robocopy es atípico con los exit codes**: 0–7 son éxito (incluye "no había nada que copiar"). El `.bat` generado normaliza esto a 0/1 para que el Programador de tareas no reporte falsos fallos.
- **`/COPYALL` necesita admin** y permisos NTFS coherentes en el destino. En NAS con permisos POSIX puede fallar — usa `/COPY:DAT` (default).

## Despliegue

```powershell
git push
```

En Vercel: _Import Project_ → autodetecta Next.js + pnpm. Sin variables de entorno.

## Licencia

© 2026 Martín Medina
