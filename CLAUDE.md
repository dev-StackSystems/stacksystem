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

**StackSystems** is a Next.js 16 (App Router) multi-tenant system for "cursinho" (Brazilian prep school) management. The UI is in **Portuguese (pt-BR)**.

### Folder Structure

```
app/            # Next.js pages and API routes
components/
  ui/           # shadcn/ui base components
  layout/       # Sidebar, TopBar, session/toast providers
  forms/        # CRUD form modals
  tables/       # Listing table components
  landing/      # Landing page sections
  video/        # WebRTC video component
lib/
  db.ts         # Prisma singleton — always import db from here
  auth.ts       # NextAuth config (opcoesAuth)
  auth-helpers.ts  # getUsuarioAtual, exigirPapel, resolverModulos, resolverPermissao
  email.ts      # Nodemailer client
  utils.ts      # cn() — Tailwind class merge
types/
  next-auth.d.ts   # Session/JWT type augmentation
  system.ts        # TIPOS_SISTEMA, MODULOS_DISPONIVEIS constants
prisma/         # schema.prisma + seed.ts
```

### Database

- **PostgreSQL** hosted on **Neon** (serverless)
- **Prisma v5** ORM — single connection file: `lib/db.ts` (never instantiate PrismaClient directly)
- Schema: `prisma/schema.prisma` — multi-tenant with `empresaId` on all user-facing tables
- Main enums: `PapelUsuario` (A, T, I, E, F)

### Authentication

- **NextAuth.js v4** with CredentialsProvider + JWT strategy
- Config: `lib/auth.ts` — exports `opcoesAuth`
- Session includes `id`, `papel`, `superAdmin`, `empresaId`, `grupoId`, `setorId`, `grupoIsAdmin` (typed in `types/next-auth.d.ts`)
- Auth helpers: `lib/auth-helpers.ts` — `getUsuarioAtual()`, `exigirPapel([...])`, `exigirSuperAdmin()`, `resolverModulos()`, `resolverPermissao()`
- Auth guard: `proxy.ts` uses `getToken` from `next-auth/jwt` to protect `/painel/*`

### Next.js 16 Proxy Convention

Next.js 16 uses **`proxy.ts`** instead of `middleware.ts`. It guards `/painel/*` and `/modulos/*` (redirects to `/login` if no JWT), and maps `?pg=X` / `?m=X` query params to routes.

### Route Structure

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Auth via NextAuth `signIn("credentials")` |
| `/painel` | Dashboard home — KPIs |
| `/painel/usuarios` | Internal user management |
| `/painel/alunos` | Student management |
| `/painel/cursos` | Course management |
| `/painel/matriculas` | Enrollment management |
| `/painel/salas` | Virtual classrooms (WebRTC) |
| `/painel/empresas` | Company management (superAdmin) |
| `/painel/configuracoes` | Settings (Admin only) |

All `/painel/*` routes share `app/painel/layout.tsx` (BarraLateral + BarraTopo, reads session + resolves modules).

### User Roles

`superAdmin > A (Admin) > grupoIsAdmin > T (Técnico) / F (Docente)` — enforced at 3 layers:
1. `proxy.ts` — blocks unauthenticated access
2. Server components — conditional rendering by role
3. API routes — `exigirPapel([...])` or `exigirSuperAdmin()` before any DB query

Module visibility: `resolverModulos(usuario)` computes which modules are available based on empresa ∩ grupo ∩ setor intersection.

### API Patterns

- All routes return `{ data, message }` on success or `{ erro }` with HTTP status on error
- Multi-tenant: non-superAdmin requests are automatically scoped by `empresaId`
- Soft deletes: `ativo=false` or `status=cancelada` instead of hard deletes

### WebRTC / Socket.io

`server.ts` runs Socket.io alongside Next.js on the same HTTP server. Events: `entrar-sala`, `oferta`, `resposta`, `candidato-ice`, `sair-sala`. Topology: mesh P2P. Room registry in `Sala` table; signaling via `SinalSala` table or Socket.io events.

### Design System

- Colors: Orange primary (`#f97316`) with 11 custom shades in `tailwind.config.ts`
- Typography: Space Grotesk (`font-serif`) + Inter (`font-sans`)
- Animations: Custom Tailwind keyframes + `motion/react` (Framer Motion v12)
- Path alias: `@/*` → project root
- Utility: `lib/utils.ts` exports `cn()` (clsx + tailwind-merge)

### Adding New shadcn Components

```bash
npx shadcn@latest add <component-name>
```
