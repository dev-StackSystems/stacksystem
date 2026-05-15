import { describe, it, expect } from "vitest"
import { TIPOS_SISTEMA, MODULOS_DISPONIVEIS } from "./system"

describe("TIPOS_SISTEMA", () => {
  it("contém 5 tipos", () => {
    expect(TIPOS_SISTEMA).toHaveLength(5)
  })

  it("cada tipo tem key, label, descricao e modulos", () => {
    for (const tipo of TIPOS_SISTEMA) {
      expect(tipo).toHaveProperty("key")
      expect(tipo).toHaveProperty("label")
      expect(tipo).toHaveProperty("descricao")
      expect(Array.isArray(tipo.modulos)).toBe(true)
    }
  })

  it("tipo 'personalizado' começa sem módulos", () => {
    const personalizado = TIPOS_SISTEMA.find(t => t.key === "personalizado")
    expect(personalizado?.modulos).toHaveLength(0)
  })

  it("tipo 'escola' inclui certificados e baixas", () => {
    const escola = TIPOS_SISTEMA.find(t => t.key === "escola")
    expect(escola?.modulos).toContain("certificados")
    expect(escola?.modulos).toContain("baixas")
  })

  it("todos os módulos referenciados existem em MODULOS_DISPONIVEIS", () => {
    const chavesDisponiveis = MODULOS_DISPONIVEIS.map(m => m.key)
    for (const tipo of TIPOS_SISTEMA) {
      for (const modulo of tipo.modulos) {
        expect(chavesDisponiveis).toContain(modulo)
      }
    }
  })
})

describe("MODULOS_DISPONIVEIS", () => {
  it("contém 7 módulos", () => {
    expect(MODULOS_DISPONIVEIS).toHaveLength(7)
  })

  it("cada módulo tem key, label e grupo", () => {
    for (const modulo of MODULOS_DISPONIVEIS) {
      expect(modulo).toHaveProperty("key")
      expect(modulo).toHaveProperty("label")
      expect(modulo).toHaveProperty("grupo")
    }
  })

  it("não há chaves duplicadas", () => {
    const chaves = MODULOS_DISPONIVEIS.map(m => m.key)
    const unicas = new Set(chaves)
    expect(unicas.size).toBe(chaves.length)
  })

  it("grupos são apenas Acadêmico, Conteúdo ou Financeiro", () => {
    const gruposValidos = new Set(["Acadêmico", "Conteúdo", "Financeiro"])
    for (const modulo of MODULOS_DISPONIVEIS) {
      expect(gruposValidos.has(modulo.grupo)).toBe(true)
    }
  })
})
