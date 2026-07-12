/**
 * SIGEE Enterprise v1.0 - Matriz oficial de permissões.
 */
(function(window){
  'use strict';
  const PERFIS={SEC:'SEC',MASTER:'Master',ADMIN:'Administrador',TECNICO:'Tecnico',ESTAGIARIO:'Estagiario',CONSULTA:'Consulta'};
  const MATRIZ={
    SEC:{global:true,usuarios:true,logs:true,importar:true,exportar:true,abrirSolicitacao:true,visualizarProcesso:true,moverProcesso:true,editarProcesso:true,excluirProcesso:true,editarEscola:true},
    Master:{global:true,usuarios:true,logs:true,importar:true,exportar:true,abrirSolicitacao:true,visualizarProcesso:true,moverProcesso:true,editarProcesso:true,excluirProcesso:true,editarEscola:true},
    Administrador:{global:false,usuarios:false,logs:true,importar:true,exportar:true,abrirSolicitacao:true,visualizarProcesso:true,moverProcesso:true,editarProcesso:true,excluirProcesso:false,editarEscola:true},
    Tecnico:{global:false,usuarios:false,logs:false,importar:false,exportar:false,abrirSolicitacao:true,visualizarProcesso:true,moverProcesso:true,editarProcesso:false,excluirProcesso:false,editarEscola:true},
    Estagiario:{global:false,usuarios:false,logs:false,importar:false,exportar:false,abrirSolicitacao:true,visualizarProcesso:true,moverProcesso:false,editarProcesso:false,excluirProcesso:false,editarEscola:false},
    Consulta:{global:false,usuarios:false,logs:false,importar:false,exportar:false,abrirSolicitacao:false,visualizarProcesso:true,moverProcesso:false,editarProcesso:false,excluirProcesso:false,editarEscola:false}
  };
  const semAcento=v=>String(v??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  function normalizarPerfil(v){const p=semAcento(v).toUpperCase();if(p==='SEC'||p.includes('SECRETARIA'))return PERFIS.SEC;if(p.includes('MASTER'))return PERFIS.MASTER;if(p.includes('ADMIN'))return PERFIS.ADMIN;if(p.includes('ESTAG'))return PERFIS.ESTAGIARIO;if(p.includes('CONSULT'))return PERFIS.CONSULTA;if(p.includes('TECNIC'))return PERFIS.TECNICO;return String(v??'').trim();}
  function usuarioAtual(){return window.usuarioLogado||null;}
  function pode(acao,u){const perfil=normalizarPerfil((u||usuarioAtual()||{}).perfil);return Boolean(MATRIZ[perfil]&&MATRIZ[perfil][acao]);}
  function aplicarMenu(){const u=usuarioAtual();const toggle=(sel,vis)=>document.querySelectorAll(sel).forEach(el=>el.classList.toggle('hidden',!vis));toggle('#menu-usuarios',pode('usuarios',u));toggle('#menu-logs',pode('logs',u));toggle('#btn-importar-dados-master,.import-only',pode('importar',u));toggle('.export-only',pode('exportar',u));toggle('[onclick*="editarProcesso"],.btn-editar-processo',pode('editarProcesso',u));}
  window.SIGEE_PERMISSOES={PERFIS,MATRIZ,normalizarPerfil,perfilAtual:()=>normalizarPerfil((usuarioAtual()||{}).perfil),pode,ehGlobal:u=>pode('global',u),aplicarMenu};
  window.aplicarPermissoesMenuPorPerfil=aplicarMenu;
  document.addEventListener('DOMContentLoaded',aplicarMenu);
  window.addEventListener('load',()=>setTimeout(aplicarMenu,250));
})(window);
