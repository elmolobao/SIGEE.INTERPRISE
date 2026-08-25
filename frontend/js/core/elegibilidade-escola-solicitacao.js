/* SIGEE RC11.3.11 — Autoridade única de elegibilidade da escola para Nova Solicitação */
(function () {
  'use strict';

  const texto = (v) => (v == null ? '' : String(v).trim());
  const norm = (v) => texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  const placeholder = (v) => ['', 'SELECIONE', 'NAO INFORMADO', 'NÃO INFORMADO', '-', 'NULL'].includes(norm(v));

  function formatar(escola) {
    const e = escola || {};
    return {
      ...e,
      id: texto(e.id || e.escola_id),
      nome: texto(e.nome_escola || e.nome || e.escola),
      cod_mec: texto(e.cod_mec),
      municipio: texto(e.municipio),
      nte_id: Number(e.nte_id || 0) || null,
      dependencia: texto(e.dependencia_adm || e.dependencia),
      situacao: texto(e.situacao_funcional || e.situacao),
      acervo: texto(e.acervo),
      status_acervo: texto(e.status_acervo),
      ativoOriginal: e.ativo,
      ativo: e.ativo !== false
    };
  }

  /* Regra homologada: `acervo` é o campo canônico. `status_acervo` é fallback
     apenas quando `acervo` estiver vazio/placeholder, evitando rejeitar legado
     incompleto sem transformar um status contraditório em autoridade. */
  function acervoCanonico(escola) {
    const e = formatar(escola);
    if (!placeholder(e.acervo)) return e.acervo;
    return e.status_acervo;
  }

  function situacaoNtePermitida(valor) {
    const s = norm(valor);
    return s === 'EXTINTA' || s === 'PARALISADA';
  }

  function ehRecolhido(valor) {
    return norm(valor) === 'RECOLHIDO';
  }

  function contextoUsuario(usuario) {
    const u = usuario || {};
    let tipo = norm(u.unidade_tipo || u.unidadeTipo || '');
    if (!tipo) {
      const p = norm(u.perfil || '');
      tipo = p === 'MASTER' ? 'GLOBAL' : p === 'SEC' ? 'SEC' : 'NTE';
    }
    const nteId = Number(u.nte_id || u.nteId || 0) || null;
    const escolaId = Number(u.escola_id || u.escolaId || 0) || null;
    return { tipo, nteId, escolaId };
  }

  function validar(escola, contexto) {
    const e = formatar(escola);
    const c = contexto || {};
    const tipo = norm(c.tipo || c.unidade_tipo || 'NTE');
    const nteId = Number(c.nteId || c.nte_id || 0) || null;
    const escolaId = Number(c.escolaId || c.escola_id || 0) || null;

    if (!e.id || !e.nome) return { ok: false, codigo: 'ESCOLA_INVALIDA', motivo: 'Registro de escola incompleto.' };
    if (e.ativoOriginal === false) return { ok: false, codigo: 'ESCOLA_DESABILITADA', motivo: 'A escola está desabilitada no catálogo.' };

    if (tipo === 'ESCOLA') {
      if (!escolaId || Number(e.id) !== escolaId) return { ok: false, codigo: 'OUTRA_ESCOLA', motivo: 'Esta conta só pode abrir processos para a própria unidade escolar.' };
      if (norm(e.dependencia) !== 'ESTADUAL' || norm(e.situacao) !== 'ATIVA') return { ok: false, codigo: 'UNIDADE_ESCOLAR_INAPTA', motivo: 'A unidade vinculada precisa permanecer Estadual e Ativa.' };
      return { ok: true, codigo: 'ESCOLA_ATIVA', acervoCanonico: acervoCanonico(e) };
    }

    if (tipo === 'NTE') {
      if (!nteId || Number(e.nte_id) !== nteId) return { ok: false, codigo: 'OUTRO_NTE', motivo: 'A escola não pertence ao NTE deste usuário.' };
      if (!situacaoNtePermitida(e.situacao)) return { ok: false, codigo: 'SITUACAO_NAO_PERMITIDA', motivo: 'Para usuários de NTE, a escola deve estar Extinta ou Paralisada.' };
      const acervo = acervoCanonico(e);
      if (!ehRecolhido(acervo)) return { ok: false, codigo: 'ACERVO_NAO_RECOLHIDO', motivo: 'A escola precisa estar com o acervo oficialmente Recolhido.' };
      return { ok: true, codigo: norm(e.situacao) === 'PARALISADA' ? 'PARALISADA_RECOLHIDA' : 'EXTINTA_RECOLHIDA', acervoCanonico: acervo };
    }

    // GLOBAL/SEC preservam a operação administrativa; as demais proteções continuam ativas.
    return { ok: true, codigo: 'GLOBAL', acervoCanonico: acervoCanonico(e) };
  }

  function filtrar(lista, contexto) {
    return (Array.isArray(lista) ? lista : []).filter((e) => validar(e, contexto).ok);
  }

  window.SIGEE_ELEGIBILIDADE_ESCOLA = Object.freeze({
    versao: 'RC11.3.11',
    formatar,
    normalizar: norm,
    acervoCanonico,
    situacaoNtePermitida,
    ehRecolhido,
    contextoUsuario,
    validar,
    filtrar
  });
})();
