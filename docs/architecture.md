# Architecture

## 1. High-level picture

```
                                  ┌──────────────────────┐
                                  │  Anthropic Claude    │
                                  │  (or mock provider)  │
                                  └──────────▲───────────┘
                                             │ HTTPS
                                             │
┌─────────────────────────────┐    REST    ┌──────────────────────────┐
│                             ├───────────►│                          │
│  apps/web (Next.js 14)      │            │  apps/api (Express 4)    │
│                             ◄───────────┤                          │
│  App Router • Tailwind      │            │  Clean Architecture       │
│  Redux Toolkit + RTK Query  │   Sockets  │  domain → application →   │
│  Socket.IO client           ├───────────►│  infrastructure → http    │
│                             ◄───────────┤                          │
└────────────┬────────────────┘            └──────────────┬───────────┘
             │ imports types/schemas                       │  Mongoose
             ▼                                             ▼
       ┌───────────────────────┐                  ┌────────────────┐
       │  packages/shared      │                  │  MongoDB        │
       │  zod schemas + types  │                  │  (single-node)  │
       └───────────────────────┘                  └────────────────┘
```

Two deployable apps share a typed contract via `packages/shared`. The API is the only source of truth for data; the web app keeps no business logic.

## 2. Why a monorepo

| Concern | Resolution |
|---|---|
| Type drift between web & api | A single Zod schema in `@ai-task/shared` is imported by both. Adding a field can't go unnoticed on either side. |
| Cross-cutting refactors | One PR, one diff. |
| Multiple deployable artifacts | `apps/api` and `apps/web` build independently. |

Rejected alternatives: separate repos (drift risk), Next.js API routes only (you wanted Express, and the clean-architecture split is cleaner on a dedicated backend).

## 3. Backend: Clean Architecture in four layers

```
┌────────────────────────────────────────────────────────┐
│ interfaces/http   (Express routes + middleware)        │   <-- outer
├────────────────────────────────────────────────────────┤
│ infrastructure   (Mongo, JWT, bcrypt, Anthropic, Socket)│
├────────────────────────────────────────────────────────┤
│ application      (Use-cases — orchestrators)            │
├────────────────────────────────────────────────────────┤
│ domain           (Entities, repository interfaces)      │   <-- inner
└────────────────────────────────────────────────────────┘
```

**The Dependency Rule:** inner layers never import from outer layers.

- `domain/` knows nothing of Express, Mongoose, Anthropic, or HTTP.
- `application/` uses domain types and depends only on **interfaces** like `IUserRepository`, `IAIProvider`. It never constructs an adapter.
- `infrastructure/` implements those interfaces with concrete tech (Mongo, bcrypt, Anthropic SDK).
- `interfaces/http/` wires controllers to use-cases, validates input, and serializes output.

A minimal DI container ([`src/config/container.ts`](../apps/api/src/config/container.ts)) builds the object graph once at boot. Tests instantiate use-cases with in-memory fakes from [`src/test/fakes.ts`](../apps/api/src/test/fakes.ts) — no Mongo required.

### Why no IoC framework (tsyringe/inversify)?
- No decorators, no reflection metadata.
- Easier to grep — every wiring decision is visible in one file.
- Faster to onboard mid-level developers; the magic stays minimal.

## 4. Frontend: Feature-based with App Router

```
src/
├── app/                 # Next.js App Router (route segments only)
├── features/            # Vertical slices owned end-to-end
│   ├── auth/
│   ├── board/
│   ├── tasks/
│   ├── ai/
│   ├── activity/
│   ├── notifications/
│   ├── team/
│   └── ui/              # global UI state (toast, modals)
├── shared/              # cross-feature primitives
│   ├── components/ui    # Button, Input, Modal, ...
│   ├── hooks            # useSocket, useDebounce
│   └── lib              # cn(), api helpers
└── store/               # Redux root + RTK Query base
```

Each feature folder owns:
- `components/` — React components (server + client)
- `hooks/` — feature-specific custom hooks
- `services/` — RTK Query endpoints
- `store/` — local Redux slice (if any)

This pattern means deleting a feature is one folder removal plus removing its slice from the root store.

### Server vs client components

- Pages under `app/(app)/...` are mostly client components because they interact with Redux & sockets.
- Static marketing-style pages (`app/page.tsx`, login/register) prefer server components and embed client islands (forms).

## 5. Realtime

Socket.IO is wired through an `IRealtimeGateway` interface in `domain/`. The Mongo-backed use-cases emit events (`task:created`, `task:moved`, `notification:new`) without knowing which transport carries them — swapping to Redis Pub/Sub later requires only an infrastructure change.

Web subscribes via `useBoardRealtime(boardId)`, joining `board:{id}` and `user:{userId}` rooms. JWT access tokens authenticate the socket handshake.

## 6. AI integration boundary

```
use-case ──► IAIProvider ──► AnthropicAIProvider (real)
                          └► MockAIProvider (deterministic)
```

The provider is selected at boot based on `ANTHROPIC_API_KEY`. Every model response is parsed as JSON and validated against a Zod schema (`ParsedTaskDraftSchema`, `TaskSummarySchema`, etc.) inside the Anthropic adapter; malformed responses throw `AIError` (502) instead of cascading garbage downstream. See [ai-workflow.md](./ai-workflow.md) and [prompting-strategy.md](./prompting-strategy.md).

## 7. Data flow: creating a task

```
[User] → UI (Kanban + button)
       → useCreateTaskMutation (RTK Query)
       → POST /api/tasks  (Bearer JWT)
       → validateBody(CreateTaskInputSchema)   ← Zod, fail fast
       → requireAuth middleware
       → TaskController → CreateTaskUseCase.execute(userId, input)
            ├─ boards.findById  (authorization)
            ├─ tasks.nextPositionInStatus
            ├─ tasks.create
            ├─ activity.create     (audit)
            └─ realtime.emitToBoard  (sync other clients)
       → 201 JSON
       → Other connected clients receive task:created event
       → RTK Query cache invalidated → board re-renders
```

## 8. Cross-cutting concerns

| Concern | Mechanism |
|---|---|
| Auth | JWT access (15m) + refresh (7d). Refresh path single-flighted in RTK Query base. |
| Validation | Zod at the HTTP boundary, Mongoose at the persistence boundary. |
| Errors | Domain errors carry an HTTP statusCode; the single `errorHandler` middleware translates them to JSON. |
| Rate limiting | Three buckets: default, auth, AI. |
| Logging | pino, with redaction of authorization headers, passwords, tokens. |
| Realtime | Socket.IO rooms keyed by `board:{id}` and `user:{id}`. |
| Activity | Every state change creates an `ActivityLog` entry. |
| Notifications | Use-cases emit notifications inline; future: outbox pattern for at-least-once. |

## 9. What this architecture buys you

- **Testable core.** Use-cases run in milliseconds against in-memory fakes — no Mongo, no network. The `RegisterUseCase` test in [`__tests__/RegisterUseCase.test.ts`](../apps/api/src/application/use-cases/auth/__tests__/RegisterUseCase.test.ts) is 30 lines and covers the duplicate-email branch.
- **Swappable infrastructure.** AI provider, DB driver, transport, hasher — each is a single class behind an interface.
- **Confidence at refactor time.** TypeScript + Zod together make rename/change operations safe.

## 10. Known trade-offs

- Two layers of validation (Zod + Mongoose) is verbose but intentional.
- The DI container is hand-rolled; if the project grows past ~20 use-cases, consider tsyringe.
- No event sourcing — activities are derived, not the source of truth. Acceptable for this scale.
- The `aiSummary` field caches LLM output but isn't invalidated when description/comments change. Tracked in `docs/api-contracts.md` follow-ups.
