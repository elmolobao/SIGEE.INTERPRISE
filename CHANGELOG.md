# SIGEE Enterprise V31.5 - Correções reais

- Mantidos os perfis Master, Administrador, Técnico, SEC e Consulta.
- Removidos apenas os usuários demonstrativos/padrão: USUÁRIO SEC, USUÁRIO ADMINISTRADOR e USUÁRIO CONSULTA.
- Corrigido salvamento e exclusão de usuários pelo Master/SEC com tentativa de persistência no Supabase.
- Incluído autocomplete da escola filtrado pelo NTE do usuário cadastrado.
- Dashboard mantém apenas GLOBAL - TODOS OS NTEs, removendo SEC - TODOS OS NTEs como filtro.

# CHANGELOG

## 2.0.0-base-editavel

- Criação da estrutura modular inicial.
- Extração do CSS para `frontend/css/enterprise.css`.
- Extração do JavaScript para `frontend/js/app.js`.
- Criação dos módulos preparados para edição futura.
- Sem alteração intencional da base Supabase.
