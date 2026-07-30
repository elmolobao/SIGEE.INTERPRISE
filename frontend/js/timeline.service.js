(function (global) {
  'use strict';

  const root = global.SIGEE6 = global.SIGEE6 || {};
  const VERSION = 'RC10.3.0';
  const texto = (v) => v == null ? '' : String(v).trim();
  const normalizar = (v) => texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();


  const TIPOS_ETAPA = Object.freeze({
    SOLICITACAO: 'SOLICITACAO',
    DOCUMENTO_SOLICITADO: 'DOCUMENTO_SOLICITADO',
    PASTA_LOCALIZADA: 'PASTA_LOCALIZADA',
    PASTA_RECEBIDA: 'PASTA_RECEBIDA',
    DOCUMENTO_RECEBIDO: 'DOCUMENTO_RECEBIDO',
    DESARQUIVAMENTO: 'DESARQUIVAMENTO',
    REITERACAO: 'REITERACAO',
    REITERACAO_URGENTE: 'REITERACAO_URGENTE',
    CONFIRMACAO_DADOS: 'CONFIRMACAO_DADOS',
    PEDIDO_ATAS: 'PEDIDO_ATAS',
    ANALISE: 'ANALISE',
    PENDENCIA: 'PENDENCIA',
    DIGITACAO: 'DIGITACAO',
    CONFERENCIA: 'CONFERENCIA',
    ASSINATURA: 'ASSINATURA',
    DEFERIDO: 'DEFERIDO',
    INDEFERIDO: 'INDEFERIDO',
    RETIRADO: 'RETIRADO'
  });


  // Datas simuladas servem ao motor de prazo, mas não representam o momento
  // real de execução de uma ação. A Timeline institucional exibe somente
  // registros cuja data auditável não esteja no futuro do relógio civil.
  function instanteCivilAtual() {
    return Date.now();
  }

  function eventoComDataFutura(evento) {
    const valorData = evento?.dataHora || evento?.created_at;
    if (!valorData) return false;
    const instante = new Date(valorData).getTime();
    if (!Number.isFinite(instante)) return false;
    return instante > instanteCivilAtual() + (5 * 60 * 1000);
  }

  function somenteEventosExecutados(eventos) {
    return (Array.isArray(eventos) ? eventos : []).filter((evento) => {
      if (!eventoComDataFutura(evento)) return true;
      console.warn('[SIGEE RC10.1.0] Evento futuro removido da Timeline auditável:', {
        tipo: evento.tipo,
        dataHora: evento.dataHora,
        origem: evento.origem
      });
      return false;
    });
  }

  function tiposExecutados(eventos) {
    return Array.from(new Set((eventos || []).map(e => e?.tipo).filter(tipo => TIPOS_ETAPA[tipo])));
  }

  function db() {
    try { const c = root.api?.client?.(); if (c) return c; } catch (_) {}
    try { const c = global.obterSupabaseSIGEE?.(); if (c) return c; } catch (_) {}
    try { const c = global.criarClienteSupabaseSIGEE?.(); if (c) return c; } catch (_) {}
    try { const c = global.SIGEE_SUPABASE?.criarCliente?.(); if (c) return c; } catch (_) {}
    return null;
  }

  function valor(obj, ...campos) {
    for (const campo of campos) {
      if (obj && obj[campo] != null && texto(obj[campo])) return obj[campo];
    }
    return null;
  }

  function dataEvento(obj) {
    return valor(obj, 'created_at', 'data_hora', 'data', 'executado_em', 'updated_at') || null;
  }

  function textoBusca(obj) {
    return normalizar([
      valor(obj, 'acao', 'evento', 'titulo'),
      valor(obj, 'etapa', 'etapa_atual'),
      valor(obj, 'detalhes', 'observacao', 'descricao', 'mensagem'),
      valor(obj, 'tipo_arquivo', 'documento_tipo', 'arquivo')
    ].filter(Boolean).join(' '));
  }

  function ehPastaRecebida(obj) {
    const n = textoBusca(obj);
    const evidenciaDireta = /PASTA (FISICA )?RECEBIDA|RECEBIMENTO (DA|DE) PASTA|ACERVO (FISICO )?RECEBIDO|PASTA LOCALIZADA E RECEBIDA|ARQUIVO FISICO RECEBIDO/.test(n);
    const documentoComTipoPasta = /DOCUMENTO RECEBIDO/.test(n) && /PASTA|ACERVO FISICO|ARQUIVO FISICO/.test(n);
    return evidenciaDireta || documentoComTipoPasta;
  }

  function classificar(obj) {
    const n = textoBusca(obj);
    if (ehPastaRecebida(obj)) return 'PASTA_RECEBIDA';
    if (/DOCUMENTO RECEBIDO/.test(n)) return 'DOCUMENTO_RECEBIDO';
    if (/DOCUMENTO SOLICITADO|SOLICITACAO DE DOCUMENTO|E-?MAIL 0?2/.test(n)) return 'DOCUMENTO_SOLICITADO';
    if (/PASTA LOCALIZADA|ACERVO LOCALIZADO|ARQUIVO LOCALIZADO/.test(n)) return 'PASTA_LOCALIZADA';
    if (/SOLICITACAO|NOVA SOLICITACAO|CADASTRAD/.test(n)) return 'SOLICITACAO';
    if (/REITERACAO.*URG|URGENTE/.test(n)) return 'REITERACAO_URGENTE';
    if (/REITERACAO/.test(n)) return 'REITERACAO';
    if (/CONFIRMACAO.*DADOS|CONFIRMAR DADOS/.test(n)) return 'CONFIRMACAO_DADOS';
    if (/PEDIDO.*ATA/.test(n)) return 'PEDIDO_ATAS';
    if (/RETIFICACAO|RETIFICAR DADOS/.test(n)) return 'RETIFICACAO';
    if (/DESARQUIV/.test(n)) return 'DESARQUIVAMENTO';
    if (/ANALISE/.test(n)) return 'ANALISE';
    if (/PENDENCIA/.test(n)) return 'PENDENCIA';
    if (/DIGITACAO/.test(n)) return 'DIGITACAO';
    if (/CONFERENCIA/.test(n)) return 'CONFERENCIA';
    if (/ASSINATURA/.test(n)) return 'ASSINATURA';
    if (/INDEFER/.test(n)) return 'INDEFERIDO';
    if (/DEFERID/.test(n)) return 'DEFERIDO';
    if (/RETIRAD/.test(n)) return 'RETIRADO';
    if (/EMAIL|E-MAIL|MENSAGEM ENVIADA|COMUNICACAO/.test(n)) return 'COMUNICACAO';
    return 'MOVIMENTACAO';
  }

  function tituloPorTipo(tipo, original) {
    const mapa = {
      PASTA_RECEBIDA: 'Pasta Recebida',
      DOCUMENTO_RECEBIDO: 'Documento Recebido',
      DOCUMENTO_SOLICITADO: 'Documento solicitado',
      PASTA_LOCALIZADA: 'Pasta localizada',
      SOLICITACAO: 'Solicitação registrada',
      REITERACAO_URGENTE: 'Reiteração com Urgência',
      REITERACAO: 'Reiteração',
      CONFIRMACAO_DADOS: 'Confirmação dos Dados',
      PEDIDO_ATAS: 'Pedido de Atas',
      RETIFICACAO: 'Retificação de Dados',
      DESARQUIVAMENTO: 'Desarquivamento',
      ANALISE: 'Análise',
      PENDENCIA: 'Pendência',
      DIGITACAO: 'Digitação',
      CONFERENCIA: 'Conferência',
      ASSINATURA: 'Assinatura',
      DEFERIDO: 'Deferido',
      INDEFERIDO: 'Indeferido',
      RETIRADO: 'Retirado',
      COMUNICACAO: 'Comunicação enviada'
    };
    return mapa[tipo] || texto(original) || 'Movimentação processual';
  }

  function normalizarEvento(registro, origem) {
    const tipo = classificar(registro);
    const dataHora = dataEvento(registro);
    return {
      id: `${origem}:${valor(registro, 'id') || Math.random().toString(36).slice(2)}`,
      tipo,
      titulo: tituloPorTipo(tipo, valor(registro, 'acao', 'evento', 'titulo', 'etapa')),
      dataHora,
      created_at: dataHora,
      acao: tituloPorTipo(tipo, valor(registro, 'acao', 'evento', 'titulo', 'etapa')),
      etapa: valor(registro, 'etapa', 'etapa_atual'),
      responsavel: valor(registro, 'nome', 'usuario_nome', 'responsavel', 'executado_por'),
      usuario_nome: valor(registro, 'nome', 'usuario_nome', 'responsavel', 'executado_por'),
      emailResponsavel: valor(registro, 'email', 'usuario_email'),
      perfil: valor(registro, 'perfil', 'usuario_perfil'),
      nte: valor(registro, 'nte'),
      detalhes: valor(registro, 'detalhes', 'observacao', 'descricao', 'mensagem'),
      observacao: valor(registro, 'observacao', 'detalhes', 'descricao', 'mensagem'),
      prazoDias: valor(registro, 'prazo_dias', 'dias_prazo'),
      prazoFinal: valor(registro, 'prazo_fim', 'data_prazo', 'vencimento'),
      mensagemCodigo: valor(registro, 'mensagem_codigo', 'modelo_email', 'email_modelo'),
      documento: valor(registro, 'tipo_arquivo', 'documento_tipo', 'arquivo', 'nome_arquivo'),
      sessaoId: valor(registro, 'sessao_id'),
      origem,
      evidenciaPastaRecebida: tipo === 'PASTA_RECEBIDA',
      bruto: registro
    };
  }

  async function obterProcesso(processoId, processoBase) {
    const cliente = db();
    if (!cliente) return processoBase || null;
    try {
      const { data, error } = await cliente.from('processos').select('*').eq('id', processoId).maybeSingle();
      if (error) throw error;
      // O objeto em memória pode estar desatualizado após uma transição. O registro
      // do Supabase deve prevalecer, preservando apenas campos locais ausentes.
      return data ? { ...(processoBase || {}), ...data } : (processoBase || null);
    } catch (error) {
      console.warn('[SIGEE RC6.1.2] Processo não pôde ser recarregado para a Timeline:', error);
      return processoBase || null;
    }
  }

  async function obterHistorico(processoId) {
    const cliente = db();
    if (!cliente) return [];
    try {
      const { data, error } = await cliente.from('historico_processos').select('*').eq('processo_id', processoId).order('created_at', { ascending: true });
      if (error) throw error;
      return Array.isArray(data) ? data.map((r) => normalizarEvento(r, 'historico_processos')) : [];
    } catch (error) {
      console.info('[SIGEE RC6.1.2] historico_processos indisponível; usando logs auditáveis.');
      return [];
    }
  }

  async function obterLogs(processo) {
    const cliente = db();
    if (!cliente || !processo) return [];
    const id = texto(processo.id);
    const codigo = texto(valor(processo, 'codigo_sigee', 'codigo'));
    const filtros = [];
    if (id) filtros.push(`detalhes.ilike.%ID ${id}%`, `detalhes.ilike.%processo ${id}%`);
    if (codigo) filtros.push(`detalhes.ilike.%${codigo.replace(/,/g, '')}%`, `acao.ilike.%${codigo.replace(/,/g, '')}%`);
    if (!filtros.length) return [];

    try {
      const { data, error } = await cliente
        .from('logs_sigee')
        .select('*')
        .or(filtros.join(','))
        .order('created_at', { ascending: true })
        .limit(1000);
      if (error) throw error;
      return Array.isArray(data) ? data.map((r) => normalizarEvento(r, 'logs_sigee')) : [];
    } catch (error) {
      console.warn('[SIGEE RC6.1.2] Logs da Timeline indisponíveis:', error);
      return [];
    }
  }


  async function obterAcoesWorkflow(processo) {
    const cliente = db();
    const instanceId = texto(valor(processo, 'workflow_instance_id'));
    if (!cliente || !instanceId) return [];
    try {
      const { data, error } = await cliente.rpc('sigee_workflow_acoes_executadas', {
        p_workflow_instance_id: instanceId,
        p_ciclo: Number(valor(processo, 'workflow_ciclo', 'ciclo') || 1)
      });
      if (error) throw error;
      return (Array.isArray(data) ? data : []).map((item, indice) => normalizarEvento({
        id: item.id || item.historico_id || `${instanceId}-${indice}`,
        created_at: item.created_at || item.data_hora || item.executado_em || item.updated_at || valor(processo, 'updated_at', 'data_etapa_atual'),
        acao: item.acao || item.evento,
        etapa: item.etapa || item.etapa_destino,
        observacao: item.observacao || item.detalhes,
        usuario_nome: item.usuario_nome || item.usuario,
        usuario_email: item.usuario_email,
        usuario_perfil: item.usuario_perfil || item.perfil,
        mensagem_codigo: item.mensagem_codigo || item.mensagem,
        dados: item.dados
      }, 'workflow_acoes'));
    } catch (error) {
      console.info('[SIGEE RC6.1.2] Ações persistidas do workflow indisponíveis para a Timeline:', error);
      return [];
    }
  }

  function eventosSinteticos(processo, eventos) {
    const saida = eventos.slice();
    const criada = valor(processo, 'created_at', 'data_abertura', 'data_solicitacao');
    const temSolicitacao = saida.some((e) => e.tipo === 'SOLICITACAO');
    if (criada && !temSolicitacao) {
      saida.push(normalizarEvento({
        id: `processo-${processo.id}-criado`,
        created_at: criada,
        acao: 'Solicitação registrada',
        etapa: 'Solicitação',
        nome: valor(processo, 'usuario_lancamento_nome', 'criado_por_nome', 'responsavel') || 'Sistema SIGEE',
        detalhes: 'Registro inicial do processo no SIGEE.'
      }, 'processos'));
    }

    // O workflow persiste também evidências no próprio processo. Essa fonte é
    // necessária quando o histórico auditável não foi gravado ou usa códigos
    // como DOCUMENTO_RECEBIDO com sublinhado.
    const evidenciaDocumento = normalizar([
      valor(processo, 'ultimo_evento_workflow'),
      valor(processo, 'ultima_acao_workflow'),
      valor(processo, 'contexto_analise'),
      valor(processo, 'tipo_arquivo'),
      valor(processo, 'tipo_arquivo_recebido'),
      valor(processo, 'arquivo_tipo'),
      valor(processo, 'observacao'),
      valor(processo, 'ultima_mensagem_workflow')
    ].filter(Boolean).join(' '));
    const temDocumentoRecebido = saida.some((e) => e.tipo === 'DOCUMENTO_RECEBIDO');
    const dataDocumento = valor(processo,
      'data_arquivo_recebido', 'data_primeiro_arquivo_recebido',
      'arquivo_recebido_em', 'documento_recebido_em');
    const confirmouDocumento = /DOCUMENTO RECEBIDO|ARQUIVO RECEBIDO/.test(evidenciaDocumento) || Boolean(dataDocumento);

    if (!temDocumentoRecebido && confirmouDocumento) {
      const tipoArquivo = valor(processo, 'tipo_arquivo_recebido', 'tipo_arquivo', 'arquivo_tipo');
      const localArquivo = valor(processo, 'local_arquivo', 'arquivo_local', 'local_acervo');
      const detalhes = [
        tipoArquivo ? `Tipo: ${tipoArquivo}.` : '',
        localArquivo ? `Local: ${localArquivo}.` : '',
        'Evidência recuperada dos campos persistidos no processo.'
      ].filter(Boolean).join(' ');
      saida.push(normalizarEvento({
        id: `processo-${processo.id}-documento-recebido`,
        created_at: dataDocumento || valor(processo, 'updated_at') || criada,
        acao: 'DOCUMENTO_RECEBIDO',
        etapa: 'Documento Recebido',
        nome: valor(processo, 'analista_nome', 'tecnico_responsavel', 'responsavel', 'usuario_lancamento_nome') || 'Sistema SIGEE',
        tipo_arquivo: tipoArquivo,
        detalhes
      }, 'processos'));
    }
    return saida;
  }

  function riqueza(evento) {
    return [evento.detalhes, evento.responsavel, evento.etapa, evento.emailResponsavel,
      evento.mensagemCodigo, evento.documento, evento.prazoFinal, evento.prazoDias]
      .filter((v) => texto(v)).length;
  }

  function minuto(dataHora) {
    const d = dataHora ? new Date(dataHora) : null;
    if (!d || Number.isNaN(d.getTime())) return '';
    d.setSeconds(0, 0);
    return d.toISOString();
  }

  function removerDuplicados(eventos) {
    const grupos = new Map();
    eventos.forEach((evento) => {
      // Eventos equivalentes produzidos por histórico e log no mesmo minuto são
      // exibidos como um único marco, preservando as fontes para auditoria.
      const chave = `${evento.tipo}|${minuto(evento.dataHora)}`;
      const atual = grupos.get(chave);
      if (!atual) {
        grupos.set(chave, { ...evento, fontes: [evento.origem], registrosAgrupados: [evento.bruto] });
        return;
      }
      const principal = riqueza(evento) > riqueza(atual) ? { ...evento } : { ...atual };
      principal.fontes = Array.from(new Set([...(atual.fontes || [atual.origem]), evento.origem].filter(Boolean)));
      principal.registrosAgrupados = [...(atual.registrosAgrupados || [atual.bruto]), evento.bruto].filter(Boolean);
      const detalhes = Array.from(new Set([atual.detalhes, evento.detalhes].filter((v) => texto(v))));
      principal.detalhes = detalhes.sort((a, b) => texto(b).length - texto(a).length)[0] || principal.detalhes;
      principal.observacao = principal.observacao || principal.detalhes;
      principal.totalRegistrosAgrupados = principal.registrosAgrupados.length;
      grupos.set(chave, principal);
    });
    return Array.from(grupos.values());
  }


  function consolidarRecebimento(eventos) {
    const lista = Array.isArray(eventos) ? eventos.slice() : [];
    const pasta = lista.find((e) => e.tipo === 'PASTA_RECEBIDA') || null;
    const documentos = lista.filter((e) => e.tipo === 'DOCUMENTO_RECEBIDO');
    if (!pasta && !documentos.length) return lista;

    const principal = pasta ? { ...pasta } : { ...documentos[0], tipo: 'PASTA_RECEBIDA', titulo: 'Pasta Recebida', acao: 'Pasta Recebida', etapa: 'Pasta Recebida', evidenciaPastaRecebida: true };
    const fontes = new Set(principal.fontes || [principal.origem].filter(Boolean));
    const registros = [...(principal.registrosAgrupados || [principal.bruto].filter(Boolean))];
    const detalhes = [principal.detalhes, principal.observacao].filter(Boolean);

    documentos.forEach((evento) => {
      (evento.fontes || [evento.origem]).filter(Boolean).forEach((f) => fontes.add(f));
      registros.push(...(evento.registrosAgrupados || [evento.bruto].filter(Boolean)));
      if (evento.detalhes) detalhes.push(evento.detalhes);
      if (evento.observacao) detalhes.push(evento.observacao);
      principal.documento = principal.documento || evento.documento || valor(evento.bruto, 'tipo_arquivo', 'documento_tipo', 'arquivo');
      principal.localArquivo = principal.localArquivo || valor(evento.bruto, 'local_arquivo', 'arquivo_local', 'local_acervo', 'local');
      principal.responsavel = principal.responsavel || evento.responsavel;
      principal.usuario_nome = principal.usuario_nome || evento.usuario_nome;
      principal.dataHora = principal.dataHora || evento.dataHora;
      principal.created_at = principal.created_at || evento.created_at;
    });

    const partes = [];
    if (principal.documento) partes.push(`Tipo: ${principal.documento}.`);
    if (principal.localArquivo) partes.push(`Local: ${principal.localArquivo}.`);
    const detalheBase = Array.from(new Set(detalhes.map(texto).filter(Boolean)));
    principal.detalhes = [...partes, ...detalheBase].join(' ').trim() || 'Recebimento da pasta registrado no processo.';
    principal.observacao = principal.detalhes;
    principal.fontes = Array.from(fontes);
    principal.registrosAgrupados = registros.filter(Boolean);
    principal.totalRegistrosAgrupados = principal.registrosAgrupados.length || 1;
    principal.documentoRecebidoInterno = documentos.length > 0;

    return lista.filter((e) => e.tipo !== 'PASTA_RECEBIDA' && e.tipo !== 'DOCUMENTO_RECEBIDO').concat(principal);
  }

  async function carregar(processoId, processoBase) {
    const processo = await obterProcesso(processoId, processoBase);
    if (!processo) throw new Error('Processo não localizado para montar a Timeline.');

    const [historico, logs, acoesWorkflow] = await Promise.all([
      obterHistorico(processoId),
      obterLogs(processo),
      obterAcoesWorkflow(processo)
    ]);

    let eventos = consolidarRecebimento(removerDuplicados(eventosSinteticos(processo, [...historico, ...logs, ...acoesWorkflow])));
    eventos = somenteEventosExecutados(eventos);
    eventos.sort((a, b) => {
      const da = a.dataHora ? new Date(a.dataHora).getTime() : Number.MAX_SAFE_INTEGER;
      const dbv = b.dataHora ? new Date(b.dataHora).getTime() : Number.MAX_SAFE_INTEGER;
      return da - dbv;
    });

    const pastaRecebida = eventos.find((e) => e.tipo === 'PASTA_RECEBIDA') || null;
    const executados = tiposExecutados(eventos);
    return {
      processo,
      eventos,
      marcos: {
        pastaRecebida: Boolean(pastaRecebida),
        eventoPastaRecebida: pastaRecebida,
        documentoRecebido: Boolean(pastaRecebida && pastaRecebida.documentoRecebidoInterno),
        tiposExecutados: executados,
        fontesConsultadas: ['processos', 'historico_processos', 'logs_sigee', 'sigee_workflow_acoes_executadas'],
        fonteCronologica: 'SIGEE6.timeline.service'
      },
      carregadoEm: new Date().toISOString(),
      versao: VERSION
    };
  }

  function invalidar(id) {
    root.cache?.clear?.(`timeline:${id || ''}`);
  }

  const service = Object.freeze({
    VERSION,
    carregar,
    invalidar,
    classificar,
    ehPastaRecebida,
    tiposExecutados,
    TIPOS_ETAPA
  });

  root.timelineService = service;
  root.core?.register?.('timeline.service', service, { mode: 'read-only', version: VERSION });
})(window);
