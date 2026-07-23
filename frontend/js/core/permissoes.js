/**
 * SIGEE Enterprise RC5.3.8 — Matriz oficial de capacidades.
 * Capacidades definem o que o perfil faz; SIGEE_ESCOPO define onde a ação vale.
 */
(function(window){
'use strict';
if(window.__SIGEE_PERMISSOES_RC538__)return;
window.__SIGEE_PERMISSOES_RC538__=true;

const C=Object.freeze({
  Master:Object.freeze({
    'escopo.global':1,
    'processos.visualizar':1,'processos.criar':1,'processos.movimentar':1,'processos.editar_administrativo':1,'processos.editar_estrutural':1,'processos.reatribuir':1,'processos.regredir':1,'processos.excluir':1,
    'indicadores.visualizar':1,'relatorios.visualizar':1,'relatorios.exportar':1,'produtividade.visualizar':1,
    'escolas.visualizar':1,'escolas.editar_operacional':1,'escolas.editar_cadastral':1,'escolas.importar':1,'escolas.exportar':1,
    'usuarios.visualizar':1,'usuarios.visualizar_nte':1,'usuarios.gerenciar_nte':1,'usuarios.gerenciar_global':1,
    'logs.visualizar':1,'migracao.executar':1,'sistema.suspender_nte':1
  }),
  SEC:Object.freeze({
    'escopo.global':1,'processos.visualizar':1,'indicadores.visualizar':1,'relatorios.visualizar':1,'relatorios.exportar':1,'produtividade.visualizar':1,'escolas.visualizar':1
  }),
  Gestor:Object.freeze({
    'processos.visualizar':1,'processos.reatribuir':1,'indicadores.visualizar':1,'relatorios.visualizar':1,'relatorios.exportar':1,'produtividade.visualizar':1,'escolas.visualizar':1,'usuarios.visualizar_nte':1
  }),
  Administrador:Object.freeze({
    'processos.visualizar':1,'processos.criar':1,'processos.movimentar':1,'processos.editar_administrativo':1,'processos.reatribuir':1,
    'indicadores.visualizar':1,'relatorios.visualizar':1,'produtividade.visualizar':1,
    'escolas.visualizar':1,'escolas.editar_operacional':1,'usuarios.visualizar_nte':1,'usuarios.gerenciar_nte':1
  }),
  'Técnico':Object.freeze({
    'processos.visualizar':1,'processos.criar':1,'processos.movimentar':1,
    'relatorios.visualizar':1,'escolas.visualizar':1,'escolas.editar_operacional':1
  }),
  Atendimento:Object.freeze({
    'processos.visualizar':1,'processos.criar':1,'relatorios.visualizar':1,'escolas.visualizar':1
  }),
  'Estagiário':Object.freeze({
    'processos.visualizar':1,'processos.criar':1,'relatorios.visualizar':1,'escolas.visualizar':1
  }),
  Consulta:Object.freeze({
    'processos.visualizar':1,'relatorios.visualizar':1,'escolas.visualizar':1
  })
});

const LEGADO=Object.freeze({
 global:'escopo.global',usuarios:'usuarios.gerenciar_global',logs:'logs.visualizar',salaSituacao:'indicadores.visualizar',inteligencia:'indicadores.visualizar',relatorios:'relatorios.visualizar',
 importarEscola:'escolas.importar',exportarEscola:'escolas.exportar',exportar:'relatorios.exportar',abrirSolicitacao:'processos.criar',visualizarProcesso:'processos.visualizar',moverProcesso:'processos.movimentar',
 editarProcesso:'processos.editar_administrativo',excluirProcesso:'processos.excluir',regredirProcesso:'processos.regredir',cadastrarEscola:'escolas.editar_cadastral',editarEscola:'escolas.editar_operacional'
});
function user(target){return target||window.SIGEE_SESSION?.getUser?.()||null;}
function profile(target){return window.SIGEE_PERFIS?.normalizar?.(user(target)?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(user(target)?.perfil)||'';}
function capability(action){return LEGADO[action]||action;}
function can(action,target){return Boolean(C[profile(target)]?.[capability(action)]);}
function requireCapability(action,target,message){if(can(action,target))return true;if(message!==false)alert(message||'Seu perfil não possui permissão para esta ação.');return false;}
function apply(){
 const u=user();if(!u||!document.body)return false;
 const p=profile(u);document.body.dataset.sigeePerfil=p;document.body.dataset.sigeeEscopo=can('escopo.global',u)?'GLOBAL':'NTE';
 return true;
}
window.SIGEE_PERMISSOES=Object.freeze({MATRIZ:C,LEGADO,pode:can,exigir:requireCapability,aplicar:apply,perfil:profile,capacidade:capability});
})(window);
