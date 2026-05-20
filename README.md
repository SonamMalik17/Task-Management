# AI Task Manager

Production-grade, AI-assisted task management. Built as a teaching example of Clean Architecture on the backend and feature-based architecture on the frontend.

- **Web** — Next.js 14 App Router + Tailwind + Redux Toolkit + RTK Query
- **API** — Node.js + Express, Clean Architecture, MongoDB via Mongoose
- **AI** — Anthropic Claude with a deterministic mock fallback
- **Realtime** — Socket.IO
- **Shared** — One Zod-defined contract imported by both apps

## ✨ Features

- Email/password auth (JWT access + refresh)
- Boards with team members and roles
- Tasks with priority, due date, tags, assignees, comments, checklist
- Kanban board with drag-drop (dnd-kit)
- AI-assisted task suggestions
- AI task summarization
- Smart deadline recommendations
- **Natural-language task creation** (type a sentence, get a structured draft)
- Activity log per board
- Team collaboration with live updates
- Notifications

## 🏗 Architecture at a glance

```
apps/
├── api/   ─ Express + MongoDB, Clean Architecture (domain → application → infra → http)
└── web/   ─ Next.js App Router, feature-based, Redux Toolkit + RTK Query

packages/
└── shared/ ─ Zod schemas + TypeScript types — single source of truth
```

The dependency flows inward. Use-cases depend on **interfaces**, not adapters. Swapping MongoDB for Postgres, or Claude for OpenAI, is a single-file change.

Full write-up: [`docs/architecture.md`](./docs/architecture.md).

## 🚀 Quick start

```bash
# Prereqs: Node 20+, npm 10+, Docker

git clone <this repo>
cd assign

npm install
docker compose up -d mongo

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Optional: set ANTHROPIC_API_KEY in apps/api/.env for real Claude calls.
# Without it, a deterministic mock provider is used so everything still works.

npm run dev
# → web on http://localhost:3000
# → api on http://localhost:4000   (health: GET /health)
```

Sign up at `/register`, create a board, drop a task, then click the AI Assist panel.

## 🧪 Testing

```bash
npm test                  # all workspaces
npm test -w @ai-task/api  # API only (use-case + HTTP integration tests with in-memory Mongo)
npm test -w @ai-task/web  # Web only (RTL component + reducer tests)
```

Coverage:
- **API:** unit tests for every use-case (auth, tasks, AI) + a full HTTP integration suite against `mongodb-memory-server`.
- **Web:** RTL tests for UI primitives, slice tests for state, isolation tests for Kanban position math.

## 📚 Documentation

Every important decision has a written rationale:

- [`docs/architecture.md`](./docs/architecture.md) — Clean Architecture, layering, trade-offs
- [`docs/api-contracts.md`](./docs/api-contracts.md) — Every endpoint, payload shape, error code, socket event
- [`docs/ai-workflow.md`](./docs/ai-workflow.md) — How AI calls flow through the system, failure modes
- [`docs/prompting-strategy.md`](./docs/prompting-strategy.md) — Prompt structure, schema validation, versioning
- [`docs/database-design.md`](./docs/database-design.md) — Collections, indexes, position math
- [`docs/deployment.md`](./docs/deployment.md) — Env vars, Docker, scaling, observability

## 🧭 Where to start reading

If you're a new engineer joining the project:

1. [`packages/shared/src/schemas`](./packages/shared/src/schemas) — the contract.
2. [`apps/api/src/domain`](./apps/api/src/domain) — entities + interfaces. No tech here.
3. [`apps/api/src/application/use-cases`](./apps/api/src/application/use-cases) — the actual behavior.
4. [`apps/api/src/infrastructure`](./apps/api/src/infrastructure) — Mongo, Anthropic, JWT, Socket.IO.
5. [`apps/api/src/interfaces/http`](./apps/api/src/interfaces/http) — routes + middleware.
6. [`apps/web/src/features/board`](./apps/web/src/features/board) — Kanban + realtime.
7. [`apps/web/src/features/ai`](./apps/web/src/features/ai) — NL task entry + suggestion panel.

## 🔒 Security posture

- Passwords hashed with bcrypt (12 rounds).
- JWT secrets validated to ≥16 chars at boot; access and refresh secrets must be distinct.
- Helmet, CORS allowlist, rate limits on auth (10/15min) and AI (20/min).
- Login returns the same error for unknown email and wrong password — no enumeration.
- Logs redact `authorization`, `cookie`, `password`, `token`.
- LLM output is Zod-validated before reaching the DB.

## 🤝 Conventions

- TypeScript strict mode everywhere.
- Zod for validation; types derived via `z.infer<>`.
- ESM in the API, App Router in the web.
- Tests colocated under `__tests__/` next to the code they exercise.
- Feature-based folders on the web; Clean Architecture layers on the API.
- Commits scoped by area: `feat(api): …`, `feat(web): …`, `docs: …`.

## 📝 License

MIT — see [`LICENSE`](./LICENSE) if you add one.

---

Author: **SonamMalik17** <maliksonam0301@gmail.com>
