# API Contracts

All endpoints are prefixed with `/api`. All requests and responses are JSON. All protected endpoints require an `Authorization: Bearer <accessToken>` header.

Schemas referenced below live in [`packages/shared/src/schemas`](../packages/shared/src/schemas) and are imported by both web and api — they are the **single source of truth**.

## Standard error envelope

```json
{ "error": { "code": "STRING_CODE", "message": "Human readable", "details": null } }
```

Codes you can rely on:

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod schema mismatch on input |
| `UNAUTHORIZED` | 401 | Missing/invalid/expired token |
| `FORBIDDEN` | 403 | Authenticated but lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate (e.g., email already exists) |
| `RATE_LIMITED` | 429 | Hit a rate limit |
| `AI_PROVIDER_ERROR` | 502 | LLM returned malformed/off-schema output |
| `INTERNAL_ERROR` | 500 | Unhandled failure |

## Auth

### `POST /api/auth/register`
Body: `RegisterInputSchema` → `{ email, password, name }`
Response **201**: `AuthResponseSchema` → `{ user, accessToken, refreshToken }`

### `POST /api/auth/login`
Body: `LoginInputSchema` → `{ email, password }`
Response **200**: `AuthResponseSchema`
Notes: returns `401 UNAUTHORIZED` with the same message for unknown email **and** wrong password — no email enumeration.

### `POST /api/auth/refresh`
Body: `{ refreshToken }`
Response **200**: `AuthResponseSchema`
Notes: re-fetches the user; returns 401 if user was deleted.

Rate limit on `/register` and `/login`: 10 requests per 15 minutes per IP.

## Boards

### `GET /api/boards`
Returns boards the user owns OR is a member of. Sorted by `updatedAt` desc.

### `POST /api/boards`
Body: `CreateBoardInputSchema` → `{ name, description?, color? }`
Response **201**: `Board`

### `GET /api/boards/:id`
Returns `{ board, tasks }` in a single payload (avoids waterfall on Kanban view).
Permission: any board member.

### `POST /api/boards/:id/members`
Body: `InviteMemberInputSchema` → `{ email, role }`
Permission: owner or admin only.
Side effects:
- Creates a `member.added` activity log.
- Creates a `board_invite` notification for the invitee.
- Emits `notification:new` to the invitee's user room over Socket.IO.

## Tasks

### `POST /api/tasks`
Body: `CreateTaskInputSchema` → `{ boardId, title, description?, status?, priority?, assigneeIds?, dueDate?, tags? }`
Response **201**: `Task`
Side effects: `task.created` activity log + `task:created` socket event on `board:{boardId}`.

### `PATCH /api/tasks/:id`
Body: `UpdateTaskInputSchema` (all fields optional). If `status` transitions to/from `done`, `completedAt` is set/cleared.

### `POST /api/tasks/:id/move`
Body: `MoveTaskInputSchema` → `{ status, position }`
Use this for Kanban drag-drop. Position is a **float** to allow inserts between any two siblings.

### `DELETE /api/tasks/:id`
Response **204**.

### `POST /api/tasks/:id/comments`
Body: `{ body: string }`. Notifies all assignees other than the commenter.

### `POST /api/tasks/:id/assign`
Body: `{ assigneeIds: string[] }`. Only newly added assignees are notified.

## AI

All AI routes are protected and rate-limited to **20 requests/min/IP**. Each AI call validates the model's JSON output against a Zod schema; a bad response yields `502 AI_PROVIDER_ERROR`.

### `POST /api/ai/parse-task`
Body: `{ boardId, text }`
Response: `ParsedTaskDraftSchema` → `{ title, description, priority, dueDate, tags, confidence }`
Behavior: returns a DRAFT. The client confirms before creating an actual task.

### `POST /api/ai/summarize-task/:id`
Response: `{ summary, nextSteps, risks }`
Side effect: caches `summary` on the task's `aiSummary` field.

### `POST /api/ai/recommend-deadline`
Body: `{ title, description?, priority? }`
Response: `{ recommendedDueDate, rationale }`

### `POST /api/ai/suggest-tasks`
Body: `{ boardId, intent?, count? }`
Response: `TaskSuggestion[]`

## Activity

### `GET /api/activity/board/:boardId?limit=50`
Newest first. Permission: any board member.

## Notifications

### `GET /api/notifications?unreadOnly=true`
Returns up to 100 notifications for the authenticated user.

### `POST /api/notifications/:id/read`
Scoped to the current user — you can't mark someone else's notifications read.

### `POST /api/notifications/read-all`
**204**. Marks all unread for the current user as read.

## Socket.IO events

Connect with `auth: { token: <accessToken> }`. After connect, join rooms:
- `socket.emit('board:join', boardId)`
- `socket.emit('board:leave', boardId)`

The server emits:

| Event | Room | Payload | Trigger |
|---|---|---|---|
| `task:created` | `board:{id}` | `Task` | task created |
| `task:updated` | `board:{id}` | `Task` | task PATCHed or assigned |
| `task:moved` | `board:{id}` | `Task` | task move |
| `task:deleted` | `board:{id}` | `{ taskId }` | task delete |
| `comment:created` | `board:{id}` | `Comment` | comment added |
| `notification:new` | `user:{id}` | minimal payload (`{ taskId? }`) | any notification for that user |

The client uses `notification:new` only as a refetch trigger — it doesn't trust the socket payload for content.
