/**
 * SIGEE RC4.1.10 — Autoridade final de acesso e escopo territorial.
 * Carregar como último script local do index.
 */
(function (window) {
  'use strict';
  if (window.__SIGEE_AUTHORITY_4110__) return;
  window.__SIGEE_AUTHORITY_4110__ = true;

  const normalize = value => {
    if (window.SIGEE_PERMISSOES?.normalizarPerfil) return window.SIGEE_PERMISSOES.normalizarPerfil(value);
    const p = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
    if (p.includes('MASTER')) return 'Master';
    if (p === 'SEC' || p.includes('SECRETARIA')) return 'SEC';
    if (p.includes('GESTOR') || p.includes('DIRIGENTE')) return 'Gestor';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('ESTAG')) return 'Estagiário';
    if (p.includes('CONSULT')) return 'Consulta';
    return 'Técnico';
  };
  const current = () => window.usuarioLogado || window.SIGEE_SESSION?.getUser?.() || null;
  const can = action => Boolean(window.SIGEE_PERMISSOES?.pode?.(action, current()));

  function visibility(selector, visible) {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.toggle('hidden', !visible);
      el.style.display = visible ? '' : 'none';
      el.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if ('disabled' in el) el.disabled = !visible;
    });
  }

  function apply() {
    const user = current();
    if (!user || !document.body) return;
    user.perfil = normalize(user.perfil);
    document.body.dataset.sigeePerfil = user.perfil;

    visibility('#menu-usuarios,#menu-logs,#menu-administracao-bloco', can('usuarios'));
    visibility('#menu-relatorios', can('relatorios'));
    visibility('#menu-sala-situacao', can('salaSituacao'));
    visibility('#menu-inteligencia', can('inteligencia'));
    visibility('#btn-nova-solicitacao,[data-acao="nova-solicitacao"],.btn-nova-solicitacao,button[onclick*="abrirFormularioNovaSolicitacao"]', can('abrirSolicitacao'));
    visibility('[data-sigee-permissao="editar-escola"],.btn-editar-escola,.btn-alterar-escola-sigee,button[onclick*="editarEscola"],button[onclick*="abrirModalEditarEscola"]', can('editarEscola'));

    const restrictedTabs = [
      ['#aba-usuarios,#aba-logs,#aba-diagnostico', 'usuarios'],
      ['#aba-sala-situacao', 'salaSituacao'],
      ['#aba-inteligencia', 'inteligencia']
    ];
    restrictedTabs.forEach(([sel, action]) => {
      document.querySelectorAll(sel).forEach(tab => {
        if (!can(action) && !tab.classList.contains('hidden')) {
          tab.classList.add('hidden');
          document.getElementById('aba-painel')?.classList.remove('hidden');
        }
      });
    });
  }

  function guard(name, action, message) {
    const fn = window[name];
    if (typeof fn !== 'function' || fn.__SIGEE_4110_GUARD__) return;
    const wrapped = function () {
      if (!can(action)) {
        alert(message || 'Seu perfil não possui permissão para esta ação.');
        return false;
      }
      return fn.apply(this, arguments);
    };
    wrapped.__SIGEE_4110_GUARD__ = true;
    window[name] = wrapped;
    try { globalThis[name] = wrapped; } catch (_) {}
  }

  function guards() {
    guard('abrirFormularioNovaSolicitacao', 'abrirSolicitacao');
    ['abrirModalEditarEscolaSIGEE','editarEscolaSIGEE','editarEscolaSIGEEV45','abrirModalEditarEscolaV37']
      .forEach(name => guard(name, 'editarEscola', 'Seu perfil não possui permissão para editar escolas.'));
  }

  function enforce() {
    guards();
    apply();
    window.SIGEE_DASHBOARD_EXECUTIVO?.render?.();
  }

  function burst() {
    [0,50,150,400,900,1800,3200].forEach(ms => setTimeout(enforce, ms));
  }

  document.addEventListener('DOMContentLoaded', burst);
  document.addEventListener('sigee:usuario-logado', burst);
  document.addEventListener('sigee:login-concluido', burst);
  document.addEventListener('sigee:navegacao-concluida', burst);
  window.addEventListener('load', burst);

  const previousNavigate = window.navegar;
  if (typeof previousNavigate === 'function' && !previousNavigate.__SIGEE_4110_NAV__) {
    const nav = function (aba) {
      if (aba === 'usuarios' || aba === 'logs' || aba === 'diagnostico') {
        if (!can('usuarios')) { alert('Acesso permitido apenas ao perfil Master.'); aba = 'painel'; }
      }
      if (aba === 'sala-situacao' && !can('salaSituacao')) { alert('Seu perfil não possui acesso à Sala de Situação.'); aba = 'painel'; }
      if ((aba === 'inteligencia' || aba === 'centro-inteligencia') && !can('inteligencia')) { alert('Acesso permitido apenas ao perfil Master.'); aba = 'painel'; }
      const out = previousNavigate.call(this, aba);
      burst();
      return out;
    };
    nav.__SIGEE_4110_NAV__ = true;
    window.navegar = nav;
    try { globalThis.navegar = nav; } catch (_) {}
  }

  window.SIGEE_AUTORIDADE_FINAL = Object.freeze({ aplicar: enforce, reaplicar: burst });
})(window);
