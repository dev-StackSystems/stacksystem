# Módulo: Cursinho

Sistema de gestão para cursinhos pré-vestibulares.

## Rotas (app/painel/)

| Rota                      | Descrição                        |
|---------------------------|----------------------------------|
| `/painel`                 | Dashboard com KPIs               |
| `/painel/alunos`          | Cadastro e ficha de alunos       |
| `/painel/matriculas`      | Matrículas e turmas              |
| `/painel/cursos`          | Catálogo de cursos               |
| `/painel/baixas`          | Financeiro / baixas              |
| `/painel/certificados`    | Emissão de certificados          |
| `/painel/salas`           | Salas de aula / video            |
| `/painel/usuarios`        | Gestão de usuários               |
| `/painel/grupos`          | Grupos e permissões              |
| `/painel/setores`         | Setores da empresa               |
| `/painel/configuracoes`   | Configurações da empresa         |

## Módulos ativos

Controlados via `modulos_ativos` na tabela `empresas` (campo JSON).
Cada módulo pode ser ligado/desligado por empresa (multi-tenant).

Módulos disponíveis: `alunos`, `matriculas`, `cursos`, `baixas`, `certificados`, `salas`
