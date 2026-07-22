# SIGEE RC5.0.0 — Refatoração do Núcleo de Autorização

## Autoridades únicas
- `core/perfis.js`: nomenclatura oficial dos perfis.
- `core/permissoes.js`: capacidades por perfil.
- `core/escopo.js`: escopo GLOBAL ou NTE.
- `core/dados-escopo.js`: dados territoriais para leitura.
- `core/autorizacao.js`: menus, rotas e ações.

## Módulos retirados do carregamento
- `core/autoridade-final.js`
- `core/autoridade-perfis-rc471.js`

Os arquivos permanecem no repositório apenas para histórico, mas não são mais carregados.

## Regras homologadas
- Master e SEC: escopo global.
- Gestor, Administrador, Técnico, Estagiário e Consulta: NTE vinculado.
- Gestor: indicadores, relatórios, produtividade e reatribuição; sem workflow e sem nova solicitação.
- Estagiário: somente nova solicitação e consulta de escolas necessária ao cadastro.
