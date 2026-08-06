/* =====================================================================
   SIGEE Enterprise — RC10.8.34
   Motor único de prazo por etapa e congelamento temporal.

   Regras homologadas:
   - ciclo de Desarquivamento: contado desde a abertura, conforme motor temporal;
   - Análise: 7 dias; Digitação: 15; Conferência: 10; Assinatura: 7;
   - Pendência e fases sem SLA: sem prazo e sem selo VENCIDO;
   - o dia de entrada na etapa é DIA 1;
   - vencimento somente quando diasNaEtapa > prazoEtapa;
   - deferimento congela a contagem normal e inicia a espera para retirada;
   - retirada congela definitivamente todo o tempo do processo.
   ===================================================================== */
(function (global) {
  'use strict';
  if (global.SIGEE_PRAZO_ETAPA?.versao === 'RC10.8.34') return;

  const DIA_MS = 86400000;
  const normalizar = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  const PRAZOS_OFICIAIS = Object.freeze({ ANALISE: 7, DIGITACAO: 15, CONFERENCIA: 10, ASSINATURA: 7, DESARQUIVAMENTO: 30 });

  function dataCivil(valor) {
    if (!valor) return null;
    if (valor instanceof Date) {
      if (Number.isNaN(valor.getTime())) return null;
      return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
    }
    const texto = String(valor).trim();
    let m = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    const d = new Date(texto);
    return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function etapaNormalizada(processoOuEtapa) {
    if (typeof processoOuEtapa === 'string') return normalizar(processoOuEtapa);
    return normalizar(processoOuEtapa?.etapa_atual || processoOuEtapa?.etapa || processoOuEtapa?.fase_atual);
  }

  function prazoPadrao(etapa) {
    const e = etapaNormalizada(etapa);
    if (e.includes('PEND')) return null;
    if (e.includes('ANAL')) return PRAZOS_OFICIAIS.ANALISE;
    if (e.includes('DIGIT')) return PRAZOS_OFICIAIS.DIGITACAO;
    if (e.includes('CONFER')) return PRAZOS_OFICIAIS.CONFERENCIA;
    if (e.includes('ASSIN')) return PRAZOS_OFICIAIS.ASSINATURA;
    if (e.includes('DESARQ')) return PRAZOS_OFICIAIS.DESARQUIVAMENTO;
    return null;
  }

  function inicioEtapa(processo) {
    const e = etapaNormalizada(processo);
    if (e.includes('AGUARD') || e === 'DEFERIDO') {
      return processo?.deferido_em || processo?.data_etapa_atual || processo?.prazo_inicio || null;
    }
    return processo?.data_etapa_atual
      || processo?.etapa_iniciada_em
      || processo?.prazo_inicio
      || processo?.data_etapa
      || null;
  }

  function fimContagemEtapa(processo, referencia) {
    const e = etapaNormalizada(processo);
    if (e.includes('RETIR')) return processo?.retirado_em || processo?.finalizado_em || referencia;
    if (e.includes('INDEFER')) return processo?.finalizado_em || referencia;
    return referencia;
  }

  function calcular(processo, referencia = new Date()) {
    const etapa = etapaNormalizada(processo);
    const inicio = dataCivil(inicioEtapa(processo));
    const fim = dataCivil(fimContagemEtapa(processo, referencia)) || dataCivil(new Date());
    // A etapa atual é a autoridade. prazo_etapa persistido é apenas informativo/legado.
    const prazoEtapa = prazoPadrao(etapa);

    if (!inicio) {
      return { etapa, inicio: null, diasNaEtapa: 0, prazoEtapa, prazoFinal: null, vencido: false, venceHoje: false, situacao: 'SEM DATA DE ENTRADA' };
    }

    const diferenca = Math.floor((fim.getTime() - inicio.getTime()) / DIA_MS);
    const diasNaEtapa = Math.max(1, diferenca + 1);
    const prazoFinal = prazoEtapa ? new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + prazoEtapa - 1) : null;
    const vencido = prazoEtapa != null && diasNaEtapa > prazoEtapa;
    const venceHoje = prazoEtapa != null && diasNaEtapa === prazoEtapa;

    let situacao = 'SEM PRAZO';
    if (etapa.includes('RETIR')) situacao = 'FINALIZADO';
    else if (etapa.includes('INDEFER')) situacao = 'FINALIZADO';
    else if (etapa.includes('AGUARD') || etapa === 'DEFERIDO') situacao = 'AGUARDANDO RETIRADA';
    else if (vencido) situacao = 'VENCIDO';
    else if (venceHoje) situacao = 'VENCE HOJE';
    else if (prazoEtapa) situacao = 'DENTRO DO PRAZO';

    return { etapa, inicio, fim, diasNaEtapa, prazoEtapa, prazoFinal, vencido, venceHoje, situacao };
  }

  global.SIGEE_PRAZO_ETAPA = Object.freeze({
    versao: 'RC10.8.34', PRAZOS_OFICIAIS, dataCivil, etapaNormalizada, prazoPadrao, inicioEtapa, calcular
  });
})(window);
