/**
 * SIGEE Enterprise RC5.1.0 — Autoridade única de acesso, menus e navegação.
 * Substitui as autoridades legadas e mantém o escopo territorial central.
 */
(function (window, document) {
  'use strict';
  if (window.__SIGEE_AUTORIZACAO_RC510__) return;
  window.__SIGEE_AUTORIZACAO_RC510__ = true;

  const ROTAS = Object.freeze({
    painel: 'indicadores.visualizar',
    processos: 'processos.visualizar',
    escolas: 'escolas.visualizar',
    usuarios: ['usuarios.gerenciar_global', 'usuarios.gerenciar_nte'],
    logs: 'logs.visualizar',
    'sala-situacao': 'indicadores.visualizar',
    'centro-inteligencia': 'indicadores.visualizar',
    relatorios: 'relatorios.visualizar',
    'nova-solicitacao': 'processos.criar'
  });

  const MENUS = Object.freeze({
    'menu-painel': 'indicadores.visualizar',
    'menu-central-processos': 'processos.visualizar',
    'menu-catalogo-escolas': 'escolas.visualizar',
    'menu-escolas': 'escolas.visualizar',
    'menu-usuarios': ['usuarios.gerenciar_global', 'usuarios.gerenciar_nte'],
    'menu-logs': 'logs.visualizar',
    'menu-relatorios': 'relatorios.visualizar',
    'menu-sala-situacao': 'indicadores.visualizar',
    'menu-inteligencia': 'indicadores.visualizar',
    'btn-nova-solicitacao': 'processos.criar',
    'menu-controle-acesso-ntes': 'sistema.suspender_nte'
  });

  const DESTINO_INICIAL = Object.freeze({
    Master: 'painel',
    SEC: 'painel',
    Gestor: 'painel',
    Administrador: 'processos',
    'Técnico': 'processos',
    'Estagiário': 'nova-solicitacao',
    Consulta: 'processos'
  });

  let navegacaoOriginal = null;
  let observadorMenu = null;
  let aplicacaoAgendada = false;
  let emRedirecionamentoAutomatico = false;
  let loginEmProcessamento = false;

  function usuario() {
    return window.SIGEE_SESSION?.getUser?.() || window.usuarioLogado || window.usuarioAtual || window.currentUser || null;
  }

  function perfil(u = usuario()) {
    return window.SIGEE_PERFIS?.normalizar?.(u?.perfil) || '';
  }

  function pode(capacidade, u = usuario()) {
    if (Array.isArray(capacidade)) return capacidade.some(item => pode(item, u));
    return window.SIGEE_PERMISSOES?.pode?.(capacidade, u) === true;
  }

  function mostrar(elemento, autorizado) {
    if (!elemento) return;
    elemento.hidden = !autorizado;
    elemento.classList.toggle('hidden', !autorizado);
    elemento.setAttribute('aria-hidden', autorizado ? 'false' : 'true');
    elemento.style.setProperty('display', autorizado ? '' : 'none', 'important');
    if ('disabled' in elemento) elemento.disabled = !autorizado;
  }

  function garantirMenuNovaSolicitacao() {
    const nav = document.querySelector('#sistema-dashboard aside nav, #sistema-dashboard nav.sigee-sidebar-nav');
    if (!nav) return null;
    let botao = document.getElementById('menu-nova-solicitacao');
    const exclusivo = pode('processos.criar') && !pode('processos.visualizar');
    if (!botao && exclusivo) {
      botao = document.createElement('button');
      botao.id = 'menu-nova-solicitacao';
      botao.type = 'button';
      botao.className = 'sigee-menu-item w-full text-left px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition cursor-pointer';
      botao.textContent = '➕ Nova Solicitação';
      botao.addEventListener('click', function (event) {
        event.preventDefault();
        if (!pode('processos.criar')) return;
        if (typeof window.abrirFormularioNovaSolicitacao === 'function') {
          window.abrirFormularioNovaSolicitacao();
        }
      });
      nav.insertBefore(botao, nav.firstChild);
    }
    if (botao) mostrar(botao, exclusivo);
    return botao;
  }

  function aplicarMenus() {
    const u = usuario();
    if (!u) return false;

    Object.entries(MENUS).forEach(([id, capacidade]) => {
      mostrar(document.getElementById(id), pode(capacidade, u));
    });

    document.querySelectorAll('[data-sigee-capacidade]').forEach(elemento => {
      mostrar(elemento, pode(elemento.dataset.sigeeCapacidade, u));
    });

    document.querySelectorAll('[data-acao="nova-solicitacao"], .btn-nova-solicitacao').forEach(elemento => {
      mostrar(elemento, pode('processos.criar', u));
    });

    garantirMenuNovaSolicitacao();

    if (document.body) {
      document.body.dataset.sigeeAutorizacao = 'pronta';
      document.body.dataset.sigeePerfil = perfil(u);
      document.body.dataset.sigeeEscopo = window.SIGEE_ESCOPO?.ehGlobal?.(u) ? 'GLOBAL' : 'NTE';
    }
    return true;
  }

  function capacidadeRota(aba) {
    return ROTAS[String(aba || '').trim()] || null;
  }

  function autorizarRota(aba, silencioso = false) {
    const capacidade = capacidadeRota(aba);
    if (!capacidade || pode(capacidade)) return true;
    if (!silencioso && !emRedirecionamentoAutomatico && !loginEmProcessamento) {
      alert('Seu perfil não possui permissão para acessar esta área.');
    }
    return false;
  }

  function primeiraRotaPermitida() {
    const preferida = DESTINO_INICIAL[perfil()] || 'painel';
    if (autorizarRota(preferida, true)) return preferida;
    return ['painel', 'processos', 'escolas', 'usuarios', 'sala-situacao', 'logs']
      .find(rota => autorizarRota(rota, true)) || '';
  }

  function abrirNovaSolicitacaoAutomaticamente() {
    if (!pode('processos.criar')) return false;
    if (typeof window.abrirFormularioNovaSolicitacao !== 'function') return false;
    window.abrirFormularioNovaSolicitacao();
    return true;
  }

  function navegarAutomaticamente() {
    const destino = primeiraRotaPermitida();
    if (!destino) return false;
    emRedirecionamentoAutomatico = true;
    try {
      if (destino === 'nova-solicitacao') return abrirNovaSolicitacaoAutomaticamente();
      return typeof window.navegar === 'function' ? window.navegar(destino, { silencioso: true, automatico: true }) : false;
    } finally {
      setTimeout(() => { emRedirecionamentoAutomatico = false; }, 100);
    }
  }

  function protegerNavegacao() {
    const atual = window.navegar;
    if (typeof atual !== 'function') return false;
    if (atual.__sigeeRc510) return true;

    navegacaoOriginal = atual.__original || atual;
    function protegida(aba, opcoes) {
      const opts = opcoes && typeof opcoes === 'object' ? opcoes : {};
      const silencioso = opts.silencioso === true || opts.automatico === true || emRedirecionamentoAutomatico || loginEmProcessamento;
      if (!autorizarRota(aba, silencioso)) {
        if (silencioso) {
          const alternativa = primeiraRotaPermitida();
          if (alternativa && alternativa !== aba) {
            emRedirecionamentoAutomatico = true;
            try {
              if (alternativa === 'nova-solicitacao') abrirNovaSolicitacaoAutomaticamente();
              else navegacaoOriginal.call(this, alternativa);
            } finally {
              setTimeout(() => { emRedirecionamentoAutomatico = false; }, 100);
            }
          }
        }
        return false;
      }
      const resultado = navegacaoOriginal.apply(this, arguments);
      queueMicrotask(aplicarMenus);
      return resultado;
    }
    protegida.__sigeeRc510 = true;
    protegida.__original = navegacaoOriginal;
    window.navegar = protegida;
    try { globalThis.navegar = protegida; } catch (_) {}
    return true;
  }

  function destinoElemento(elemento) {
    if (!elemento) return '';
    if (elemento.id === 'menu-nova-solicitacao' || elemento.id === 'btn-nova-solicitacao' ||
        elemento.matches?.('[data-acao="nova-solicitacao"], .btn-nova-solicitacao')) return 'nova-solicitacao';
    const mapa = {
      'menu-painel': 'painel',
      'menu-central-processos': 'processos',
      'menu-catalogo-escolas': 'escolas',
      'menu-escolas': 'escolas',
      'menu-usuarios': 'usuarios',
      'menu-logs': 'logs',
      'menu-relatorios': 'painel',
      'menu-sala-situacao': 'sala-situacao',
      'menu-inteligencia': 'centro-inteligencia'
    };
    return mapa[elemento.id] || '';
  }

  document.addEventListener('click', function (evento) {
    const elemento = evento.target.closest?.('button, a, [data-acao]');
    const aba = destinoElemento(elemento);
    if (!aba || autorizarRota(aba, true)) return;
    evento.preventDefault();
    evento.stopImmediatePropagation();
    if (!emRedirecionamentoAutomatico && !loginEmProcessamento) {
      alert('Seu perfil não possui permissão para acessar esta área.');
    }
  }, true);

  function observarMenu() {
    if (observadorMenu) return;
    const menu = document.querySelector('#sistema-dashboard aside, #sistema-dashboard nav');
    if (!menu || typeof MutationObserver === 'undefined') return;
    observadorMenu = new MutationObserver(function () {
      if (aplicacaoAgendada) return;
      aplicacaoAgendada = true;
      requestAnimationFrame(function () {
        aplicacaoAgendada = false;
        aplicarMenus();
        protegerNavegacao();
      });
    });
    observadorMenu.observe(menu, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] });
  }

  function sincronizar() {
    aplicarMenus();
    protegerNavegacao();
    observarMenu();
  }

  function aposLogin() {
    loginEmProcessamento = true;
    sincronizar();
    setTimeout(function () {
      sincronizar();
      navegarAutomaticamente();
      loginEmProcessamento = false;
    }, 80);
  }

  document.addEventListener('DOMContentLoaded', sincronizar, { once: true });
  document.addEventListener('sigee:usuario-logado', aposLogin);
  window.addEventListener('sigee:login-concluido', aposLogin);
  window.addEventListener('load', function () { setTimeout(sincronizar, 50); });

  window.SIGEE_AUTORIZACAO = Object.freeze({
    usuario,
    perfil,
    pode,
    exigir: (capacidade, mensagem) => pode(capacidade) || ((mensagem !== false) && alert(mensagem || 'Ação não autorizada.'), false),
    capacidadeRota,
    autorizarRota,
    aplicarMenus,
    protegerNavegacao,
    primeiraRotaPermitida,
    navegarAutomaticamente
  });
})(window, document);
