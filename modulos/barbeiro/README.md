# Módulo: Barbearia

Sistema de gestão para barbearias e salões masculinos.

## Protótipo

`index.html` — protótipo completo em HTML/CSS/JS puro com dados mockados.
Servido em: `/modulos/barbeiro/index.html`

## Funcionalidades (protótipo)

- **Dashboard** — resumo do dia (agendamentos, receita, clientes, fila)
- **Agenda** — visualização de horários por barbeiro
- **Fila** — atendimento walk-in (sem agendamento)
- **Clientes** — cadastro com histórico de visitas
- **Serviços** — catálogo de cortes e preços
- **Barbeiros** — equipe e especialidades
- **Financeiro** — resumo de entradas por período

## Rotas (quando integrado ao painel)

| Rota                          | Descrição              |
|-------------------------------|------------------------|
| `/painel/modulos/barbeiro`    | Iframe do protótipo    |

## Para integrar ao banco

Tabelas necessárias:
- `barbeiros` — equipe
- `clientes_barbearia` — clientes
- `servicos_barbearia` — catálogo
- `agendamentos` — agenda
- `fila_espera` — walk-ins
- `atendimentos` — histórico / financeiro
