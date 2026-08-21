/**
 * SIGEE Enterprise RC11.3.6 — Matriz oficial de capacidades e regras contextuais.
 * Capacidades definem o que o perfil faz; SIGEE_ESCOPO define onde a ação vale.
 */
(function(window){
'use strict';
if(window.__SIGEE_PERMISSOES_RC542__)return;
window.__SIGEE_PERMISSOES_RC542__=true;

const C=Object.freeze({
  Master:Object.freeze({
    'escopo.global':1,
    'processos.visualizar':1,'processos.criar':1,'processos.movimentar':1,'processos.editar_administrativo':1,'processos.editar_estrutural':1,'processos.reatribuir':1,'processos.regredir':1,'processos.excluir':1,
    'indicadores.visualizar':1,'relatorios.visualizar':1,'relatorios.exportar':1,'produtividade.visualizar':1,
    'escolas.visualizar':1,'escolas.editar_operacional':1,'escolas.editar_cadastral':1,'escolas.excluir':1,'escolas.importar':1,'escolas.exportar':1,
    'usuarios.visualizar':1,'usuarios.visualizar_nte':1,'usuarios.gerenciar_nte':1,'usuarios.gerenciar_global':1,
    'logs.visualizar':1,'migracao.executar':1,'sistema.suspender_nte':1,'gestao_territorial.gerenciar':1
  }),
  SEC:Object.freeze({
    'escopo.global':1,'processos.visualizar':1,'indicadores.visualizar':1,'relatorios.visualizar':1,'relatorios.exportar':1,'produtividade.visualizar':1,'escolas.visualizar':1
  }),
  Secretaria:Object.freeze({
    'processos.visualizar':1,'processos.criar':1,'processos.movimentar':1,
    'indicadores.visualizar':1,'escolas.visualizar':1
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
    'indicadores.visualizar':1,'escolas.visualizar':1,'escolas.editar_operacional':1
  }),
  Atendimento:Object.freeze({
    'processos.visualizar':1,'processos.criar':1,'indicadores.visualizar':1,'escolas.visualizar':1
  }),
  'Estagiário':Object.freeze({
    'processos.visualizar':1,'indicadores.visualizar':1,'escolas.visualizar':1
  }),
  Consulta:Object.freeze({
    'processos.visualizar':1,'indicadores.visualizar':1,'escolas.visualizar':1
  })
});

const LEGADO=Object.freeze({
 global:'escopo.global',usuarios:'usuarios.gerenciar_global',logs:'logs.visualizar',salaSituacao:'indicadores.visualizar',inteligencia:'indicadores.visualizar',relatorios:'relatorios.visualizar',
 importarEscola:'escolas.importar',exportarEscola:'escolas.exportar',exportar:'relatorios.exportar',abrirSolicitacao:'processos.criar',visualizarProcesso:'processos.visualizar',moverProcesso:'processos.movimentar',
 editarProcesso:'processos.editar_administrativo',excluirProcesso:'processos.excluir',regredirProcesso:'processos.regredir',cadastrarEscola:'escolas.editar_cadastral',editarEscola:'escolas.editar_operacional',excluirEscola:'escolas.excluir'
});
function user(target){return target||window.SIGEE_SESSION?.getUser?.()||null;}
function profile(target){return window.SIGEE_PERFIS?.normalizar?.(user(target)?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(user(target)?.perfil)||'';}
function capability(action){return LEGADO[action]||action;}
function gestorSecGlobal(target){
 const u=user(target),p=profile(u);if(p!=='Gestor')return false;
 const vinc=String(u?.nte??u?.nte_nome??u?.grupo??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const id=Number(u?.nte_id);return (!Number.isFinite(id)||id<=0)&&(vinc.includes('SEC')||vinc.includes('TODOS'));
}
function can(action,target){
 const cap=capability(action),p=profile(target);
 if(cap==='escopo.global'&&gestorSecGlobal(target))return true;
 return Boolean(C[p]?.[cap]);
}
function requireCapability(action,target,message){if(can(action,target))return true;if(message!==false)alert(message||'Seu perfil não possui permissão para esta ação.');return false;}
function scopeContext(target){
 const u=user(target);
 try{return window.SIGEE_ESCOPO?.contexto?.(u)||null;}catch(_){return null;}
}
function schoolUser(target){const c=scopeContext(target),u=user(target);return c?.tipo==='ESCOLA'||String(u?.unidade_tipo||'').toUpperCase()==='ESCOLA';}
function sameSchool(process,target){const u=user(target);return Number(u?.escola_id||0)>0&&Number(process?.escola_id||0)===Number(u?.escola_id||0)&&String(process?.escopo_tipo||'').toUpperCase()==='ESCOLA';}
function sameNte(process,target){const u=user(target),uid=Number(u?.nte_id||0),pid=Number(process?.nte_id||0);return uid>0&&pid>0&&uid===pid&&String(process?.escopo_tipo||'NTE').toUpperCase()!=='ESCOLA';}
function canMoveProcess(process,target){
 const u=user(target),p=profile(u);
 if(p==='Master')return true;
 if(['SEC','Consulta','Estagiário','Atendimento'].includes(p))return false;
 if(schoolUser(u)){
   return ['Secretaria','Gestor','Administrador','Técnico'].includes(p)&&sameSchool(process,u);
 }
 return ['Administrador','Técnico'].includes(p)&&sameNte(process,u);
}
function canCreateProcess(target){
 const u=user(target),p=profile(u);
 if(p==='Master')return true;
 if(['SEC','Consulta','Estagiário'].includes(p))return false;
 if(schoolUser(u))return ['Secretaria','Gestor','Administrador','Técnico'].includes(p)&&Number(u?.escola_id||0)>0;
 return ['Administrador','Técnico','Atendimento'].includes(p)&&Number(u?.nte_id||0)>0;
}
function readOnly(target){const p=profile(target);return ['SEC','Consulta','Estagiário'].includes(p);}

function apply(){
 const u=user();if(!u||!document.body)return false;
 const p=profile(u);document.body.dataset.sigeePerfil=p;
 const contexto=window.SIGEE_ESCOPO?.contexto?.(u);
 document.body.dataset.sigeeEscopo=contexto?.tipo || (can('escopo.global',u)?'GLOBAL':'NTE');
 return true;
}
window.SIGEE_PERMISSOES=Object.freeze({MATRIZ:C,LEGADO,pode:can,exigir:requireCapability,aplicar:apply,perfil:profile,capacidade:capability,gestorSecGlobal,contexto:scopeContext,usuarioEscola:schoolUser,mesmaEscola:sameSchool,mesmoNte:sameNte,podeMovimentarProcesso:canMoveProcess,podeCriarProcesso:canCreateProcess,somenteLeitura:readOnly,versao:'RC11.3.6'});
})(window);
