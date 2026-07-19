/* SIGEE Enterprise 1.0 RC2 — autoridade final de perfis, dados e workflow */
(function (window) {
  'use strict';

  const PERFIS = Object.freeze({
    MASTER: 'Master', SEC: 'SEC', GESTOR: 'Gestor', ADMIN: 'Administrador',
    TECNICO: 'Técnico', ESTAGIARIO: 'Estagiário', CONSULTA: 'Consulta'
  });

  function semAcento(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  }

  function normalizarPerfil(valor) {
    const p = semAcento(valor);
    if (p === 'MASTER' || p.includes('MASTER')) return PERFIS.MASTER;
    if (p === 'SEC' || p.includes('SECRETARIA')) return PERFIS.SEC;
    if (p.includes('GESTOR') || p.includes('DIRIGENTE')) return PERFIS.GESTOR;
    if (p.includes('ADMINISTRATOR') || p.includes('ADMINISTRADOR') || p === 'ADMIN') return PERFIS.ADMIN;
    if (p.includes('ESTAG')) return PERFIS.ESTAGIARIO;
    if (p.includes('CONSULT')) return PERFIS.CONSULTA;
    if (p.includes('TECNIC')) return PERFIS.TECNICO;
    return valor ? String(valor).trim() : PERFIS.CONSULTA;
  }

  function perfilAtual() {
    return normalizarPerfil((window.usuarioLogado || {}).perfil);
  }

  function podeOperarWorkflow() {
    return [PERFIS.MASTER, PERFIS.ADMIN, PERFIS.TECNICO].includes(perfilAtual());
  }

  function texto(v) { return String(v == null ? '' : v).trim(); }
  function etapa(p) { return texto(p && p.etapa_atual) || texto(p && p.etapa) || 'Desarquivamento'; }
  function migrado(p) { return Boolean(p && (p.processo_migrado || semAcento(p.origem_registro).includes('MIGRA'))); }

  function responsavelExibicao(p) {
    const r = texto(p && (
      p.tecnico_responsavel_nome || p.tecnico_responsavel || p.responsavel_nome || p.responsavel ||
      p.analista_nome || p.analista || p.digitador_nome || p.digitador || p.conferente_nome || p.conferente ||
      p.responsavel_assinatura_nome || p.responsavel_assinatura || p.enviado_assinatura_por
    ));
    return r || (migrado(p) ? 'Migrado' : 'Atribuição pendente');
  }

  function modalidadeExibicao(p) {
    const valores = [p && p.modalidade, p && p.nivel_oferta]
      .map(texto).filter(Boolean)
      .filter((v, i, a) => a.findIndex(x => semAcento(x) === semAcento(v)) === i);
    return valores.join(' / ') || 'Não informado';
  }

  function validarDestino(p) {
    const e = semAcento(etapa(p));
    if (!podeOperarWorkflow() && !migrado(p)) {
      throw new Error('Seu perfil possui acesso somente para consulta e não pode movimentar processos.');
    }
    if (e === 'PENDENCIA') {
      const itens = [...(p.pendencia_aluno_itens || []), ...(p.pendencia_instituicao_itens || [])];
      if (!itens.length || !p.pendencia_aberta) throw new Error('Para registrar Pendência, selecione ao menos um item e confirme a abertura da pendência.');
    }
    if (e === 'DIGITACAO') {
      if (!texto(p.digitador || p.digitador_nome || p.tecnico_responsavel)) throw new Error('Selecione o responsável pela Digitação.');
    }
    if (e === 'CONFERENCIA') {
      if (!texto(p.conferente || p.conferente_nome || p.tecnico_responsavel)) throw new Error('Selecione o responsável pela Conferência.');
    }
    if (e === 'ASSINATURA') {
      if (!texto(p.enviado_assinatura_por || p.responsavel_assinatura || p.tecnico_responsavel)) throw new Error('Registre o responsável pelo envio para Assinatura.');
    }
    if (e === 'AGUARDANDO RETIRADA' && !p.deferido_em) throw new Error('O deferimento deve ser confirmado antes de disponibilizar o documento para retirada.');
    if (e === 'RETIRADO' && !p.finalizado_em) throw new Error('A retirada precisa ser concluída antes de finalizar o processo.');
    if (e === 'INDEFERIDO' && !texto(p.motivo_indeferimento || p.justificativa_indeferimento)) throw new Error('Informe o motivo ou a justificativa do indeferimento.');
    return true;
  }

  function instalarSalvamentoSeguro() {
    const api = window.SIGEE_Processos;
    if (!api || typeof api.salvar !== 'function' || api.salvar.__SIGEE_RC2__) return false;
    const original = api.salvar.bind(api);
    const seguro = async function (p) {
      if (!p || typeof p !== 'object') throw new Error('Processo inválido.');
      p.etapa_atual = etapa(p);
      validarDestino(p);
      // "etapa" permanece apenas como alias visual legado; nunca é enviada ao banco pelo payload oficial.
      const resultado = await original(p);
      return resultado;
    };
    seguro.__SIGEE_RC2__ = true;
    api.salvar = seguro;
    return true;
  }

  function reinstalarWorkflowConsolidado() {
    const wf = window.SIGEE_WORKFLOW_093;
    if (!wf) return false;
    if (typeof wf.abrirAnalise === 'function') window.abrirAnaliseSIGEE = wf.abrirAnalise;
    if (typeof wf.abrirEncaminharDigitacaoAnalise === 'function') {
      window.abrirEncaminharDigitacaoSIGEE = wf.abrirEncaminharDigitacaoAnalise;
      window.abrirEncaminharDigitacaoAnaliseSIGEE = wf.abrirEncaminharDigitacaoAnalise;
    }
    if (typeof wf.abrirEncaminharDigitacaoPendencia === 'function') {
      window.abrirEncaminharDigitacaoPendenciaSIGEE = wf.abrirEncaminharDigitacaoPendencia;
    }
    if (typeof wf.abrirDigitacao === 'function') window.abrirModalFluxoDigitacao = wf.abrirDigitacao;
    if (typeof wf.abrirConferencia === 'function') window.abrirModalFluxoConferencia = wf.abrirConferencia;
    if (typeof wf.abrirAssinatura === 'function') window.abrirModalFluxoAssinatura = wf.abrirAssinatura;
    if (typeof wf.abrirRetirada === 'function') window.abrirModalFluxoAguardando = wf.abrirRetirada;
    return true;
  }

  function normalizarSessao() {
    if (window.usuarioLogado && window.usuarioLogado.perfil) {
      window.usuarioLogado.perfil = normalizarPerfil(window.usuarioLogado.perfil);
    }
  }

  function instalar() {
    normalizarSessao();
    instalarSalvamentoSeguro();
    reinstalarWorkflowConsolidado();
  }

  window.SIGEE_CORE_RC2 = Object.freeze({
    PERFIS, normalizarPerfil, perfilAtual, podeOperarWorkflow,
    validarDestino, responsavelExibicao, modalidadeExibicao, instalar
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar, { once: true });
  else instalar();
  window.addEventListener('load', instalar, { once: true });
  window.addEventListener('sigee:usuario-autenticado', instalar);
  window.addEventListener('sigee:perfil-atualizado', instalar);
})(window);
