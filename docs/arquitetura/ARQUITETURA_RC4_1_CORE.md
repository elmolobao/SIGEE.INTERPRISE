# SIGEE Enterprise RC4.1 — Consolidação do Core

## Escopo
A sprint consolida somente sessão, autenticação e permissões. Nenhuma função de processos, escolas, usuários, dashboard ou workflow operacional foi deliberadamente alterada.

## Alterações
- Criado `frontend/js/core/session.js` como fonte única da sessão autenticada.
- Reescrito `auth.js`, removendo normalizadores duplicados e o `setInterval` de primeiro acesso.
- Reescrito `permissoes.js`, removendo duas matrizes concorrentes, `MutationObserver`, múltiplos `setTimeout` e CSS injetado por perfil.
- Perfis oficiais: Master, SEC, Gestor, Administrador, Técnico, Estagiário e Consulta.
- Mantidas APIs globais de compatibilidade para os módulos legados.

## Arquivos alterados
- `frontend/index.html`
- `frontend/js/core/session.js` (novo)
- `frontend/js/core/auth.js`
- `frontend/js/core/permissoes.js`

## Não alterado
- motor temporal e workflow declarativo;
- `app.js`;
- `processos.js`;
- consultas Supabase dos módulos funcionais;
- CSS e estrutura visual.
