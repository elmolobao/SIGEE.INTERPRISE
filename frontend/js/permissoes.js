/** SIGEE Enterprise — Matriz oficial central de permissões 2.4.9 */
(function(window){
  'use strict';
  const PERFIS={SEC:'SEC',MASTER:'Master',ADMIN:'Administrador',TECNICO:'Tecnico',ESTAGIARIO:'Estagiario',CONSULTA:'Consulta',GESTOR:'Gestor'};
  const MATRIZ={
    Master:{global:true,usuarios:true,logs:true,importar:true,importarEscolas:true,exportar:true,abrirSolicitacao:true,visualizarProcesso:true,moverProcesso:true,editarProcesso:true,excluirProcesso:true,regredirProcesso:true,cadastrarEscola:true,editarEscola:true,acessarRelatorios:true,acessarSalaSituacao:true},
    SEC:{global:true,usuarios:false,logs:true,importar:false,importarEscolas:false,exportar:true,abrirSolicitacao:false,visualizarProcesso:true,moverProcesso:false,editarProcesso:false,excluirProcesso:false,regredirProcesso:false,cadastrarEscola:false,editarEscola:false,acessarRelatorios:true,acessarSalaSituacao:true},
    Administrador:{global:false,usuarios:false,logs:true,importar:true,importarEscolas:false,exportar:true,abrirSolicitacao:true,visualizarProcesso:true,moverProcesso:true,editarProcesso:true,excluirProcesso:false,regredirProcesso:false,cadastrarEscola:false,editarEscola:true,acessarRelatorios:true,acessarSalaSituacao:false},
    Tecnico:{global:false,usuarios:false,logs:false,importar:false,importarEscolas:false,exportar:false,abrirSolicitacao:false,visualizarProcesso:true,moverProcesso:true,editarProcesso:false,excluirProcesso:false,regredirProcesso:false,cadastrarEscola:false,editarEscola:true,acessarRelatorios:false,acessarSalaSituacao:false},
    Estagiario:{global:false,usuarios:false,logs:false,importar:false,importarEscolas:false,exportar:false,abrirSolicitacao:true,visualizarProcesso:true,moverProcesso:false,editarProcesso:false,excluirProcesso:false,regredirProcesso:false,cadastrarEscola:false,editarEscola:false,acessarRelatorios:false,acessarSalaSituacao:false},
    Consulta:{global:false,usuarios:false,logs:false,importar:false,importarEscolas:false,exportar:false,abrirSolicitacao:false,visualizarProcesso:true,moverProcesso:false,editarProcesso:false,excluirProcesso:false,regredirProcesso:false,cadastrarEscola:false,editarEscola:false,acessarRelatorios:false,acessarSalaSituacao:false},
    Gestor:{global:true,usuarios:false,logs:false,importar:false,importarEscolas:false,exportar:false,abrirSolicitacao:false,visualizarProcesso:true,moverProcesso:false,editarProcesso:false,excluirProcesso:false,regredirProcesso:false,cadastrarEscola:false,editarEscola:false,acessarRelatorios:true,acessarSalaSituacao:true}
  };
  const semAcento=v=>String(v??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  function normalizarPerfil(v){const p=semAcento(v).toUpperCase();if(p==='SEC'||p.includes('SECRETARIA'))return PERFIS.SEC;if(p.includes('MASTER'))return PERFIS.MASTER;if(p.includes('GESTOR'))return PERFIS.GESTOR;if(p.includes('ADMIN'))return PERFIS.ADMIN;if(p.includes('ESTAG'))return PERFIS.ESTAGIARIO;if(p.includes('CONSULT'))return PERFIS.CONSULTA;if(p.includes('TECNIC'))return PERFIS.TECNICO;return String(v??'').trim();}
  const usuarioAtual=()=>window.usuarioLogado||null;
  function pode(acao,u){const alvo=u||usuarioAtual()||{};const perfil=normalizarPerfil(alvo.perfil);return Boolean(MATRIZ[perfil]&&MATRIZ[perfil][acao]);}
  function aplicarMenu(){try{window.SIGEE_APLICAR_PERMISSOES_249?.();}catch(_){}}
  window.SIGEE_PERMISSOES={PERFIS,MATRIZ,normalizarPerfil,perfilAtual:()=>normalizarPerfil((usuarioAtual()||{}).perfil),pode,ehGlobal:u=>pode('global',u),aplicarMenu};
  window.aplicarPermissoesMenuPorPerfil=aplicarMenu;
})(window);
