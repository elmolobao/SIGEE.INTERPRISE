/* SIGEE Enterprise 2.0 - Permissões por Perfil */
(function () {
  function normalizar(txt) {
    return (txt || '').toString().trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function perfil(usuario) {
    return normalizar(usuario?.perfil);
  }

  function nte(usuario) {
    return (usuario?.nte || usuario?.nte_associado || '').toString().trim();
  }

  function isSEC(usuario) { return perfil(usuario) === 'sec'; }
  function isMaster(usuario) { return perfil(usuario) === 'master'; }
  function isAdministrador(usuario) { return perfil(usuario) === 'administrador'; }
  function isTecnico(usuario) { return perfil(usuario) === 'tecnico'; }
  function isConsulta(usuario) { return perfil(usuario) === 'consulta'; }
  function isGlobal(usuario) { return isSEC(usuario) || isMaster(usuario); }
  function canImportar(usuario) { return isSEC(usuario) || isMaster(usuario) || isAdministrador(usuario); }
  function canExportar(usuario) { return isSEC(usuario) || isMaster(usuario) || isAdministrador(usuario); }
  function canGerenciarUsuarios(usuario) { return isSEC(usuario) || isMaster(usuario); }
  function canAcessarLogs(usuario) { return isSEC(usuario) || isMaster(usuario) || isAdministrador(usuario); }
  function canCadastrarEscola(usuario) { return isSEC(usuario) || isMaster(usuario) || isAdministrador(usuario) || isTecnico(usuario); }
  function canAlterarEscola(usuario) { return isSEC(usuario) || isMaster(usuario) || isAdministrador(usuario) || isTecnico(usuario); }
  function canExcluirEscola(usuario) { return isSEC(usuario) || isMaster(usuario); }
  function canAbrirSolicitacao(usuario) { return isSEC(usuario) || isMaster(usuario) || isAdministrador(usuario) || isTecnico(usuario); }
  function canMovimentarProcesso(usuario) { return isSEC(usuario) || isMaster(usuario) || isAdministrador(usuario) || isTecnico(usuario); }
  function canEditarProcessoAvancado(usuario) { return isSEC(usuario) || isMaster(usuario); }
  function canSelecionarTecnicosTodosNtes(usuario) { return isSEC(usuario) || isMaster(usuario); }

  function filtrarPorAbrangencia(usuario, lista, campoNte = 'nte') {
    if (!Array.isArray(lista)) return [];
    if (isGlobal(usuario)) return lista;
    const nteUser = normalizar(nte(usuario));
    return lista.filter(item => normalizar(item?.[campoNte]) === nteUser);
  }

  function aplicarMenu(usuario) {
    const menuUsuarios = document.getElementById('menu-usuarios');
    const menuLogs = document.getElementById('menu-logs');
    const importadores = document.querySelectorAll('#btn-importar-dados-master, .btn-importar, [onclick*="importar"]');
    const exportadores = document.querySelectorAll('.btn-exportar, [onclick*="exportar"], #btn-exportar-excel, #btn-exportar-pdf');

    if (menuUsuarios) menuUsuarios.classList.toggle('hidden', !canGerenciarUsuarios(usuario));
    if (menuLogs) menuLogs.classList.toggle('hidden', !canAcessarLogs(usuario));
    importadores.forEach(btn => btn.classList.toggle('hidden', !canImportar(usuario)));
    exportadores.forEach(btn => btn.classList.toggle('hidden', !canExportar(usuario)));
  }

  window.SIGEE_PERMISSOES = {
    normalizar, perfil, nte,
    isSEC, isMaster, isAdministrador, isTecnico, isConsulta, isGlobal,
    canImportar, canExportar, canGerenciarUsuarios, canAcessarLogs,
    canCadastrarEscola, canAlterarEscola, canExcluirEscola,
    canAbrirSolicitacao, canMovimentarProcesso, canEditarProcessoAvancado,
    canSelecionarTecnicosTodosNtes, filtrarPorAbrangencia, aplicarMenu
  };
})();
