# RC61 — Evidência consolidada para ofertas DOE

A aplicação regulatória passa a reconhecer etapa/modalidade usando a evidência documental preservada em conjunto:
- ocorrência `legalizacao_atos_importacao`;
- cópia confirmada em `legalizacao_atos_legais`.

Não existe regra específica para o ICB ou para os atos 305/2026 e 392/2026.

Se nenhuma das duas evidências contiver etapa/modalidade reconhecível, a reconciliação retorna `SEM_ETAPA_NA_EVIDENCIA` em vez de inventar uma oferta. Isso diferencia falha de materialização de perda de conteúdo documental no histórico.
