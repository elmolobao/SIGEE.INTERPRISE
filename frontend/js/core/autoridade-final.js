/**
 * SIGEE RC4.1.15 — Autoridade final otimizada de identidade e permissões.
 * Sem polling, varredura de storage ou reaplicações temporizadas.
 */
(function (window, document) {
  'use strict';
  if (window.__SIGEE_AUTHORITY_4115__) return;
  window.__SIGEE_AUTHORITY_4115__ = true;

  function normalize(value) {
    try {
      if (window.SIGEE_SESSION?.normalizarPerfil) return window.SIGEE_SESSION.normalizarPerfil(value);
      if (window.SIGEE_PERMISSOES?.normalizarPerfil) return window.SIGEE_PERMISSOES.normalizarPerfil(value);
    } catch (_) {}
    return String(value || '').trim();
  }

  function current() {
    try { return window.SIGEE_SESSION?.getUser?.() || window.usuarioLogado || null; }
    catch (_) { return window.usuarioLogado || null; }
  }

  function can(action, user) {
    const target = user || current();
    return Boolean(target && window.SIGEE_PERMISSOES?.pode?.(action, target));
  }

  function setVisibility(selector, visible) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.classList.toggle('hidden', !visible);
      el.style.display = visible ? '' : 'none';
      el.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if ('disabled' in el) el.disabled = !visible;
    });
  }

  function renderIdentity(user) {
    const target = user || current();
    if (!target) return null;
    const perfil = normalize(target.perfil || target.tipo || target.role);
    const nte = target.nte || target.nte_nome || target.grupo || target.territorio || '';
    const nome = target.nome || target.nome_completo || target.email || '';
    const nomeEl = document.getElementById('user-nome');
    const perfilEl = document.getElementById('user-perfil');
    if (nomeEl && nomeEl.textContent !== nome) nomeEl.textContent = nome;
    const profileText = `${perfil}${nte ? ' | ' + nte : ''}`;
    if (perfilEl && perfilEl.textContent !== profileText) perfilEl.textContent = profileText;
    document.querySelectorAll('[data-sigee-user-profile],#perfil-usuario-logado,#usuario-perfil-logado').forEach(function (el) {
      if (el.textContent !== perfil) el.textContent = perfil;
    });
    try { window.SIGEE_FOOTER_INSTITUCIONAL?.atualizar?.(); } catch (_) {}
    return target;
  }

  function apply() {
    const user = current();
    if (!user || !document.body) return false;
    const perfil = normalize(user.perfil);
    document.body.dataset.sigeePerfil = perfil;
    renderIdentity(user);

    setVisibility('#menu-usuarios,#menu-logs,#menu-administracao-bloco', can('usuarios', user));
    setVisibility('#menu-relatorios', can('relatorios', user));
    setVisibility('#menu-sala-situacao', can('salaSituacao', user));
    setVisibility('#menu-inteligencia', can('inteligencia', user));
    setVisibility('#btn-nova-solicitacao,[data-acao="nova-solicitacao"],.btn-nova-solicitacao,button[onclick*="abrirFormularioNovaSolicitacao"]', can('abrirSolicitacao', user));
    setVisibility('[data-sigee-permissao="editar-escola"],.btn-editar-escola,.btn-alterar-escola-sigee,button[onclick*="editarEscola"],button[onclick*="abrirModalEditarEscola"]', can('editarEscola', user));

    if (!can('usuarios', user)) setVisibility('#aba-usuarios,#aba-logs,#aba-diagnostico', false);
    if (!can('salaSituacao', user)) setVisibility('#aba-sala-situacao', false);
    if (!can('inteligencia', user)) setVisibility('#aba-inteligencia', false);
    return true;
  }

  function guard(name, action, message) {
    const fn = window[name];
    if (typeof fn !== 'function' || fn.__SIGEE_4115_GUARD__) return;
    const wrapped = function () {
      if (!can(action)) { alert(message || 'Seu perfil não possui permissão para esta ação.'); return false; }
      return fn.apply(this, arguments);
    };
    wrapped.__SIGEE_4115_GUARD__ = true;
    window[name] = wrapped;
    try { globalThis[name] = wrapped; } catch (_) {}
  }

  function installGuards() {
    guard('abrirFormularioNovaSolicitacao', 'abrirSolicitacao');
    ['abrirModalEditarEscolaSIGEE','editarEscolaSIGEE','editarEscolaSIGEEV45','abrirModalEditarEscolaV37'].forEach(function (name) {
      guard(name, 'editarEscola', 'Seu perfil não possui permissão para editar escolas.');
    });
  }

  function enforce() { installGuards(); return apply(); }
  function schedule() { window.requestAnimationFrame ? requestAnimationFrame(enforce) : setTimeout(enforce, 0); }

  document.addEventListener('DOMContentLoaded', schedule, { once: true });
  document.addEventListener('sigee:usuario-logado', schedule);
  document.addEventListener('sigee:login-concluido', schedule);
  document.addEventListener('sigee:navegacao-concluida', schedule);
  window.addEventListener('load', schedule, { once: true });

  const previousNavigate = window.navegar;
  if (typeof previousNavigate === 'function' && !previousNavigate.__SIGEE_4115_NAV__) {
    const nav = function (aba) {
      if (['usuarios','logs','diagnostico'].includes(aba) && !can('usuarios')) { alert('Acesso permitido apenas ao perfil Master.'); aba = 'painel'; }
      if (aba === 'sala-situacao' && !can('salaSituacao')) { alert('Seu perfil não possui acesso à Sala de Situação.'); aba = 'painel'; }
      if ((aba === 'inteligencia' || aba === 'centro-inteligencia') && !can('inteligencia')) { alert('Acesso permitido apenas ao perfil Master.'); aba = 'painel'; }
      const result = previousNavigate.call(this, aba);
      schedule();
      return result;
    };
    nav.__SIGEE_4115_NAV__ = true;
    window.navegar = nav;
    try { globalThis.navegar = nav; } catch (_) {}
  }

  window.SIGEE_RENDERIZAR_IDENTIDADE_EFETIVA = renderIdentity;
  window.SIGEE_AUTORIDADE_FINAL = Object.freeze({
    aplicar: enforce,
    reaplicar: schedule,
    reconciliarUsuario: current,
    renderizarIdentidade: renderIdentity
  });
})(window, document);
