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

  if (window.__SIGEE_POPUP_PRAZOS_LOGIN_RC920__) return;
  window.__SIGEE_POPUP_PRAZOS_LOGIN_RC920__ = true;

  const VERSION = 'RC9.2.0';
  const EVENTOS = Object.freeze({
    38: Object.freeze({ codigo: 'SEND_REITERACAO', titulo: 'Reiteração' }),
    45: Object.freeze({ codigo: 'SEND_REITERACAO_URGENTE', titulo: 'Reiteração Urgente' }),
    52: Object.freeze({ codigo: 'CONFIRMAR_DADOS', titulo: 'Confirmação dos Dados' }),
    59: Object.freeze({ codigo: 'PEDIDO_ATAS_DESARQUIVAMENTO', titulo: 'Pedido de Atas' })
  });

  let loginEmProcessamento = false;
  let ultimoLoginProcessado = 0;

  function texto(v) { return v == null ? '' : String(v).trim(); }
  function normalizar(v) {
    return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ');
  }
  function perfilTecnico(u) { return normalizar(u && (u.perfil || u.role || u.tipo)).includes('TECN'); }
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
    const dec = diasDecorridos(dataBase(p), new Date());
    return dec == null ? null : dec + 1;
  }
  function ciclo(p) { return Math.max(1, Number(p && (p.workflow_ciclo || p.ciclo) || 1)); }
  function instancia(p) { return texto(p && p.workflow_instance_id); }
  function etapaDesarquivamento(p) {
    const e = normalizar(p && (p.etapa_codigo || p.etapa_atual || p.etapa || p.fase_atual));
    return ['DES', 'RET', 'REU', 'CFD'].includes(e) || e.includes('DESARQUIV') || e.includes('REITER') || e.includes('CONFIRMACAO');
  }

  async function aguardarProcessos() {
    for (let i = 0; i < 20; i += 1) {
      const lista = listaProcessos();
      if (lista.length) return lista;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    return listaProcessos();
  }

  async function acaoExecutada(p, evento) {
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

  async function obterVencimentos(usuario) {
    const processos = await aguardarProcessos();
    const candidatos = processos.filter(p => {
      if (!p || p.ativo === false || p.status === 'Excluído') return false;
      if (!etapaDesarquivamento(p)) return false;
      if (!mesmoNte(p.nte || p.nte_nome, usuario.nte || usuario.nte_nome)) return false;
      return Boolean(EVENTOS[diaDoCiclo(p)]);
    });

    const saida = [];
    for (const p of candidatos) {
      const acao = EVENTOS[diaDoCiclo(p)];
      if (!acao || await acaoExecutada(p, acao.codigo)) continue;
      saida.push({ processo: p, acao: acao, diaCiclo: diaDoCiclo(p) });
    }
    return saida;
  }

  function escapar(v) {
    return texto(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function removerPopup() { document.getElementById('sigee-popup-prazos-login')?.remove(); }

  async function registrarCiencia(usuario, itens) {
    const detalhes = JSON.stringify({
      tipo: 'CIENCIA_ALERTA_PRAZOS_LOGIN',
      versao: VERSION,
      quantidade: itens.length,
      processos: itens.map(x => ({
        processo_id: x.processo.id,
        codigo_sigee: x.processo.codigo_sigee || null,
        acao: x.acao.codigo,
        ciclo: ciclo(x.processo),
        workflow_instance_id: instancia(x.processo) || null
      })),
      confirmado_em: new Date().toISOString()
    });
    if (typeof window.registrarLog === 'function') {
      const ok = await window.registrarLog('CIÊNCIA DE AÇÕES COM PRAZO VENCENDO HOJE', detalhes, {
        modulo: 'workflow', tipo: 'CIENCIA_ALERTA_PRAZOS_LOGIN', nte: usuario.nte || null
      });
      if (ok === false) throw new Error('O registro de auditoria não foi confirmado.');
      return true;
    }
    throw new Error('Serviço oficial de logs indisponível.');
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
            <h2 id="sigee-prazos-login-titulo">Ações com prazo final hoje</h2>
            <p>${itens.length} ${itens.length === 1 ? 'ação requer' : 'ações requerem'} ciência no ${escapar(usuario.nte || 'NTE')}.</p>
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
                <b>${escapar(item.acao.titulo)} — último dia</b>
              </div>
            </article>`).join('')}
        </div>
        <label class="sigee-prazos-login-ciencia">
          <input type="checkbox" id="sigee-prazos-login-checkbox">
          <span>Declaro que tomei ciência das ações com prazo vencendo hoje.</span>
        </label>
        <p class="sigee-prazos-login-erro" id="sigee-prazos-login-erro" hidden></p>
        <footer>
          <button type="button" id="sigee-prazos-login-confirmar" disabled>Confirmar ciência e acessar o sistema</button>
        </footer>
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
        await registrarCiencia(usuario, itens);
        sessionStorage.setItem('SIGEE_CIENCIA_PRAZOS_LOGIN', new Date().toISOString());
        removerPopup();
      } catch (e) {
        erro.textContent = 'Não foi possível registrar a ciência. Verifique a conexão e tente novamente.';
        erro.hidden = false;
        confirmar.disabled = false;
        confirmar.textContent = 'Confirmar ciência e acessar o sistema';
        console.error('[SIGEE Popup Prazos] Ciência não registrada:', e);
      }
    });
  }

  async function aoLogin(event) {
    const agora = Date.now();
    if (loginEmProcessamento || agora - ultimoLoginProcessado < 1500) return;
    const usuario = usuarioAtual(event && event.detail);
    if (!usuario || !perfilTecnico(usuario)) return;
    loginEmProcessamento = true;
    ultimoLoginProcessado = agora;
    try {
      const itens = await obterVencimentos(usuario);
      if (itens.length) exibirPopup(usuario, itens);
    } catch (erro) {
      console.error('[SIGEE Popup Prazos] Falha ao montar alerta de login:', erro);
    } finally {
      loginEmProcessamento = false;
    }
  }

  document.addEventListener('sigee:login-concluido', aoLogin);
  window.SIGEE_POPUP_PRAZOS_LOGIN = Object.freeze({ version: VERSION, verificar: aoLogin });
})(window, document);
