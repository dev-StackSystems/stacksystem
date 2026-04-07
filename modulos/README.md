# modulos/

Cada diretório aqui representa um **sistema/vertical** que o StackSystems suporta.
Inspirado na estrutura `modules/` do i3 SCMWeb.

## Convenção

```
modulos/
├── {nome_sistema}/
│   ├── README.md        — Descrição, rotas e requisitos do sistema
│   └── index.html       — Protótipo HTML/CSS/JS (para sistemas standalone)
```

Para sistemas integrados ao painel Next.js, as páginas ficam em `app/painel/`
e o módulo aqui serve como documentação e ponto de entrada.

## Sistemas disponíveis

| Diretório    | Sistema          | Status        | Painel                        |
|--------------|------------------|---------------|-------------------------------|
| `cursinho/`  | Sistema Cursinho | Produção      | `/painel/*`                   |
| `barbeiro/`  | Sistema Barbearia| Protótipo     | `/modulos/barbeiro/index.html`|

## Adicionar novo sistema

1. Criar `modulos/{nome}/`
2. Colocar o protótipo em `modulos/{nome}/index.html`
3. Copiar para `public/modulos/{nome}/index.html` para servir via Next.js
4. Criar `app/painel/modulos/{nome}/page.tsx` com iframe wrapper
5. Adicionar entrada na tabela acima
