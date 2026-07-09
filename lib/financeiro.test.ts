import { describe, it, expect } from "vitest"
import { limparDocumento, documentoValido, formatarDocumento, proximaData } from "./financeiro"
import { paletaBrand } from "./tema"

describe("limparDocumento", () => {
  it("remove tudo que não for dígito", () => {
    expect(limparDocumento("123.456.789-00")).toBe("12345678900")
    expect(limparDocumento("12.345.678/0001-90")).toBe("12345678000190")
    expect(limparDocumento(null)).toBe("")
  })
})

describe("documentoValido", () => {
  it("aceita CPF com 11 dígitos e CNPJ com 14", () => {
    expect(documentoValido("PF", "123.456.789-00")).toBe(true)
    expect(documentoValido("PJ", "12.345.678/0001-90")).toBe(true)
  })
  it("permite documento vazio (opcional)", () => {
    expect(documentoValido("PF", "")).toBe(true)
    expect(documentoValido("PJ", null)).toBe(true)
  })
  it("rejeita comprimentos incorretos", () => {
    expect(documentoValido("PF", "123")).toBe(false)
    expect(documentoValido("PJ", "12345678900")).toBe(false)
  })
})

describe("formatarDocumento", () => {
  it("aplica máscara de CPF", () => {
    expect(formatarDocumento("PF", "12345678900")).toBe("123.456.789-00")
  })
  it("aplica máscara de CNPJ", () => {
    expect(formatarDocumento("PJ", "12345678000190")).toBe("12.345.678/0001-90")
  })
})

describe("proximaData", () => {
  it("índice 0 retorna a própria data base", () => {
    const base = new Date(2026, 0, 15)
    expect(proximaData(base, "mensal", 0).getTime()).toBe(base.getTime())
  })
  it("avança meses corretamente", () => {
    const base = new Date(2026, 0, 15)
    const d = proximaData(base, "mensal", 3)
    expect(d.getMonth()).toBe(3) // abril
  })
  it("avança semanas corretamente", () => {
    const base = new Date(2026, 0, 1)
    const d = proximaData(base, "semanal", 2)
    expect(d.getDate()).toBe(15)
  })
})

describe("paletaBrand", () => {
  it("gera as 11 variáveis de tom", () => {
    const p = paletaBrand("#f97316") as Record<string, string>
    expect(p["--brand-500"]).toBe("249 115 22")
    expect(Object.keys(p)).toHaveLength(11)
  })
  it("usa o laranja padrão quando o hex é inválido", () => {
    const p = paletaBrand("xyz") as Record<string, string>
    expect(p["--brand-500"]).toBe("249 115 22")
  })
  it("respeita uma cor customizada no tom 500", () => {
    const p = paletaBrand("#3b82f6") as Record<string, string>
    expect(p["--brand-500"]).toBe("59 130 246")
  })
})
