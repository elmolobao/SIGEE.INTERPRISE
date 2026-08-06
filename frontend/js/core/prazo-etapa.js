/* =====================================================================
   SIGEE Enterprise — RC10.8.30
   Motor único de prazo por etapa.

   Regra homologada:
   - o dia de entrada na etapa é contabilizado como DIA 1;
   - o processo permanece no prazo enquanto diasNaEtapa <= prazoEtapa;
   - torna-se VENCIDO somente quando diasNaEtapa > prazoEtapa.
   ===================================================================== */
(function (global) {
  'use strict';
  if (global.SIGEE_PRAZO_ETAPA?.versao === 'RC10.8.30') return;

  const DIA_MS = 86400000;
  const normalizar = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();

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

  function prazoPadrao(etapa) {
    const e = normalizar(etapa);
    if (e.includes('ANAL')) return 7;
    if (e.includes('DIGIT')) return 15;
    if (e.includes('CONFER')) return 10;
    if (e.includes('ASSIN')) return 7;
    if (e.includes('DESARQ')) return 30;
    return null;
  }

  function inicioEtapa(processo) {
    return processo?.data_etapa_atual
      || processo?.etapa_iniciada_em
      || processo?.prazo_inicio
      || processo?.data_etapa
      || null;
  }

  function calcular(processo, referencia = new Date()) {
    const inicio = dataCivil(inicioEtapa(processo));
    const hoje = dataCivil(referencia) || dataCivil(new Date());
    const persistido = Number(processo?.prazo_etapa);
    const prazoEtapa = Number.isFinite(persistido) && persistido > 0
      ? persistido
      : prazoPadrao(processo?.etapa_atual || processo?.etapa || processo?.fase_atual);

    if (!inicio) {
      return { inicio: null, diasNaEtapa: 0, prazoEtapa, prazoFinal: null, vencido: false, venceHoje: false, situacao: 'SEM DATA DE ENTRADA' };
    }

    const diferenca = Math.floor((hoje.getTime() - inicio.getTime()) / DIA_MS);
    const diasNaEtapa = Math.max(1, diferenca + 1);
    const prazoFinal = prazoEtapa ? new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + prazoEtapa - 1) : null;
    const vencido = prazoEtapa != null && diasNaEtapa > prazoEtapa;
    const venceHoje = prazoEtapa != null && diasNaEtapa === prazoEtapa;

    return {
      inicio,
      diasNaEtapa,
      prazoEtapa,
      prazoFinal,
      vencido,
      venceHoje,
      situacao: vencido ? 'VENCIDO' : (venceHoje ? 'VENCE HOJE' : (prazoEtapa ? 'DENTRO DO PRAZO' : 'SEM PRAZO'))
    };
  }

  global.SIGEE_PRAZO_ETAPA = Object.freeze({ versao: 'RC10.8.30', dataCivil, prazoPadrao, inicioEtapa, calcular });
})(window);
