# StackSystems — Documentação Técnica

> Sistema de gestão para cursinhos e instituições de ensino.
> Plataforma multi-tenant (múltiplas empresas) com autenticação, módulos configuráveis, WebRTC e financeiro.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estrutura de Diretórios](#estrutura-de-diretórios)
4. [Banco de Dados](#banco-de-dados)
5. [Autenticação e Papéis](#autenticação-e-papéis)
6. [API REST](#api-rest)
7. [Componentes de Interface](#componentes-de-interface)
8. [WebRTC / Salas de Aula](#webrtc--salas-de-aula)
9. [Comandos do Projeto](#comandos-do-projeto)
10. [Variáveis de Ambiente](#variáveis-de-ambiente)
11. [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)

---

## Visão Geral

O StackSystems é uma plataforma SaaS para gestão de cursinhos e escolas preparatórias. Cada empresa (cliente) tem seus próprios alunos, cursos, matrículas e usuários internos — completamente isolados das demais (multi-tenant).

**Funcionalidades principais:**

| Módulo         | Descrição                                              |
|----------------|--------------------------------------------------------|
| Alunos         | Cadastro, histórico de matrículas, ativação/desativação |
| Cursos         | Cursos da empresa com módulos e aulas vinculadas        |
| Matrículas     | Vínculo aluno-curso com controle de status              |
| Financeiro     | Baixas (pagamentos), controle de pendências e receita   |
| Certificados   | Emissão para matrículas concluídas                     |
| Salas de Aula  | Videoconferências em tempo real via WebRTC              |
| Usuários       | Contas internas por papel (Admin, Técnico, Docente)     |
| Grupos/Setores | Agrupamentos com controle de módulos acessíveis         |
| Empresas       | Gerenciamento de clientes (exclusivo super admin)       |
| Segurança      | Log de auditoria de ações do sistema                    |

---

## Stack Tecnológico

| Camada         | Tecnologia                                   |
|----------------|----------------------------------------------|
| Framework      | Next.js 16 (App Router)                      |
| Linguagem      | TypeScript                                   |
| Banco de dados | PostgreSQL via Neon (serverless)             |
| ORM            | Prisma v5                                    |
| Autenticação   | NextAuth.js v4 (JWT + CredentialsProvider)   |
| WebRTC         | Socket.io (sinalização) + RTCPeerConnection  |
| UI             | Tailwind CSS + shadcn/ui                     |
| Servidor       | Node.js custom (`server.ts`) com Socket.io   |
| Fontes         | Space Grotesk (títulos) + Inter (corpo)       |

---

## Estrutura de Diretórios

```
stacksystem/
│
├── app/                      — Rotas Next.js (App Router)
│   ├── layout.tsx            — Layout raiz (fontes, metadata)
│   ├── page.tsx              — Landing page pública
│   ├── login/page.tsx        — Página de login
│   ├── painel/               — Área autenticada (protegida pelo proxy)
│   │   ├── layout.tsx        — Layout com barra lateral + topo
│   │   ├── page.tsx          — Dashboard principal (KPIs)
│   │   ├── alunos/           — Gestão de alunos
│   │   ├── cursos/           — Gestão de cursos
│   │   ├── matriculas/       — Gestão de matrículas
│   │   ├── baixas/           — Controle financeiro
│   │   ├── certificados/     — Certificados emitidos
│   │   ├── salas/            — Salas de videoaula
│   │   │   └── [id]/         — Sala individual (WebRTC)
│   │   ├── usuarios/         — Usuários internos
│   │   ├── grupos/           — Grupos de usuários
│   │   ├── setores/          — Setores/departamentos
│   │   ├── empresas/         — Empresas (super admin)
│   │   ├── configuracoes/    — Configurações da empresa
│   │   └── seguranca/        — Log de auditoria
│   └── api/                  — API Routes (REST)
│       ├── auth/[...nextauth] — Handler NextAuth
│       ├── alunos/           — CRUD alunos
│       ├── cursos/           — CRUD cursos
│       ├── matriculas/       — CRUD matrículas
│       ├── baixas/           — CRUD baixas
│       ├── certificados/     — Certificados
│       ├── salas/            — CRUD salas + sinal WebRTC
│       ├── usuarios/         — CRUD usuários internos
│       ├── grupos/           — CRUD grupos
│       ├── setores/          — CRUD setores
│       ├── empresas/         — CRUD empresas + módulos
│       └── permissoes/       — Permissões por usuário/módulo
│
├── servidor/                 — Backend (lógica de servidor)
│   ├── banco/
│   │   └── cliente.ts        — Instância singleton do Prisma
│   └── autenticacao/
│       ├── config.ts         — Configuração NextAuth (opcoesAuth)
│       └── sessao.ts         — Helpers: getUsuarioAtual, exigirPapel, resolverModulos
│
├── componentes/              — Componentes React reutilizáveis
│   ├── layout/               — Layout do painel
│   │   ├── barra-lateral.tsx — Menu lateral com módulos
│   │   ├── barra-topo.tsx    — Barra superior com usuário
│   │   ├── link-nav-lateral.tsx — Link com estado ativo
│   │   ├── provedor-sessao.tsx  — Provider de sessão + toast
│   │   └── provedor-toast.tsx   — Sistema de notificações
│   ├── tabelas/              — Tabelas de listagem
│   │   ├── tabela-alunos.tsx
│   │   ├── tabela-baixas.tsx
│   │   ├── tabela-cursos.tsx
│   │   ├── tabela-empresas.tsx
│   │   ├── tabela-grupos.tsx
│   │   ├── tabela-matriculas.tsx
│   │   ├── tabela-setores.tsx
│   │   ├── tabela-usuarios.tsx
│   │   └── sala-card.tsx
│   ├── formularios/          — Formulários e modais
│   │   ├── form-aluno.tsx
│   │   ├── form-baixa.tsx
│   │   ├── form-curso.tsx
│   │   ├── form-empresa.tsx
│   │   ├── form-grupo.tsx
│   │   ├── form-matricula.tsx
│   │   ├── form-sala.tsx
│   │   ├── form-setor.tsx
│   │   ├── form-usuario.tsx
│   │   ├── form-config-empresa.tsx
│   │   ├── gerenciador-modulos-empresa.tsx
│   │   └── modal-modulos-empresa.tsx
│   ├── video/
│   │   └── sala-video-webrtc.tsx — Interface WebRTC
│   ├── landing/              — Seções da landing page
│   ├── ui/                   — Componentes base (shadcn/ui)
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   └── card.tsx
│   └── mascote.tsx           — Mascote animado (landing)
│
├── tipos/                    — Tipos e constantes compartilhadas
│   ├── autenticacao.d.ts     — Extensão dos tipos NextAuth
│   ├── sistema.ts            — Módulos disponíveis, tipos de sistema
│   └── utilitarios.ts        — Função cn() (clsx + tailwind-merge)
│
├── prisma/
│   ├── schema.prisma         — Schema do banco (fonte da verdade)
│   └── seed.ts               — Dados iniciais para desenvolvimento
│
├── server.ts                 — Servidor customizado (Next.js + Socket.io)
├── proxy.ts                  — Middleware de autenticação (protege /painel/*)
├── tsconfig.json             — Aliases de path TypeScript
└── DOCUMENTACAO.md           — Este arquivo
```

---

## Banco de Dados

### Modelos principais

```
Usuario         — Usuários internos do sistema (admins, técnicos, docentes)
Empresa         — Empresas contratantes da plataforma
ModuloDaEmpresa — Módulos ativos por empresa
Aluno           — Alunos vinculados a uma empresa
CursoDaEmpresa  — Cursos criados pela empresa
ModuloCurso     — Módulos dentro de um curso
Aula            — Aulas dentro de um módulo
Matricula       — Vínculo aluno-curso
Baixa           — Pagamentos/baixas financeiras
Certificado     — Certificados emitidos
Sala            — Salas de videoconferência
SinalSala       — Dados de sinalização WebRTC
Grupo           — Grupos de usuários com permissões
Setor           — Setores/departamentos
PermissaoUsuario — Permissões CRUD por módulo
SegurancaUsuario — Log de auditoria
```

### Isolamento multi-tenant

Toda entidade de negócio tem `empresaId` — as queries sempre filtram por empresa:

```typescript
// Exemplo correto (isolamento de tenant)
const alunos = await db.aluno.findMany({
  where: { empresaId: sessao.user.empresaId }
})

// Super admin pode ver tudo
const alunos = await db.aluno.findMany({}) // sem filtro
```

### Campos padrão

| Campo       | Tipo      | Descrição                          |
|-------------|-----------|-------------------------------------|
| `id`        | String    | UUID gerado automaticamente (cuid) |
| `criadoEm`  | DateTime  | Data de criação                    |
| `atualizadoEm` | DateTime | Última atualização               |
| `empresaId` | String?   | FK para empresa (tenant)           |

---

## Autenticação e Papéis

### Configuração

- **Arquivo**: `servidor/autenticacao/config.ts`
- **Estratégia**: JWT (sem banco de sessão)
- **Provider**: Credentials (email + senha bcrypt)

### Papéis de usuário (`PapelUsuario`)

| Valor | Nome        | Permissões                                    |
|-------|-------------|-----------------------------------------------|
| `A`   | Administrador | Acesso completo à empresa                   |
| `T`   | Técnico       | Acesso operacional (sem gestão de usuários)  |
| `F`   | Docente       | Acesso limitado (salas, aulas)               |

Além dos papéis, existe o `superAdmin: true` para a conta da i3 Soluções — acessa todas as empresas.

### Helpers de autenticação

```typescript
import { getUsuarioAtual, exigirPapel, exigirSuperAdmin } from "@/servidor/autenticacao/sessao"

// Obtém o usuário da sessão atual (ou null)
const usuario = await getUsuarioAtual()

// Lança erro 401/403 se o papel não for permitido
const usuario = await exigirPapel(["A", "T"])

// Lança erro 403 se não for super admin
const usuario = await exigirSuperAdmin()
```

### Módulos efetivos por usuário

```typescript
import { resolverModulos } from "@/servidor/autenticacao/sessao"

// Retorna lista de módulos que o usuário pode acessar
// Leva em conta: empresa, grupo e setor do usuário
const modulos = await resolverModulos(usuario)
```

---

## API REST

Todas as rotas ficam em `app/api/`. Padrão de resposta:

```json
// Sucesso
{ "ok": true }
{ "ok": true, "id": "..." }
[{ ... }]

// Erro
{ "erro": "Mensagem de erro" }
```

### Endpoints disponíveis

| Método | Rota                            | Descrição                              |
|--------|---------------------------------|----------------------------------------|
| GET    | `/api/alunos`                   | Lista alunos da empresa                |
| POST   | `/api/alunos`                   | Cria aluno                             |
| GET    | `/api/alunos/[id]`              | Busca aluno por ID                     |
| PUT    | `/api/alunos/[id]`              | Atualiza aluno                         |
| DELETE | `/api/alunos/[id]`              | Remove aluno                           |
| GET    | `/api/cursos`                   | Lista cursos                           |
| POST   | `/api/cursos`                   | Cria curso                             |
| GET    | `/api/cursos/[id]`              | Busca curso                            |
| PUT    | `/api/cursos/[id]`              | Atualiza curso                         |
| DELETE | `/api/cursos/[id]`              | Remove curso                           |
| GET    | `/api/matriculas`               | Lista matrículas                       |
| POST   | `/api/matriculas`               | Cria matrícula                         |
| PUT    | `/api/matriculas/[id]`          | Atualiza matrícula                     |
| DELETE | `/api/matriculas/[id]`          | Remove matrícula                       |
| GET    | `/api/baixas`                   | Lista baixas financeiras               |
| POST   | `/api/baixas`                   | Cria baixa                             |
| PUT    | `/api/baixas/[id]`              | Atualiza baixa                         |
| DELETE | `/api/baixas/[id]`              | Remove baixa                           |
| GET    | `/api/salas`                    | Lista salas ativas                     |
| POST   | `/api/salas`                    | Cria sala                              |
| GET    | `/api/salas/[id]`               | Busca sala                             |
| DELETE | `/api/salas/[id]`               | Remove sala                            |
| POST   | `/api/salas/signal`             | Troca de sinal WebRTC                  |
| GET    | `/api/usuarios`                 | Lista usuários internos                |
| POST   | `/api/usuarios`                 | Cria usuário                           |
| PUT    | `/api/usuarios/[id]`            | Atualiza usuário                       |
| DELETE | `/api/usuarios/[id]`            | Desativa usuário                       |
| GET    | `/api/empresas`                 | Lista empresas (super admin)           |
| POST   | `/api/empresas`                 | Cria empresa (super admin)             |
| PUT    | `/api/empresas/[id]`            | Atualiza empresa                       |
| GET    | `/api/empresas/[id]/modulos`    | Lista módulos ativos da empresa        |
| PUT    | `/api/empresas/[id]/modulos`    | Atualiza módulos da empresa            |
| GET    | `/api/grupos`                   | Lista grupos                           |
| POST   | `/api/grupos`                   | Cria grupo                             |
| PUT    | `/api/grupos/[id]`              | Atualiza grupo                         |
| DELETE | `/api/grupos/[id]`              | Remove grupo                           |
| GET    | `/api/setores`                  | Lista setores                          |
| POST   | `/api/setores`                  | Cria setor                             |
| PUT    | `/api/setores/[id]`             | Atualiza setor                         |
| DELETE | `/api/setores/[id]`             | Remove setor                           |
| GET    | `/api/permissoes`               | Lista permissões do usuário            |
| POST   | `/api/permissoes`               | Define permissão                       |
| DELETE | `/api/permissoes/[id]`          | Remove permissão                       |

---

## Componentes de Interface

### Layout do painel

O layout `app/painel/layout.tsx` monta a estrutura do painel:
- `BarraLateral` — menu esquerdo com módulos da empresa
- `BarraTopo` — barra superior com nome do usuário e atalhos
- `ProvedorSessao` — wraps com SessionProvider + sistema de toast

### Toast (notificações)

```tsx
import { useToast } from "@/componentes/layout/provedor-toast"

const { mostrar } = useToast()

mostrar("Aluno salvo com sucesso!", "sucesso")
mostrar("Erro ao salvar", "erro")
mostrar("Processando...", "info")
```

### Formulários

Todos os formulários são modais (`Dialog`) que recebem um `trigger` como prop:

```tsx
<AlunoFormModal
  mode="create"
  trigger={<button>Novo Aluno</button>}
  empresas={empresas}
  isSystemAdmin={superAdmin}
/>
```

Após salvar, chamam o router para recarregar a página (`router.refresh()`).

---

## WebRTC / Salas de Aula

### Arquitetura

```
Cliente A                    Servidor (Socket.io)           Cliente B
    |                               |                           |
    |-- entrar-sala (salaId) -----> |                           |
    |                               | <-- entrar-sala (salaId) -|
    |-- oferta (SDP) ------------> |                           |
    |                               | -- oferta (SDP) -------> |
    |                               | <-- resposta (SDP) ------|
    |<-- resposta (SDP) ---------- |                           |
    |-- candidato-ice -----------> |                           |
    |                               | -- candidato-ice ------> |
    |<======= canal direto P2P =========================>      |
```

### Eventos Socket.io

| Evento           | Direção          | Descrição                          |
|------------------|------------------|------------------------------------|
| `entrar-sala`    | cliente → server | Entra em uma sala                  |
| `oferta`         | cliente → server | Envia oferta SDP (WebRTC)          |
| `resposta`       | cliente → server | Envia resposta SDP (WebRTC)        |
| `candidato-ice`  | cliente → server | Envia candidato ICE                |
| `sair-sala`      | cliente → server | Sai da sala                        |

O servidor retransmite os eventos para os outros participantes da sala.

### JWT no Socket.io

O servidor valida o token JWT do NextAuth no handshake:

```typescript
// server.ts
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token
  const payload = await getToken({ req: ..., secret: process.env.NEXTAUTH_SECRET })
  socket.data.usuarioId = payload.sub
  socket.data.empresaId = payload.empresaId
  next()
})
```

---

## Comandos do Projeto

```bash
npm run dev           # Servidor de desenvolvimento (Next.js + Socket.io na porta 3000)
npm run build         # Build de produção
npm run start         # Servidor de produção
npm run lint          # ESLint

npm run db:generate   # Regenerar Prisma Client após mudança no schema
npm run db:push       # Aplicar schema no banco Neon (desenvolvimento)
npm run db:seed       # Popular banco com dados de exemplo
npm run db:studio     # Abrir Prisma Studio (interface visual do banco)
```

> **Importante**: Use sempre `npm run db:push` ao invés de `migrate dev` — a conexão Neon é pooled e não suporta migrations interativas.

---

## Variáveis de Ambiente

Arquivo `.env` na raiz do projeto:

```env
# Banco de dados Neon (PostgreSQL serverless)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

> `NEXTAUTH_SECRET` deve ter no mínimo 32 caracteres aleatórios. Gerar com: `openssl rand -base64 32`

---

## Fluxo de Desenvolvimento

### Adicionar um novo módulo

1. **Schema** (`prisma/schema.prisma`): adicionar o modelo Prisma em português
2. **Push**: `npm run db:push` para aplicar no banco
3. **API**: criar `app/api/{modulo}/route.ts` e `app/api/{modulo}/[id]/route.ts`
4. **Componentes**: criar `componentes/tabelas/tabela-{modulo}.tsx` e `componentes/formularios/form-{modulo}.tsx`
5. **Página**: criar `app/painel/{modulo}/page.tsx`
6. **Menu**: adicionar o módulo em `componentes/layout/barra-lateral.tsx` (`GRUPOS_MODULOS`)
7. **Constante**: adicionar a chave em `tipos/sistema.ts` (`MODULOS_DISPONIVEIS`)

### Alterar o schema

```bash
# 1. Editar prisma/schema.prisma
# 2. Aplicar no banco
npm run db:push
# 3. Regenerar o Prisma Client (db:push já faz isso, mas se necessário):
npm run db:generate
```

### Criar nova empresa (super admin)

1. Fazer login com `sup.stacksystems@gmail.com`
2. Acessar **Painel → Empresas → Nova Empresa**
3. Preencher dados e salvar
4. Acessar **Empresas → Módulos** para ativar os módulos da empresa
5. Criar usuários da empresa em **Usuários**


---

*Documentação gerada em 07/04/2026 — StackSystems v1.0*
