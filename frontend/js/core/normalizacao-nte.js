/* SIGEE RC4.6.8 — Normalização territorial e vínculo da escola */
(function (window) {
  'use strict';

  function normalizarNte(valor) {
    const texto = valor == null ? '' : String(valor).trim();
    if (!texto) return '';
    if (/^SEC\b/i.test(texto) || /TODOS\s+OS\s+NTE/i.test(texto)) return texto;
    const match = texto.match(/(?:NTE\s*[- ]?\s*)?(\d{1,2})/i);
    if (!match) return texto;
    const numero = Number(match[1]);
    if (!Number.isInteger(numero) || numero < 1 || numero > 27) return texto;
    return `NTE-${String(numero).padStart(2, '0')}`;
  }


  const NOMES_OFICIAIS_NTE = Object.freeze({
    1:'Irecê',2:'Bom Jesus da Lapa',3:'Seabra',4:'Serrinha',5:'Itabuna',
    6:'Valença',7:'Teixeira de Freitas',8:'Itapetinga',9:'Amargosa',10:'Juazeiro',
    11:'Barreiras',12:'Macaúbas',13:'Caetité',14:'Itaberaba',15:'Ipirá',
    16:'Jacobina',17:'Ribeira do Pombal',18:'Alagoinhas',19:'Feira de Santana',
    20:'Vitória da Conquista',21:'Santo Antônio de Jesus',22:'Jequié',
    23:'Santa Maria da Vitória',24:'Paulo Afonso',25:'Senhor do Bonfim',
    26:'Salvador',27:'Eunápolis'
  });

  function rotuloNte(valor) {
    const normalizado = normalizarNte(valor);
    const match = String(normalizado || '').match(/NTE-(\d{2})/i);
    if (!match) return normalizado || String(valor || '').trim();
    const numero = Number(match[1]);
    const sede = NOMES_OFICIAIS_NTE[numero];
    return sede ? `${normalizado} (${sede})` : normalizado;
  }

  function localizarEscola(processo) {
    const id = processo && (processo.escola_id || processo.escolaId);
    const nome = String(processo && (processo.escola_nome || processo.escola || processo.nome_escola) || '').trim().toUpperCase();
    const selecionada = window.SIGEE_ESCOLA_NOVA_SOLICITACAO;
    if (selecionada && (!id || String(selecionada.id || selecionada.escola_id) === String(id))) return selecionada;
    const bases = [window.escolasDB, window.escolas, window.SIGEE_DADOS?.escolas?.()].filter(Array.isArray);
    for (const base of bases) {
      const escola = base.find(e => (id && String(e.id || e.escola_id) === String(id)) || (nome && String(e.nome_escola || e.nome || e.escola || '').trim().toUpperCase() === nome));
      if (escola) return escola;
    }
    return null;
  }

  function nteDoProcesso(processo) {
    const escola = localizarEscola(processo || {});
    return normalizarNte(
      (escola && (escola.nte || escola.nte_nome || escola.nte_id)) ||
      (processo && (processo.nte || processo.nte_nome || processo.nte_id)) ||
      ''
    );
  }

  function normalizarPayload(payload, origem) {
    if (!payload || typeof payload !== 'object') return payload;
    const nte = nteDoProcesso(origem || payload) || normalizarNte(payload.nte);
    if (nte) payload.nte = nte;
    else if (Object.prototype.hasOwnProperty.call(payload, 'nte')) payload.nte = null;
    return payload;
  }

  window.SIGEE_NORMALIZACAO_NTE = Object.freeze({
    normalizar: normalizarNte,
    aplicarPayload: normalizarPayload,
    localizarEscola,
    nteDoProcesso,
    rotulo: rotuloNte,
    nomes: NOMES_OFICIAIS_NTE
  });
  window.normalizarNteSIGEE = normalizarNte;
  window.rotuloNteSIGEE = rotuloNte;
})(window);
