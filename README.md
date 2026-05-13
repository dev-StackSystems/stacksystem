# StackSystems

Sistema de gestão para cursinhos e instituições de ensino, construído com Next.js 16 e Socket.io. Multi-tenant, com controle granular de permissões por usuário, grupo e setor.

## O que é

StackSystems é uma plataforma SaaS voltada para cursinho pré-vestibular e outras instituições de ensino. Cada empresa (tenant) tem seu próprio conjunto de módulos habilitados, usuários com papéis distintos e permissões configuráveis por módulo.

**Funcionalidades principais:**

- Gestão de alunos, matrículas, cursos, aulas e certificados
- Controle financeiro (baixas/pagamentos)
- Salas de aula virtuais com WebRTC (videochamada P2P em mesh)
- Gestão de usuários internos com hierarquia de permissões
- Painel administrativo multi-empresa (superAdmin)
- Recuperação de senha por e-mail

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Servidor | Node.js custom (`server.ts`) com Socket.io |
| Banco de dados | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| ORM | Prisma v5 com `@prisma/adapter-neon` |
| Autenticação | NextAuth.js v4 — JWT + CredentialsProvider |
| UI | Tailwind CSS 3 + shadcn/ui |
| Animações | motion/react (Framer Motion v12) |
| E-mail | Nodemailer |
| Real-time | Socket.io 4 |

## Estrutura de pastas

```
stacksystem/
├── app/                    # Páginas e rotas de API (Next.js App Router)
│   ├── api/                # REST API (alunos, cursos, matriculas, salas…)
│   ├── login/              # Autenticação + recuperação de senha
│   └── painel/             # Dashboard protegido
├── components/             # Componentes React
│   ├── ui/                 # shadcn/ui (button, badge, card…)
│   ├── layout/             # Sidebar, TopBar, provedores
│   ├── forms/              # Formulários de CRUD
│   ├── tables/             # Tabelas de listagem
│   ├── landing/            # Seções da landing page
│   └── video/              # Componente WebRTC
├── lib/                    # Utilitários do servidor
│   ├── db.ts               # Prisma singleton (Neon)
│   ├── auth.ts             # Configuração NextAuth
│   ├── auth-helpers.ts     # getUsuarioAtual, exigirPapel, resolverModulos
│   ├── email.ts            # Cliente Nodemailer
│   └── utils.ts            # cn() — merge de classes Tailwind
├── types/                  # Tipos TypeScript
│   ├── next-auth.d.ts      # Augmentação da sessão NextAuth
│   └── system.ts           # Constantes: TIPOS_SISTEMA, MODULOS_DISPONIVEIS
├── prisma/                 # Schema e seed do banco
├── public/                 # Assets estáticos
├── server.ts               # Entry point: Next.js + Socket.io
└── proxy.ts                # Middleware: guarda /painel/* e /modulos/*
```

## Hierarquia de papéis

```
superAdmin  →  acesso irrestrito a todas as empresas
    A       →  administrador da empresa (todos os módulos)
  grupoIsAdmin →  grupo com flag admin (equivale ao papel A)
   T / F    →  técnico / docente — interseção empresa ∩ grupo ∩ setor
              permissões granulares: Ler, Criar, Editar, Deletar
```

## Pré-requisitos

- Node.js 18+
- PostgreSQL (recomendado: conta gratuita no [Neon](https://neon.tech))
- Conta SMTP opcional (recuperação de senha; em dev, o link é exibido no terminal)

## Configuração

Crie um arquivo `.env` na raiz:

```env
# Banco de dados (Neon)
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"

# E-mail (opcional — em dev, o link aparece no terminal)
EMAIL_HOST="smtp.exemplo.com"
EMAIL_PORT=587
EMAIL_USER="seu@email.com"
EMAIL_PASS="sua-senha"
EMAIL_FROM="StackSystems <noreply@exemplo.com>"
```

## Rodando o projeto

```bash
# Instalar dependências
npm install

# Aplicar schema no banco (use db:push, não migrate dev — conexão pooled)
npm run db:push

# Criar primeiro usuário admin
npm run db:seed

# Iniciar em desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

> **Importante:** use `npm run dev` (não `next dev`). O servidor customizado `server.ts` sobe o Next.js e o Socket.io juntos na mesma porta.

## Scripts disponíveis

```bash
npm run dev           # Servidor de desenvolvimento (Next.js + Socket.io)
npm run build         # Build de produção
npm run start         # Servidor de produção
npm run lint          # ESLint
npm run db:generate   # Regenera o Prisma Client após mudar o schema
npm run db:push       # Aplica o schema no banco (sem migration interativa)
npm run db:seed       # Cria o primeiro usuário admin
npm run db:studio     # Abre o Prisma Studio
```

## Adicionando componentes shadcn/ui

```bash
npx shadcn@latest add <nome-do-componente>
```

Os componentes são adicionados em `components/ui/`.

## Módulos disponíveis

O sistema suporta habilitar/desabilitar módulos por empresa:

| Chave | Descrição |
|-------|-----------|
| `alunos` | Cadastro de alunos |
| `matriculas` | Matrículas e status |
| `cursos` | Cursos e módulos |
| `aulas` | Aulas (vídeo, online, PDF, texto) |
| `salas` | Salas de aula virtuais (WebRTC) |
| `baixas` | Controle financeiro |
| `certificados` | Emissão de certificados |

## WebRTC / Salas

O Socket.io roda no mesmo processo do Next.js (`server.ts`). As salas usam topologia mesh P2P — cada participante conecta diretamente a todos os outros. O registro de salas é feito no banco (tabela `Sala`) e a sinalização SDP/ICE via tabela `SinalSala` ou eventos Socket.io.
