/**
 * lib/ia.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Camada de inteligência artificial do StackSystems.
 *
 * `analisarFinancas()` recebe os indicadores agregados do mês (renda, gastos,
 * divisão essencial/lazer/investimento, categorias) e devolve um resumo em
 * linguagem natural com recomendações práticas.
 *
 * Ordem de provedores (usa o primeiro cuja chave existir):
 *   1. Google Gemini  — GEMINI_API_KEY  (tier gratuito; grátis em aistudio.google.com)
 *   2. Claude          — ANTHROPIC_API_KEY (paga; modelo claude-opus-4-8)
 *   3. Análise determinística local — sempre disponível, sem chave nenhuma.
 *
 * Opcional: GEMINI_MODEL (padrão "gemini-2.5-flash").
 * Qualquer falha de rede/HTTP cai para o próximo provedor / fallback local.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Anthropic from "@anthropic-ai/sdk"

export interface Transacao {
  data: string          // AAAA-MM-DD
  tipo: string          // receita | despesa
  descricao: string
  valor: number
  categoria: string | null
  classe: string | null // essencial | lazer | investimento | neutro
  contato: string | null
}

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
  transacoes?: Transacao[]     // lançamentos crus do mês (para análise item a item)
  transacoesOmitidas?: number  // quantos lançamentos ficaram de fora do envio
}

export interface ResultadoAnalise {
  texto: string
  fonte: "ia" | "local"
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const pct = (v: number) => `${Math.round(v * 100)}%`

const SISTEMA =
  "Você é um consultor financeiro pessoal brasileiro: direto, honesto e prático — como um amigo que entende de dinheiro e não passa a mão na cabeça. " +
  "Você recebe os LANÇAMENTOS REAIS do mês (data, tipo, descrição, valor, categoria, classe e contato), além dos totais. " +
  "Leia item a item, não apenas os totais: entenda no que a pessoa realmente gastou, identifique padrões, assinaturas/recorrências, " +
  "gastos que chamam atenção, possíveis exageros ou desperdícios — e também elogie o que está saudável. " +
  "Dê conselhos, críticas construtivas e sugestões ESPECÍFICAS, citando descrições e valores reais dos lançamentos (ex.: 'os R$ 320 em iFood'). " +
  "Escreva em português do Brasil, com markdown simples: **negrito** para destaques e listas com hífen (-). NÃO use tabelas nem títulos com #. " +
  "Estruture em quatro blocos, cada um começando com um subtítulo em negrito: " +
  "**Diagnóstico** (1-2 frases sobre o mês), " +
  "**Seus gastos em detalhe** (comente lançamentos específicos pelo nome e valor, o essencial x lazer, recorrências), " +
  "**Onde dá pra melhorar** (críticas francas e onde economizar) e " +
  "**Recomendações** (2 a 4 ações objetivas). " +
  "Cite apenas números que recebeu; nunca invente valores. Seja específico, evite jargão e frases genéricas. Máximo de aproximadamente 320 palavras."

function promptUsuario(d: DadosResumo): string {
  const transacoes = (d.transacoes ?? []).map((t) => ({
    data: t.data,
    tipo: t.tipo,
    descricao: t.descricao,
    valor: t.valor,
    categoria: t.categoria ?? undefined,
    classe: t.classe ?? undefined,
    de_para: t.contato ?? undefined,
  }))
  return (
    `Contexto: gestão ${d.gestao === "PF" ? "pessoal (pessoa física)" : "empresarial (pessoa jurídica)"}, mês de referência ${d.mesLabel}.\n\n` +
    "Totais do mês (valores em reais):\n" +
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
    "\n```\n\n" +
    `Lançamentos do mês${d.transacoesOmitidas ? ` (mostrando os ${transacoes.length} maiores; +${d.transacoesOmitidas} menores omitidos)` : ""}:\n` +
    "```json\n" +
    JSON.stringify(transacoes, null, 2) +
    "\n```\n\nAnalise os lançamentos acima e escreva o resumo seguindo exatamente a estrutura pedida."
  )
}

export async function analisarFinancas(d: DadosResumo): Promise<ResultadoAnalise> {
  // 1. Google Gemini (tier gratuito) — preferido quando GEMINI_API_KEY existe
  if (process.env.GEMINI_API_KEY) {
    const t = await tentarGemini(d)
    if (t) return { texto: t, fonte: "ia" }
  }
  // 2. Claude (paga) — se ANTHROPIC_API_KEY existir
  if (process.env.ANTHROPIC_API_KEY) {
    const t = await tentarClaude(d)
    if (t) return { texto: t, fonte: "ia" }
  }
  // 3. Análise determinística local — sempre disponível
  return { texto: analiseLocal(d), fonte: "local" }
}

/** Google Gemini via REST (sem SDK). Retorna null em qualquer falha para cair no próximo provedor. */
async function tentarGemini(d: DadosResumo): Promise<string | null> {
  try {
    const modelo = process.env.GEMINI_MODEL || "gemini-2.5-flash"
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SISTEMA }] },
          contents: [{ role: "user", parts: [{ text: promptUsuario(d) }] }],
          // thinkingBudget: 0 evita que o "pensamento" do 2.5 consuma o orçamento e devolva texto vazio
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
        }),
      },
    )
    if (!res.ok) {
      console.error("[ia] Gemini HTTP", res.status, await res.text().catch(() => ""))
      return null
    }
    const json = await res.json()
    const partes: { text?: string }[] = json?.candidates?.[0]?.content?.parts ?? []
    const texto = partes.map((p) => p.text ?? "").join("").trim()
    return texto || null
  } catch (e) {
    console.error("[ia] Gemini falhou:", e)
    return null
  }
}

/** Claude via SDK oficial (@anthropic-ai/sdk). */
async function tentarClaude(d: DadosResumo): Promise<string | null> {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const resposta = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      system: SISTEMA,
      messages: [{ role: "user", content: promptUsuario(d) }],
    })
    const texto = resposta.content.map((b) => (b.type === "text" ? b.text : "")).join("\n").trim()
    return texto || null
  } catch (e) {
    console.error("[ia] Claude falhou:", e)
    return null
  }
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

  // Seus gastos em detalhe — maiores lançamentos individuais
  const despTransacoes = (d.transacoes ?? [])
    .filter((t) => t.tipo === "despesa")
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 4)
  if (despTransacoes.length > 0) {
    const det = ["**Seus gastos em detalhe**"]
    for (const t of despTransacoes) det.push(`- ${t.descricao} — ${brl(t.valor)}${t.categoria ? ` (${t.categoria})` : ""}`)
    linhas.push(det.join("\n"))
  }

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
