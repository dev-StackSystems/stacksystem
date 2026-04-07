/**
 * prisma/seed.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Popula o banco com dados iniciais para desenvolvimento.
 *
 * Execução: npm run db:seed
 *
 * Cria:
 *   - 1 super admin da plataforma (sem empresa)
 *   - 2 empresas de exemplo
 *   - 3 usuários por empresa (admin, técnico, professor)
 *   - Cursos, módulos, aulas, alunos, matrículas, baixas e certificados
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient, PapelUsuario } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando seed...")

  const senhaHash = await bcrypt.hash("Admin@1234!", 12)

  // ── Super Admin (plataforma) ───────────────────────────────────────────────
  // Não vinculado a nenhuma empresa — acesso irrestrito
  const superAdmin = await prisma.usuario.upsert({
    where:  { email: "admin@stacksystems.com.br" },
    update: { superAdmin: true },
    create: {
      nome:       "Administrador da Plataforma",
      email:      "admin@stacksystems.com.br",
      senha:      senhaHash,
      papel:      PapelUsuario.A,
      superAdmin: true,
      ativo:      true,
    },
  })

  console.log("OK Super Admin")

  // ── Empresas ───────────────────────────────────────────────────────────────
  const emp1 = await prisma.empresa.upsert({
    where:  { cnpj: "12.345.678/0001-90" },
    update: {},
    create: {
      nome:        "Cursinho Ápice",
      cnpj:        "12.345.678/0001-90",
      email:       "contato@apice.com.br",
      telefone:    "(11) 99999-0001",
      tipoSistema: "cursinho",
      ativa:       true,
    },
  })

  const emp2 = await prisma.empresa.upsert({
    where:  { cnpj: "98.765.432/0001-10" },
    update: {},
    create: {
      nome:        "Instituto Vanguarda",
      cnpj:        "98.765.432/0001-10",
      email:       "contato@vanguarda.com.br",
      telefone:    "(11) 99999-0002",
      tipoSistema: "cursinho",
      ativa:       true,
    },
  })

  console.log("OK Empresas")

  // ── Usuários da empresa 1 ──────────────────────────────────────────────────
  await prisma.usuario.upsert({
    where:  { email: "admin@apice.com.br" },
    update: {},
    create: {
      nome:      "Admin Ápice",
      email:     "admin@apice.com.br",
      senha:     senhaHash,
      papel:     PapelUsuario.A,
      empresaId: emp1.id,
      ativo:     true,
    },
  })

  await prisma.usuario.upsert({
    where:  { email: "tecnico@apice.com.br" },
    update: {},
    create: {
      nome:      "Técnico Silva",
      email:     "tecnico@apice.com.br",
      senha:     senhaHash,
      papel:     PapelUsuario.T,
      empresaId: emp1.id,
      ativo:     true,
    },
  })

  await prisma.usuario.upsert({
    where:  { email: "professor@apice.com.br" },
    update: {},
    create: {
      nome:      "Prof. Ana Lima",
      email:     "professor@apice.com.br",
      senha:     senhaHash,
      papel:     PapelUsuario.F,
      empresaId: emp1.id,
      ativo:     true,
    },
  })

  console.log("OK Usuários")

  // ── Cursos ─────────────────────────────────────────────────────────────────
  const cursoEnem = await prisma.cursoDaEmpresa.create({
    data: {
      empresaId:    emp1.id,
      nome:         "ENEM 2025 — Extensivo",
      descricao:    "Preparação completa para o ENEM",
      cargaHoraria: 480,
      ativo:        true,
    },
  })

  const cursoMed = await prisma.cursoDaEmpresa.create({
    data: {
      empresaId:    emp1.id,
      nome:         "Medicina — Intensivo",
      descricao:    "Foco em FUVEST e UNICAMP",
      cargaHoraria: 360,
      ativo:        true,
    },
  })

  const cursoEng = await prisma.cursoDaEmpresa.create({
    data: {
      empresaId:    emp2.id,
      nome:         "Engenharia — Semestral",
      descricao:    "Vestibulares de exatas",
      cargaHoraria: 240,
      ativo:        true,
    },
  })

  console.log("OK Cursos")

  // ── Módulos e Aulas ────────────────────────────────────────────────────────
  const dadosCursos = [
    { curso: cursoEnem, modulos: ["Matemática", "Português", "Ciências da Natureza", "Ciências Humanas"] },
    { curso: cursoMed,  modulos: ["Biologia", "Química", "Física", "Redação"] },
    { curso: cursoEng,  modulos: ["Cálculo I", "Física Mecânica", "Álgebra Linear"] },
  ]

  for (const { curso, modulos } of dadosCursos) {
    for (let mi = 0; mi < modulos.length; mi++) {
      const modulo = await prisma.moduloCurso.create({
        data: {
          cursoId: curso.id,
          nome:    modulos[mi],
          ordem:   mi + 1,
          ativo:   true,
        },
      })

      // 4 aulas por módulo
      for (let ai = 1; ai <= 4; ai++) {
        await prisma.aula.create({
          data: {
            moduloId: modulo.id,
            nome:     `Aula ${ai} — ${modulos[mi]}`,
            tipo:     ai % 2 === 0 ? "video" : "online",
            duracao:  50 + ai * 10,
            ordem:    ai,
            ativa:    true,
          },
        })
      }
    }
  }

  console.log("OK Módulos e Aulas")

  // ── Alunos ─────────────────────────────────────────────────────────────────
  const dadosAlunosEmp1 = [
    { nome: "Lucas Ferreira",   email: "lucas@email.com",    cpf: "111.111.111-01" },
    { nome: "Mariana Costa",    email: "mariana@email.com",  cpf: "111.111.111-02" },
    { nome: "Pedro Alves",      email: "pedro@email.com",    cpf: "111.111.111-03" },
    { nome: "Gabriela Santos",  email: "gabriela@email.com", cpf: "111.111.111-04" },
    { nome: "Rafael Souza",     email: "rafael@email.com",   cpf: "111.111.111-05" },
    { nome: "Isabela Oliveira", email: "isabela@email.com",  cpf: "111.111.111-06" },
    { nome: "Thiago Pereira",   email: "thiago@email.com",   cpf: "111.111.111-07" },
    { nome: "Camila Rodrigues", email: "camila@email.com",   cpf: "111.111.111-08" },
    { nome: "Felipe Lima",      email: "felipe@email.com",   cpf: "111.111.111-09" },
    { nome: "Juliana Martins",  email: "juliana@email.com",  cpf: "111.111.111-10" },
  ]

  const dadosAlunosEmp2 = [
    { nome: "Bruno Carvalho", email: "bruno@email.com",   cpf: "111.111.111-11" },
    { nome: "Letícia Gomes",  email: "leticia@email.com", cpf: "111.111.111-12" },
  ]

  const alunosEmp1 = await Promise.all(
    dadosAlunosEmp1.map(a =>
      prisma.aluno.upsert({
        where:  { empresaId_email: { empresaId: emp1.id, email: a.email } },
        update: {},
        create: { ...a, empresaId: emp1.id, ativo: true },
      })
    )
  )

  const alunosEmp2 = await Promise.all(
    dadosAlunosEmp2.map(a =>
      prisma.aluno.upsert({
        where:  { empresaId_email: { empresaId: emp2.id, email: a.email } },
        update: {},
        create: { ...a, empresaId: emp2.id, ativo: true },
      })
    )
  )

  const alunos = [...alunosEmp1, ...alunosEmp2]

  console.log("OK Alunos")

  // ── Matrículas ─────────────────────────────────────────────────────────────
  const dadosMatriculas = [
    { aluno: alunos[0],  curso: cursoEnem, status: "ativa",     valor: 1200 },
    { aluno: alunos[1],  curso: cursoEnem, status: "ativa",     valor: 1200 },
    { aluno: alunos[2],  curso: cursoMed,  status: "ativa",     valor: 1800 },
    { aluno: alunos[3],  curso: cursoMed,  status: "concluida", valor: 1800 },
    { aluno: alunos[4],  curso: cursoEnem, status: "ativa",     valor: 950  },
    { aluno: alunos[5],  curso: cursoEnem, status: "ativa",     valor: 1200 },
    { aluno: alunos[6],  curso: cursoMed,  status: "cancelada", valor: 1800 },
    { aluno: alunos[7],  curso: cursoEnem, status: "ativa",     valor: 950  },
    { aluno: alunos[8],  curso: cursoEnem, status: "concluida", valor: 1200 },
    { aluno: alunos[9],  curso: cursoMed,  status: "ativa",     valor: 1800 },
    { aluno: alunos[10], curso: cursoEng,  status: "ativa",     valor: 950  },
    { aluno: alunos[11], curso: cursoEng,  status: "ativa",     valor: 1200 },
  ]

  const matriculas = await Promise.all(
    dadosMatriculas.map(m =>
      prisma.matricula.create({
        data: {
          alunoId: m.aluno.id,
          cursoId: m.curso.id,
          status:  m.status,
          valor:   m.valor,
          dataFim: m.status === "concluida" ? new Date() : null,
        },
      })
    )
  )

  console.log("OK Matrículas")

  // ── Baixas (financeiro) ────────────────────────────────────────────────────
  const hoje = new Date()
  const dadosBaixas = [
    { mat: matriculas[0],  valor: 400,  status: "pago",     tipo: "mensalidade" },
    { mat: matriculas[1],  valor: 400,  status: "pago",     tipo: "mensalidade" },
    { mat: matriculas[2],  valor: 600,  status: "pago",     tipo: "mensalidade" },
    { mat: matriculas[3],  valor: 1800, status: "pago",     tipo: "matricula"   },
    { mat: matriculas[4],  valor: 320,  status: "pago",     tipo: "mensalidade" },
    { mat: matriculas[5],  valor: 400,  status: "pendente", tipo: "mensalidade" },
    { mat: matriculas[7],  valor: 320,  status: "pendente", tipo: "mensalidade" },
    { mat: matriculas[8],  valor: 1200, status: "pago",     tipo: "matricula"   },
    { mat: matriculas[9],  valor: 600,  status: "pago",     tipo: "mensalidade" },
    { mat: matriculas[10], valor: 320,  status: "pago",     tipo: "mensalidade" },
    { mat: matriculas[11], valor: 400,  status: "pendente", tipo: "mensalidade" },
  ]

  await Promise.all(
    dadosBaixas.map((b, i) =>
      prisma.baixa.create({
        data: {
          matriculaId:    b.mat.id,
          descricao:      `${b.tipo === "matricula" ? "Taxa de matrícula" : "Mensalidade"} — ${b.mat.id.slice(-4)}`,
          valor:          b.valor,
          tipo:           b.tipo,
          status:         b.status,
          dataPagamento:  b.status === "pago" ? new Date(hoje.getTime() - i * 86400000) : null,
          dataVencimento: new Date(hoje.getTime() + (7 - i) * 86400000),
        },
      })
    )
  )

  console.log("OK Baixas")

  // ── Certificados ───────────────────────────────────────────────────────────
  await prisma.certificado.createMany({
    data: [
      { alunoId: alunos[3].id, cursoId: cursoMed.id  },
      { alunoId: alunos[8].id, cursoId: cursoEnem.id },
    ],
  })

  console.log("OK Certificados")

  // ── Log de segurança inicial ───────────────────────────────────────────────
  await prisma.segurancaUsuario.create({
    data: {
      usuarioId: superAdmin.id,
      acao:      "seed",
      detalhes:  "Banco de dados inicializado com dados de exemplo",
      ip:        "127.0.0.1",
    },
  })

  console.log("OK Segurança")
  console.log("\nSeed concluído com sucesso!")
  console.log("   Super Admin : admin@stacksystems.com.br / Admin@1234!")
  console.log("   Admin Ápice : admin@apice.com.br       / Admin@1234!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
