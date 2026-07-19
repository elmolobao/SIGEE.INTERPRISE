# SIGEE Enterprise RC4.1.1 — Correção da Matriz de Perfis

## Escopo aplicado

- `frontend/js/core/session.js`
  - normalização canônica do perfil no carregamento e na gravação da sessão;
  - preservação literal de `Gestor`;
  - compatibilidade com `GESTOR`, `gestor` e legado `Dirigente`, todos convertidos para `Gestor`;
  - nenhum perfil reconhecido como Gestor utiliza fallback para Técnico.

- `frontend/js/core/permissoes.js`
  - Administrador: Relatórios = Sim; Sala de Situação = Não; Gestão de usuários = Não;
  - Consulta: Relatórios = Sim; Sala de Situação = Não; Gestão de usuários = Não;
  - Gestor: Relatórios = Sim; Sala de Situação = Sim; Gestão de usuários = Não.

- `frontend/js/usuarios/usuarios.js` e seletor existente em `frontend/index.html`
  - opção `Gestor` preservada;
  - valores de Técnico e Estagiário padronizados com a grafia canônica.

## Matriz para homologação

| Perfil | Relatórios | Sala de Situação | Gestão de usuários |
|---|---:|---:|---:|
| Master | Sim | Sim | Sim |
| SEC | Sim | Sim | Não |
| Gestor | Sim | Sim | Não |
| Administrador | Sim | Não | Não |
| Técnico | Conforme regra anterior (Não nesta matriz) | Não | Não |
| Estagiário | Não | Não | Não |
| Consulta | Sim | Não | Não |

## Testes mínimos

1. Limpar a sessão anterior ou sair e entrar novamente.
2. Autenticar com um usuário de cada um dos sete perfis.
3. Conferir o nome literal do perfil exibido no cabeçalho.
4. Conferir os menus Relatórios, Sala de Situação e Gestão de usuários.
5. No Gestor, confirmar que o sistema não exibe `Técnico` e mantém visão global de consulta.
6. Recarregar a página com `F5` e repetir a conferência dos menus.

A RC4.2 permanece bloqueada até a homologação desta correção.
