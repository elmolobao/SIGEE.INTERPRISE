(function (global) {
  'use strict';
  const root = global.SIGEE6 = global.SIGEE6 || {};
  const COLUNAS_LOG = 'id,created_at,usuario_id,nome,email,perfil,nte,acao,modulo,etapa,detalhes,sessao_id';
  const COLUNAS_PROCESSO = 'id,codigo_sigee,aluno_nome,escola_nome,etapa_atual,responsavel_id,tecnico_atribuido,prazo_inicio,prazo_fim,created_at,updated_at';

  function normalizarEvento(log) {
    return {
      id: `log:${log.id}`,
      tipo: 'log',
      titulo: log.acao || log.etapa || 'Evento do processo',
      dataHora: log.created_at,
      etapa: log.etapa || null,
      responsavel: log.nome || null,
      emailResponsavel: log.email || null,
      nte: log.nte || null,
      detalhes: log.detalhes || null,
      origem: 'logs_sigee',
      bruto: log
    };
  }

  async function obterProcesso(processoId) {
    return root.api.cached(`timeline:processo:${processoId}`, (db) => db.from('processos').select(COLUNAS_PROCESSO).eq('id', processoId).maybeSingle(), 30000, { name: 'timeline.processo', processoId });
  }

  async function obterLogs(processoId) {
    return root.api.cached(`timeline:logs:${processoId}`, (db) => db.from('logs_sigee').select(COLUNAS_LOG).or(`processo_id.eq.${processoId},detalhes.ilike.%ID ${processoId}%`).order('created_at', { ascending: true }), 30000, { name: 'timeline.logs', processoId });
  }

  async function carregar(processoId) {
    const [processoResult, logsResult] = await Promise.all([obterProcesso(processoId), obterLogs(processoId)]);
    const processo = processoResult.data || null;
    const eventos = (logsResult.data || []).map(normalizarEvento);
    if (processo?.created_at) eventos.unshift({ id: `processo:${processo.id}:created`, tipo: 'processo', titulo: 'Solicitação registrada', dataHora: processo.created_at, etapa: 'Solicitação', origem: 'processos', bruto: processo });
    eventos.sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));
    return { processo, eventos, carregadoEm: new Date().toISOString(), versao: root.core?.VERSION || 'RC6' };
  }

  const service = Object.freeze({ carregar, invalidar: (id) => root.cache.clear(`timeline:${id || ''}`) });
  root.timelineService = service;
  root.core?.register('timeline.service', service, { mode: 'read-only', version: 'RC6.0.1' });
})(window);
