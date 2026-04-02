# StackSystems — Documentação do Backend

> **Stack:** Next.js 16 (App Router) · TypeScript · Prisma 5 · PostgreSQL (Neon serverless) · NextAuth.js v4 · Socket.io

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Banco de Dados](#banco-de-dados)
4. [Autenticação e Sessão](#autenticação-e-sessão)
5. [Controle de Acesso (RBAC)](#controle-de-acesso-rbac)
6. [Rotas da API](#rotas-da-api)
7. [WebRTC — Sinalização e Socket.io](#webrtc--sinalização-e-socketio)
8. [Middleware (proxy.ts)](#middleware-proxytts)
9. [Módulos do Sistema](#módulos-do-sistema)
10. [Comandos](#comandos)
11. [Seed](#seed)

---

## Visão Geral

O StackSystems é uma plataforma multi-tenant SaaS voltada para gestão de cursinhos e instituições de ensino. Cada **Empresa** (tenant) tem seus próprios usuários, alunos, cursos e módulos habilitados. O **Super Admin** (desenvolvedor/i3) tem acesso irrestrito a todas as empresas.

```
Cliente → proxy.ts (Edge Auth Guard)
       → Next.js App Router
       → API Routes (app/api/**/route.ts)
       → session-helpers (requireRole / requireSuperAdmin)
       → Prisma → PostgreSQL Neon
```

---

## Estrutura de Arquivos

```
stacksystem/
├── server.ts                          # Entry point customizado: Next.js + Socket.io
├── proxy.ts                           # Middleware de autenticação (Next.js 16)
├── prisma/
│   ├── schema.prisma                  # Schema completo do banco
│   └── seed.ts                        # Dados iniciais de desenvolvimento
├── backend/
│   ├── auth/
│   │   ├── nextauth-config.ts         # Configuração NextAuth (providers, JWT, callbacks)
│   │   └── session-helpers.ts         # Helpers: getCurrentUser, requireRole, requireSuperAdmin, resolveModulosEfetivos
│   └── database/
│       └── prisma-client.ts           # Singleton do Prisma com driver Neon
├── shared/
│   ├── constants/
│   │   └── sistema-types.ts           # TIPOS_SISTEMA e MODULOS_DISPONIVEIS
│   └── types/
│       └── next-auth.d.ts             # Extensão de tipos da sessão NextAuth
└── app/
    └── api/                           # Rotas REST (ver seção Rotas da API)
```

---

## Banco de Dados

### Conexão

- **Banco:** PostgreSQL hospedado no **Neon** (serverless)
- **ORM:** Prisma v5 com `@prisma/adapter-neon` (driver HTTP/WebSocket)
- **Singleton:** `backend/database/prisma-client.ts` — importar sempre `db` deste arquivo, nunca instanciar `PrismaClient` diretamente
- **Schema changes:** usar `npm run db:push` (não `migrate dev`; conexão Neon é pooled e não-interativa)

```ts
// Correto
import { db } from "@/backend/database/prisma-client"

// Errado — nunca instanciar diretamente
const prisma = new PrismaClient()
```

### Diagrama de Entidades

```
Empresa (tenant)
├── usuarios      → User (role: A | T | F)
├── alunos        → Aluno
├── cursos        → EmpCurso → Modulo → Aula
├── setores       → Setor → SetorModulo[]
├── grupos        → Grupo (isAdmin) → GrupoModulo[]
├── modulos       → EmpresaModulo (ativo por módulo)
└── salas         → Sala → SalaSignal (WebRTC HTTP polling)

Aluno → Matricula → AlunoAndamento (progresso por aula)
                  → Baixa (financeiro)
                  → Certificado

User → SegurancaUser (log de auditoria)
     → Account, Session, VerificationToken (NextAuth)
```

### Models principais

| Model | Tabela | Descrição |
|-------|--------|-----------|
| `User` | `users` | Usuários internos do sistema (staff/professores) |
| `Empresa` | `empresas` | Tenant — cursinho/instituição |
| `Setor` | `setores` | Departamento dentro da empresa |
| `Grupo` | `grupos` | Grupo de permissões de usuários |
| `EmpresaModulo` | `empresa_modulos` | Módulos habilitados por empresa |
| `EmpCurso` | `emp_cursos` | Curso vinculado a uma empresa |
| `Modulo` | `modulos` | Módulo/disciplina de um curso |
| `Aula` | `aulas` | Aula (video, online, texto, pdf) |
| `Aluno` | `alunos` | Aluno vinculado a uma empresa |
| `Matricula` | `matriculas` | Vínculo aluno ↔ curso |
| `AlunoAndamento` | `alunos_andamento` | Progresso por aula |
| `Baixa` | `baixas` | Registro financeiro (mensalidade, matrícula...) |
| `Certificado` | `certificados` | Emissão de certificado |
| `Sala` | `salas` | Sala WebRTC |
| `SalaSignal` | `sala_signals` | Sinalização WebRTC (offer/answer/ICE) |
| `SegurancaUser` | `seguranca_user` | Log de ações do usuário |

### Enum UserRole

```prisma
enum UserRole {
  A  // Administrador da empresa
  T  // Técnico
  F  // Corpo Docente (Faculty)
}
```

---

## Autenticação e Sessão

**Arquivo:** `backend/auth/nextauth-config.ts`

- **Provider:** `CredentialsProvider` (email + senha)
- **Estratégia:** JWT (não usa sessões em banco)
- **Hash de senha:** `bcryptjs` com salt 12
- **Página de login:** `/login`

### Fluxo de autenticação

1. `POST /api/auth/[...nextauth]` com `{ email, password }`
2. `authorize()` — busca usuário no banco, valida senha com `bcrypt.compare`
3. Registra login em `SegurancaUser` (async, não bloqueia)
4. JWT callback — inclui campos extras: `id`, `role`, `isSuperAdmin`, `empresaId`, `grupoId`, `setorId`, `grupoIsAdmin`
5. Session callback — propaga os campos para `session.user`

### Campos disponíveis em `session.user`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | PK do usuário |
| `name` | `string` | Nome |
| `email` | `string` | E-mail |
| `role` | `UserRole` | `A`, `T` ou `F` |
| `isSuperAdmin` | `boolean` | Acesso irrestrito cross-empresa |
| `empresaId` | `string \| null` | Tenant do usuário |
| `grupoId` | `string \| null` | Grupo de permissões |
| `setorId` | `string \| null` | Setor/departamento |
| `grupoIsAdmin` | `boolean` | Se o grupo tem flag `isAdmin` |

---

## Controle de Acesso (RBAC)

**Arquivo:** `backend/auth/session-helpers.ts`

### Funções disponíveis

#### `getCurrentUser()`
Retorna o usuário da sessão atual ou `null`. Usado nas rotas que precisam checar manualmente.

#### `requireRole(allowedRoles: UserRole[])`
Verifica autenticação e role. Retorna `{ user }` em caso de sucesso ou `NextResponse` 401/403.
`isSuperAdmin` bypassa qualquer checagem de role.

```ts
// Exemplo de uso em route.ts
const auth = await requireRole([UserRole.A, UserRole.T])
if (auth instanceof NextResponse) return auth
const { user } = auth
```

#### `requireSuperAdmin()`
Exige `isSuperAdmin = true`. Usado em operações cross-empresa (gestão de empresas).

#### `resolveModulosEfetivos(user)`
Resolve quais módulos o usuário pode acessar, aplicando a hierarquia:

```
isSuperAdmin  → [] (sem filtro, vê tudo)
UserRole.A    → todos os módulos ativos da empresa
grupoIsAdmin  → todos os módulos ativos da empresa
T / F         → empresa ∩ grupo ∩ setor  (intersecção)
```

### Hierarquia de permissões

```
isSuperAdmin (i3/desenvolvedor)
  └── acesso irrestrito a TODAS as empresas e operações

UserRole.A (admin da empresa)
  └── gestão de usuários, cursos, alunos, matrículas, baixas, grupos, setores
  └── edição dos dados da própria empresa

UserRole.T (técnico)
  └── leitura de usuários, criação/edição de cursos, alunos, matrículas, baixas

UserRole.F (corpo docente)
  └── acesso somente leitura na maioria das rotas
  └── não pode criar/editar alunos
```

---

## Rotas da API

Todas as rotas ficam em `app/api/**/route.ts`. O isolamento multi-tenant é feito em cada rota: usuários sem `isSuperAdmin` só acessam dados da própria `empresaId`.

### Autenticação

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET/POST | `/api/auth/[...nextauth]` | Handler NextAuth (login, sessão, callbacks) | Público |

---

### Usuários (`/api/users`)

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/users` | Lista usuários da empresa | A, T, grupoIsAdmin, isSuperAdmin |
| POST | `/api/users` | Cria usuário | A, grupoIsAdmin, isSuperAdmin |
| GET | `/api/users/[id]` | Busca usuário por ID | A, T, grupoIsAdmin, isSuperAdmin |
| PUT | `/api/users/[id]` | Atualiza usuário | A, grupoIsAdmin, isSuperAdmin |
| DELETE | `/api/users/[id]` | Desativa usuário (soft delete: `active = false`) | A, grupoIsAdmin, isSuperAdmin |

**Campos retornados:** `id, name, email, role, department, phone, active, createdAt, empresaId, setorId, grupoId, empresa.nome, setor.nome, grupo.nome`

**Regras:**
- Não-super-admin só vê/edita usuários da própria empresa
- Não-super-admin não pode criar `isSuperAdmin`
- `empresaId` é sempre a do requester para não-super-admin

---

### Alunos (`/api/alunos`)

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/alunos` | Lista alunos da empresa | Autenticado com empresa |
| POST | `/api/alunos` | Cria aluno | A, T, grupoIsAdmin, isSuperAdmin |
| GET | `/api/alunos/[id]` | Busca aluno por ID | Autenticado |
| PUT | `/api/alunos/[id]` | Atualiza aluno | A, T, grupoIsAdmin, isSuperAdmin |
| DELETE | `/api/alunos/[id]` | Desativa aluno (soft delete: `ativo = false`) | A, grupoIsAdmin, isSuperAdmin |

**Campos retornados:** `id, nome, email, cpf, telefone, dataNasc, ativo, createdAt, _count.matriculas`

**Regras:**
- Email único por empresa (`empresaId + email`)
- CPF único por empresa (`empresaId + cpf`)
- `UserRole.F` não pode criar ou editar alunos

---

### Cursos (`/api/cursos`)

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/cursos` | Lista cursos da empresa | Autenticado com empresa |
| POST | `/api/cursos` | Cria curso | A, T, grupoIsAdmin, isSuperAdmin |
| PUT | `/api/cursos/[id]` | Atualiza curso | A, T |
| DELETE | `/api/cursos/[id]` | Desativa curso (soft delete: `ativo = false`) | A |

**Campos:** `id, empresaId, nome, descricao, cargaHoraria, ativo, createdAt, updatedAt, empresa.nome`

---

### Matrículas (`/api/matriculas`)

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/matriculas` | Lista matrículas dos cursos da empresa | Autenticado com empresa |
| POST | `/api/matriculas` | Cria matrícula | A, T, grupoIsAdmin, isSuperAdmin |
| PUT | `/api/matriculas/[id]` | Atualiza status/valor/datas | A, T |
| DELETE | `/api/matriculas/[id]` | Soft delete (status = `"cancelada"`) | A |

**Campos POST:** `alunoId, empCursoId, status, valor, dataInicio, dataFim`

**Status possíveis:** `ativa`, `concluida`, `cancelada`

**Regras:**
- Valida que curso e aluno pertencem à mesma empresa do requester
- Escopo via relação: matrícula → empCurso → empresaId

---

### Baixas / Financeiro (`/api/baixas`)

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/baixas` | Lista baixas das matrículas da empresa | Autenticado com empresa |
| POST | `/api/baixas` | Cria baixa | A, T, grupoIsAdmin, isSuperAdmin |
| PUT | `/api/baixas/[id]` | Atualiza baixa | A, T |
| DELETE | `/api/baixas/[id]` | Remove baixa (hard delete) | A |

**Campos POST:** `matriculaId, descricao, valor, tipo, status, dataPag, dataVenc`

**Tipo possíveis:** `mensalidade`, `matricula`, `certificado`, `outros`

**Status possíveis:** `pago`, `pendente`, `cancelado`

**Escopo:** baixa → matrícula → empCurso → empresaId

---

### Empresas (`/api/empresas`)

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/empresas` | Lista todas as empresas | **isSuperAdmin** |
| POST | `/api/empresas` | Cria empresa | **isSuperAdmin** |
| PUT | `/api/empresas/[id]` | Atualiza empresa | isSuperAdmin ou A/grupoIsAdmin da própria empresa |
| DELETE | `/api/empresas/[id]` | Desativa empresa (`ativa = false`) | **isSuperAdmin** |

**Ao criar empresa:**
- Se `tipoSistema !== "personalizado"`, cria automaticamente os `EmpresaModulo` baseados no preset do tipo

**Restrições de edição para admin da empresa:**
- Não pode alterar `tipoSistema` nem `ativa` (apenas isSuperAdmin)
- Pode editar dados cadastrais e identidade visual

---

### Módulos da Empresa (`/api/empresas/[id]/modulos`)

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/empresas/[id]/modulos` | Lista módulos da empresa | A, T, F |
| POST | `/api/empresas/[id]/modulos` | Atualiza módulos (upsert) | A |

**Modos do POST:**
- `{ modulos: string[] }` — define manualmente quais módulos estão ativos
- `{ aplicarTipo: true }` — redefine baseado no `tipoSistema` da empresa (somente se não for `personalizado`)

Usa `db.$transaction()` para atomicidade nos upserts.

---

### Grupos (`/api/grupos`)

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/grupos` | Lista grupos da empresa | Autenticado |
| POST | `/api/grupos` | Cria grupo | A, grupoIsAdmin |
| GET | `/api/grupos/[id]` | Busca grupo por ID | Autenticado |
| PUT | `/api/grupos/[id]` | Atualiza grupo e seus módulos | A, grupoIsAdmin |
| DELETE | `/api/grupos/[id]` | Remove grupo | A, grupoIsAdmin |

**Campos:** `nome, descricao, isAdmin, empresaId, modulos[]`

O PUT usa `db.$transaction` para apagar os `GrupoModulo` existentes e recriar.

---

### Setores (`/api/setores`)

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/setores` | Lista setores da empresa | Autenticado |
| POST | `/api/setores` | Cria setor | A, grupoIsAdmin |
| GET | `/api/setores/[id]` | Busca setor por ID | Autenticado |
| PUT | `/api/setores/[id]` | Atualiza setor e seus módulos | A, grupoIsAdmin |
| DELETE | `/api/setores/[id]` | Remove setor | A, grupoIsAdmin |

**Campos:** `nome, descricao, empresaId, modulos[]`

Mesma lógica do grupo: PUT usa `db.$transaction` para recriar `SetorModulo`.

---

### Salas WebRTC (`/api/salas`)

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/api/salas` | Lista salas ativas | Autenticado |
| POST | `/api/salas` | Cria sala (gera código único 6 chars) | Autenticado |
| GET | `/api/salas/[id]` | Busca sala por ID | Autenticado |
| DELETE | `/api/salas/[id]` | Remove sala | Admin ou criador da sala |

Ao criar uma sala, um `SalaSignal` vazio é criado automaticamente.

**Geração de código:** `Math.random().toString(36).substring(2, 8).toUpperCase()` com até 5 tentativas de unicidade.

---

### Sinalização WebRTC (`/api/salas/signal`)

Endpoint de HTTP polling para troca de SDP e ICE candidates (alternativa ao Socket.io para ambientes sem WebSocket).

| Método | Query | Descrição |
|--------|-------|-----------|
| GET | `?action=get&room=CODE` | Retorna offer, answer e ICE candidates da sala |
| GET | `?action=reset&room=CODE` | Reseta o SalaSignal (apaga e recria vazio) |
| POST | `?action=set&room=CODE` | Salva offer, answer, caller_name ou callee_name |
| POST | `?action=ice&room=CODE` | Adiciona ICE candidate para `caller` ou `callee` |

**Body do `action=ice`:** `{ role: "caller" | "callee", candidate: RTCIceCandidateInit }`

---

### Rooms em memória (`/api/rooms`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/rooms` | Lista rooms em memória |
| POST | `/api/rooms` | Cria room em memória |

> **Fase 1 apenas** — armazenamento in-memory, perdido ao reiniciar. Substituir por tabela DB na Fase 2.

---

## WebRTC — Sinalização e Socket.io

**Arquivo:** `server.ts`

O servidor customizado inicia Next.js e Socket.io juntos na mesma porta (padrão `3000`).

### Eventos Socket.io

| Evento (cliente → servidor) | Payload | Descrição |
|-----------------------------|---------|-----------|
| `join-room` | `roomId: string` | Entra na sala, notifica outros com `user-joined` |
| `offer` | `{ roomId, offer, to? }` | Envia SDP offer (unicast se `to`, broadcast se não) |
| `answer` | `{ roomId, answer, to? }` | Envia SDP answer |
| `ice-candidate` | `{ roomId, candidate, to? }` | Envia ICE candidate |
| `leave-room` | `roomId: string` | Sai da sala, notifica outros com `user-left` |

| Evento (servidor → cliente) | Descrição |
|-----------------------------|-----------|
| `user-joined` | Novo participante entrou |
| `user-left` | Participante saiu ou desconectou |
| `offer` | Recebeu offer de outro peer |
| `answer` | Recebeu answer de outro peer |
| `ice-candidate` | Recebeu ICE candidate |

**Registry em memória:** `Map<roomId, Set<socketId>>` — Fase 1, substituir por DB na Fase 2.

**CORS:** configurado com `NEXTAUTH_URL` (ou `http://localhost:3000` como fallback).

---

## Middleware (proxy.ts)

**Arquivo:** `proxy.ts` (convenção Next.js 16 — equivale ao `middleware.ts` de versões anteriores)

### Comportamentos

1. **Auth Guard para `/dashboard/*`:** verifica JWT com `getToken` do `next-auth/jwt`. Redireciona para `/login` se não autenticado.

2. **Roteamento por query param na raiz `/`:**

| Parâmetro (`?pg=` ou `?m=`) | Redireciona para |
|-----------------------------|-----------------|
| `login` | `/login` |
| `logout` | `/` |
| `dashboard` | `/dashboard` |
| `home` / `inicio` | `/` |
| `contato` | `/#contato` |

**Matcher:** `["/dashboard/:path*", "/"]`

---

## Módulos do Sistema

**Arquivo:** `shared/constants/sistema-types.ts`

### Módulos disponíveis

| Key | Label | Grupo |
|-----|-------|-------|
| `alunos` | Alunos | Acadêmico |
| `matriculas` | Matrículas | Acadêmico |
| `cursos` | Cursos | Acadêmico |
| `aulas` | Aulas | Conteúdo |
| `salas` | Salas de Aula | Conteúdo |
| `baixas` | Financeiro | Financeiro |
| `certificados` | Certificados | Financeiro |

### Tipos de sistema (presets)

| Key | Módulos incluídos |
|-----|------------------|
| `escola` | alunos, matriculas, cursos, aulas, certificados, salas, baixas |
| `treinamento` | alunos, matriculas, cursos, aulas, salas, baixas |
| `consultoria` | alunos, matriculas, cursos, certificados, baixas, salas |
| `clinica` | alunos, matriculas, baixas, salas, certificados |
| `personalizado` | (nenhum — configuração manual) |

---

## Comandos

```bash
npm run dev           # Inicia servidor customizado (Next.js + Socket.io via tsx server.ts)
npm run build         # Build de produção (prisma generate + next build)
npm run start         # Inicia em produção
npm run lint          # ESLint

npm run db:generate   # Regenera client Prisma após mudanças no schema
npm run db:push       # Aplica schema no Neon (usar sempre, não migrate dev)
npm run db:seed       # Popula dados iniciais de desenvolvimento
npm run db:studio     # Abre Prisma Studio
```

> **Importante:** `npm run dev` usa `tsx server.ts`, não `next dev`. Usar `next dev` diretamente não sobe o Socket.io.

---

## Seed

**Arquivo:** `prisma/seed.ts`

Popula o banco para desenvolvimento com:

| Entidade | Dados |
|----------|-------|
| Super Admin | `admin@stacksystems.com.br` / `Admin@1234!` |
| Empresas | Cursinho Ápice (emp1), Instituto Vanguarda (emp2) |
| Usuários | Admin, Técnico e Professor para emp1 |
| Cursos | ENEM Extensivo, Medicina Intensivo (emp1), Engenharia Semestral (emp2) |
| Módulos/Aulas | 4 aulas por módulo, tipos video/online alternados |
| Alunos | 10 em emp1, 2 em emp2 |
| Matrículas | 12 matrículas (status: ativa, concluida, cancelada) |
| Baixas | 11 registros (pago/pendente, mensalidade/matrícula) |
| Certificados | 2 emissões (para matrículas concluídas) |
| Log de segurança | 1 entry de login do super admin |

Executar com: `npm run db:seed`
