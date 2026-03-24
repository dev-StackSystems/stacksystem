# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start dev server (Next.js + Socket.io via tsx server.ts)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:push       # Push schema changes to Neon (use instead of migrate dev)
npm run db:seed       # Seed first admin user
npm run db:studio     # Open Prisma Studio
```

No test framework is configured.

**Important**: `npm run dev` starts a custom Node.js server (`server.ts`) that runs Next.js + Socket.io together on port 3000. Never use `next dev` directly.

**Database schema changes**: Use `npm run db:push` (not `migrate dev`) because the Neon connection is pooled and non-interactive.

## Architecture

**StackSystems** is a Next.js 16 (App Router) system for "cursinho" (Brazilian prep school) management. The UI is in **Portuguese (pt-BR)**.

### Database

- **PostgreSQL** hosted on **Neon** (serverless)
- **Prisma v5** ORM — single connection file: `lib/db.ts` (Prisma singleton, all other files import `db` from here, never instantiate PrismaClient directly)
- Schema: `prisma/schema.prisma` — `User` model with `UserRole` enum (ADMIN, TECH, FACULTY) + NextAuth models

### Authentication

- **NextAuth.js v4** with CredentialsProvider + JWT strategy
- Config: `lib/auth.ts` — imports `db` from `lib/db.ts`
- Session includes `user.id` and `user.role` (typed in `types/next-auth.d.ts`)
- Auth helpers: `lib/auth-helpers.ts` — `getCurrentUser()` and `requireRole([...roles])` for API routes
- Auth guard: `proxy.ts` uses `getToken` from `next-auth/jwt` to protect `/dashboard/*`

### Next.js 16 Proxy Convention

Next.js 16 uses **`proxy.ts`** (named export `proxy`) instead of `middleware.ts`. The `proxy.ts` file:
- Guards `/dashboard/*` routes (redirects to `/login` if no JWT)
- Maps `?pg=X` / `?m=X` query params to routes at root

### Route Structure

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing page |
| `/login` | `app/login/page.tsx` | Real auth via NextAuth `signIn("credentials")` |
| `/dashboard` | `app/dashboard/page.tsx` | Server component — KPIs from DB |
| `/dashboard/usuarios` | `app/dashboard/usuarios/page.tsx` | Internal user management (ADMIN/TECH) |
| `/dashboard/configuracoes` | `app/dashboard/configuracoes/page.tsx` | Settings (ADMIN only) |

All dashboard routes share `app/dashboard/layout.tsx` (Sidebar + TopBar, reads role from session).

### User Roles

`ADMIN > TECH > FACULTY` — enforced at 3 layers:
1. `proxy.ts` (Edge) — blocks unauthenticated access
2. Server components — conditional rendering by role
3. API routes — `requireRole([...])` before any DB query

### Internal User APIs

- `GET/POST /api/users` — list / create (ADMIN+TECH for GET, ADMIN-only for POST)
- `GET/PUT/DELETE /api/users/[id]` — CRUD (DELETE is soft: sets `active=false`)
- `GET/POST /api/rooms` — WebRTC room management (in-memory, Phase 1)
- `GET/POST /api/auth/[...nextauth]` — NextAuth handler

### Component Organization

- `components/sections/` — landing page sections
- `components/ui/` — shadcn/ui base components (`button`, `card`, `badge`)
- `components/dashboard/` — `Sidebar`, `TopBar`, `SessionWrapper`, `SidebarNavLink`, `UserTable`, `UserFormModal`
- `components/Mascot.tsx` — animated mascot (landing page only)

### WebRTC / Socket.io

`server.ts` runs Socket.io alongside Next.js. Events: `join-room`, `offer`, `answer`, `ice-candidate`, `leave-room`. Room registry is in-memory (Phase 1); migrate to DB table in Phase 2.

### Design System

- Colors: Orange primary (`#f97316`) with 11 custom shades in `tailwind.config.ts`
- Typography: Space Grotesk (headings, `font-serif` class) + Inter (body, `font-sans`)
- Animations: Custom Tailwind keyframes + `motion/react` (Framer Motion v12)
- Path alias: `@/*` → project root
- Utility: `lib/utils.ts` exports `cn()` (clsx + tailwind-merge)

### Adding New shadcn Components

```bash
npx shadcn@latest add <component-name>
```
