# fantasy-football-v2

# NFL Fantasy Clone (Starter)

## Quickstart (local, dev)
1. Copy env vars:
   - `cp backend/.env.example backend/.env`
   - edit if necessary
2. Start dev services:
   - `docker-compose up --build`
3. Backend dev:
   - `cd backend && npm install`
   - `npm run dev`
4. Frontend dev:
   - `cd frontend && npm install`
   - `npm run dev` (Vite at http://localhost:5173)

## Project structure
- backend: Express + TypeScript + TypeORM + Socket.IO
- frontend: React + TypeScript + Vite
- docker-compose: Postgres + Redis + backend + frontend

## What’s included
- auth endpoints (register/login)
- create/start draft endpoints
- socket.io draft namespace with `joinDraft` and `makePick`
- worker skeleton for scoring/waivers

## Next steps
- Implement player model & integration with sports provider
- Add robust locking (Redlock) & idempotency keys
- Add unit/integration tests & CI
- Harden auth (refresh tokens), rate limiting, and input validation
