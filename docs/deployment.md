# Deployment

Two services + one database. Both Node 20+. Designed to deploy on any modern container platform (Fly.io, Render, Railway, AWS ECS, GCP Cloud Run).

## 1. Local development

Prereqs: Node ≥ 20, npm ≥ 10, Docker (for Mongo) — or a hosted MongoDB Atlas connection string.

```bash
# 1. Install
npm install

# 2. Start Mongo
docker compose up -d mongo

# 3. Configure env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Optionally set ANTHROPIC_API_KEY in apps/api/.env to use real Claude;
# leave empty to use the deterministic mock provider.

# 4. Run both apps
npm run dev          # runs api + web concurrently
# or:
npm run dev:api      # api only (port 4000)
npm run dev:web      # web only (port 3000)
```

Quick check: visit `http://localhost:3000`. Health: `curl http://localhost:4000/health`.

## 2. Environment variables

### API (`apps/api/.env`)
| Var | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | yes | `development` | `production` enables JSON logs |
| `API_PORT` | yes | `4000` | |
| `MONGO_URI` | yes | — | Connection string. Validated at boot. |
| `JWT_ACCESS_SECRET` | yes | — | ≥ 16 chars. `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | yes | — | Distinct from the access secret. |
| `JWT_ACCESS_TTL` | no | `15m` | |
| `JWT_REFRESH_TTL` | no | `7d` | |
| `CORS_ORIGIN` | no | `http://localhost:3000` | Must match web's deployed URL in prod. |
| `ANTHROPIC_API_KEY` | no | — | Empty → mock provider |
| `ANTHROPIC_MODEL` | no | `claude-opus-4-7` | |

Boot-time validation (`config/env.ts`) crashes immediately on a missing/short secret rather than failing mid-request.

### Web (`apps/web/.env.local`)
| Var | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | Public URL of the API |
| `NEXT_PUBLIC_SOCKET_URL` | Usually same host as API |

Anything `NEXT_PUBLIC_*` is inlined into the client bundle. Don't put secrets here.

## 3. Build & run in production

### API
```bash
cd apps/api
npm run build
NODE_ENV=production node dist/index.js
```

The API is stateless — every replica reads/writes Mongo and emits via Socket.IO. For horizontal scaling beyond a single node, attach a Socket.IO Redis adapter (one-line addition in `SocketIOGateway.attach`).

### Web
```bash
cd apps/web
npm run build
NODE_ENV=production npm start         # next start, port 3000
```

For a static-ish deploy, the App Router still requires a Node runtime. Hosting on Vercel is the path of least resistance; the existing config is compatible.

## 4. Docker

The included `docker-compose.yml` is for local Mongo. Production images aren't shipped because they're trivially specific to the platform — sample Dockerfiles below.

### API Dockerfile sketch
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm ci
RUN npm -w @ai-task/api run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
```

### Web Dockerfile sketch
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm -w @ai-task/web run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

(Standalone mode requires `output: 'standalone'` in `next.config.mjs` — add when productionizing.)

## 5. Reverse proxy / TLS

A single load balancer fronting `api.example.com` and `app.example.com`. TLS terminates at the LB. Cookies aren't used for auth (Bearer tokens only), so no SameSite/Domain considerations.

Socket.IO needs sticky sessions OR a Redis adapter. On Fly/Render, sticky sessions are the simpler default until you horizontally scale.

## 6. Observability

- **Logs.** pino → stdout in JSON (prod). Redacts `authorization`, `cookie`, `password`, `token` keys.
- **Metrics.** Not wired today. Add `prom-client` and expose `/metrics`; the Express app's middleware tree is the natural place.
- **Tracing.** Recommend OpenTelemetry; instrument the route layer and pass spans into use-cases through the Express request.

## 7. Backups

- Mongo: managed Atlas with point-in-time recovery is the right default. For self-hosted, schedule `mongodump` to S3 every 6 hours.

## 8. Pre-deploy checklist

- [ ] Both `JWT_*_SECRET` rotated from `.env.example` values.
- [ ] `CORS_ORIGIN` set to the deployed web URL.
- [ ] `MONGO_URI` points at a production cluster, **not** localhost.
- [ ] `ANTHROPIC_API_KEY` set (or accept the mock — make this an intentional choice).
- [ ] Rate-limit numbers reviewed for your traffic profile.
- [ ] Health probe pointed at `/health`.
- [ ] Log redaction verified — `curl -i` a 401 and check the response doesn't contain raw tokens.
