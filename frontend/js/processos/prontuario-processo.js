/* =====================================================================
   SIGEE Enterprise — RC10.8.10
   Prontuário Eletrônico do Processo
   Camada aditiva: não altera regras, transições ou persistência do workflow.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__SIGEE_PRONTUARIO_RC10810__) return;
  window.__SIGEE_PRONTUARIO_RC10810__ = true;

  const ETAPAS = Object.freeze([
    { tipo:'SOLICITACAO', label:'Solicitação' },
    { tipo:'DOCUMENTO_SOLICITADO', label:'Documento Solicitado' },
    { tipo:'PASTA_LOCALIZADA', label:'Pasta Localizada' },
    { tipo:'PASTA_RECEBIDA', label:'Pasta Recebida' },
    { tipo:'DESARQUIVAMENTO', label:'Desarquivamento' },
    { tipo:'ANALISE', label:'Análise' },
    { tipo:'PENDENCIA', label:'Pendência' },
    { tipo:'DIGITACAO', label:'Digitação' },
    { tipo:'CONFERENCIA', label:'Conferência' },
    { tipo:'ASSINATURA', label:'Assinatura' },
    { tipo:'DEFERIDO', label:'Deferido' },
    { tipo:'RETIRADO', label:'Retirado' }
  ]);

  const texto = v => v == null ? '' : String(v).trim();
  const normalizar = v => texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const escapar = v => texto(v).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));

  function processos() {
    if (Array.isArray(window.processosDB)) return window.processosDB;
    try { if (Array.isArray(processosDB)) return processosDB; } catch (_) {}
    return [];
  }

  function processo(id) {
    return processos().find(p => String(p.id) === String(id));
  }

  function supabase() {
    try {
      return window.obterSupabaseSIGEE?.()
        || window.criarClienteSupabaseSIGEE?.()
        || window.SIGEE_SUPABASE?.criarCliente?.()
        || null;
    } catch (_) { return null; }
  }

  function valor(p, ...campos) {
    for (const c of campos) if (p && p[c] != null && texto(p[c])) return texto(p[c]);
    return '';
  }

  function estadoTemporal(p) {
    try {
      const resolvedor = window.SIGEE_WORKFLOW_TEMPORAL;
      if (resolvedor && typeof resolvedor.resolve === 'function') return resolvedor.resolve(p || {});
    } catch (e) {
      console.warn('[SIGEE RC10.3.0] Resolvedor temporal indisponível no prontuário:', e);
    }
    return null;
  }

  function etapaAtual(p) {
    const temporal = estadoTemporal(p);
    const etapaPersistida = valor(p, 'etapa_atual', 'etapa', 'fase_atual') || 'Desarquivamento';
    const normalizada = normalizar(etapaPersistida);
    const fluxoExterno = ['DESARQUIVAMENTO', 'REITERACAO', 'REITERACAO URGENTE', 'CONFIRMACAO DOS DADOS', 'PEDIDO DE ATAS SEM PASTA'];
    return temporal && fluxoExterno.some(item => normalizada.includes(item)) ? temporal.name : etapaPersistida;
  }

  function codigo(p) {
    return valor(p, 'codigo_sigee', 'codigo', 'protocolo') || `PROCESSO ${p?.id || ''}`;
  }

  function dataValida(v) {
    if (!v) return null;
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : new Date(v.getTime());
    const t = texto(v);

    // Datas civis sem horário não podem ser interpretadas como UTC,
    // pois isso desloca 00:00 UTC para 21:00 do dia anterior na Bahia.
    let m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);

    m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 0, 0, 0, 0);

    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function temHorarioReal(v) {
    if (!v) return false;
    if (v instanceof Date) return true;
    const t = texto(v);
    return /[T ]\d{2}:\d{2}(?::\d{2})?/.test(t) || /^\d{2}\/\d{2}\/\d{4}[, ]+\d{2}:\d{2}/.test(t);
  }

  function formatarData(v, hora = true) {
    const d = dataValida(v);
    if (!d) return 'Data não informada';
    const mostrarHora = hora && temHorarioReal(v);
    return d.toLocaleString('pt-BR', mostrarHora
      ? { dateStyle:'short', timeStyle:'short' }
      : { dateStyle:'short' });
  }

  function diasEntre(inicio, fim = new Date()) {
    const a = dataValida(inicio);
    const b = dataValida(fim) || new Date();
    if (!a) return 0;
    return Math.max(0, Math.floor((b - a) / 86400000));
  }

  function agoraWorkflow() {
    try {
      const relogio = window.SIGEE_WORKFLOW_CLOCK;
      const valorAtual = relogio && typeof relogio.now === 'function' ? relogio.now() : new Date();
      return dataValida(valorAtual) || new Date();
    } catch (_) {
      return new Date();
    }
  }

  function fechar() {
    prontuarioAbertoId = null;
    document.getElementById('sigee-prontuario-overlay')?.remove();
    document.body.classList.remove('sigee-prontuario-aberto');
  }

  function iconeEvento(ev) {
    const tipo = normalizar(ev?.tipo || '');
    const n = normalizar(`${ev.acao || ''} ${ev.etapa || ''}`);
    if (tipo === 'SOLICITACAO') return '📄';
    if (tipo === 'DOCUMENTO_SOLICITADO') return '📧';
    if (tipo === 'PASTA_LOCALIZADA') return '📦';
    if (tipo === 'PASTA_RECEBIDA' || tipo === 'DOCUMENTO_RECEBIDO' || n.includes('PASTA RECEBIDA') || n.includes('DOCUMENTO RECEBIDO')) return '📁';
    if (tipo === 'COMUNICACAO' || n.includes('COMUNIC')) return '✉️';
    if (tipo === 'RETIFICACAO' || n.includes('RETIFIC')) return '🔁';
    if (tipo.includes('REITERACAO') || n.includes('REITER')) return '⏱️';
    if (tipo === 'PENDENCIA' || n.includes('PEND')) return '⚠️';
    if (tipo === 'DIGITACAO' || n.includes('DIGIT')) return '⌨️';
    if (tipo === 'CONFERENCIA' || n.includes('CONFER')) return '✔️';
    if (tipo === 'ASSINATURA' || n.includes('ASSIN')) return '✒️';
    if (tipo === 'DEFERIDO' || tipo === 'RETIRADO') return '🏁';
    if (tipo === 'INDEFERIDO') return '⛔';
    if (tipo === 'ANALISE' || n.includes('ANAL')) return '🔎';
    return '●';
  }

  function classeEvento(ev) {
    const n = normalizar(`${ev.acao || ''} ${ev.etapa || ''}`);
    if (n.includes('INDEFER') || n.includes('VENCID')) return 'critico';
    if (n.includes('PEND') || n.includes('URG')) return 'alerta';
    if (n.includes('DEFER') || n.includes('RETIR') || n.includes('RECEBID')) return 'sucesso';
    if (n.includes('RETIFIC') || n.includes('REITER')) return 'ciclo';
    return 'padrao';
  }

  function dadosEvento(ev) {
    const bruto = ev?.dados || ev?.metadata || ev?.detalhes;
    if (!bruto) return {};
    if (typeof bruto === 'object') return bruto;
    try { return JSON.parse(bruto); } catch (_) { return {}; }
  }


  function jsonSeguro(valorBruto) {
    if (!valorBruto) return null;
    if (typeof valorBruto === 'object') return valorBruto;
    const valorTexto = texto(valorBruto);
    if (!valorTexto || (!valorTexto.startsWith('{') && !valorTexto.startsWith('['))) return null;
    try { return JSON.parse(valorTexto); } catch (_) { return null; }
  }

  function payloadCiencia(ev) {
    const candidatos = [ev?.observacao, ev?.descricao, ev?.detalhes, ev?.dados, ev?.metadata];
    for (const candidato of candidatos) {
      const objeto = jsonSeguro(candidato);
      if (objeto && normalizar(objeto.tipo) === 'CIENCIA_ALERTA_ETAPA_LOGIN') return objeto;
    }
    const d = dadosEvento(ev);
    return normalizar(d?.tipo) === 'CIENCIA_ALERTA_ETAPA_LOGIN' ? d : null;
  }

  function etapaPayloadCiencia(payload, ev) {
    const processos = Array.isArray(payload?.processos) ? payload.processos : [];
    const processoId = texto(ev?.processo_id || ev?.processoId);
    const correspondente = processos.find(item => texto(item?.processo_id) === processoId);
    return correspondente?.etapa || ev?.etapa || processos[0]?.etapa || 'Etapa com prazo vencido';
  }

  function descricaoCiencia(payload, ev) {
    const quantidade = Number(payload?.quantidade || (Array.isArray(payload?.processos) ? payload.processos.length : 0));
    const etapa = etapaPayloadCiencia(payload, ev);
    const sufixo = quantidade > 1 ? ` O alerta consolidado contemplou ${quantidade} processos.` : '';
    return `Ciência confirmada no login para a etapa ${etapa}. O processo permanece nessa etapa até a execução da ação correspondente.${sufixo}`;
  }

  function tituloEvento(ev) {
    const codigo = normalizar(ev?.acao || ev?.evento || '');
    const titulos = {
      PASTA_RECEBIDA: 'Pasta Recebida',
      DOCUMENTO_RECEBIDO: 'Pasta Recebida',
      RETIFICAR_DADOS: 'Retificação de Dados',
      SEND_REITERACAO: 'Reiteração',
      SEND_REITERACAO_URGENTE: 'Reiteração com Urgência',
      CONFIRMAR_DADOS: 'Confirmação dos Dados da Busca',
      PEDIDO_ATAS_DESARQUIVAMENTO: 'Pedido de Atas sem Pasta'
    };
    return titulos[codigo] || ev.acao || ev.titulo || ev.etapa || 'Movimentação processual';
  }

  function descricaoEvento(ev) {
    const codigo = normalizar(ev?.acao || ev?.evento || '');
    const ciencia = payloadCiencia(ev);
    if (ciencia) return descricaoCiencia(ciencia, ev);
    const d = dadosEvento(ev);
    if (codigo === 'PASTA_RECEBIDA' || codigo === 'DOCUMENTO_RECEBIDO' || /PASTA RECEBIDA|RECEBIMENTO DA PASTA|DOCUMENTO RECEBIDO/.test(codigo)) {
      const tipo = d.tipo_arquivo || ev.documento || ev.tipo_arquivo;
      const local = d.local_arquivo || d.local || ev.localArquivo || ev.local_arquivo;
      const complemento = [tipo ? `Tipo: ${tipo}.` : '', local ? `Local: ${local}.` : ''].filter(Boolean).join(' ');
      return ev.observacao || `Recebimento da pasta registrado${complemento ? `. ${complemento}` : '.'}`;
    }
    if (codigo === 'RETIFICAR_DADOS') {
      const novo = d.novo_ciclo || ev.novo_ciclo;
      const numero = Math.max(1, Number(novo || cicloEvento(ev) || 2) - 1);
      return ev.observacao || `Retificação ${String(numero).padStart(2, '0')} executada. O prazo do Desarquivamento foi reiniciado por 30 dias.`;
    }
    if (codigo === 'SEND_REITERACAO') return ev.observacao || 'Reiteração registrada, mantendo a contagem contínua do Desarquivamento.';
    if (codigo === 'SEND_REITERACAO_URGENTE') return ev.observacao || 'Reiteração com urgência registrada, mantendo a contagem contínua do Desarquivamento.';
    if (codigo === 'CONFIRMAR_DADOS') return ev.observacao || 'Confirmação dos dados da busca solicitada ao requerente.';
    if (codigo === 'PEDIDO_ATAS_DESARQUIVAMENTO') return ev.observacao || 'Pedido de Atas sem Pasta registrado. Processo encaminhado para Análise no contexto do Desarquivamento.';
    return ev.observacao || ev.descricao || ev.resumo || 'Movimentação registrada no processo.';
  }



  const ACOES_DESARQUIVAMENTO = Object.freeze([
    'SEND_REITERACAO', 'SEND_REITERACAO_URGENTE', 'CONFIRMAR_DADOS',
    'PEDIDO_ATAS_DESARQUIVAMENTO', 'RETIFICAR_DADOS', 'PASTA_RECEBIDA',
    'DOCUMENTO_RECEBIDO', 'CIENCIA_ALERTA_ETAPA_LOGIN'
  ]);

  function codigoAcao(ev) {
    const ciencia = payloadCiencia(ev);
    if (ciencia) return 'CIENCIA_ALERTA_ETAPA_LOGIN';
    return normalizar(ev?.acao || ev?.evento || ev?.tipo || '').replace(/\s+/g, '_');
  }

  function cicloEvento(ev) {
    const ciencia = payloadCiencia(ev);
    if (ciencia && Array.isArray(ciencia.processos)) {
      const processoId = texto(ev?.processo_id || ev?.processoId);
      const item = ciencia.processos.find(x => texto(x?.processo_id) === processoId) || ciencia.processos[0];
      if (item?.ciclo != null) return Number(item.ciclo) || 1;
    }
    const d = dadosEvento(ev);
    return Number(ev?.workflow_ciclo || ev?.ciclo || ev?.novo_ciclo || d?.workflow_ciclo || d?.ciclo || d?.novo_ciclo || 1) || 1;
  }

  function etapaOperacionalEvento(ev) {
    const acao = codigoAcao(ev);
    const base = normalizar(`${ev?.etapa || ''} ${ev?.acao || ''} ${ev?.evento || ''} ${ev?.tipo || ''}`);
    if (ACOES_DESARQUIVAMENTO.includes(acao)
      || /REITER|CONFIRMACAO DOS DADOS|PEDIDO DE ATAS|RETIFIC|DESARQUIV/.test(base)
      || payloadCiencia(ev)) return 'DESARQUIVAMENTO';
    if (/DOCUMENTO SOLICITADO/.test(base)) return 'DOCUMENTO_SOLICITADO';
    if (/PASTA LOCALIZADA/.test(base)) return 'PASTA_LOCALIZADA';
    if (/PASTA RECEBIDA|DOCUMENTO RECEBIDO/.test(base)) return 'PASTA_RECEBIDA';
    if (/SOLICIT/.test(base)) return 'SOLICITACAO';
    if (/ANALISE/.test(base)) return 'ANALISE';
    if (/PENDENCIA/.test(base)) return 'PENDENCIA';
    if (/DIGITACAO/.test(base)) return 'DIGITACAO';
    if (/CONFERENCIA/.test(base)) return 'CONFERENCIA';
    if (/ASSINATURA/.test(base)) return 'ASSINATURA';
    if (/DEFERID/.test(base)) return 'DEFERIDO';
    if (/RETIRAD/.test(base)) return 'RETIRADO';
    return 'OUTROS';
  }

  function naturezaEvento(ev) {
    if (payloadCiencia(ev)) return 'CIENCIA';
    const acao = codigoAcao(ev);
    if (['SEND_REITERACAO','SEND_REITERACAO_URGENTE','CONFIRMAR_DADOS','PEDIDO_ATAS_DESARQUIVAMENTO','RETIFICAR_DADOS','PASTA_RECEBIDA','DOCUMENTO_RECEBIDO'].includes(acao)) return 'ACAO_EXECUTADA';
    const origem = normalizar(Array.isArray(ev?.fontes) ? ev.fontes.join(' ') : ev?.origem || '');
    if (origem.includes('SIGEE_WORKFLOW_ACOES_EXECUTADAS')) return 'ACAO_EXECUTADA';
    return 'REGISTRO';
  }

  function chaveSemanticaEvento(ev) {
    const data = dataValida(ev?.created_at || ev?.data || ev?.data_hora);
    const minuto = data ? data.toISOString().slice(0,16) : '';
    return [etapaOperacionalEvento(ev), cicloEvento(ev), codigoAcao(ev), minuto,
      normalizar(ev?.usuario_nome || ev?.responsavel || ev?.executado_por || '')].join('|');
  }

  function deduplicarEventos(eventos) {
    const mapa = new Map();
    eventos.forEach(ev => {
      const chave = chaveSemanticaEvento(ev);
      const atual = mapa.get(chave);
      if (!atual) {
        mapa.set(chave, { ...ev, totalRegistrosAgrupados: ev.totalRegistrosAgrupados || 1 });
        return;
      }
      const fontes = new Set([...(Array.isArray(atual.fontes) ? atual.fontes : [atual.origem]), ...(Array.isArray(ev.fontes) ? ev.fontes : [ev.origem])].filter(Boolean));
      atual.fontes = [...fontes];
      atual.totalRegistrosAgrupados = Number(atual.totalRegistrosAgrupados || 1) + Number(ev.totalRegistrosAgrupados || 1);
      if (!atual.observacao && ev.observacao) atual.observacao = ev.observacao;
    });
    return [...mapa.values()].sort((a,b) => (dataValida(a.created_at || a.data || a.data_hora)?.getTime() || 0) - (dataValida(b.created_at || b.data || b.data_hora)?.getTime() || 0));
  }

  function dataEvento(ev) {
    return ev?.created_at || ev?.data || ev?.data_hora || ev?.executado_em || null;
  }

  function responsavelEvento(ev) {
    return texto(ev?.tecnico_responsavel || ev?.responsavel_etapa || ev?.executado_por_nome || ev?.usuario_nome || ev?.responsavel || ev?.executado_por);
  }

  function responsavelPersistidoPorEtapa(p, etapaTipo) {
    const campos = {
      SOLICITACAO:['criado_por_nome','criado_por','usuario_lancamento_nome','responsavel'],
      DOCUMENTO_SOLICITADO:['responsavel','tecnico_responsavel'],
      PASTA_LOCALIZADA:['responsavel','tecnico_responsavel'],
      PASTA_RECEBIDA:['responsavel','tecnico_responsavel'],
      DESARQUIVAMENTO:['tecnico_responsavel','responsavel','usuario_responsavel'],
      ANALISE:['analista_nome','analista','responsavel'],
      PENDENCIA:['analista_nome','analista','responsavel'],
      DIGITACAO:['digitador_nome','digitador','responsavel'],
      CONFERENCIA:['conferente_nome','conferente','responsavel'],
      ASSINATURA:['responsavel_assinatura','responsavel'],
      DEFERIDO:['responsavel','tecnico_responsavel'],
      RETIRADO:['responsavel','tecnico_responsavel']
    };
    return valor(p, ...(campos[etapaTipo] || ['tecnico_responsavel','responsavel','usuario_responsavel']));
  }

  function agruparEventosPorEtapa(eventos, p = null) {
    const limpos = deduplicarEventos(eventos);
    const grupos = new Map();
    limpos.forEach(ev => {
      const etapaTipo = etapaOperacionalEvento(ev);
      const ciclo = etapaTipo === 'DESARQUIVAMENTO' ? cicloEvento(ev) : 1;
      const chave = `${etapaTipo}|1`; // Desarquivamento permanece em um único cartão contínuo.
      if (!grupos.has(chave)) grupos.set(chave, { etapaTipo, ciclo, eventos: [] });
      grupos.get(chave).eventos.push(ev);
    });

    const atual = p ? tipoEtapaAtual(p) : '';
    if (atual) {
      const cicloAtual = atual === 'DESARQUIVAMENTO' ? Number(p?.workflow_ciclo || p?.ciclo || 1) : 1;
      const chaveAtual = `${atual}|1`;
      if (!grupos.has(chaveAtual)) grupos.set(chaveAtual, { etapaTipo:atual, ciclo:cicloAtual, eventos:[], atual:true });
      else grupos.get(chaveAtual).atual = true;
    }

    const ordem = new Map(ETAPAS.map((e,i) => [e.tipo, i]));
    const lista = [...grupos.values()].sort((a,b) => (ordem.get(a.etapaTipo) ?? 99) - (ordem.get(b.etapaTipo) ?? 99) || a.ciclo - b.ciclo);

    const criada = p ? (valor(p,'created_at','criado_em','data_solicitacao','data_abertura') || null) : null;
    let limiteAnterior = dataValida(criada);
    lista.forEach((grupo, i) => {
      grupo.eventos.sort((a,b) => (dataValida(dataEvento(a))?.getTime() || 0) - (dataValida(dataEvento(b))?.getTime() || 0));
      const primeiraReal = grupo.eventos.map(dataEvento).find(v => dataValida(v));
      let enviado = primeiraReal || null;

      if (grupo.etapaTipo === 'SOLICITACAO' && criada) enviado = criada;
      if (!enviado && grupo.atual && p) enviado = valor(p,'data_etapa_atual','updated_at') || criada;

      let dtEnvio = dataValida(enviado);
      if (limiteAnterior && (!dtEnvio || dtEnvio < limiteAnterior)) {
        enviado = limiteAnterior.toISOString();
        dtEnvio = new Date(limiteAnterior);
      }
      grupo.enviadoEm = enviado;
      grupo.responsavel = grupo.eventos.map(responsavelEvento).find(Boolean) || (p ? responsavelPersistidoPorEtapa(p, grupo.etapaTipo) : '') || 'Não identificado';
      grupo.atual = grupo.atual || grupo.etapaTipo === atual;
      grupo.situacao = grupo.atual ? 'Em andamento' : 'Concluída';
      limiteAnterior = dtEnvio || limiteAnterior;
    });

    // A conclusão de uma etapa é a entrada cronologicamente validada na próxima etapa.
    lista.forEach((grupo, i) => {
      const proxima = lista[i + 1];
      if (grupo.atual) grupo.concluidoEm = null;
      else if (proxima?.enviadoEm) grupo.concluidoEm = proxima.enviadoEm;
      else {
        const ultimo = grupo.eventos.length ? dataEvento(grupo.eventos[grupo.eventos.length - 1]) : null;
        const du = dataValida(ultimo), de = dataValida(grupo.enviadoEm);
        grupo.concluidoEm = du && de && du >= de ? ultimo : grupo.enviadoEm;
      }
      const dc = dataValida(grupo.concluidoEm), de = dataValida(grupo.enviadoEm);
      if (dc && de && dc < de) grupo.concluidoEm = null;
    });
    return lista;
  }

  function rotuloEtapaGrupo(grupo) {
    const base = ETAPAS.find(e => e.tipo === grupo.etapaTipo)?.label || 'Outros registros';
    return base;
  }

  function tituloAcaoInterna(ev) {
    if (payloadCiencia(ev)) return `Ciência de vencimento — ${etapaPayloadCiencia(payloadCiencia(ev), ev)}`;
    return tituloEvento(ev);
  }

  function badgeNatureza(ev) {
    const natureza = naturezaEvento(ev);
    const rotulos = { CIENCIA:'Ciência institucional', ACAO_EXECUTADA:'Ação executada', REGISTRO:'Registro auditável' };
    return `<span class="sigee-pep-badge-natureza ${natureza.toLowerCase()}">${rotulos[natureza]}</span>`;
  }

  function detalhesEvento(ev) {
    const data = ev.created_at || ev.data || ev.data_hora;
    const ciencia = payloadCiencia(ev);
    const d = dadosEvento(ev);
    const fontes = Array.isArray(ev.fontes) ? ev.fontes.join(', ') : ev.origem;

    if (ciencia) {
      const quantidade = Number(ciencia.quantidade || (Array.isArray(ciencia.processos) ? ciencia.processos.length : 0));
      const camposCiencia = [
        ['Evento', 'Ciência de alerta institucional'],
        ['Data e hora', formatarData(data || ciencia.confirmado_em)],
        ['Responsável', ev.usuario_nome || ev.responsavel || ev.executado_por || 'Não identificado'],
        ['Perfil', ev.usuario_perfil || ev.perfil],
        ['Etapa', etapaPayloadCiencia(ciencia, ev)],
        ['Quantidade de processos', quantidade || 1],
        ['Retificação vigente', (() => { const c = Array.isArray(ciencia.processos) ? (ciencia.processos.find(item => texto(item?.processo_id) === texto(ev?.processo_id || ev?.processoId))?.ciclo || ciencia.processos[0]?.ciclo) : null; return Number(c) > 1 ? `Retificação ${String(Number(c)-1).padStart(2,'0')}` : 'Sem retificação'; })()],
        ['Origem auditável', fontes],
        ['Logs consolidados', ev.totalRegistrosAgrupados > 1 ? `${ev.totalRegistrosAgrupados} registros equivalentes` : '1 registro'],
        ['Sessão', ev.sessaoId || ev.sessao_id],
        ['Observação', descricaoCiencia(ciencia, ev)]
      ].filter(([,v]) => texto(v));
      return camposCiencia.map(([k,v]) => `<div><span>${k}</span><strong>${escapar(v)}</strong></div>`).join('');
    }

    const observacaoBruta = ev.observacao || ev.descricao || ev.detalhes;
    const observacaoExibivel = jsonSeguro(observacaoBruta) ? '' : observacaoBruta;
    const campos = [
      ['Evento', tituloEvento(ev)],
      ['Data e hora', formatarData(data)],
      ['Responsável', ev.usuario_nome || ev.responsavel || ev.executado_por || 'Não identificado'],
      ['Perfil', ev.usuario_perfil || ev.perfil],
      ['Etapa', ev.etapa],
      ['Prazo', ev.prazoFinal ? formatarData(ev.prazoFinal, false) : (ev.prazoDias ? `${ev.prazoDias} dias` : '')],
      ['E-mail / modelo', ev.mensagemCodigo || ev.mensagem_codigo || ev.mensagem],
      ['Tipo do documento', ev.documento || ev.tipo_arquivo || ev.arquivo],
      ['Local do arquivo', ev.localArquivo || ev.local_arquivo || d.local_arquivo || d.local],
      ['Origem auditável', fontes],
      ['Logs consolidados', ev.totalRegistrosAgrupados > 1 ? `${ev.totalRegistrosAgrupados} registros equivalentes` : '1 registro'],
      ['Sessão', ev.sessaoId || ev.sessao_id],
      ['Observação', observacaoExibivel]
    ].filter(([,v]) => texto(v));

    const conhecidos = new Set(['id','created_at','data','data_hora','acao','evento','titulo','etapa','observacao','descricao','detalhes','tipo','processos']);
    const extras = d && typeof d === 'object'
      ? Object.entries(d).filter(([k,v]) => !conhecidos.has(k) && v != null && typeof v !== 'object')
          .slice(0, 12)
          .map(([k,v]) => `<div><span>${escapar(k.replaceAll('_',' '))}</span><strong>${escapar(v)}</strong></div>`).join('')
      : '';
    return campos.map(([k,v]) => `<div><span>${k}</span><strong>${escapar(v)}</strong></div>`).join('') + extras;
  }

  async function carregarEventos(p) {
    try {
      if (window.SIGEE6?.timeline?.carregar) {
        const timeline = await window.SIGEE6.timeline.carregar(p.id, p);
        return {
          eventos: Array.isArray(timeline?.eventos) ? timeline.eventos : [],
          marcos: timeline?.marcos || { pastaRecebida:false, documentoRecebido:false },
          origem: 'SIGEE6.timeline'
        };
      }
    } catch (e) {
      console.warn('[SIGEE RC6.1.5] Timeline Enterprise indisponível; aplicando leitura compatível:', e);
    }

    const eventos = [];
    const cliente = supabase();
    if (cliente && p?.id != null) {
      try {
        const { data, error } = await cliente
          .from('historico_processos')
          .select('*')
          .eq('processo_id', p.id)
          .order('created_at', { ascending: true });
        if (!error && Array.isArray(data)) eventos.push(...data);
      } catch (e) {
        console.warn('[SIGEE Prontuário] histórico_processos indisponível:', e);
      }
    }

    if (!eventos.length) {
      const criada = valor(p, 'created_at', 'criado_em', 'data_solicitacao', 'data_abertura');
      eventos.push({
        created_at: criada || new Date().toISOString(),
        acao: 'Solicitação criada',
        etapa: 'Solicitação',
        usuario_nome: valor(p, 'criado_por', 'responsavel') || 'Sistema SIGEE',
        observacao: 'Registro inicial do processo.'
      });
    }

    const pastaRecebida = eventos.some(ev => /PASTA (FISICA )?RECEBIDA|RECEBIMENTO (DA|DE) PASTA|ACERVO (FISICO )?RECEBIDO/i.test(`${ev.acao || ''} ${ev.etapa || ''} ${ev.observacao || ''} ${ev.detalhes || ''}`));
    return { eventos, marcos:{ pastaRecebida, documentoRecebido:eventos.some(ev => /DOCUMENTO RECEBIDO/i.test(`${ev.acao || ''} ${ev.etapa || ''}`)) }, origem:'compatibilidade' };
  }

  function tipoEtapaAtual(p) {
    const atual = normalizar(etapaAtual(p));
    const mapa = {
      'SOLICITACAO':'SOLICITACAO', 'DOCUMENTO SOLICITADO':'DOCUMENTO_SOLICITADO',
      'PASTA LOCALIZADA':'PASTA_LOCALIZADA', 'PASTA RECEBIDA':'PASTA_RECEBIDA',
      'DOCUMENTO RECEBIDO':'PASTA_RECEBIDA', 'DESARQUIVAMENTO':'DESARQUIVAMENTO',
      'REITERACAO':'DESARQUIVAMENTO', 'REITERACAO URGENTE':'DESARQUIVAMENTO',
      'CONFIRMACAO DOS DADOS':'DESARQUIVAMENTO', 'PEDIDO DE ATAS SEM PASTA':'DESARQUIVAMENTO',
      'ANALISE':'ANALISE', 'PENDENCIA':'PENDENCIA', 'DIGITACAO':'DIGITACAO',
      'CONFERENCIA':'CONFERENCIA', 'ASSINATURA':'ASSINATURA',
      'DEFERIDO':'DEFERIDO', 'AGUARDANDO RETIRADA':'DEFERIDO', 'RETIRADO':'RETIRADO'
    };
    return mapa[atual] || ETAPAS.find(e => atual.includes(normalizar(e.label)))?.tipo || '';
  }

  function workflowHTML(p, eventos = [], marcos = {}) {
    const executados = new Set(marcos.tiposExecutados || eventos.map(e => e.tipo).filter(Boolean));
    const atual = tipoEtapaAtual(p);
    return ETAPAS.map((etapa, i) => {
      const concluida = executados.has(etapa.tipo);
      const ehAtual = etapa.tipo === atual;
      let classe = concluida ? 'concluida' : ehAtual ? 'atual' : 'futura';
      if (etapa.tipo === 'PASTA_RECEBIDA' && !concluida) classe += ' pendente-registro marco-pasta';
      if (etapa.tipo === 'PASTA_RECEBIDA' && concluida) classe += ' marco-pasta';
      const simbolo = concluida ? '✓' : ehAtual ? '●' : i + 1;
      const titulo = concluida ? 'Evento confirmado pela Timeline' : ehAtual ? 'Etapa atual do processo' : 'Evento não localizado na Timeline';
      return `<div class="sigee-pep-etapa ${classe}" title="${titulo}">
        <span>${simbolo}</span><small>${escapar(etapa.label)}</small>
      </div>`;
    }).join('');
  }

  function timelineHTML(eventos, p) {
    const grupos = agruparEventosPorEtapa(eventos, p);
    return grupos.map((grupo, gi) => {
      const ultimo = grupo.eventos[grupo.eventos.length - 1] || {};
      const executadas = grupo.eventos.filter(ev => naturezaEvento(ev) === 'ACAO_EXECUTADA').length;
      const ciencias = grupo.eventos.filter(ev => naturezaEvento(ev) === 'CIENCIA').length;
      return `
      <article class="sigee-pep-evento sigee-pep-grupo-etapa ${grupo.etapaTipo === 'DESARQUIVAMENTO' ? 'ciclo' : classeEvento(ultimo)}">
        <div class="sigee-pep-marcador">${grupo.etapaTipo === 'DESARQUIVAMENTO' ? '🗂️' : iconeEvento(ultimo)}</div>
        <div class="sigee-pep-evento-card">
          <header>
            <div>
              <time>${escapar(formatarData(grupo.enviadoEm))}</time>
              <h3>${escapar(rotuloEtapaGrupo(grupo))}</h3>
            </div>
            <button type="button" aria-expanded="false" data-pep-expandir="grupo-${gi}">Ver ações</button>
          </header>
          <div class="sigee-pep-metadados-etapa">
            <div><span>Enviado em</span><strong>${escapar(formatarData(grupo.enviadoEm))}</strong></div>
            <div><span>Concluído em</span><strong>${grupo.concluidoEm ? escapar(formatarData(grupo.concluidoEm)) : 'Em andamento'}</strong></div>
            <div><span>Técnico responsável</span><strong>${escapar(grupo.responsavel)}</strong></div>
            <div><span>Situação</span><strong>${escapar(grupo.situacao)}</strong></div>
          </div>
          <p>${grupo.eventos.length} registro(s) nesta etapa${executadas ? ` • ${executadas} ação(ões) executada(s)` : ''}${ciencias ? ` • ${ciencias} ciência(s)` : ''}.</p>
          <div class="sigee-pep-detalhes sigee-pep-acoes-etapa" data-pep-detalhes="grupo-${gi}">
            ${grupo.eventos.length ? grupo.eventos.map(ev => `
              <section class="sigee-pep-acao-interna ${naturezaEvento(ev).toLowerCase()}">
                <div class="sigee-pep-acao-cabecalho">
                  <span class="sigee-pep-acao-icone">${iconeEvento(ev)}</span>
                  <div><time>${formatarData(dataEvento(ev))}</time><strong>${escapar(tituloAcaoInterna(ev))}</strong></div>
                  ${badgeNatureza(ev)}
                </div>
                <p>${escapar(descricaoEvento(ev))}</p>
                <div class="sigee-pep-acao-metadados">${detalhesEvento(ev) || '<div><span>Registro</span><strong>Sem informações complementares.</strong></div>'}</div>
              </section>`).join('') : '<div class="sigee-pep-vazio-etapa">Etapa atual sem ação interna registrada.</div>'}
          </div>
        </div>
      </article>`;
    }).join('');
  }

  function resumoComunicacoes(eventos) {
    return eventos.filter(e => /MENSAGEM|COMUNIC|EMAIL|E-MAIL/i.test(`${e.acao || ''} ${e.observacao || ''}`));
  }

  function resumoDocumentos(eventos) {
    return eventos.filter(e => /DOCUMENT|PASTA|ATA|CADERNETA|PARECER|BOLETIM/i.test(`${e.acao || ''} ${e.observacao || ''} ${e.tipo_arquivo || ''}`));
  }

  function ultimaMovimentacao(eventos) {
    return eventos.filter(e => dataValida(e.created_at || e.data || e.data_hora))
      .slice().sort((a,b) => dataValida(b.created_at || b.data || b.data_hora) - dataValida(a.created_at || a.data || a.data_hora))[0] || null;
  }

  function ultimaAcaoExecutada(eventos) {
    return eventos.filter(e => naturezaEvento(e) === 'ACAO_EXECUTADA' && dataValida(e.created_at || e.data || e.data_hora))
      .slice().sort((a,b) => dataValida(b.created_at || b.data || b.data_hora) - dataValida(a.created_at || a.data || a.data_hora))[0] || null;
  }

  function riscoProcesso(p, tempoParado) {
    const prazo = dataValida(valor(p,'prazo_fim'));
    if (prazo && prazo < new Date()) return 'Crítico';
    if (tempoParado >= 15) return 'Atenção';
    return 'Normal';
  }

  function modalHTML(p, eventos, marcos = {}) {
    const temporal = estadoTemporal(p);
    const metricas = (() => {
      try { return window.SIGEE_WORKFLOW_TEMPORAL?.processMetrics?.(p || {}, agoraWorkflow()) || null; }
      catch (e) { console.warn('[SIGEE RC10.8.10] Métricas temporais indisponíveis:', e); return null; }
    })();
    const inicio = metricas?.opening || valor(p, 'data_abertura', 'data_solicitacao', 'created_at', 'criado_em', 'data_inicio_desarquivamento');
    const tempoTotal = metricas?.totalDays ?? diasEntre(inicio, valor(p,'deferido_em','data_deferimento') || agoraWorkflow());
    const tempoPosDeferimento = metricas?.postDeferredDays ?? 0;
    const etapa = etapaAtual(p);
    const comunicacoes = resumoComunicacoes(eventos);
    const documentos = resumoDocumentos(eventos);
    const ultima = ultimaMovimentacao(eventos);
    const ultimaExecutada = ultimaAcaoExecutada(eventos);
    const ultimaData = ultima?.created_at || ultima?.data || ultima?.data_hora || inicio;
    const tempoParado = diasEntre(ultimaData, agoraWorkflow());
    const etapaNormalizada = normalizar(valor(p,'etapa_atual','etapa','fase_atual'));
    const cicloExterno = ['DESARQUIVAMENTO','REITERACAO','REITERACAO URGENTE','CONFIRMACAO DOS DADOS','PEDIDO DE ATAS SEM PASTA'].some(item => etapaNormalizada.includes(item));
    const prazoEtapaCalculado = window.SIGEE_PRAZO_ETAPA?.calcular?.(p, agoraWorkflow()) || null;
    const tempoEtapa = cicloExterno
      ? (temporal?.days ?? metricas?.stageDays ?? 0)
      : (prazoEtapaCalculado?.diasNaEtapa ?? metricas?.stageDays ?? diasEntre(valor(p,'data_etapa_atual','data_etapa','prazo_inicio'), agoraWorkflow()) + 1);
    const prazoFinalCalculado = prazoEtapaCalculado?.prazoFinal || dataValida(valor(p,'prazo_fim'));
    const responsavelAtual = valor(p,'tecnico_responsavel','responsavel','usuario_responsavel') || 'Não atribuído';
    const risco = prazoEtapaCalculado?.vencido ? 'Crítico' : riscoProcesso(p, tempoParado);

    return `
    <div id="sigee-prontuario-overlay" class="sigee-pep-overlay" role="dialog" aria-modal="true" aria-label="Prontuário Eletrônico do Processo">
      <div class="sigee-pep-shell">
        <header class="sigee-pep-topo">
          <div class="sigee-pep-marca"><b>SIGEE</b><span>Prontuário Eletrônico do Processo</span></div>
          <div class="sigee-pep-topo-acoes">
            <button type="button" onclick="window.print()">🖨️ Imprimir</button>
            <button type="button" data-pep-fechar>✕ Fechar</button>
          </div>
        </header>

        <section class="sigee-pep-cabecalho">
          <div class="sigee-pep-titulo">
            <span>PROCESSO</span>
            <h1>${escapar(codigo(p))}</h1>
            <div class="sigee-pep-status"><i></i>${escapar(etapa)}</div>
          </div>
          <div class="sigee-pep-grade">
            <div><span>Aluno</span><strong>${escapar(valor(p,'aluno_nome','aluno','nome_solicitante') || 'Não informado')}</strong></div>
            <div><span>Escola</span><strong>${escapar(valor(p,'escola_nome','escola','nome_escola','instituicao') || 'Não informada')}</strong></div>
            <div><span>NTE</span><strong>${escapar(valor(p,'nte','nte_nome','grupo') || 'Não informado')}</strong></div>
            <div><span>Responsável</span><strong>${escapar(valor(p,'tecnico_responsavel','responsavel','usuario_responsavel') || 'Não atribuído')}</strong></div>
            <div><span>Prioridade</span><strong>${escapar(valor(p,'prioridade') || 'Normal')}</strong></div>
            <div><span>Documento</span><strong>${escapar(valor(p,'documento_tipo','documento','documento_solicitado') || 'Não informado')}</strong></div>
            <div><span>Tempo total</span><strong>${tempoTotal} dias</strong></div>
            <div><span>Tempo parado</span><strong>${tempoParado} dias</strong></div>
          </div>
        </section>

        <section class="sigee-pep-workflow">${workflowHTML(p, eventos, marcos)}</section>

        <div class="sigee-pep-conteudo">
          <main class="sigee-pep-timeline">
            <div class="sigee-pep-secao-titulo"><div><span>LINHA DO TEMPO</span><h2>Trajetória completa do processo</h2></div><b>${agruparEventosPorEtapa(eventos, p).length} etapas • ${eventos.length} registros</b></div>
            ${timelineHTML(eventos, p) || '<div class="sigee-pep-vazio">Nenhum evento auditável foi localizado para este processo.</div>'}
          </main>

          <aside class="sigee-pep-lateral">
            <section><h3>Visão executiva</h3>
              <div class="sigee-pep-kpis sigee-pep-kpis-executivos">
                <div><strong>${tempoTotal}</strong><span>tempo total (dias)</span></div>
                <div><strong>${tempoParado}</strong><span>tempo parado (dias)</span></div>
                ${metricas?.deferred ? `<div><strong>${tempoPosDeferimento}</strong><span>deferido até retirada (dias)</span></div>` : ''}
              </div>
              <dl class="sigee-pep-resumo-executivo">
                <div><dt>Responsável</dt><dd>${escapar(responsavelAtual)}</dd></div>
                <div><dt>Última movimentação</dt><dd>${formatarData(ultimaData)}</dd></div>
                <div><dt>Última ação</dt><dd>${escapar(ultimaExecutada ? tituloEvento(ultimaExecutada) : 'Nenhuma ação executada')}</dd></div>
                <div><dt>Risco</dt><dd class="risco-${normalizar(risco).toLowerCase()}">${escapar(risco)}</dd></div>
              </dl>
            </section>
            <section class="sigee-pep-marco-pasta ${marcos.pastaRecebida ? 'registrado' : 'nao-registrado'}">
              <h3>Recebimento da pasta</h3>
              <div class="sigee-pep-marco-status">
                <strong>${marcos.pastaRecebida ? '✓ Pasta recebida' : 'Aguardando registro'}</strong>
                <span>${marcos.pastaRecebida ? 'Há evidência auditável na fonte oficial da cronologia.' : 'Nenhum recebimento da pasta foi localizado nas fontes consultadas.'}</span>
                <small class="sigee-pep-fontes">Fontes verificadas: ${(marcos.fontesConsultadas || ['processos','historico_processos','logs_sigee']).map(escapar).join(' • ')}</small>
              </div>
            </section>
            <section><h3>Prazos</h3>
              <dl>
                <div><dt>Etapa atual</dt><dd>${escapar(etapa)}</dd></div>
                <div><dt>Início</dt><dd>${formatarData(inicio, false)}</dd></div>
                <div><dt>Tempo na etapa</dt><dd>${tempoEtapa} dias</dd></div>
                ${metricas?.deferred ? `<div><dt>Deferido até retirada</dt><dd>${tempoPosDeferimento} dias${metricas?.postDeferredFrozen ? ' (encerrado)' : ''}</dd></div>` : ''}
                <div><dt>Prazo final</dt><dd>${formatarData(prazoFinalCalculado, false)}${prazoEtapaCalculado?.vencido ? ' <strong class="sigee-pep-prazo-vencido">VENCIDO</strong>' : ''}</dd></div>
              </dl>
            </section>
            <section><h3>Responsáveis</h3>
              <dl>
                <div><dt>Analista</dt><dd>${escapar(valor(p,'analista','analista_nome') || 'Não atribuído')}</dd></div>
                <div><dt>Digitador</dt><dd>${escapar(valor(p,'digitador','digitador_nome') || 'Não atribuído')}</dd></div>
                <div><dt>Conferente</dt><dd>${escapar(valor(p,'conferente','conferente_nome') || 'Não atribuído')}</dd></div>
              </dl>
            </section>
            <section class="sigee-pep-selo"><b>Registro Institucional</b><span>Eventos auditáveis do SIGEE Enterprise</span><small>RC10.8.10</small></section>
          </aside>
        </div>
        <footer class="sigee-pep-rodape-impressao">
          <span>SIGEE — Sistema Integrado de Gestão de Escolas Extintas | Secretaria da Educação do Estado da Bahia</span>
          <strong>${escapar(codigo(p))}</strong>
        </footer>
      </div>
    </div>`;
  }

  let prontuarioAbertoId = null;

  async function abrir(id) {
    prontuarioAbertoId = id;
    const p = processo(id);
    if (!p) {
      alert('Processo não localizado para abertura do prontuário.');
      return;
    }
    fechar();
    const carregando = document.createElement('div');
    carregando.id = 'sigee-prontuario-overlay';
    carregando.className = 'sigee-pep-overlay sigee-pep-carregando';
    carregando.innerHTML = '<div><span></span><strong>Preparando Prontuário Eletrônico...</strong></div>';
    document.body.appendChild(carregando);
    document.body.classList.add('sigee-prontuario-aberto');

    const timeline = await carregarEventos(p);
    const eventos = timeline.eventos || [];
    const processoAtualizado = timeline.processo || p;
    carregando.outerHTML = modalHTML(processoAtualizado, eventos, timeline.marcos || {});

    const overlay = document.getElementById('sigee-prontuario-overlay');
    overlay?.querySelector('[data-pep-fechar]')?.addEventListener('click', fechar);
    overlay?.addEventListener('click', e => { if (e.target === overlay) fechar(); });
    overlay?.querySelectorAll('[data-pep-expandir]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.pepExpandir;
        const box = overlay.querySelector(`[data-pep-detalhes="${id}"]`);
        const aberto = box.classList.toggle('aberto');
        btn.textContent = aberto ? 'Ocultar detalhes' : 'Ver detalhes';
        btn.setAttribute('aria-expanded', String(aberto));
      });
    });
  }

  function renomearBotoes() {
    document.querySelectorAll('button').forEach(btn => {
      const onclick = btn.getAttribute('onclick') || '';
      const textoBotao = normalizar(btn.textContent);
      const ehHistorico = /abrirHistorico(SIGEE|ProcessoSIGEE)?\s*\(/i.test(onclick)
        || textoBotao === 'HISTORICO';

      if (!ehHistorico || btn.classList.contains('sigee-btn-prontuario')) return;

      btn.textContent = '📑 Prontuário';
      btn.classList.add('sigee-btn-prontuario');
    });
  }

  window.abrirProntuarioSIGEE = abrir;
  window.abrirHistoricoSIGEE = abrir;
  window.abrirHistoricoProcessoSIGEE = abrir;



  window.addEventListener('sigee:workflow-action-executed', function (event) {
    const processoId = event?.detail?.processoId;
    try { window.SIGEE6?.timelineService?.invalidar?.(processoId); } catch (_) {}
    if (prontuarioAbertoId == null || String(prontuarioAbertoId) !== String(processoId)) return;
    if (!document.getElementById('sigee-prontuario-overlay')) return;
    setTimeout(function () { abrir(processoId); }, 0);
  });

  window.addEventListener('sigee:workflow-clock-change', function () {
    if (prontuarioAbertoId == null || !document.getElementById('sigee-prontuario-overlay')) return;
    const id = prontuarioAbertoId;
    setTimeout(function () { abrir(id); }, 0);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('sigee-prontuario-overlay')) fechar();
  });

  let timerRenomeacao = null;
  const observadorProntuario = new MutationObserver(mudancas => {
    if (document.hidden) return;
    const relevante = mudancas.some(m => [...m.addedNodes].some(no =>
      no.nodeType === 1 && (no.matches?.('button,[id*="prontuario"],[class*="prontuario"]') || no.querySelector?.('button,[id*="prontuario"],[class*="prontuario"]'))
    ));
    if (!relevante) return;
    clearTimeout(timerRenomeacao);
    timerRenomeacao = setTimeout(() => { timerRenomeacao = null; renomearBotoes(); }, 100);
  });
  observadorProntuario.observe(document.body || document.documentElement, { childList:true, subtree:true });
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', renomearBotoes)
    : renomearBotoes();

  console.info('[SIGEE RC10.8.7] Prontuário consolidado com processo recarregado, relógio de homologação e resolvedor temporal único.');
})();
