# RC60 — Reconciliação ancorada no ato legal

A reconciliação passa a partir de `legalizacao_atos_legais` da instituição e recupera a ocorrência DOE pelo `importacao_id`.

Isso cobre atos legados cuja ocorrência em `legalizacao_atos_importacao` não possui `instituicao_id`, mas que já está formalmente vinculada à instituição pelo ato legal.

Proteções:
- não reimporta DOE;
- não altera `importacao_id`, instituição, status ou identidade documental;
- bloqueia ocorrência DOE que possua vínculo explícito divergente do ato legal;
- Parecer não produz efeito regulatório autônomo;
- mantém a materialização idempotente de ofertas da RC58;
- registra auditoria em `logs_sigee`.
