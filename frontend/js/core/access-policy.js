/**
 * SIGEE Enterprise RC11.3.6 — Autoridade contextual final de acesso.
 * Perfil define capacidades; unidade/escopo define onde a capacidade vale.
 */
(function(window,document){
'use strict';
if(window.__SIGEE_ACCESS_POLICY_RC1136__)return;
window.__SIGEE_ACCESS_POLICY_RC1136__=true;
function user(target){return target||window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function profile(target){const u=user(target);return window.SIGEE_PERFIS?.normalizar?.(u?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(u?.perfil)||'';}
function context(target){const u=user(target);try{return window.SIGEE_ESCOPO?.contexto?.(u)||null;}catch(_){return null;}}
function isSchoolUser(target){const u=user(target),c=context(u);return c?.tipo==='ESCOLA'||String(u?.unidade_tipo||'').trim().toUpperCase()==='ESCOLA';}
function isSchoolProcess(p){return String(p?.escopo_tipo||'').trim().toUpperCase()==='ESCOLA'&&Number(p?.escola_id||0)>0;}
function sameSchool(p,target){const u=user(target);return isSchoolUser(u)&&isSchoolProcess(p)&&Number(u?.escola_id||0)>0&&Number(u.escola_id)===Number(p.escola_id);}
function sameNte(p,target){const u=user(target);return !isSchoolProcess(p)&&Number(u?.nte_id||0)>0&&Number(p?.nte_id||0)>0&&Number(u.nte_id)===Number(p.nte_id);}
function readOnly(target){return ['SEC','Consulta','Estagiário'].includes(profile(target));}
function canMove(p,target){const u=user(target),pf=profile(u);if(pf==='Master')return true;if(readOnly(u)||pf==='Atendimento')return false;if(isSchoolUser(u))return ['Secretaria','Gestor','Administrador','Técnico'].includes(pf)&&sameSchool(p,u);return ['Administrador','Técnico'].includes(pf)&&sameNte(p,u);}
function canCreate(target){const u=user(target),pf=profile(u);if(pf==='Master')return true;if(['SEC','Consulta','Estagiário'].includes(pf))return false;if(isSchoolUser(u))return ['Secretaria','Gestor','Administrador','Técnico'].includes(pf)&&Number(u?.escola_id||0)>0;return ['Administrador','Técnico','Atendimento'].includes(pf)&&Number(u?.nte_id||0)>0;}
function canBeResponsible(candidate,process){if(!candidate||candidate.ativo===false||candidate.Ativo===false)return false;const pf=profile(candidate);if(['Master','SEC','Consulta'].includes(pf))return false;if(isSchoolProcess(process))return String(candidate.unidade_tipo||'').toUpperCase()==='ESCOLA'&&Number(candidate.escola_id||0)===Number(process.escola_id||0)&&['Secretaria','Gestor','Administrador','Técnico','Estagiário'].includes(pf);return Number(candidate.nte_id||0)===Number(process?.nte_id||0)&&String(candidate.unidade_tipo||'NTE').toUpperCase()!=='ESCOLA'&&['Administrador','Técnico','Gestor','Estagiário'].includes(pf);}
function apply(){const u=user();if(!u||!document.body)return;document.body.dataset.sigeePerfil=profile(u);document.body.dataset.sigeeSomenteLeitura=readOnly(u)?'true':'false';document.body.dataset.sigeeProcessosCriar=canCreate(u)?'true':'false';}
window.SIGEE_ACCESS_POLICY=Object.freeze({usuario:user,perfil:profile,contexto:context,usuarioEscola:isSchoolUser,processoEscola:isSchoolProcess,mesmaEscola:sameSchool,mesmoNte:sameNte,somenteLeitura:readOnly,podeMovimentarProcesso:canMove,podeCriarProcesso:canCreate,podeSerResponsavel:canBeResponsible,aplicar:apply,versao:'RC11.3.6'});
['DOMContentLoaded','sigee:usuario-logado','sigee:escopo-aplicado','sigee:usuario-atualizado'].forEach(evt=>document.addEventListener(evt,()=>setTimeout(apply,0)));
setTimeout(apply,0);setTimeout(apply,1000);
})(window,document);
