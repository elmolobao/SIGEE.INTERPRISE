/* =====================================================================
 * SIGEE RC10.8.12 — Alerta único de processos vencidos no login
 *
 * Um único popup obrigatório, exibido uma vez por login, com dois blocos:
 * 1) Ciclo de Desarquivamento: somente a ação atual ainda não executada;
 * 2) Fluxo Operacional: somente etapas produtivas com prazo vencido.
 *
 * Regras preservadas:
 * - Retificação reinicia o ciclo de Desarquivamento e seus marcos;
 * - procedimentos já executados ou dispensados não são inferidos como pendentes;
 * - Pendência do Aluno não é contabilizada;
 * - Pendência da Instituição não possui vencimento e não é contabilizada;
 * - o ciclo produtivo termina no Deferimento;
 * - Deferido → Retirado é apenas medição estatística, sem vencimento/alerta.
 * ===================================================================== */
(function (window, document) {
  'use strict';

  if (window.__SIGEE_POPUP_PRAZOS_LOGIN_RC10812__) return;
  window.__SIGEE_POPUP_PRAZOS_LOGIN_RC10812__ = true;

  const VERSION = 'RC10.8.12';
  const LIMITES_OPERACIONAIS = Object.freeze({
    ANALISE: 7,
    DIGITACAO: 15,
    CONFERENCIA: 10,
    ASSINATURA: 7
  });
  const ORDEM_DESARQUIVAMENTO = ['REITERACAO', 'REITERACAO_URGENTE', 'CONFIRMACAO_DADOS', 'SOLICITACAO_ATAS'];
  const ORDEM_OPERACIONAL = ['ANALISE', 'DIGITACAO', 'CONFERENCIA', 'ASSINATURA'];

  let loginEmProcessamento = false;
  let popupExibidoNesteLogin = false;
  let tokenLogin = 0;

  function texto(v) { return v == null ? '' : String(v).trim(); }
  function normalizar(v) {
    return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[\s_-]+/g, ' ').trim();
  }
  function perfilOperacional(u) {
    const perfil = normalizar(u && (u.perfil || u.role || u.tipo));
    return ['TECN', 'ADMIN', 'MASTER', 'SEC'].some(item => perfil.includes(item));
  }
  function perfilMaster(u) { return normalizar(u && (u.perfil || u.role || u.tipo)).includes('MASTER'); }
  function statusRelogio() {
    try { return window.SIGEE_WORKFLOW_CLOCK?.status?.() || { enabled: false }; } catch (_) { return { enabled: false }; }
  }
  function emHomologacaoMaster(u) { return perfilMaster(u) && statusRelogio().enabled === true; }
  function agoraWorkflow() {
    try { return window.SIGEE_WORKFLOW_CLOCK?.now?.() || new Date(); } catch (_) { return new Date(); }
  }
  function nteCanonico(v) {
    const bruto = normalizar(v);
    const digitos = bruto.match(/\d+/g);
    if (digitos && digitos.length) return String(Number(digitos.join('')));
    return bruto.replace(/[^A-Z0-9]/g, '');
  }
  function mesmoNte(a, b) { return Boolean(nteCanonico(a)) && nteCanonico(a) === nteCanonico(b); }
  function usuarioAtual(detail) {
    return (detail && detail.usuario) || window.usuarioLogado || window.SIGEE_SESSION?.getUser?.() || null;
  }
  function listaProcessos() {
    try {
      if (window.SIGEE_Processos?.listar) return window.SIGEE_Processos.listar() || [];
      if (Array.isArray(window.processosDB)) return window.processosDB;
    } catch (_) {}
    return [];
  }
  function inicioDia(v) {
    const d = v instanceof Date ? new Date(v.getTime()) : new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function diasDecorridos(base, referencia) {
    const a = inicioDia(base), b = inicioDia(referencia || new Date());
    if (!a || !b) return null;
    return Math.floor((b.getTime() - a.getTime()) / 86400000);
  }
  function ciclo(p) { return Math.max(1, Number(p && (p.workflow_ciclo || p.ciclo) || 1)); }
  function instancia(p) { return texto(p && p.workflow_instance_id); }

  function valoresEtapa(p) {
    return [p?.etapa_atual, p?.etapa_codigo, p?.etapa, p?.fase_atual].map(normalizar).filter(Boolean);
  }
  function estadoAtualDoProcesso(p) {
    try {
      const r = window.SIGEE_WORKFLOW_TEMPORAL?.resolve?.(p);
      return {
        codigo: normalizar(r?.code || r?.codigo || r?.etapaCodigo || r?.stateCode || p?.etapa_codigo || p?.etapa_atual),
        nome: texto(r?.name || r?.nome || r?.etapaNome || r?.stateName || p?.etapa_atual || p?.etapa || p?.fase_atual)
      };
    } catch (_) {
      return { codigo: normalizar(p?.etapa_codigo || p?.etapa_atual), nome: texto(p?.etapa_atual || p?.etapa || p?.fase_atual) };
    }
  }
  function etapaTerminalOuPosDeferimento(p) {
    const valores = [...valoresEtapa(p), normalizar(p?.status), normalizar(p?.situacao), normalizar(p?.situacao_atual)];
    return valores.some(e =>
      e === 'DEF' || e.includes('DEFERID') || e.includes('AGUARDANDO RETIRADA') ||
      e === 'RETIRADO' || e.includes('RETIRAD') || e === 'IND' || e.includes('INDEFERID') ||
      e.includes('CONCLUID') || e.includes('ENCERRAD') || e.includes('ARQUIVAD') ||
      e.includes('CANCELAD') || e.includes('EXCLUID')
    );
  }
  function dentroEscopo(p, usuario) {
    if (perfilMaster(usuario) || normalizar(usuario?.perfil).includes('SEC')) return true;
    return mesmoNte(p?.nte || p?.nte_nome, usuario?.nte || usuario?.nte_nome);
  }

  function etapaDesarquivamento(estado) {
    const e = normalizar(`${estado?.codigo || ''} ${estado?.nome || ''}`);
    if (e === 'RET' || (e.includes('REITERACAO') && !e.includes('URGENTE'))) return 'REITERACAO';
    if (e === 'REU' || e.includes('REITERACAO URGENTE')) return 'REITERACAO_URGENTE';
    if (e === 'CFD' || e.includes('CONFIRMACAO')) return 'CONFIRMACAO_DADOS';
    if (e === 'PAS' || e === 'PAT' || e.includes('PEDIDO DE ATAS') || e.includes('SOLICITACAO DE ATAS') || e.includes('ATAS SEM PASTA')) return 'SOLICITACAO_ATAS';
    return null;
  }
  function etapaOperacional(estado) {
    const e = normalizar(`${estado?.codigo || ''} ${estado?.nome || ''}`);
    if (e === 'ANA' || e.includes('ANALISE')) return 'ANALISE';
    if (e === 'DIG' || e.includes('DIGITACAO')) return 'DIGITACAO';
    if (e === 'CON' || e.includes('CONFERENCIA')) return 'CONFERENCIA';
    if (e === 'ASS' || e.includes('ASSINATURA')) return 'ASSINATURA';
    // Pendência do aluno e da instituição são deliberadamente excluídas.
    return null;
  }
  function dataEntradaEtapa(p) {
    return p?.data_etapa_atual || p?.etapa_iniciada_em || p?.inicio_etapa || p?.prazo_inicio || p?.updated_at || p?.created_at || p?.criado_em;
  }

  async function aguardarProcessos(token) {
    for (let i = 0; i < 120; i += 1) {
      if (token !== tokenLogin) return [];
      const lista = listaProcessos();
      if (lista.length) return lista;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return listaProcessos();
  }

  function resumoVazio() {
    return {
      desarquivamento: { REITERACAO:0, REITERACAO_URGENTE:0, CONFIRMACAO_DADOS:0, SOLICITACAO_ATAS:0 },
      operacional: { ANALISE:0, DIGITACAO:0, CONFERENCIA:0, ASSINATURA:0 },
      ids: [], total: 0
    };
  }

  async function obterResumo(usuario, token) {
    const processos = await aguardarProcessos(token);
    const resumo = resumoVazio();

    for (const p of processos) {
      if (!p || p.ativo === false || etapaTerminalOuPosDeferimento(p) || !dentroEscopo(p, usuario)) continue;
      const estado = estadoAtualDoProcesso(p);

      // Desarquivamento: conta somente a ação/etapa atual. Não presume que uma
      // ação dispensada deveria ter sido registrada. O resolvedor temporal já
      // considera a âncora do ciclo atual, inclusive o reinício por Retificação.
      const des = etapaDesarquivamento(estado);
      if (des) {
        resumo.desarquivamento[des] += 1;
        resumo.ids.push(p.id);
        continue;
      }

      // Fluxo produtivo: somente etapas com SLA definido e efetivamente vencidas.
      const op = etapaOperacional(estado);
      if (!op) continue;
      const dias = diasDecorridos(dataEntradaEtapa(p), agoraWorkflow());
      const limite = LIMITES_OPERACIONAIS[op];
      if (dias != null && dias > limite) {
        resumo.operacional[op] += 1;
        resumo.ids.push(p.id);
      }
    }

    resumo.total = ORDEM_DESARQUIVAMENTO.reduce((s,k)=>s+resumo.desarquivamento[k],0) +
      ORDEM_OPERACIONAL.reduce((s,k)=>s+resumo.operacional[k],0);
    return resumo;
  }

  function escapar(v) {
    return texto(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function removerPopup() { document.getElementById('sigee-popup-prazos-login')?.remove(); }

  async function registrarCiencia(usuario, resumo) {
    const instante = new Date().toISOString();
    const payload = {
      tipo: 'CIENCIA_ALERTA_UNICO_LOGIN', versao: VERSION,
      nte: usuario?.nte || usuario?.nte_nome || null,
      ciclo_desarquivamento: resumo.desarquivamento,
      fluxo_operacional_vencido: resumo.operacional,
      total: resumo.total,
      processos_considerados: [...new Set(resumo.ids)].length,
      sessao_id: window.SIGEE_SESSAO_ID || null,
      confirmado_em: instante
    };

    if (typeof window.registrarLog !== 'function') {
      throw new Error('Serviço de auditoria indisponível.');
    }
    await window.registrarLog('CIÊNCIA — ALERTA DE PROCESSOS VENCIDOS', JSON.stringify(payload), {
      modulo: 'workflow', tipo: 'CIENCIA_ALERTA_UNICO_LOGIN', nte: payload.nte
    });
    return true;
  }

  const ROTULOS = Object.freeze({
    REITERACAO:'Reiteração', REITERACAO_URGENTE:'Reiteração com Urgência',
    CONFIRMACAO_DADOS:'Confirmação dos Dados da Busca', SOLICITACAO_ATAS:'Solicitação de Atas de Resultados Finais',
    ANALISE:'Análise', DIGITACAO:'Digitação', CONFERENCIA:'Conferência', ASSINATURA:'Assinatura'
  });
  function linhas(grupo, ordem) {
    return ordem.map(k => `
      <div class="sigee-alerta-linha">
        <span>${escapar(ROTULOS[k])}</span><i aria-hidden="true"></i><strong>${String(grupo[k] || 0).padStart(2,'0')}</strong>
      </div>`).join('');
  }

  function exibirPopup(usuario, resumo) {
    removerPopup();
    const overlay = document.createElement('div');
    overlay.id = 'sigee-popup-prazos-login';
    overlay.className = 'sigee-prazos-login-overlay';
    overlay.innerHTML = `
      <section class="sigee-prazos-login-modal" role="dialog" aria-modal="true" aria-labelledby="sigee-prazos-login-titulo">
        <header>
          <span class="sigee-prazos-login-selo">ALERTA</span>
          <h2 id="sigee-prazos-login-titulo">Processos vencidos</h2>
          <p>Existem ações pendentes no ${escapar(usuario?.nte || usuario?.nte_nome || 'escopo atual')}.</p>
        </header>

        <div class="sigee-alerta-bloco">
          <h3>ALERTA 01 — Ciclo de Desarquivamento</h3>
          <div class="sigee-alerta-linhas">${linhas(resumo.desarquivamento, ORDEM_DESARQUIVAMENTO)}</div>
        </div>

        <div class="sigee-alerta-bloco">
          <h3>ALERTA 02 — Fluxo Operacional</h3>
          <p>Processos com prazo operacional vencido.</p>
          <div class="sigee-alerta-linhas">${linhas(resumo.operacional, ORDEM_OPERACIONAL)}</div>
        </div>

        <label class="sigee-prazos-login-ciencia">
          <input type="checkbox" id="sigee-prazos-login-checkbox">
          <span>Declaro ciência das informações apresentadas.</span>
        </label>
        <p class="sigee-prazos-login-erro" id="sigee-prazos-login-erro" hidden></p>
        <footer><button type="button" id="sigee-prazos-login-confirmar" disabled>Confirmar ciência</button></footer>
      </section>`;
    document.body.appendChild(overlay);

    const checkbox = overlay.querySelector('#sigee-prazos-login-checkbox');
    const confirmar = overlay.querySelector('#sigee-prazos-login-confirmar');
    const erro = overlay.querySelector('#sigee-prazos-login-erro');
    checkbox.addEventListener('change', () => { confirmar.disabled = !checkbox.checked; });
    confirmar.addEventListener('click', async () => {
      if (!checkbox.checked) return;
      confirmar.disabled = true;
      confirmar.textContent = 'Registrando ciência...';
      erro.hidden = true;
      try {
        await registrarCiencia(usuario, resumo);
        removerPopup();
      } catch (e) {
        erro.textContent = 'Não foi possível registrar a ciência. Verifique a conexão e tente novamente.';
        erro.hidden = false;
        confirmar.disabled = false;
        confirmar.textContent = 'Confirmar ciência';
        console.error('[SIGEE Alerta Login] Ciência não registrada:', e);
      }
    });
  }

  async function processarLogin(usuario, token) {
    loginEmProcessamento = true;
    try {
      const resumo = await obterResumo(usuario, token);
      if (token !== tokenLogin || popupExibidoNesteLogin) return;
      if (resumo.total > 0) {
        popupExibidoNesteLogin = true;
        exibirPopup(usuario, resumo);
      }
    } catch (erro) {
      console.error('[SIGEE Alerta Login] Falha ao montar alerta:', erro);
    } finally {
      if (token === tokenLogin) loginEmProcessamento = false;
    }
  }

  function iniciarNovoLogin(event) {
    const usuario = usuarioAtual(event?.detail);
    if (!usuario || !perfilOperacional(usuario)) return;

    // Somente o evento oficial de login cria uma nova execução. Eventos auxiliares
    // da mesma autenticação não podem invalidar a consulta que já está em andamento.
    tokenLogin += 1;
    popupExibidoNesteLogin = false;
    loginEmProcessamento = false;
    removerPopup();
    processarLogin(usuario, tokenLogin);
  }

  function garantirLoginAtivo(event) {
    const usuario = usuarioAtual(event?.detail);
    if (!usuario || !perfilOperacional(usuario)) return;
    if (popupExibidoNesteLogin || loginEmProcessamento) return;
    processarLogin(usuario, tokenLogin);
  }
  function aoLogout() {
    tokenLogin += 1;
    loginEmProcessamento = false;
    popupExibidoNesteLogin = false;
    removerPopup();
  }

  document.addEventListener('sigee:login-concluido', iniciarNovoLogin);
  window.addEventListener('sigee:session-ready', garantirLoginAtivo);
  document.addEventListener('sigee:usuario-deslogado', aoLogout);
  window.addEventListener('sigee:usuario-deslogado', aoLogout);

  function verificarSessaoJaAtiva() {
    const usuario = usuarioAtual();
    if (usuario && !popupExibidoNesteLogin && !loginEmProcessamento) {
      setTimeout(() => garantirLoginAtivo({ detail: { usuario } }), 800);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', verificarSessaoJaAtiva, { once:true });
  else verificarSessaoJaAtiva();

  window.SIGEE_POPUP_PRAZOS_LOGIN = Object.freeze({ version:VERSION, verificar:garantirLoginAtivo, reiniciar:iniciarNovoLogin, obterResumo, etapaDesarquivamento, etapaOperacional });
})(window, document);
