import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("retorna string vazia sem argumentos", () => {
    expect(cn()).toBe("")
  })

  it("combina classes simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("ignora valores falsy", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar")
  })

  it("resolve conflitos do Tailwind mantendo a última classe", () => {
    expect(cn("p-4", "p-8")).toBe("p-8")
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })

  it("aceita objetos condicionais", () => {
    expect(cn({ "font-bold": true, "italic": false })).toBe("font-bold")
  })

  it("aceita arrays de classes", () => {
    expect(cn(["flex", "items-center"])).toBe("flex items-center")
  })

  it("combina objeto e string na mesma chamada", () => {
    const ativo = true
    expect(cn("px-4", { "bg-orange-500": ativo, "bg-slate-200": !ativo })).toBe("px-4 bg-orange-500")
  })
})
