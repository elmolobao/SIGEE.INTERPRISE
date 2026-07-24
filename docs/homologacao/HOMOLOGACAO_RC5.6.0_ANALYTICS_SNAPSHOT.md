# SIGEE Enterprise RC5.6.0 — Snapshot Analítico

## Objetivo

Substituir as duas RPCs pesadas `sigee_dashboard_resumo` e `sigee_dashboard_complemento` por uma única chamada consolidada: `sigee_dashboard_snapshot`.

## Ordem obrigatória de implantação

1. No Supabase SQL Editor, executar `supabase/rc5_6_0_analytics_snapshot.sql`.
2. Confirmar a mensagem de sucesso.
3. Publicar os arquivos do frontend RC5.6.0.
4. Aguardar o deploy da Vercel.
5. Fechar as abas antigas e usar Ctrl+F5.

## Resultado esperado no Network

Ao abrir ou atualizar o Painel, deve existir apenas uma requisição:

`/rest/v1/rpc/sigee_dashboard_snapshot`

Não devem mais ser chamadas pelo frontend:

- `/rest/v1/rpc/sigee_dashboard_resumo`
- `/rest/v1/rpc/sigee_dashboard_complemento`

## Validação funcional

- Os totais devem considerar registros SIGEE e Migração Histórica.
- O filtro de NTE deve continuar respeitando o escopo do usuário.
- Dashboard Operacional e Dashboard Executivo devem compartilhar o mesmo snapshot.
- A tabela territorial deve exibir total, concluídos, atrasos e eficiência.
- A atualização não deve travar a interface.

## Validação de desempenho

No Chrome DevTools:

- INP esperado abaixo de 200 ms;
- nenhuma resposta Supabase deve bloquear a thread por dezenas de segundos;
- nenhuma RPC deve retornar o erro PostgreSQL `57014`.

## Observação sobre prazos

Quando `prazo_fim` estiver vazio, o snapshot tenta calcular o vencimento usando a data atual da etapa somada a `prazo_etapa`. Registros sem nenhuma base temporal válida entram no total, mas não são classificados automaticamente como atrasados.
