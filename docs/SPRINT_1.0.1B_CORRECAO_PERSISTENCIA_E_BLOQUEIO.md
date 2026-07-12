# Sprint 1.0.1b — Correção de persistência e bloqueio

Correções aplicadas após homologação:

1. A nova solicitação aguarda o Supabase retornar o ID real antes de fechar o formulário.
2. O processo local recebe o mesmo ID e `workflow_instance_id` gravados no banco.
3. Falhas de gravação deixam de criar processo temporário que desaparece após recarregar.
4. A consulta de bloqueio usa `workflow_instance_id + ciclo + ação` de forma consistente.
5. O cache atualizado após uma ação usa a identidade UUID, não o ID numérico.
6. O Workflow é recarregado após a transição para refletir imediatamente o estado Executada.

## Teste obrigatório

- Criar processo e confirmar que permanece após fechar e atualizar.
- Abrir Workflow: ação ainda disponível.
- Executar ação: botão muda para Executada e fica bloqueado.
- Atualizar a página: bloqueio permanece.
- Criar outro processo: não herda o bloqueio.
