# SIGEE Enterprise — Auditoria RC5.8

**Base auditada:** `SIGEE.INTERPRISE-main(37).zip`  
**Escopo:** arquitetura do frontend, inicialização, comunicação Supabase, camada analítica, duplicidades estruturais e riscos de desempenho.  
**Natureza desta entrega:** diagnóstico técnico; nenhuma regra de negócio foi alterada nesta etapa.

## 1. Resumo executivo

A base está funcional e todos os arquivos JavaScript passaram na validação sintática do Node.js. A camada analítica já utiliza a RPC consolidada `sigee_dashboard_snapshot`, e a leitura global de `solicitacoes_sigee` foi bloqueada nos ajustes RC5.7.3.

A auditoria, porém, encontrou dívida técnica significativa acumulada por sucessivas versões e patches:

- 118 arquivos JavaScript no projeto;
- 57 scripts carregados pelo `index.html`, sendo 52 locais;
- 27 nomes de arquivos duplicados em pastas diferentes;
- 294 listeners e 220 timers apenas nos scripts efetivamente carregados;
- 28 ocorrências de `select('*')` nos scripts carregados;
- `frontend/js/app/app.js` com aproximadamente 581 KB;
- coexistência de arquivos antigos na raiz de `frontend/js` e equivalentes modularizados em subpastas.

A prioridade da RC5.8 deve ser reduzir autoridades concorrentes e controlar o bootstrap, sem alterar o workflow homologado.

## 2. Indicadores da auditoria

| Indicador | Resultado |
|---|---:|
| Arquivos JavaScript auditados | 118 |
| Scripts declarados no `index.html` | 57 |
| Scripts locais realmente carregados | 52 |
| Chamadas RPC encontradas | 7 |
| `select('*')` em todo o repositório | 66 |
| `select('*')` em scripts carregados | 28 |
| Listeners em todo o repositório | 629 |
| Listeners em scripts carregados | 294 |
| Timers em todo o repositório | 509 |
| Timers em scripts carregados | 220 |
| Basenames JavaScript duplicados | 27 |
| Erros sintáticos JavaScript | 0 |

## 3. Achados críticos

### A1 — Arquivo principal monolítico

`frontend/js/app/app.js` possui aproximadamente 581 KB e concentra autenticação legada, carga de dados, CRUD, sincronização, navegação e patches históricos. Esse tamanho dificulta controle de efeitos colaterais e explica por que alterações localizadas reativam consultas ou eventos antigos.

**Risco:** alto.  
**Ação RC5.8:** congelar o arquivo como compatibilidade e extrair, gradualmente, bootstrap, navegação e acesso a dados para autoridades únicas.

### A2 — Muitas autoridades duplicadas no repositório

Há versões paralelas como:

- `frontend/js/app.js` e `frontend/js/app/app.js`;
- `frontend/js/processos.js`, `frontend/js/processo.js` e `frontend/js/processos/processos.js`;
- `frontend/js/escolas.js`, `frontend/js/app/escolas.js` e `frontend/js/escolas/escolas.js`;
- `frontend/js/dashboard-executivo.js` e `frontend/js/analytics/dashboard-executivo.js`;
- `frontend/js/sala-situacao.js` e `frontend/js/analytics/sala-situacao.js`;
- múltiplas cópias de autenticação, workflow e componentes.

O `index.html` atualmente carrega principalmente as versões modularizadas, mas as cópias antigas continuam no projeto e elevam o risco de publicação equivocada.

**Risco:** alto.  
**Ação RC5.8:** criar manifesto de autoridade, mover versões não utilizadas para uma pasta de legado fora do caminho de publicação e impedir inclusão acidental.

### A3 — Volume excessivo de listeners e timers

Nos 52 scripts locais carregados existem 294 registros de `addEventListener` e 220 chamadas a `setTimeout`/`setInterval`.

Nem todos são problemas individualmente, mas o volume torna provável:

- listeners repetidos após login/navegação;
- timers que continuam ativos em abas ocultas;
- múltiplos disparos para a mesma atualização;
- renderizações redundantes.

**Risco:** alto para desempenho e previsibilidade.  
**Ação RC5.8:** inventariar eventos globais, criar guards padronizados e suspender timers quando o módulo estiver oculto.

### A4 — Uso amplo de `select('*')`

Foram encontradas 28 ocorrências nos scripts efetivamente carregados. Os casos mais sensíveis são:

- carga genérica de tabelas no `app/app.js` com limite de 10.000;
- paginação genérica com `range()`;
- carga integral de usuários em Processos e Usuários;
- autenticação e credenciais buscando todas as colunas;
- consultas de histórico e prontuário sem seleção explícita.

As consultas por ID ou `maybeSingle()` têm impacto menor, mas ainda ampliam tráfego e acoplamento ao schema.

**Risco:** alto quando aplicado a tabelas crescentes; médio nos registros únicos.  
**Ação RC5.8:** definir listas de colunas por domínio e proibir `select('*')` nas funções genéricas.

### A5 — Bootstrap analítico ainda tem múltiplos consumidores

A RPC direta `sigee_dashboard_snapshot` aparece somente em `frontend/js/analytics/dashboard.js`, o que é correto. O Dashboard Executivo consome a API compartilhada. Entretanto, a arquitetura ainda mantém vários eventos de compatibilidade e consumidores que podem solicitar nova carga.

**Risco:** médio.  
**Ação RC5.8:** transformar o serviço de snapshot em autoridade explícita e fazer todos os módulos apenas assinarem o snapshot; atualização forçada somente por ação humana ou invalidação de dados.

## 4. Achados importantes

### A6 — 57 scripts no carregamento inicial

O `index.html` inclui 57 scripts, incluindo bibliotecas externas e 52 scripts locais. Mesmo com cache, o navegador precisa baixar, compilar e executar uma grande quantidade de código antes de estabilizar a aplicação.

**Ação:** carregamento sob demanda para migração, administração, logs, Sala de Situação e módulos pouco acessados.

### A7 — Dependências externas sem versão fixa completa

O Supabase é carregado por `@supabase/supabase-js@2`, o que permite mudança automática dentro da versão principal. Isso pode introduzir diferenças de comportamento sem alteração do projeto.

**Ação:** fixar a versão atualmente homologada (`2.110.8`, observada no navegador) ou empacotar localmente.

### A8 — Tailwind Browser em produção

`https://unpkg.com/@tailwindcss/browser@4` compila estilos no navegador. Essa modalidade é útil para protótipos, mas adiciona trabalho no cliente e risco de dependência externa.

**Ação:** gerar CSS estático no build ou consolidar os estilos usados nos arquivos CSS do projeto.

### A9 — Consultas de usuários repetidas em vários módulos

Autenticação, credenciais, Processos, Administração e Usuários consultam `usuarios_sigee` separadamente.

**Ação:** cache curto de sessão e API única de diretório de usuários, com invalidação após CRUD.

### A10 — Ausência de testes de desempenho automatizados

Existem testes de workflow, mas não foi encontrado um conjunto equivalente para:

- quantidade máxima de chamadas no login;
- ausência de leitura global de solicitações;
- uma única RPC analítica;
- quantidade de listeners após relogin;
- tempo do bootstrap.

**Ação:** criar testes estáticos e de navegador para prevenir regressão.

## 5. Pontos positivos confirmados

- Todos os arquivos `.js` passaram em `node --check`.
- A camada analítica possui uma única ocorrência direta da RPC `sigee_dashboard_snapshot`.
- Processos usam uma RPC específica de contadores (`sigee_processos_contadores`).
- Workflow possui RPCs específicas para ações executadas e registro de ação.
- O `index.html` não carrega simultaneamente as cópias raiz e modularizadas dos principais módulos.
- Os ajustes recentes reduziram a carga global de `solicitacoes_sigee`.

## 6. Plano recomendado da RC5.8

### RC5.8.1 — Manifesto e bootstrap

1. Criar manifesto de scripts oficiais.
2. Consolidar eventos de login e navegação.
3. Implantar registro único de listeners globais.
4. Instrumentar chamadas Supabase em modo diagnóstico.

### RC5.8.2 — Camada de dados

1. Bloquear `select('*')` em leitores genéricos.
2. Criar seleções explícitas por tabela.
3. Centralizar cache de usuários, NTEs e escolas de apoio.
4. Garantir solicitações históricas somente sob demanda.

### RC5.8.3 — Analytics

1. Tornar `SIGEE_ANALYTICS_SNAPSHOT` a autoridade única.
2. Dashboard, Executivo, Centro e Sala apenas consomem eventos.
3. Invalidar snapshot após mudança relevante de processo, não após toda navegação.
4. Adicionar telemetria de cache/hit/miss e duração da RPC.

### RC5.8.4 — Lazy loading

Carregar somente quando acessados:

- Migração Histórica/Oficial;
- Administração;
- Logs;
- Diagnóstico;
- Sala de Situação;
- Centro de Inteligência.

### RC5.8.5 — Limpeza segura

1. Não apagar arquivos imediatamente.
2. Mover cópias não carregadas para `legacy_archive/` fora do frontend publicado.
3. Validar deploy e rollback.
4. Remover apenas após homologação.

## 7. Critérios de homologação

- Uma chamada inicial para `sigee_dashboard_snapshot`.
- Nenhuma chamada global para `solicitacoes_sigee?select=*`.
- Nenhuma paginação profunda de solicitações no login.
- Nenhum erro 57014.
- Login e painel interativos sem congelamento.
- Processos nativos e migrados incluídos nos indicadores.
- Perfil não global restrito ao próprio NTE.
- Workflow e CRUD sem regressões.
- Segunda navegação ao painel usa cache.
- Atualização manual produz somente uma nova RPC.

## 8. Conclusão

A RC5.7.3 resolveu o gargalo emergencial, mas a base ainda carrega dívida técnica relevante. O risco principal não é uma consulta isolada: é a coexistência de muitas autoridades históricas, listeners e funções genéricas em um arquivo principal muito grande.

A RC5.8 deve ser incremental e conservadora: primeiro instrumentar e centralizar, depois reduzir consultas e scripts, e somente por último arquivar as versões legadas. Essa ordem preserva as regras homologadas do SIGEE e reduz o risco de regressão.
