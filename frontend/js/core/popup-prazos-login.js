/* =====================================================================
 * SIGEE RC9.2.0 — Popup de ciência de prazos no login
 *
 * Regras:
 * - exibido exclusivamente após login manual concluído;
 * - somente para perfil Técnico;
 * - lista ações cujo último dia da janela é hoje;
 * - respeita o NTE do técnico;
 * - ignora ações já executadas na instância/ciclo;
 * - exige checkbox de ciência antes de liberar o sistema;
 * - não reaparece durante a navegação da mesma sessão.
 * ===================================================================== */
(function (window, document) {
  'use strict';

  if (window.__SIGEE_POPUP_PRAZOS_LOGIN_RC1081__) return;
  window.__SIGEE_POPUP_PRAZOS_LOGIN_RC1081__ = true;

  const VERSION = 'RC10.8.1';
  const EVENTOS = Object.freeze({
    31: Object.freeze({ codigo: 'SEND_REITERACAO', titulo: 'Reiteração' }),
    38: Object.freeze({ codigo: 'SEND_REITERACAO_URGENTE', titulo: 'Reiteração Urgente' }),
    45: Object.freeze({ codigo: 'CONFIRMAR_DADOS', titulo: 'Confirmação dos Dados' }),
    52: Object.freeze({ codigo: 'PEDIDO_ATAS_DESARQUIVAMENTO', titulo: 'Pedido de Atas sem Pasta' })
  });

  let loginEmProcessamento = false;
  let popupExibidoNesteLogin = false;
  let tokenLogin = 0;

  function texto(v) { return v == null ? '' : String(v).trim(); }
  function normalizar(v) {
    return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ');
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
  function nteCanonico(v) { return normalizar(v).replace(/[^A-Z0-9]/g, ''); }
  function mesmoNte(a, b) { return Boolean(nteCanonico(a)) && nteCanonico(a) === nteCanonico(b); }
  function usuarioAtual(detail) {
    return (detail && detail.usuario) || window.usuarioLogado || window.SIGEE_SESSION?.getUser?.() || null;
  }
  function cliente() {
    try { return window.obterSupabaseSIGEE?.() || window.supabaseClient || null; } catch (_) { return null; }
  }
  function listaProcessos() {
    try {
      if (window.SIGEE_Processos?.listar) return window.SIGEE_Processos.listar() || [];
      if (Array.isArray(window.processosDB)) return window.processosDB;
    } catch (_) {}
    return [];
  }
  function dataBase(p) {
    return p && (p.data_inicio_ciclo || p.data_inicio_desarquivamento || p.inicio_ciclo || p.prazo_inicio || p.created_at || p.criado_em);
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
  function diaDoCiclo(p) {
    const dec = diasDecorridos(dataBase(p), agoraWorkflow());
    return dec == null ? null : dec + 1;
  }
  function ciclo(p) { return Math.max(1, Number(p && (p.workflow_ciclo || p.ciclo) || 1)); }
  function instancia(p) { return texto(p && p.workflow_instance_id); }
  function etapaDesarquivamento(p) {
    const e = normalizar(p && (p.etapa_codigo || p.etapa_atual || p.etapa || p.fase_atual));
    return ['DES', 'RET', 'REU', 'CFD', 'PAS', 'PAT'].includes(e) || e.includes('DESARQUIV') || e.includes('REITER') || e.includes('CONFIRMACAO') || e.includes('PEDIDO') || e.includes('ATAS');
  }

  async function aguardarProcessos(token) {
    // O login oficial termina antes da carga da Central de Processos. Por isso,
    // o alerta acompanha a carga por até 60 segundos, sem depender da ordem dos scripts.
    for (let i = 0; i < 120; i += 1) {
      if (token !== tokenLogin) return [];
      const lista = listaProcessos();
      if (lista.length) return lista;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return listaProcessos();
  }

  async function acaoExecutada(p, evento) {
    const usuario = usuarioAtual();
    if (emHomologacaoMaster(usuario)) return false;
    const id = instancia(p);
    if (!id) return false;
    const c = cliente();
    if (!c?.rpc) return false;
    try {
      const { data, error } = await c.rpc('sigee_workflow_acoes_executadas', {
        p_workflow_instance_id: id,
        p_ciclo: ciclo(p)
      });
      if (error) throw error;
      return (data || []).some(item => texto(item && item.acao) === evento);
    } catch (erro) {
      console.warn('[SIGEE Popup Prazos] Falha ao consultar ação executada:', erro);
      return false;
    }
  }

  function estadoAtualDoProcesso(p) {
    try {
      const resolvido = window.SIGEE_WORKFLOW_TEMPORAL?.resolve?.(p);
      const codigo = normalizar(resolvido?.code || resolvido?.codigo || resolvido?.etapaCodigo || resolvido?.stateCode || p?.etapa_codigo || p?.etapa_atual || p?.etapa || p?.fase_atual);
      const nome = texto(resolvido?.name || resolvido?.nome || resolvido?.etapaNome || resolvido?.stateName || p?.etapa_atual || p?.etapa || p?.fase_atual || codigo);
      return { codigo, nome };
    } catch (_) {
      const codigo = normalizar(p?.etapa_codigo || p?.etapa_atual || p?.etapa || p?.fase_atual);
      return { codigo, nome: texto(p?.etapa_atual || p?.etapa || p?.fase_atual || codigo) };
    }
  }

  function etapaComAlerta(estado) {
    const e = normalizar(estado?.codigo || estado?.nome);
    return e === 'RET' || e === 'REU' || e === 'CFD' || e === 'PAS' || e === 'PAT' ||
      e.includes('REITERACAO') || e.includes('REITERACAO_URGENTE') ||
      e.includes('CONFIRMACAO') || e.includes('PEDIDO_DE_ATAS') || e.includes('ATAS_SEM_PASTA');
  }

  function dadosEtapaAlerta(estado, dia) {
    const e = normalizar(estado?.codigo || estado?.nome);
    if (e === 'RET' || (e.includes('REITERACAO') && !e.includes('URGENTE'))) return { codigo:'REITERACAO', titulo:'Reiteração', marco:31 };
    if (e === 'REU' || e.includes('REITERACAO_URGENTE')) return { codigo:'REITERACAO_URGENTE', titulo:'Reiteração Urgente', marco:38 };
    if (e === 'CFD' || e.includes('CONFIRMACAO')) return { codigo:'CONFIRMACAO_DADOS', titulo:'Confirmação dos Dados', marco:45 };
    if (e === 'PAS' || e === 'PAT' || e.includes('PEDIDO_DE_ATAS') || e.includes('ATAS_SEM_PASTA')) return { codigo:'PEDIDO_ATAS_SEM_PASTA', titulo:'Pedido de Atas sem Pasta', marco:52 };
    return { codigo:e || 'ETAPA_PENDENTE', titulo:estado?.nome || 'Etapa pendente', marco:Number(dia)||0 };
  }

  async function obterVencimentos(usuario, token) {
    const processos = await aguardarProcessos(token);
    const saida = [];
    for (const p of processos) {
      if (!p || p.ativo === false || p.status === 'Excluído') continue;
      if (!perfilMaster(usuario) && !mesmoNte(p.nte || p.nte_nome, usuario.nte || usuario.nte_nome)) continue;
      const estado = estadoAtualDoProcesso(p);
      if (!etapaComAlerta(estado)) continue;
      const dia = diaDoCiclo(p);
      const acao = dadosEtapaAlerta(estado, dia);
      saida.push({
        processo: p,
        acao,
        estado,
        diaCiclo: Number.isFinite(dia) ? dia : null,
        marco: acao.marco,
        diasAtraso: Number.isFinite(dia) ? Math.max(0, dia - acao.marco) : 0
      });
    }
    return saida.sort((a, b) => (b.diasAtraso - a.diasAtraso) || String(a.processo.codigo_sigee || '').localeCompare(String(b.processo.codigo_sigee || '')));
  }

  function escapar(v) {
    return texto(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function removerPopup() { document.getElementById('sigee-popup-prazos-login')?.remove(); }

  async function registrarCiencia(usuario, itens) {
    const instante = new Date().toISOString();
    const c = cliente();
    if (!c?.from) throw new Error('Cliente Supabase indisponível.');

    const registros = itens.map(x => ({
      processo_id: x.processo.id,
      codigo_sigee: x.processo.codigo_sigee || null,
      etapa: x.estado?.nome || x.acao.titulo,
      acao: 'CIENCIA_VENCIMENTO_ETAPA',
      observacao: `Ciência confirmada no login para a etapa ${x.estado?.nome || x.acao.titulo}. O processo permanece nessa etapa até a execução da ação correspondente.`,
      usuario_nome: usuario.nome || usuario.email || 'Usuário SIGEE',
      usuario_email: usuario.email || null,
      usuario_perfil: usuario.perfil || usuario.tipo || null,
      nte: usuario.nte || x.processo.nte || null,
      dados: {
        tipo: 'CIENCIA_ALERTA_ETAPA_LOGIN',
        versao: VERSION,
        etapa_codigo: x.estado?.codigo || x.acao.codigo,
        etapa_nome: x.estado?.nome || x.acao.titulo,
        dia_ciclo: x.diaCiclo,
        marco: x.marco,
        ciclo: ciclo(x.processo),
        workflow_instance_id: instancia(x.processo) || null,
        sessao_id: window.SIGEE_SESSAO_ID || null
      },
      created_at: instante
    }));

    const { error } = await c.from('historico_processos').insert(registros);
    if (error) throw error;

    if (typeof window.registrarLog === 'function') {
      await window.registrarLog('CIÊNCIA DE VENCIMENTO POR ETAPA', JSON.stringify({
        tipo: 'CIENCIA_ALERTA_ETAPA_LOGIN',
        versao: VERSION,
        quantidade: itens.length,
        processos: itens.map(x => ({
          processo_id: x.processo.id,
          codigo_sigee: x.processo.codigo_sigee || null,
          etapa: x.estado?.nome || x.acao.titulo,
          ciclo: ciclo(x.processo)
        })),
        confirmado_em: instante
      }), { modulo:'workflow', tipo:'CIENCIA_ALERTA_ETAPA_LOGIN', nte:usuario.nte || null });
    }

    itens.forEach(x => {
      try { window.SIGEE6?.timelineService?.invalidar?.(x.processo.id); } catch (_) {}
      try {
        window.dispatchEvent(new CustomEvent('sigee:workflow-action-executed', {
          detail: { processoId:x.processo.id, evento:'CIENCIA_VENCIMENTO_ETAPA', etapa:x.estado?.nome || x.acao.titulo, executadoEm:instante }
        }));
      } catch (_) {}
    });
    return true;
  }

  function abrirProcesso(id) {
    try {
      removerPopup();
      window.abrirDetalhesProcesso?.(id);
      window.abrirProcesso?.(id);
    } catch (_) {}
  }

  function exibirPopup(usuario, itens) {
    removerPopup();
    const overlay = document.createElement('div');
    overlay.id = 'sigee-popup-prazos-login';
    overlay.className = 'sigee-prazos-login-overlay';
    overlay.innerHTML = `
      <section class="sigee-prazos-login-modal" role="dialog" aria-modal="true" aria-labelledby="sigee-prazos-login-titulo">
        <header>
          <div>
            <span class="sigee-prazos-login-selo">ALERTA DE PRAZO</span>
            <h2 id="sigee-prazos-login-titulo">Ciência de processos por etapa</h2>
            <p>${itens.length} ${itens.length === 1 ? 'processo está' : 'processos estão'} entre Reiteração e Pedido de Atas no ${escapar(usuario.nte || 'NTE')}. A relação será exibida em cada login enquanto os processos permanecerem nessas etapas.</p>
          </div>
        </header>
        <div class="sigee-prazos-login-lista">
          ${itens.map((item, i) => `
            <article class="sigee-prazos-login-item">
              <div class="sigee-prazos-login-numero">${i + 1}</div>
              <div class="sigee-prazos-login-dados">
                <strong>${escapar(item.processo.codigo_sigee || item.processo.id)}</strong>
                <span>${escapar(item.processo.aluno_nome || 'Aluno não informado')}</span>
                <small>${escapar(item.processo.escola_nome || 'Escola não informada')}</small>
                <b>Etapa atual: ${escapar(item.estado?.nome || item.acao.titulo)}${item.diaCiclo ? ` — ${item.diaCiclo}º dia do ciclo` : ''}</b>
                <button type="button" class="sigee-prazos-login-abrir" data-processo-id="${escapar(item.processo.id)}">Abrir processo</button>
              </div>
            </article>`).join('')}
        </div>
        <label class="sigee-prazos-login-ciencia">
          <input type="checkbox" id="sigee-prazos-login-checkbox">
          <span>Declaro que tomei ciência dos processos apresentados e dos respectivos vencimentos de etapa.</span>
        </label>
        <p class="sigee-prazos-login-erro" id="sigee-prazos-login-erro" hidden></p>
        <footer>
          <button type="button" id="sigee-prazos-login-confirmar" disabled>Confirmar ciência</button>
        </footer>
      </section>`;
    document.body.appendChild(overlay);

    const checkbox = overlay.querySelector('#sigee-prazos-login-checkbox');
    const confirmar = overlay.querySelector('#sigee-prazos-login-confirmar');
    const erro = overlay.querySelector('#sigee-prazos-login-erro');
    overlay.querySelectorAll('.sigee-prazos-login-abrir').forEach(botao => {
      botao.addEventListener('click', () => abrirProcesso(botao.dataset.processoId));
    });
    checkbox.addEventListener('change', () => { confirmar.disabled = !checkbox.checked; });
    confirmar.addEventListener('click', async () => {
      if (!checkbox.checked) return;
      confirmar.disabled = true;
      confirmar.textContent = 'Registrando ciência...';
      erro.hidden = true;
      try {
        await registrarCiencia(usuario, itens);
        removerPopup();
      } catch (e) {
        erro.textContent = 'Não foi possível registrar a ciência. Verifique a conexão e tente novamente.';
        erro.hidden = false;
        confirmar.disabled = false;
        confirmar.textContent = 'Confirmar ciência';
        console.error('[SIGEE Popup Prazos] Ciência não registrada:', e);
      }
    });
  }

  function chaveSessao(usuario) {
    const id = usuario && (usuario.id || usuario.email || usuario.nome || usuario.nte || 'anonimo');
    return 'SIGEE_CIENCIA_PRAZOS_LOGIN::' + String(id);
  }

  async function aoLogin(event) {
    const usuario = usuarioAtual(event && event.detail);
    if (!usuario || !perfilOperacional(usuario)) return;

    // Cada autenticação manual cria uma nova verificação. O alerta não usa
    // sessionStorage: enquanto a ação estiver pendente, volta no próximo login.
    const token = ++tokenLogin;
    popupExibidoNesteLogin = false;
    if (loginEmProcessamento) return;
    loginEmProcessamento = true;

    try {
      const itens = await obterVencimentos(usuario, token);
      if (token !== tokenLogin || popupExibidoNesteLogin) return;
      if (itens.length) {
        popupExibidoNesteLogin = true;
        exibirPopup(usuario, itens);
      }
    } catch (erro) {
      console.error('[SIGEE Popup Prazos] Falha ao montar alerta de login:', erro);
    } finally {
      if (token === tokenLogin) loginEmProcessamento = false;
    }
  }

  function aoLogout() {
    tokenLogin += 1;
    loginEmProcessamento = false;
    popupExibidoNesteLogin = false;
    removerPopup();
  }


  document.addEventListener('sigee:login-concluido', aoLogin);
  // Compatibilidade com o controlador oficial, que também emite session-ready.
  window.addEventListener('sigee:session-ready', event => {
    if (!popupExibidoNesteLogin && !loginEmProcessamento) aoLogin(event);
  });
  document.addEventListener('sigee:usuario-deslogado', aoLogout);

  // Recuperação defensiva: caso o script seja carregado depois dos eventos de
  // autenticação, realiza uma verificação única assim que a página estiver pronta.
  function verificarSessaoJaAtiva() {
    const usuario = usuarioAtual();
    if (usuario && !popupExibidoNesteLogin && !loginEmProcessamento) {
      setTimeout(() => aoLogin({ detail: { usuario } }), 800);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verificarSessaoJaAtiva, { once: true });
  } else {
    verificarSessaoJaAtiva();
  }

  // RC10.8.1 — O popup é verificado em cada login e lista processos da Reiteração ao Pedido de Atas enquanto permanecerem nessas etapas.
  // Alterações do relógio de homologação atualizam prazos e botões, mas o alerta só é aberto pelo evento de login.
  window.SIGEE_POPUP_PRAZOS_LOGIN = Object.freeze({ version: VERSION, verificar: aoLogin });
})(window, document);
