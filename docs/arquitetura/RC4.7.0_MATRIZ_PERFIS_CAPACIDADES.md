# SIGEE RC4.7.0 — Matriz oficial de perfis e capacidades

| Capacidade | Master | SEC | Gestor | Administrador | Técnico | Estagiário | Consulta |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Escopo global | ✓ | ✓ | — | — | — | — | — |
| Visualizar processos | ✓ | ✓ | ✓ NTE | ✓ NTE | ✓ NTE | — | ✓ NTE |
| Abrir solicitação | ✓ | — | — | ✓ NTE | ✓ NTE | ✓ NTE | — |
| Executar workflow | ✓ | — | — | ✓ NTE | ✓ NTE | — | — |
| Distribuir/reatribuir | ✓ | — | ✓ NTE | ✓ NTE | — | — | — |
| Indicadores/produtividade | ✓ | ✓ global | ✓ NTE | ✓ NTE | ✓ NTE | — | — |
| Relatórios | ✓ | ✓ global | ✓ NTE | ✓ NTE | ✓ NTE | — | ✓ NTE |
| Exportar | ✓ | ✓ global | ✓ NTE | ✓ NTE | — | — | — |
| Gerenciar usuários | global | — | — | próprio NTE | — | — | — |
| Editar escola operacional | ✓ | — | — | próprio NTE | próprio NTE | — | — |
| Editar escola cadastral | ✓ | — | — | — | — | — | — |
| Suspender NTE | ✓ | — | — | — | — | — | — |

## Regras estruturais
- Gestor é territorial e não executa workflow.
- SEC é global, administrativo e somente de acompanhamento.
- Estagiário apenas abre solicitações.
- Administrador não é um Master territorial: alterações estruturais, regressão e exclusão permanecem com o Master.
- Todo acesso territorial deve usar `nte_id` como autoridade, mantendo campos textuais apenas para compatibilidade e exibição.
