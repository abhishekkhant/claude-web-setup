# Claude Code Project Manager (CCPM)

## Stack

- **Next.js 14** App Router (`app/` for pages + `app/api/` for route handlers)
- **pnpm** — use `pnpm`, not npm/yarn
- **Zustand** state management (`stores/useStore.ts`)
- **Tailwind CSS** + `tailwindcss-animate` — dark mode always on (`className="dark"` on `<html>` in `app/layout.tsx`)
- **shadcn-style** UI components (`components/ui/`) built on Radix primitives
- **Zod** schemas in `lib/types/index.ts` (used for type definitions, not runtime validation in pages)

## Commands

| Command | What |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run `next lint` (ESLint only) |

No test runner, type checker, or formatter is configured.

## Architecture

### Data layer (server-side, `fs`-based persistence)

All state lives in two directory trees, read/written directly via Node `fs` in both `lib/claude/` and `app/api/` route handlers:

- **`~/.claude/`** — Claude Code's own config dir (`settings.json`, `CLAUDE.md`, `skills/<name>/SKILL.md`, `subagents/<name>/agent.md`, etc.)
- **`~/.ccpm/`** — CCPM's own data dir (`profiles/<id>.json`, `projects.json`)

`lib/claude/*.ts` contains the core filesystem wrappers (config, projects, mcp, skills, agents, hooks, memory, cli). Route handlers (`app/api/*`) duplicate some of this logic directly — check both places when changing behavior.

### Routes

| Path | Type |
|---|---|
| `/` | Dashboard |
| `/projects`, `/mcp`, `/skills`, `/agents`, `/hooks` | Management pages |
| `/config` | Settings (global/local) |
| `/profiles`, `/memory`, `/permissions`, `/cli` | Additional pages |
| `/api/projects` | GET (list), POST (scan/add) |
| `/api/mcp` | GET (list by scope/project), POST/PUT/DELETE |
| `/api/skills` | CRUD for skills |
| `/api/config` | GET/PUT for global/local settings |
| `/api/agents`, `/api/hooks`, `/api/memory`, `/api/permissions`, `/api/profiles`, `/api/cli` | Corresponding CRUD |

### MCP server config sources

Two formats are supported, checked in order:
1. `.mcp.json` at project root (newer format, `{ mcpServers: {...} }`)
2. `.claude/settings.json` (legacy format)

### Project discovery

Scans `~/Astro/Projects`, `~/Projects`, and `~/` for directories containing a `.claude` subdirectory.

## Key conventions

- All pages are `"use client"` and fetch data via `fetch("/api/...")`
- `@/*` path alias maps to project root
- Server-only `fs` imports are in `lib/claude/` and `app/api/` — never import these from client components
- IDs are generated client-side with `generateId()` (`Date.now() + random`)
- `lib/utils.ts` provides shared helpers: `cn()` (class merging), `contractPath`/`expandPath` (home dir ~), `formatRelativeTime`, `slugify`, etc.
