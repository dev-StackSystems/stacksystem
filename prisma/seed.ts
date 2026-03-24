import { PrismaClient, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed...")

  // ── Usuários internos ────────────────────────────────────
  const adminPass = await bcrypt.hash("Admin@1234!", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@stacksystems.com.br" },
    update: {},
    create: { name: "Administrador", email: "admin@stacksystems.com.br", password: adminPass, role: UserRole.A, department: "TI", active: true },
  })

  await prisma.user.upsert({
    where: { email: "tecnico@stacksystems.com.br" },
    update: {},
    create: { name: "Técnico Silva", email: "tecnico@stacksystems.com.br", password: adminPass, role: UserRole.T, department: "Suporte", active: true },
  })

  await prisma.user.upsert({
    where: { email: "professor@stacksystems.com.br" },
    update: {},
    create: { name: "Prof. Ana Lima", email: "professor@stacksystems.com.br", password: adminPass, role: UserRole.F, department: "Exatas", active: true },
  })

  console.log("✓ Usuários internos")

  // ── Empresas ────────────────────────────────────────────
  const emp1 = await prisma.empresa.upsert({
    where: { cnpj: "12.345.678/0001-90" },
    update: {},
    create: { nome: "Cursinho Ápice", cnpj: "12.345.678/0001-90", email: "contato@apice.com.br", telefone: "(11) 99999-0001", ativa: true },
  })

  const emp2 = await prisma.empresa.upsert({
    where: { cnpj: "98.765.432/0001-10" },
    update: {},
    create: { nome: "Instituto Vanguarda", cnpj: "98.765.432/0001-10", email: "contato@vanguarda.com.br", telefone: "(11) 99999-0002", ativa: true },
  })

  console.log("✓ Empresas")

  // ── Cursos ──────────────────────────────────────────────
  const cursoEnem = await prisma.empCurso.create({
    data: { empresaId: emp1.id, nome: "ENEM 2025 — Extensivo", descricao: "Preparação completa para o ENEM", cargaHoraria: 480, ativo: true },
  })

  const cursoMed = await prisma.empCurso.create({
    data: { empresaId: emp1.id, nome: "Medicina — Intensivo", descricao: "Foco em FUVEST e UNICAMP", cargaHoraria: 360, ativo: true },
  })

  const cursoEng = await prisma.empCurso.create({
    data: { empresaId: emp2.id, nome: "Engenharia — Semestral", descricao: "Vestibulares de exatas", cargaHoraria: 240, ativo: true },
  })

  console.log("✓ Cursos")

  // ── Módulos e Aulas ─────────────────────────────────────
  for (const [curso, modNomes] of [
    [cursoEnem, ["Matemática", "Português", "Ciências da Natureza", "Ciências Humanas"]],
    [cursoMed,  ["Biologia", "Química", "Física", "Redação"]],
    [cursoEng,  ["Cálculo I", "Física Mecânica", "Álgebra Linear"]],
  ] as const) {
    for (let mi = 0; mi < modNomes.length; mi++) {
      const modulo = await prisma.modulo.create({
        data: { empCursoId: (curso as { id: string }).id, nome: modNomes[mi], ordem: mi + 1, ativo: true },
      })
      for (let ai = 1; ai <= 4; ai++) {
        await prisma.aula.create({
          data: {
            moduloId: modulo.id,
            nome: `Aula ${ai} — ${modNomes[mi]}`,
            tipo: ai % 2 === 0 ? "video" : "online",
            duracao: 50 + ai * 10,
            ordem: ai,
            ativa: true,
          },
        })
      }
    }
  }

  console.log("✓ Módulos e Aulas")

  // ── Alunos ──────────────────────────────────────────────
  const alunosData = [
    { nome: "Lucas Ferreira",    email: "lucas@email.com",    cpf: "111.111.111-01" },
    { nome: "Mariana Costa",     email: "mariana@email.com",  cpf: "111.111.111-02" },
    { nome: "Pedro Alves",       email: "pedro@email.com",    cpf: "111.111.111-03" },
    { nome: "Gabriela Santos",   email: "gabriela@email.com", cpf: "111.111.111-04" },
    { nome: "Rafael Souza",      email: "rafael@email.com",   cpf: "111.111.111-05" },
    { nome: "Isabela Oliveira",  email: "isabela@email.com",  cpf: "111.111.111-06" },
    { nome: "Thiago Pereira",    email: "thiago@email.com",   cpf: "111.111.111-07" },
    { nome: "Camila Rodrigues",  email: "camila@email.com",   cpf: "111.111.111-08" },
    { nome: "Felipe Lima",       email: "felipe@email.com",   cpf: "111.111.111-09" },
    { nome: "Juliana Martins",   email: "juliana@email.com",  cpf: "111.111.111-10" },
    { nome: "Bruno Carvalho",    email: "bruno@email.com",    cpf: "111.111.111-11" },
    { nome: "Letícia Gomes",     email: "leticia@email.com",  cpf: "111.111.111-12" },
  ]

  const alunos = await Promise.all(
    alunosData.map(a =>
      prisma.aluno.upsert({ where: { email: a.email }, update: {}, create: { ...a, ativo: true } })
    )
  )

  console.log("✓ Alunos")

  // ── Matrículas ──────────────────────────────────────────
  const matriculasData = [
    { aluno: alunos[0],  curso: cursoEnem, status: "ativa",     valor: 1200 },
    { aluno: alunos[1],  curso: cursoEnem, status: "ativa",     valor: 1200 },
    { aluno: alunos[2],  curso: cursoMed,  status: "ativa",     valor: 1800 },
    { aluno: alunos[3],  curso: cursoMed,  status: "concluida", valor: 1800 },
    { aluno: alunos[4],  curso: cursoEng,  status: "ativa",     valor: 950  },
    { aluno: alunos[5],  curso: cursoEnem, status: "ativa",     valor: 1200 },
    { aluno: alunos[6],  curso: cursoMed,  status: "cancelada", valor: 1800 },
    { aluno: alunos[7],  curso: cursoEng,  status: "ativa",     valor: 950  },
    { aluno: alunos[8],  curso: cursoEnem, status: "concluida", valor: 1200 },
    { aluno: alunos[9],  curso: cursoMed,  status: "ativa",     valor: 1800 },
    { aluno: alunos[10], curso: cursoEng,  status: "ativa",     valor: 950  },
    { aluno: alunos[11], curso: cursoEnem, status: "ativa",     valor: 1200 },
  ]

  const matriculas = await Promise.all(
    matriculasData.map(m =>
      prisma.matricula.create({
        data: {
          alunoId: m.aluno.id,
          empCursoId: m.curso.id,
          status: m.status,
          valor: m.valor,
          dataFim: m.status === "concluida" ? new Date() : null,
        },
      })
    )
  )

  console.log("✓ Matrículas")

  // ── Baixas ──────────────────────────────────────────────
  const hoje = new Date()
  const baixasData = [
    { mat: matriculas[0], valor: 400,  status: "pago",     tipo: "mensalidade" },
    { mat: matriculas[1], valor: 400,  status: "pago",     tipo: "mensalidade" },
    { mat: matriculas[2], valor: 600,  status: "pago",     tipo: "mensalidade" },
    { mat: matriculas[3], valor: 1800, status: "pago",     tipo: "matricula"   },
    { mat: matriculas[4], valor: 320,  status: "pago",     tipo: "mensalidade" },
    { mat: matriculas[5], valor: 400,  status: "pendente", tipo: "mensalidade" },
    { mat: matriculas[7], valor: 320,  status: "pendente", tipo: "mensalidade" },
    { mat: matriculas[8], valor: 1200, status: "pago",     tipo: "matricula"   },
    { mat: matriculas[9], valor: 600,  status: "pago",     tipo: "mensalidade" },
    { mat: matriculas[10],valor: 320,  status: "pago",     tipo: "mensalidade" },
    { mat: matriculas[11],valor: 400,  status: "pendente", tipo: "mensalidade" },
  ]

  await Promise.all(
    baixasData.map((b, i) =>
      prisma.baixa.create({
        data: {
          matriculaId: b.mat.id,
          descricao: `${b.tipo === "matricula" ? "Taxa de matrícula" : "Mensalidade"} — ${b.mat.id.slice(-4)}`,
          valor: b.valor,
          tipo: b.tipo,
          status: b.status,
          dataPag: b.status === "pago" ? new Date(hoje.getTime() - i * 86400000) : null,
          dataVenc: new Date(hoje.getTime() + (7 - i) * 86400000),
        },
      })
    )
  )

  console.log("✓ Baixas")

  // ── Certificados ────────────────────────────────────────
  await prisma.certificado.createMany({
    data: [
      { alunoId: alunos[3].id, empCursoId: cursoMed.id },
      { alunoId: alunos[8].id, empCursoId: cursoEnem.id },
    ],
  })

  console.log("✓ Certificados")

  // ── Log de segurança ────────────────────────────────────
  await prisma.segurancaUser.create({
    data: { userId: admin.id, acao: "login", detalhes: "Primeiro acesso ao sistema", ip: "127.0.0.1" },
  })

  console.log("✓ Segurança")
  console.log("\n✅ Seed concluído com sucesso!")
  console.log("   Login: admin@stacksystems.com.br / Admin@1234!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
