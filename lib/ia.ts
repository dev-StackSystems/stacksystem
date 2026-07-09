/**
 * lib/ia.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Camada de inteligência artificial do StackSystems.
 *
 * `analisarFinancas()` recebe os indicadores agregados do mês (renda, gastos,
 * divisão essencial/lazer/investimento, categorias) e devolve um resumo em
 * linguagem natural com recomendações práticas.
 *
 * Usa a API da Claude (modelo claude-opus-4-8) quando a variável de ambiente
 * ANTHROPIC_API_KEY está configurada. Sem a chave — ou em caso de erro — cai
 * automaticamente em uma análise determinística local, para o recurso nunca
 * ficar indisponível.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Anthropic from "@anthropic-ai/sdk"

export interface DadosResumo {
  mesLabel: string
  gestao: "PF" | "PJ"
  receitas: number
  despesas: number
  sobra: number
  taxaPoupanca: number // 0..1
  porClasse: { essencial: number; lazer: number; investimento: number; neutro: number }
  topCategorias: { nome: string; valor: number }[]
  mesAnterior?: { despesas: number; sobra: number } | null
}

export interface ResultadoAnalise {
  texto: string
  fonte: "ia" | "local"
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const pct = (v: number) => `${Math.round(v * 100)}%`

const SISTEMA =
  "Você é um consultor financeiro pessoal brasileiro: direto, acolhedor e prático. " +
  "Analise os dados reais do mês que o usuário enviar (em JSON) e escreva um resumo em português do Brasil. " +
  "Use markdown simples: **negrito** para destaques e listas com hífen (-). NÃO use tabelas nem títulos com #. " +
  "Estruture em quatro blocos curtos, cada um começando com um subtítulo em negrito: " +
  "**Diagnóstico** (1-2 frases sobre o mês), **Para onde foi o dinheiro** (comente a divisão essencial x lazer x investimento), " +
  "**Pontos de atenção** e **Recomendações** (2 a 4 ações objetivas). " +
  "Cite os números reais (em reais) que recebeu; nunca invente valores. " +
  "Seja específico, evite jargão e frases genéricas. Máximo de aproximadamente 230 palavras."

function promptUsuario(d: DadosResumo): string {
  return (
    `Contexto: gestão ${d.gestao === "PF" ? "pessoal (pessoa física)" : "empresarial (pessoa jurídica)"}, mês de referência ${d.mesLabel}.\n\n` +
    "Dados do mês (valores em reais):\n" +
    "```json\n" +
    JSON.stringify(
      {
        receitas: d.receitas,
        despesas: d.despesas,
        sobra: d.sobra,
        taxaPoupanca: d.taxaPoupanca,
        gastosPorClasse: d.porClasse,
        principaisCategoriasDeGasto: d.topCategorias,
        mesAnterior: d.mesAnterior ?? undefined,
      },
      null,
      2,
    ) +
    "\n```\n\nEscreva o resumo do mês seguindo exatamente a estrutura pedida."
  )
}

export async function analisarFinancas(d: DadosResumo): Promise<ResultadoAnalise> {
  const chave = process.env.ANTHROPIC_API_KEY
  if (chave) {
    try {
      const client = new Anthropic({ apiKey: chave })
      const resposta = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 1400,
        system: SISTEMA,
        messages: [{ role: "user", content: promptUsuario(d) }],
      })
      const texto = resposta.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("\n")
        .trim()
      if (texto) return { texto, fonte: "ia" }
    } catch (e) {
      console.error("[ia] Falha ao chamar a Claude, usando análise local:", e)
    }
  }
  return { texto: analiseLocal(d), fonte: "local" }
}

/** Análise determinística — usada quando não há chave de API ou a chamada falha. */
function analiseLocal(d: DadosResumo): string {
  const linhas: string[] = []
  const essencialPct = d.despesas > 0 ? d.porClasse.essencial / d.despesas : 0
  const lazerPct = d.despesas > 0 ? d.porClasse.lazer / d.despesas : 0

  // Diagnóstico
  const diag =
    d.receitas === 0
      ? "Você ainda não registrou receitas neste mês — comece cadastrando seu salário ou renda para o resumo fazer sentido."
      : d.sobra >= 0
        ? `Mês positivo: você recebeu ${brl(d.receitas)}, gastou ${brl(d.despesas)} e **sobrou ${brl(d.sobra)}** (poupança de ${pct(d.taxaPoupanca)}).`
        : `Atenção: os gastos (${brl(d.despesas)}) superaram a renda (${brl(d.receitas)}), fechando o mês **${brl(d.sobra)}** no vermelho.`
  linhas.push(`**Diagnóstico**\n${diag}`)

  // Para onde foi o dinheiro
  const onde: string[] = ["**Para onde foi o dinheiro**"]
  if (d.despesas > 0) {
    onde.push(`- Essenciais: ${brl(d.porClasse.essencial)} (${pct(essencialPct)})`)
    onde.push(`- Lazer: ${brl(d.porClasse.lazer)} (${pct(lazerPct)})`)
    if (d.porClasse.investimento > 0) onde.push(`- Investimentos: ${brl(d.porClasse.investimento)}`)
    if (d.porClasse.neutro > 0) onde.push(`- Não classificado: ${brl(d.porClasse.neutro)}`)
  } else {
    onde.push("- Nenhuma despesa registrada no período.")
  }
  linhas.push(onde.join("\n"))

  // Pontos de atenção
  const aten: string[] = ["**Pontos de atenção**"]
  if (lazerPct > 0.3) aten.push(`- Lazer representa ${pct(lazerPct)} dos gastos — acima dos 30% recomendados.`)
  if (d.taxaPoupanca < 0.1 && d.receitas > 0) aten.push("- Sua taxa de poupança está abaixo de 10%; tente reservar mais.")
  if (d.mesAnterior && d.despesas > d.mesAnterior.despesas)
    aten.push(`- Gastou ${brl(d.despesas - d.mesAnterior.despesas)} a mais que no mês anterior.`)
  if (d.topCategorias[0]) aten.push(`- Maior gasto: **${d.topCategorias[0].nome}** (${brl(d.topCategorias[0].valor)}).`)
  if (aten.length === 1) aten.push("- Nenhum alerta relevante — continue assim! 👏")
  linhas.push(aten.join("\n"))

  // Recomendações
  const rec: string[] = ["**Recomendações**"]
  if (d.sobra < 0) rec.push("- Corte gastos de lazer até equilibrar renda e despesas.")
  if (d.porClasse.investimento === 0 && d.sobra > 0) rec.push("- Direcione parte da sobra para investimentos/reserva.")
  if (lazerPct > 0.3) rec.push("- Defina um teto mensal para as categorias de lazer.")
  if (d.taxaPoupanca >= 0.2) rec.push("- Ótima poupança: considere metas de médio prazo com o excedente.")
  if (rec.length === 1) rec.push("- Mantenha o registro em dia para acompanhar a evolução mês a mês.")
  linhas.push(rec.join("\n"))

  return linhas.join("\n\n")
}
