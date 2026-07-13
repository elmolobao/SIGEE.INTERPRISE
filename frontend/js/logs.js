/* =====================================================================
   SIGEE Enterprise 2.0 - Logs e Presença Online
   Registra ações no Supabase e exibe usuários realmente conectados.
   Requer as tabelas logs_sigee e usuarios_online_sigee (ver SQL entregue).
   ===================================================================== */
(function () {
  'use strict';

  const VERSION = '3.3.9-LOGS-PRESENCA';
  const TABELA_LOGS = 'logs_sigee';
  const TABELA_ONLINE = 'usuarios_online_sigee';
  const HEARTBEAT_MS = 60 * 1000;
  const ONLINE_LIMITE_MS = 3 * 60 * 1000;
  const MAX_LOCAL = 2000;
  const SESSION_ID = sessionStorage.getItem('SIGEE_SESSION_ID') ||
    ((window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `sigee-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  sessionStorage.setItem('SIGEE_SESSION_ID', SESSION_ID);

  let heartbeatTimer = null;
  let ultimoUsuarioEmail = '';
  let ultimoLog = { chave: '', ts: 0 };
  let instalando = false;

  function txt(v) { return v == null ? '' : String(v).trim(); }
  function esc(v) {
    return txt(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function usuarioAtual() {
    try { return window.usuarioLogado || (typeof usuarioLogado !== 'undefined' ? usuarioLogado : null); }
    catch (_) { return window.usuarioLogado || null; }
  }
  function cliente() {
    try { if (typeof obterSupabaseSIGEE === 'function') return obterSupabaseSIGEE(); } catch (_) {}
    try { if (window.SIGEE_SUPABASE?.criarCliente) return window.SIGEE_SUPABASE.criarCliente(); } catch (_) {}
    return window.SIGEE_SUPABASE_CLIENT || window.supabaseClient || null;
  }
  function perfilCanonico(v) {
    const p = txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (p.includes('MASTER')) return 'Master';
    if (p === 'SEC' || p.includes('SEC -')) return 'SEC';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('TECNIC')) return 'Tecnico';
    if (p.includes('ESTAG')) return 'Estagiario';
    if (p.includes('CONSULT')) return 'Consulta';
    return txt(v) || '-';
  }
  function nteUsuario(u) { return txt(u?.nte || u?.nte_nome || u?.nte_vinculado || u?.grupo || u?.territorio || '-'); }
  function dataBR(v) {
    const d = v ? new Date(v) : new Date();
    return Number.isNaN(d.getTime()) ? txt(v) : d.toLocaleString('pt-BR');
  }
  function obterContextoElemento(el) {
    if (!el) return {};
    const form = el.closest?.('form');
    const modal = el.closest?.('[id^="modal-"]');
    const secao = el.closest?.('section[id]');
    return {
      elemento: el.id || el.name || el.tagName || '',
      formulario: form?.id || '',
      modulo: secao?.id?.replace(/^aba-/, '') || modal?.id || '',
      rotulo: txt(el.getAttribute?.('aria-label') || el.title || el.innerText || el.value).replace(/\s+/g, ' ').slice(0, 180)
    };
  }
  function processoContexto() {
    const id = document.querySelector('input[id$="-id"]:not([value=""])')?.value || '';
    if (!id) return {};
    const lista = Array.isArray(window.processosDB) ? window.processosDB : [];
    const p = lista.find(x => String(x.id) === String(id));
    return p ? {
      processo_id: p.id,
      codigo_sigee: p.codigo_sigee || '',
      etapa: p.etapa_atual || p.etapa || p.fase_atual || '',
      aluno: p.aluno_nome || p.aluno || ''
    } : { processo_id: id };
  }

  function logsLocais() {
    try { return JSON.parse(localStorage.getItem('SIGEE_LOGS_DB') || '[]'); } catch (_) { return []; }
  }
  function salvarLocal(registro) {
    const logs = logsLocais();
    logs.unshift(registro);
    if (logs.length > MAX_LOCAL) logs.length = MAX_LOCAL;
    localStorage.setItem('SIGEE_LOGS_DB', JSON.stringify(logs));
    window.logsDB = logs;
  }

  async function inserirLogSupabase(registro) {
    const c = cliente();
    if (!c) return false;
    const payloadCompleto = {
      usuario_id: registro.usuario_id,
      nome: registro.nome,
      email: registro.email,
      perfil: registro.perfil,
      nte: registro.nte,
      acao: registro.acao,
      detalhes: registro.detalhes,
      modulo: registro.modulo,
      processo_id: registro.processo_id || null,
      codigo_sigee: registro.codigo_sigee || null,
      etapa: registro.etapa || null,
      sessao_id: SESSION_ID,
      created_at: registro.created_at
    };
    let r = await c.from(TABELA_LOGS).insert(payloadCompleto);
    if (!r.error) return true;

    // Compatibilidade com tabelas antigas que possuem apenas as colunas básicas.
    const payloadBasico = {
      nome: registro.nome,
      email: registro.email,
      perfil: registro.perfil,
      nte: registro.nte,
      acao: registro.acao,
      detalhes: registro.detalhes
    };
    r = await c.from(TABELA_LOGS).insert(payloadBasico);
    if (r.error) console.warn('[SIGEE Logs] Falha ao gravar no Supabase:', r.error.message);
    return !r.error;
  }

  async function registrarLogSIGEE(acao, detalhes = '', contexto = {}) {
    const u = usuarioAtual();
    if (!u) return false;
    const acaoTexto = txt(acao) || 'AÇÃO NÃO INFORMADA';
    const chave = `${txt(u.email).toLowerCase()}|${acaoTexto}|${txt(detalhes)}`;
    const agora = Date.now();
    if (chave === ultimoLog.chave && agora - ultimoLog.ts < 1500) return false;
    ultimoLog = { chave, ts: agora };

    const processo = Object.assign({}, processoContexto(), contexto || {});
    const registro = {
      data: dataBR(),
      created_at: new Date().toISOString(),
      usuario_id: u.id || null,
      nome: u.nome || u.name || 'Usuário',
      email: txt(u.email).toLowerCase(),
      perfil: perfilCanonico(u.perfil),
      nte: nteUsuario(u),
      acao: acaoTexto,
      detalhes: txt(detalhes || processo.rotulo || ''),
      modulo: txt(processo.modulo || ''),
      processo_id: processo.processo_id || null,
      codigo_sigee: processo.codigo_sigee || '',
      etapa: processo.etapa || ''
    };

    salvarLocal(registro);
    await inserirLogSupabase(registro);
    if (!document.getElementById('aba-logs')?.classList.contains('hidden')) carregarLogsSIGEE();
    return true;
  }

  async function atualizarPresenca(status = 'online') {
    const u = usuarioAtual();
    const c = cliente();
    if (!u || !c || !u.email) return false;
    const payload = {
      sessao_id: SESSION_ID,
      usuario_id: u.id || null,
      nome: u.nome || u.name || 'Usuário',
      email: txt(u.email).toLowerCase(),
      perfil: perfilCanonico(u.perfil),
      nte: nteUsuario(u),
      status,
      pagina_atual: txt(document.querySelector('section:not(.hidden)[id^="aba-"]')?.id || '').replace('aba-', ''),
      ultimo_acesso: new Date().toISOString(),
      user_agent: navigator.userAgent.slice(0, 500)
    };
    const { error } = await c.from(TABELA_ONLINE).upsert(payload, { onConflict: 'sessao_id' });
    if (error) {
      console.warn('[SIGEE Presença] Tabela indisponível ou sem permissão:', error.message);
      return false;
    }
    return true;
  }

  async function marcarOffline() {
    const c = cliente();
    if (!c) return;
    try {
      await c.from(TABELA_ONLINE).update({ status: 'offline', ultimo_acesso: new Date().toISOString() }).eq('sessao_id', SESSION_ID);
    } catch (_) {}
  }

  function iniciarHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    atualizarPresenca('online');
    heartbeatTimer = setInterval(() => {
      if (usuarioAtual() && document.visibilityState !== 'hidden') atualizarPresenca('online');
    }, HEARTBEAT_MS);
  }

  async function obterOnline() {
    const c = cliente();
    if (!c) return [];
    const limite = new Date(Date.now() - ONLINE_LIMITE_MS).toISOString();
    const { data, error } = await c.from(TABELA_ONLINE)
      .select('*')
      .eq('status', 'online')
      .gte('ultimo_acesso', limite)
      .order('ultimo_acesso', { ascending: false });
    if (error) return [];
    const unicos = new Map();
    (data || []).forEach(x => {
      const email = txt(x.email).toLowerCase();
      if (email && !unicos.has(email)) unicos.set(email, x);
    });
    return [...unicos.values()];
  }

  async function atualizarDashboardUsuariosConectadosSIGEE() {
    const online = await obterOnline();
    const set = (id, valor) => { const el = document.getElementById(id); if (el) el.innerText = valor; };
    set('log-usuarios-conectados', online.length);
    set('log-conectados-master', online.filter(x => ['Master', 'SEC'].includes(perfilCanonico(x.perfil))).length);
    set('log-conectados-operacao', online.filter(x => ['Tecnico', 'Administrador', 'Estagiario'].includes(perfilCanonico(x.perfil))).length);
    set('log-ultimo-acesso', online[0] ? dataBR(online[0].ultimo_acesso) : '-');

    let corpo = document.getElementById('tabela-tecnicos-online-sigee');
    if (!corpo) {
      const secao = document.getElementById('aba-logs');
      const tabelaLogs = secao?.querySelector('.bg-white.rounded-xl.shadow-sm.border.overflow-hidden');
      if (secao && tabelaLogs) {
        const bloco = document.createElement('div');
        bloco.className = 'bg-white rounded-xl shadow-sm border overflow-hidden';
        bloco.innerHTML = `<div class="p-4 border-b"><h2 class="font-bold text-blue-900">Técnicos logados no sistema</h2><p class="text-xs text-gray-500">Ativos nos últimos 3 minutos.</p></div><div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="bg-gray-100"><tr><th class="p-3">Técnico</th><th class="p-3">Perfil</th><th class="p-3">NTE</th><th class="p-3">Última atividade</th><th class="p-3">Situação</th></tr></thead><tbody id="tabela-tecnicos-online-sigee"></tbody></table></div>`;
        tabelaLogs.parentNode.insertBefore(bloco, tabelaLogs);
        corpo = document.getElementById('tabela-tecnicos-online-sigee');
      }
    }
    if (corpo) {
      corpo.innerHTML = online.length ? online.map(x => `<tr class="border-b"><td class="p-3 font-bold">${esc(x.nome)}<br><span class="text-xs font-normal text-gray-500">${esc(x.email)}</span></td><td class="p-3">${esc(perfilCanonico(x.perfil))}</td><td class="p-3">${esc(x.nte)}</td><td class="p-3">${esc(dataBR(x.ultimo_acesso))}</td><td class="p-3"><span class="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">ONLINE</span></td></tr>`).join('') : '<tr><td colspan="5" class="p-4 text-center text-gray-400">Nenhum técnico conectado neste momento.</td></tr>';
    }
  }

  async function carregarLogsSIGEE() {
    const corpo = document.getElementById('tabela-logs-corpo');
    if (!corpo) return;
    const u = usuarioAtual();
    let dados = [];
    const c = cliente();
    if (c) {
      let q = c.from(TABELA_LOGS).select('*').order('created_at', { ascending: false }).limit(1000);
      if (perfilCanonico(u?.perfil) === 'Administrador') q = q.eq('nte', nteUsuario(u));
      const { data, error } = await q;
      if (!error) dados = data || [];
    }
    if (!dados.length) dados = logsLocais();
    corpo.innerHTML = dados.length ? dados.map(l => `<tr class="hover:bg-gray-50 text-xs"><td class="p-4 whitespace-nowrap">${esc(dataBR(l.created_at || l.data))}</td><td class="p-4 font-bold">${esc(l.nome)}</td><td class="p-4 font-semibold text-blue-900">${esc(l.nte)}</td><td class="p-4 font-mono text-[11px] text-gray-500">${esc(l.email)}</td><td class="p-4"><span class="font-semibold">${esc(l.acao)}</span>${l.detalhes ? `<br><span class="text-gray-500">${esc(l.detalhes)}</span>` : ''}</td></tr>`).join('') : '<tr><td colspan="5" class="p-4 text-center text-gray-400">Nenhum registro localizado.</td></tr>';
    await atualizarDashboardUsuariosConectadosSIGEE();
  }

  function descreverClique(el) {
    const ctx = obterContextoElemento(el);
    if (!ctx.rotulo || /^(x|✕|fechar)$/i.test(ctx.rotulo)) return null;
    return { acao: `CLIQUE: ${ctx.rotulo}`.slice(0, 250), detalhes: `Elemento: ${ctx.elemento}`, contexto: ctx };
  }

  function instalarCapturaGlobal() {
    if (document.documentElement.dataset.sigeeLogsCaptura === '1') return;
    document.documentElement.dataset.sigeeLogsCaptura = '1';

    document.addEventListener('click', e => {
      const el = e.target.closest('button, a, [role="button"]');
      if (!el || el.closest('#tela-login')) return;
      const d = descreverClique(el);
      if (d) registrarLogSIGEE(d.acao, d.detalhes, d.contexto);
    }, true);

    document.addEventListener('submit', e => {
      if (e.target?.id === 'form-login') return;
      const ctx = obterContextoElemento(e.submitter || e.target);
      registrarLogSIGEE(`FORMULÁRIO ENVIADO: ${ctx.formulario || ctx.modulo || 'sem identificação'}`, ctx.rotulo, ctx);
    }, true);

    document.addEventListener('change', e => {
      const el = e.target;
      if (!el || !el.matches('select, input[type="checkbox"], input[type="radio"], input[type="file"]')) return;
      const ctx = obterContextoElemento(el);
      const valor = el.type === 'checkbox' || el.type === 'radio' ? (el.checked ? 'marcado' : 'desmarcado') : (el.type === 'file' ? `${el.files?.length || 0} arquivo(s)` : txt(el.value));
      registrarLogSIGEE(`ALTERAÇÃO DE CAMPO: ${ctx.rotulo || ctx.elemento}`, valor.slice(0, 300), ctx);
    }, true);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && usuarioAtual()) atualizarPresenca('online');
    });
    window.addEventListener('beforeunload', () => { marcarOffline(); });
  }

  function envolverLogout() {
    const anterior = window.logout;
    if (anterior?.__sigeeLogsWrapped) return;
    const novo = async function () {
      await registrarLogSIGEE('LOGOUT', 'Saída do sistema');
      await marcarOffline();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (typeof anterior === 'function') return anterior.apply(this, arguments);
      window.usuarioLogado = null;
      try { usuarioLogado = null; } catch (_) {}
      document.getElementById('sistema-dashboard')?.classList.add('hidden');
      document.getElementById('tela-login')?.classList.remove('hidden');
    };
    novo.__sigeeLogsWrapped = true;
    window.logout = novo;
    try { logout = novo; } catch (_) {}
  }

  function observarLogin() {
    setInterval(() => {
      const u = usuarioAtual();
      const email = txt(u?.email).toLowerCase();
      if (email && email !== ultimoUsuarioEmail) {
        ultimoUsuarioEmail = email;
        registrarLogSIGEE('LOGIN', `Perfil ${perfilCanonico(u.perfil)} | ${nteUsuario(u)}`);
        iniciarHeartbeat();
      } else if (!email) {
        ultimoUsuarioEmail = '';
      }
    }, 800);
  }

  function instalar() {
    if (instalando) return;
    instalando = true;
    window.registrarLog = registrarLogSIGEE;
    window.carregarLogs = carregarLogsSIGEE;
    window.atualizarDashboardUsuariosConectadosSIGEE = atualizarDashboardUsuariosConectadosSIGEE;
    window.SIGEE_LOGS_VERSION = VERSION;
    try { registrarLog = registrarLogSIGEE; carregarLogs = carregarLogsSIGEE; } catch (_) {}
    instalarCapturaGlobal();
    envolverLogout();
    observarLogin();
    if (usuarioAtual()) iniciarHeartbeat();
    setInterval(() => {
      envolverLogout();
      if (!document.getElementById('aba-logs')?.classList.contains('hidden')) carregarLogsSIGEE();
    }, 30000);
    instalando = false;
  }

  window.instalarModuloLogsSIGEE = instalar;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar);
  else instalar();
  window.addEventListener('load', () => setTimeout(instalar, 600));
})();
