# Sprint 0.9.3.1 — Entrega 1

## Escopo

Primeira consolidação não destrutiva do motor de procedimentos do SIGEE.

## Alterações

- `frontend/js/config.js` centralizado e compatível com o legado;
- criado `frontend/js/core/mensagens-config.js`;
- criado `frontend/js/core/pop-config.js`;
- criado `frontend/js/core/workflow-engine.js`;
- scripts adicionados ao `index.html` antes de `processos.js`;
- removido o arquivo duplicado `processos.js.js`;
- nenhuma tela homologada foi alterada;
- o procedimento atual de Pasta Localizada permanece preservado.

## Regras consolidadas do Desarquivamento

- Reiteração: assinaturas 43 e 45;
- Reiteração com urgência: assinaturas 44 e 46;
- Confirmação dos dados: assinatura 12;
- assinatura 13 desconsiderada;
- retificação: assinaturas 14 e 37, reiniciando o prazo de 30 dias;
- pedido de atas sem pasta: assinatura 36 e envio para Pendência;
- assinatura 35 pertence à Pendência posterior à Análise;
- assinatura 34 desconsiderada;
- Documento Recebido pode ocorrer em qualquer ponto do Desarquivamento;
- Documento Recebido abre o procedimento homologado de Pasta Localizada;
- somente após as obrigações da Pasta Localizada o processo segue para Análise.

## Teste rápido no console

```javascript
SIGEE_WORKFLOW.descrever('POP-DES-002')
SIGEE_WORKFLOW.validarConfirmacoes('POP-DES-002', {'43': true, '45': true})
SIGEE_WORKFLOW.eventoDisponivel('POP-DES-004', 'DOCUMENTO_RECEBIDO')
```
