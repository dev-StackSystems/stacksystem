/**
 * app/painel/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Página principal do painel — exibe KPIs, módulos de acesso rápido,
 * anúncios da empresa e atividade recente (últimas matrículas e baixas).
 *
 * É um Server Component: todos os dados são buscados diretamente no servidor
 * antes de renderizar, sem chamadas fetch no cliente.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { db }               from "@/servidor/banco/cliente"
import { getServerSession } from "next-auth"
import { redirect }         from "next/navigation"
import { opcoesAuth }       from "@/servidor/autenticacao/config"
import { TIPOS_SISTEMA }    from "@/tipos/sistema"
import Link                 from "next/link"
import {
  GraduationCap, BookOpen, Layers, Play,
  DollarSign, Award, Users, TrendingUp,
  CheckCircle2, Clock, XCircle,
  Globe, Phone, MapPin, Video, Building2,
} from "lucide-react"

// ── Rótulos por papel do usuário ──────────────────────────────────────────────
const ROTULOS_PAPEL: Record<string, string> = {
  A: "Administrador",
  T: "Técnico",
  I: "Interno",
  E: "Externo",
  F: "Corpo Docente",
}

// ── Status visual de matrícula ────────────────────────────────────────────────
const STATUS_MATRICULA: Record<string, { rotulo: string; cls: string }> = {
  ativa:     { rotulo: "Ativa",     cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  concluida: { rotulo: "Concluída", cls: "bg-blue-50 text-blue-600 border-blue-200" },
  cancelada: { rotulo: "Cancelada", cls: "bg-red-50 text-red-500 border-red-200" },
}

// ── Status visual de baixa ────────────────────────────────────────────────────
const STATUS_BAIXA: Record<string, { rotulo: string; cls: string; icone: typeof CheckCircle2 }> = {
  pago:      { rotulo: "Pago",      cls: "text-emerald-600", icone: CheckCircle2 },
  pendente:  { rotulo: "Pendente",  cls: "text-amber-500",   icone: Clock },
  cancelado: { rotulo: "Cancelado", cls: "text-red-500",     icone: XCircle },
}

// ── Configuração de módulos (ícone, rota, descrição) ──────────────────────────
const CONFIG_MODULO: Record<string, { rotulo: string; icone: typeof GraduationCap; href: string; desc: string }> = {
  alunos:       { rotulo: "Alunos",        icone: GraduationCap, href: "/painel/alunos",       desc: "Cadastro de alunos" },
  matriculas:   { rotulo: "Matrículas",    icone: BookOpen,      href: "/painel/matriculas",   desc: "Gestão de matrículas" },
  cursos:       { rotulo: "Cursos",        icone: Layers,        href: "/painel/cursos",       desc: "Cursos e módulos" },
  aulas:        { rotulo: "Aulas",         icone: Play,          href: "/painel/aulas",        desc: "Conteúdo das aulas" },
  salas:        { rotulo: "Salas de Aula", icone: Video,         href: "/painel/salas",        desc: "Videoaulas ao vivo" },
  baixas:       { rotulo: "Financeiro",    icone: DollarSign,    href: "/painel/baixas",       desc: "Controle financeiro" },
  certificados: { rotulo: "Certificados",  icone: Award,         href: "/painel/certificados", desc: "Emissão de certificados" },
}

// ── Tipo de anúncio (salvo como JSON no campo `anuncios` da empresa) ──────────
interface Anuncio {
  titulo: string
  texto:  string
  cor?:   string
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function PaginaPainel() {
  const sessao    = await getServerSession(opcoesAuth)
  const papel     = sessao?.user.papel       ?? ""
  const empresaId = sessao?.user.empresaId   ?? null
  const isAdmin   = sessao?.user.superAdmin  ?? false

  // ── Dados da empresa ──────────────────────────────────────────────────────
  let empresa: {
    nome:        string
    sigla?:      string | null
    cor:         string | null
    cor2?:       string | null
    logo:        string | null
    brasao?:     string | null
    banner:      string | null
    tipoSistema: string | null
    nomeSistema?: string | null
    descricao:   string | null
    anuncios:    string | null
    email?:      string | null
    telefone?:   string | null
    site?:       string | null
    municipio?:  string | null
    uf?:         string | null
  } | null = null

  let modulosAtivos: string[] = []

  if (empresaId) {
    const [emp, empMods, empCustom] = await Promise.all([
      db.empresa.findUnique({
        where:  { id: empresaId },
        select: {
          nome: true, sigla: true, cor: true, cor2: true,
          logo: true, brasao: true, banner: true,
          tipoSistema: true, nomeSistema: true, descricao: true, anuncios: true,
          email: true, telefone: true, site: true, municipio: true, uf: true,
        },
      }),
      db.moduloDaEmpresa.findMany({
        where:  { empresaId, ativo: true },
        select: { modulo: true },
      }),
      db.moduloCustomDaEmpresa.findMany({
        where:  { empresaId, ativo: true },
        select: { catalogo: { select: { id: true, href: true } } },
        orderBy: { criadoEm: "asc" },
      }),
    ])
    empresa       = emp
    modulosAtivos = empMods.map(m => m.modulo)

    // Empresa sem módulos builtin mas com módulos custom → redireciona para rota mascarada
    if (!isAdmin && modulosAtivos.length === 0 && empCustom.length > 0) {
      redirect(`/painel/app/${empCustom[0].catalogo.id}`)
    }
  }

  // Informações do tipo de sistema (cursinho, escola, etc.)
  const tipoInfo = empresa?.tipoSistema
    ? TIPOS_SISTEMA.find(t => t.key === empresa!.tipoSistema)
    : null

  // Decodifica anúncios salvos como JSON
  let listaAnuncios: Anuncio[] = []
  if (empresa?.anuncios) {
    try { listaAnuncios = JSON.parse(empresa.anuncios) as Anuncio[] }
    catch { listaAnuncios = [] }
  }

  // ── KPIs — filtrados pela empresa do usuário ──────────────────────────────
  const inicioMes      = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const filtroCurso    = !isAdmin && empresaId ? { empresaId }                       : undefined
  const filtroAluno    = !isAdmin && empresaId ? { empresaId }                       : undefined
  const filtroMatric   = !isAdmin && empresaId ? { curso: { empresaId } }            : undefined
  const filtroBaixa    = !isAdmin && empresaId ? { matricula: filtroMatric }         : undefined

  const [
    totalAlunos,
    alunosAtivos,
    totalMatriculas,
    matriculasAtivas,
    totalCursos,
    totalCertificados,
    receitaMes,
    totalUsuarios,
    ultimasMatriculas,
    ultimasBaixas,
  ] = await Promise.all([
    db.aluno.count({ where: filtroAluno }),
    db.aluno.count({ where: { ativo: true, ...filtroAluno } }),
    db.matricula.count({ where: filtroMatric }),
    db.matricula.count({ where: { ...filtroMatric, status: "ativa" } }),
    db.cursoDaEmpresa.count({ where: { ...filtroCurso, ativo: true } }),
    db.certificado.count({ where: filtroCurso ? { curso: filtroCurso } : undefined }),
    db.baixa.aggregate({
      _sum:  { valor: true },
      where: {
        status:        "pago",
        dataPagamento: { gte: inicioMes },
        ...(filtroBaixa ?? {}),
      },
    }),
    db.usuario.count({
      where: { ativo: true, ...(empresaId && !isAdmin ? { empresaId } : {}) },
    }),
    db.matricula.findMany({
      take:    6,
      orderBy: { criadoEm: "desc" },
      where:   filtroMatric,
      select:  {
        id: true, status: true, valor: true, criadoEm: true,
        aluno: { select: { nome: true, email: true } },
        curso: { select: { nome: true } },
      },
    }),
    db.baixa.findMany({
      take:    6,
      orderBy: { criadoEm: "desc" },
      where:   filtroBaixa,
      select:  {
        id: true, descricao: true, valor: true, tipo: true,
        status: true, dataPagamento: true, criadoEm: true,
        matricula: { select: { aluno: { select: { nome: true } } } },
      },
    }),
  ])

  const receitaValor = Number(receitaMes._sum.valor ?? 0)
  const corEmpresa   = empresa?.cor ?? "#f97316"
  const nomeExibido  = empresa?.nomeSistema || empresa?.nome || "StackSystems"

  // ── Cards de KPI ──────────────────────────────────────────────────────────
  const kpis = [
    {
      icone: GraduationCap,
      rotulo: "Alunos Ativos",
      valor:  alunosAtivos.toString(),
      sub:    `${totalAlunos} cadastrados`,
      cor:    "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      icone:  BookOpen,
      rotulo: "Matrículas Ativas",
      valor:  matriculasAtivas.toString(),
      sub:    `${totalMatriculas} no total`,
      cor:    "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      icone:  Layers,
      rotulo: "Cursos Ativos",
      valor:  totalCursos.toString(),
      sub:    "disponíveis",
      cor:    "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      icone:  DollarSign,
      rotulo: "Receita do Mês",
      valor:  receitaValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      sub:    "baixas pagas",
      cor:    "bg-teal-50 text-teal-600 border-teal-100",
    },
    {
      icone:  Award,
      rotulo: "Certificados",
      valor:  totalCertificados.toString(),
      sub:    "emitidos",
      cor:    "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      icone:  TrendingUp,
      rotulo: "Taxa de Conclusão",
      valor:  totalMatriculas > 0
        ? `${Math.round(((totalMatriculas - matriculasAtivas) / totalMatriculas) * 100)}%`
        : "—",
      sub:    "finalizadas",
      cor:    "bg-orange-50 text-orange-600 border-orange-100",
    },
    {
      icone:  Users,
      rotulo: "Usuários Internos",
      valor:  totalUsuarios.toString(),
      sub:    "com acesso ativo",
      cor:    "bg-slate-100 text-slate-600 border-slate-200",
    },
  ]

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* ── Cabeçalho com identidade da empresa ── */}
      {empresa ? (
        <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
          {empresa.banner ? (
            /* Com banner */
            <div className="relative h-36 md:h-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={empresa.banner} alt={nomeExibido} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 flex items-end gap-4">
                {(empresa.logo || empresa.brasao) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(empresa.logo || empresa.brasao)!}
                    alt={nomeExibido}
                    className="w-14 h-14 rounded-xl border-2 border-white/80 object-cover shrink-0 shadow-lg"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-serif text-xl font-bold text-white drop-shadow">{nomeExibido}</h1>
                    {tipoInfo && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                        {tipoInfo.emoji} {tipoInfo.label}
                      </span>
                    )}
                  </div>
                  {empresa.municipio && (
                    <p className="text-xs text-white/70 mt-0.5 flex items-center gap-1">
                      <MapPin size={10} />
                      {empresa.municipio}{empresa.uf ? ` — ${empresa.uf}` : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Sem banner — degradê com a cor da empresa */
            <div
              className="px-6 py-5 flex items-center gap-4"
              style={{
                background:    `linear-gradient(135deg, ${corEmpresa}18, ${corEmpresa}38)`,
                borderBottom:  `3px solid ${corEmpresa}`,
              }}
            >
              {empresa.logo || empresa.brasao ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(empresa.logo || empresa.brasao)!}
                  alt={nomeExibido}
                  className="w-14 h-14 rounded-xl border border-white shadow-sm object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-sm font-serif"
                  style={{ background: corEmpresa }}
                >
                  {(empresa.sigla || empresa.nome).charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif text-xl font-bold text-slate-900">{nomeExibido}</h1>
                  {empresa.sigla && empresa.sigla !== nomeExibido && (
                    <span className="text-xs font-bold text-slate-400">({empresa.sigla})</span>
                  )}
                  {tipoInfo && (
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                      style={{ background: `${corEmpresa}18`, color: corEmpresa, borderColor: `${corEmpresa}44` }}
                    >
                      {tipoInfo.emoji} {tipoInfo.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {empresa.municipio && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={10} /> {empresa.municipio}{empresa.uf ? ` — ${empresa.uf}` : ""}
                    </span>
                  )}
                  {empresa.telefone && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone size={10} /> {empresa.telefone}
                    </span>
                  )}
                  {empresa.site && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Globe size={10} /> {empresa.site}
                    </span>
                  )}
                </div>
              </div>

              <div className="ml-auto text-right hidden sm:block shrink-0">
                <p className="text-sm font-semibold text-slate-700">
                  Olá, {sessao?.user.name?.split(" ")[0]}
                </p>
                <p className="text-xs text-slate-400">
                  {ROTULOS_PAPEL[papel] ?? ""} ·{" "}
                  {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                </p>
              </div>
            </div>
          )}

          {/* Saudação abaixo do banner */}
          {empresa.banner && (
            <div className="px-6 py-3 bg-white flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Olá, <span className="font-semibold text-slate-800">{sessao?.user.name?.split(" ")[0]}</span>
                {" "} — {ROTULOS_PAPEL[papel] ?? ""}
              </p>
              <div className="flex items-center gap-4">
                {empresa.municipio && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 hidden sm:flex">
                    <MapPin size={10} /> {empresa.municipio}{empresa.uf ? ` — ${empresa.uf}` : ""}
                  </span>
                )}
                <p className="text-xs text-slate-400">
                  {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Sem empresa (super admin da plataforma) */
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            Olá, {sessao?.user.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {ROTULOS_PAPEL[papel] ?? ""} ·{" "}
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
        </div>
      )}

      {/* ── Anúncios da empresa ── */}
      {listaAnuncios.length > 0 && (
        <div className="flex flex-col gap-2">
          {listaAnuncios.map((anuncio, i) => (
            <div
              key={i}
              className="rounded-xl px-4 py-3 border text-sm"
              style={{
                background:   anuncio.cor ? `${anuncio.cor}12` : "#fff7ed",
                borderColor:  anuncio.cor ? `${anuncio.cor}44` : "#fed7aa",
                color:        anuncio.cor ?? "#c2410c",
              }}
            >
              {anuncio.titulo && <span className="font-bold mr-2">{anuncio.titulo}:</span>}
              {anuncio.texto}
            </div>
          ))}
        </div>
      )}

      {/* ── Módulos de acesso rápido ── */}
      {modulosAtivos.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Módulos</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {modulosAtivos
              .filter(m => CONFIG_MODULO[m])
              .map(m => {
                const cfg  = CONFIG_MODULO[m]
                const Icon = cfg.icone
                return (
                  <Link
                    key={m}
                    href={cfg.href}
                    className="group bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"
                      style={{ background: `${corEmpresa}18`, color: corEmpresa }}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 leading-tight">{cfg.rotulo}</span>
                    <span className="text-[10px] text-slate-400 leading-tight hidden sm:block">{cfg.desc}</span>
                  </Link>
                )
              })}
          </div>
        </div>
      )}

      {/* ── Atalhos do sistema (apenas admin) ── */}
      {isAdmin && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Sistema</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icone: Building2,  rotulo: "Empresas",  href: "/painel/empresas",   desc: "Gerenciar clientes" },
              { icone: Users,      rotulo: "Usuários",  href: "/painel/usuarios",   desc: "Contas do sistema" },
              { icone: TrendingUp, rotulo: "Segurança", href: "/painel/seguranca",  desc: "Logs de auditoria" },
            ].map(item => {
              const Icon = item.icone
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 leading-tight">{item.rotulo}</span>
                  <span className="text-[10px] text-slate-400 hidden sm:block">{item.desc}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpis.map(card => (
          <CardKpi key={card.rotulo} {...card} />
        ))}
      </div>

      {/* ── Atividade recente ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Últimas Matrículas */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-slate-800 text-base">Últimas Matrículas</h2>
              <p className="text-xs text-slate-400 mt-0.5">Registros mais recentes</p>
            </div>
            <BookOpen size={16} className="text-slate-300" />
          </div>
          <div className="divide-y divide-slate-50">
            {ultimasMatriculas.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">Nenhuma matrícula ainda.</p>
            ) : (
              ultimasMatriculas.map(m => {
                const st = STATUS_MATRICULA[m.status] ?? STATUS_MATRICULA.ativa
                return (
                  <div key={m.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: `linear-gradient(135deg, ${corEmpresa}bb, ${corEmpresa})` }}
                    >
                      {m.aluno.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{m.aluno.nome}</p>
                      <p className="text-xs text-slate-400 truncate">{m.curso.nome}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>
                        {st.rotulo}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(m.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Últimas Baixas */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-slate-800 text-base">Últimas Baixas</h2>
              <p className="text-xs text-slate-400 mt-0.5">Movimentações financeiras</p>
            </div>
            <DollarSign size={16} className="text-slate-300" />
          </div>
          <div className="divide-y divide-slate-50">
            {ultimasBaixas.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">Nenhuma baixa ainda.</p>
            ) : (
              ultimasBaixas.map(b => {
                const st     = STATUS_BAIXA[b.status] ?? STATUS_BAIXA.pendente
                const Icone  = st.icone
                return (
                  <div key={b.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className={`shrink-0 ${st.cls}`}><Icone size={18} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {b.matricula?.aluno?.nome ?? b.descricao ?? "—"}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">{b.tipo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-800">
                        {Number(b.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(b.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente: card de KPI ───────────────────────────────────────────────────
function CardKpi({
  icone: Icone,
  rotulo,
  valor,
  sub,
  cor,
}: {
  icone:  typeof GraduationCap
  rotulo: string
  valor:  string
  sub:    string
  cor:    string
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 leading-snug">{rotulo}</span>
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${cor}`}>
          <Icone size={16} />
        </div>
      </div>
      <div className="font-serif text-2xl font-bold text-slate-900 mb-0.5 truncate">{valor}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  )
}
