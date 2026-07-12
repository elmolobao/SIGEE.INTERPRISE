# SIGEE Enterprise — Sprint 1.0 / Entrega S1-E2.1

## Versão 0.9.3.2 — Workflow Engine PoC

### Objetivo
Validar em memória o núcleo declarativo de estados, eventos e transições, sem alterar telas, banco de dados, comunicações ou regras já homologadas.

### Implementado
- catálogo de 12 estados internos;
- catálogo central de eventos;
- tabela declarativa de transições;
- validação de estado e evento;
- consulta de eventos permitidos;
- simulação e execução de transições;
- evento global `DOCUMENTO_RECEBIDO`, sem mudança automática de estado;
- retificação com indicação de reinício do prazo de 30 dias;
- preservação integral da API da versão 0.9.3.1.

### Fluxo validado
`DES → RET → REU → CFD → DES`

Eventos utilizados:
1. `SEND_REITERACAO`
2. `SEND_REITERACAO_URGENTE`
3. `CONFIRMAR_DADOS`
4. `RETIFICAR_DADOS`

### Fora do escopo
- persistência no Supabase;
- integração com botões e modais;
- envio de e-mail;
- geração de histórico;
- cálculo automático de datas;
- alteração automática de processos.

### Teste técnico
Executar na raiz do projeto:

```bash
node tests/workflow-engine.poc.test.js
```

Resultado esperado:

```text
Workflow Engine PoC 0.9.3.2: todos os testes passaram.
```
