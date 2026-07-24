# SIGEE Enterprise RC5.5.0 — Consolidação Analítica

Base: SIGEE.INTERPRISE-main(36).zip

## Ajustes
- inclusão dos processos SIGEE e MIGRACAO_HISTORICA em todos os módulos que usam SIGEE_DADOS;
- leitura paginada da tabela processos acima do limite de 1.000 registros;
- seleção restrita às colunas analíticas necessárias;
- filtro territorial aplicado na consulta para perfis não globais;
- cache de 3 minutos, requisição única em andamento e compartilhamento de RPCs;
- Dashboard Operacional e Executivo reconciliados com a base analítica completa;
- relatório de atrasos por etapa calculado sobre a mesma base consolidada;
- preservação da estrutura existente: nenhum diretório services foi criado.

## Arquivos
- frontend/index.html
- frontend/js/core/dados-escopo.js
- frontend/js/analytics/analytics-data-controller.js
- frontend/js/analytics/analytics-engine.js
- frontend/js/analytics/dashboard.js
- frontend/js/analytics/dashboard-executivo.js

Não requer SQL.
