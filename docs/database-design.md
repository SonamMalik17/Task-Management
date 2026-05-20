# Database Design

MongoDB via Mongoose. Six collections — `users`, `boards`, `tasks`, `comments`, `activities`, `notifications`.

## 1. Why MongoDB

Task data is naturally document-shaped:
- A task has a nested **checklist** array.
- A board has a nested **members** array (with roles).
- Activity logs carry a free-form `metadata` blob whose shape varies by `action`.

Relational joins would be painful here. Mongo's document model maps 1:1 to the entities the application already reasons about.

## 2. Collection shapes

### `users`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `email` | String, **unique**, lowercase, indexed | Lookup key for login |
| `name` | String | |
| `passwordHash` | String | bcrypt, 12 rounds. **Never** returned in toJSON |
| `avatarUrl` | String? | |
| `role` | enum `owner/admin/member/viewer` | Platform role, distinct from per-board role |
| `createdAt`, `updatedAt` | Date | |

Indexes: `{ email: 1 }` unique.

### `boards`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name`, `description`, `color` | String | |
| `ownerId` | ObjectId ref User, **indexed** | |
| `members[]` | `{ userId, role, joinedAt }` | Embedded. Owner is implicit, NOT in this array. |

Indexes: `{ ownerId: 1 }`, `{ 'members.userId': 1 }` — together they cover the "boards a user can see" query.

### `tasks`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `boardId` | ObjectId ref Board, **indexed** | |
| `title`, `description` | String | |
| `status` | enum `todo/in_progress/review/done`, **indexed** | |
| `priority` | enum | |
| `position` | Number (float) | See "Position math" below |
| `assigneeIds[]` | ObjectId ref User, **indexed** | |
| `creatorId` | ObjectId ref User | |
| `dueDate`, `completedAt` | Date | |
| `tags[]` | String | |
| `checklist[]` | `{ id, text, done }` | Embedded |
| `aiSummary` | String? | Cached LLM output |

Indexes:
- `{ boardId: 1, status: 1, position: 1 }` — the Kanban query: load a column ordered by position.
- `{ assigneeIds: 1 }` — "my tasks" filter.

### `comments`
| Field | Type | Notes |
|---|---|---|
| `taskId` | ObjectId ref Task, **indexed** | |
| `authorId` | ObjectId ref User | |
| `body` | String | |

Index: `{ taskId: 1 }`.

### `activities`
| Field | Type | Notes |
|---|---|---|
| `boardId` | ObjectId ref Board, **indexed** | |
| `actorId` | ObjectId ref User | |
| `action` | enum `task.created/updated/...` | |
| `metadata` | Mixed | Shape varies by `action`. Consumers narrow on `action`. |

Index: `{ boardId: 1, createdAt: -1 }` — newest-first feed.

### `notifications`
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId ref User, **indexed** | |
| `type` | enum | |
| `title`, `body`, `link` | String | |
| `readAt` | Date? | `null` until read |

Index: `{ userId: 1, readAt: 1, createdAt: -1 }` — supports "my unread, newest-first" in a single scan.

## 3. Position math (Kanban)

`task.position` is a **floating-point number**. To insert between two adjacent tasks A (position 1024) and B (position 2048), we write `position = 1536`. This keeps inserts O(1) — we never have to rewrite siblings.

We step by 1024 between siblings, which gives ~10 halving operations before two positions collide at floating-point precision. A future migration could re-pack a column to `1024, 2048, 3072, …` if collisions are detected.

Reasons we did NOT use:
- **Integer positions with reorder-on-insert** — O(N) writes per Kanban move.
- **Linked list of `prevId` pointers** — fetching a column becomes an N-roundtrip walk.
- **Fractional indexing libraries** — overkill for the scale.

## 4. Soft delete vs hard delete

We hard-delete tasks and comments today. Audit history of *what* was deleted lives in the activity log (`task.deleted` records the title). If we need recovery, add `deletedAt` and exclude on read — easy migration.

## 5. Schema validation: two layers, on purpose

| Layer | Purpose |
|---|---|
| Zod (in `@ai-task/shared`) | Validates HTTP inputs. Same schema used by the web client to produce friendly error messages. |
| Mongoose schema | Defends storage from bypass paths — e.g., a batch script that skips the HTTP layer. |

These overlap on purpose. Two cheap layers > one expensive one.

## 6. Indexes in summary

```
users:         { email: 1 } unique
boards:        { ownerId: 1 }
               { 'members.userId': 1 }
tasks:         { boardId: 1, status: 1, position: 1 }
               { assigneeIds: 1 }
comments:      { taskId: 1 }
activities:    { boardId: 1, createdAt: -1 }
notifications: { userId: 1, readAt: 1, createdAt: -1 }
```

## 7. Scaling notes

- **Read scaling.** All hot queries are board-scoped — sharding by `boardId` is straightforward when the time comes.
- **Search.** The current task search uses regex. At >10k tasks per board, swap in Atlas Search. The repository interface won't change.
- **Activity volume.** Activity logs grow unbounded. Add a TTL index (`createdAt`, 90 days) once the table noticeably outgrows the working set.
- **Notifications.** Same. Mark-read + TTL on `readAt` would keep the collection bounded.
