/* SIGEE Enterprise - Rodapé Institucional v1.0 */
(function () {
  const APP_INFO_FOOTER = {
    nome: 'SIGEE Enterprise',
    versao: '1.0.0',
    ambiente: 'Produção',
    orgao: 'Secretaria da Educação do Estado da Bahia',
    sistema: 'Sistema Integrado de Gestão de Escolas Extintas - SIGEE Enterprise',
    suporte: 'Suporte aos Técnicos do Setor de Escolas Extintas dos Núcleos Territoriais de Educação',
    coordenacao: 'Coordenação de Legalização e Orientação das Unidades Educacionais - CLO / DAI / SGINF',
    telefone: '(71) 3115-9177',
    email: 'escolasextintas.sec@enova.educacao.ba.gov.br'
  };

  function obterUsuarioSessaoSIGEE() {
    try {
      const central = window.SIGEE_SESSION?.getUser?.();
      if (central) return central;
    } catch (_) {}
    try { if (window.usuarioLogado) return window.usuarioLogado; } catch (_) {}
    const chaves = ['SIGEE_USUARIO_LOGADO','usuarioLogadoSIGEE','usuarioLogado','sigee_usuario_logado','SIGEE_USER','sigee_user'];
    for (const chave of chaves) {
      try {
        const valor = localStorage.getItem(chave) || sessionStorage.getItem(chave);
        if (valor) {
          const usuario = JSON.parse(valor);
          if (usuario) return usuario;
        }
      } catch (_) {}
    }
    return null;
  }

  function normalizarPerfil(perfil) {
    const p = String(perfil || '').trim();
    if (!p) return 'NÃO IDENTIFICADO';
    return p.toUpperCase().replace('TECNICO', 'TÉCNICO');
  }

  function normalizarNte(usuario) {
    if (!usuario) return 'NÃO INFORMADO';
    const perfil = normalizarPerfil(usuario.perfil);
    if (perfil === 'MASTER') return 'TODOS';
    if (usuario.nte) return String(usuario.nte).replace('NTE-', 'NTE ').trim();
    if (usuario.nte_id) return `NTE ${String(usuario.nte_id).padStart(2, '0')}`;
    return 'NÃO INFORMADO';
  }

  function criarEstrutura() {
    if (!document.getElementById('sigee-session-bar')) {
      const sessionBar = document.createElement('div');
      sessionBar.id = 'sigee-session-bar';
      document.body.appendChild(sessionBar);
    }

    if (!document.getElementById('sigee-footer-institucional')) {
      const footer = document.createElement('footer');
      footer.id = 'sigee-footer-institucional';
      footer.innerHTML = `
        <div class="sigee-footer-col sigee-footer-left">
          <div class="sigee-footer-title">${APP_INFO_FOOTER.nome}</div>
          <div class="sigee-footer-subtitle">Versão ${APP_INFO_FOOTER.versao}</div>
          <div class="sigee-footer-subtitle">Ambiente: ${APP_INFO_FOOTER.ambiente}</div>
        </div>

        <div class="sigee-footer-col sigee-footer-center">
          <div class="sigee-footer-main">${APP_INFO_FOOTER.suporte}</div>
          <div class="sigee-footer-org">${APP_INFO_FOOTER.coordenacao}</div>
          <div class="sigee-footer-copy">© 2026 ${APP_INFO_FOOTER.orgao} · ${APP_INFO_FOOTER.sistema}</div>
        </div>

        <div class="sigee-footer-col sigee-footer-right">
          <div class="sigee-footer-contact"><strong>Telefone:</strong> ${APP_INFO_FOOTER.telefone}</div>
          <div class="sigee-footer-contact"><strong>E-mail:</strong> ${APP_INFO_FOOTER.email}</div>
        </div>
      `;
      document.body.appendChild(footer);
    }
  }

  function atualizarSessao() {
    const barra = document.getElementById('sigee-session-bar');
    if (!barra) return;

    const telaLogin = document.getElementById('tela-login');
    const sistemaVisivel = !document.getElementById('sistema-dashboard')?.classList.contains('hidden');
    const loginVisivel = telaLogin && !telaLogin.classList.contains('hidden');
    const usuario = obterUsuarioSessaoSIGEE();

    if (!usuario || loginVisivel || !sistemaVisivel) {
      barra.style.display = 'none';
      return;
    }

    const nome = usuario.nome || usuario.email || 'Usuário';
    const perfil = normalizarPerfil(usuario.perfil);
    const nte = normalizarNte(usuario);
    const acesso = new Date().toLocaleString('pt-BR');

    barra.innerHTML = `
      <span>Usuário: <strong>${nome}</strong></span>
      <span>Perfil: <strong>${perfil}</strong></span>
      <span>NTE: <strong>${nte}</strong></span>
      <span>Último acesso: <strong>${acesso}</strong></span>
    `;
    barra.style.display = 'flex';
  }

  function init() {
    criarEstrutura();
    atualizarSessao();
    setInterval(atualizarSessao, 2500);
    document.addEventListener('click', () => setTimeout(atualizarSessao, 250));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SIGEE_FOOTER_INSTITUCIONAL = {
    atualizar: atualizarSessao,
    info: APP_INFO_FOOTER
  };
})();
