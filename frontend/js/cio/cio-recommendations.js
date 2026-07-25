(function(global){
  'use strict';
  const NS=global.SIGEE_CIO=global.SIGEE_CIO||{};
  function gerar(m){
    const r=[];
    if(m.criticos)r.push({prioridade:'ALTA',titulo:'Priorizar processos críticos',justificativa:`Há ${m.criticos} processo(s) em condição crítica.`,acao:'Organizar fila imediata por prazo e tempo sem movimentação.',impacto:'Redução do risco de descumprimento de SLA.'});
    if(m.vencem3)r.push({prioridade:'ALTA',titulo:'Antecipar vencimentos',justificativa:`${m.vencem3} processo(s) vencem em até 3 dias.`,acao:'Separar uma fila operacional para esta semana.',impacto:'Prevenção de novos atrasos.'});
    if(m.gargalo?.total)r.push({prioridade:'MEDIA',titulo:`Priorizar ${m.gargalo.etapa}`,justificativa:`A etapa concentra ${m.gargalo.total} processo(s), ${m.gargalo.percentual}% do backlog.`,acao:'Revisar a distribuição de tarefas nessa etapa.',impacto:'Redução do maior gargalo atual.'});
    if(m.sobrecarregados.length)r.push({prioridade:'MEDIA',titulo:'Equilibrar carga da equipe',justificativa:`${m.sobrecarregados.length} técnico(s) estão acima da carga média.`,acao:'Redistribuir processos de forma assistida e não punitiva.',impacto:'Melhor equilíbrio e menor tempo parado.'});
    if(m.tendencias?.d30?.saldo>0)r.push({prioridade:'MEDIA',titulo:'Conter crescimento do backlog',justificativa:`O saldo dos últimos 30 dias é de +${m.tendencias.d30.saldo} processo(s).`,acao:'Ajustar prioridades e acompanhar entradas versus saídas semanalmente.',impacto:'Estabilização do volume ativo.'});
    if(!r.length)r.push({prioridade:'NORMAL',titulo:'Manter acompanhamento regular',justificativa:'Nenhum alerta operacional relevante foi identificado.',acao:'Atualizar o diagnóstico periodicamente.',impacto:'Preservação da estabilidade operacional.'});
    return r;
  }
  NS.recommendations=Object.freeze({gerar});
})(window);
