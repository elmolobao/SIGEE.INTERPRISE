/**
 * SIGEE Enterprise RC11.0.0 — Autoridade única de escopo de acesso.
 * Escopos: GLOBAL, SEC, NTE e ESCOLA.
 * - GLOBAL: acesso integral (Master).
 * - SEC: visão estadual conforme permissões do perfil.
 * - NTE: somente processos de escopo NTE do território do usuário.
 * - ESCOLA: somente processos de escopo ESCOLA da unidade escolar vinculada.
 * Compatibilidade: usuários legados sem unidade_tipo continuam resolvidos por perfil/NTE.
 */
(function(window){'use strict';
if(window.__SIGEE_ESCOPO_RC1100__)return;window.__SIGEE_ESCOPO_RC1100__=true;

function user(t){return t||window.SIGEE_AUTORIZACAO?.usuario?.()||window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||{};}
function norm(v){return String(v??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();}
function number(v){if(v===0||v==='0')return 0;if(typeof v==='number'&&Number.isFinite(v))return v;const m=String(v??'').match(/(?:NTE\s*[-–— ]?)?(\d{1,2})/i);return m?Number(m[1]):null;}
function profile(t){return window.SIGEE_PERFIS?.normalizar?.(user(t)?.perfil)||'';}
function unitType(t){
  const u=user(t), explicit=norm(u.unidade_tipo||u.unidadeTipo||u.tipo_unidade);
  if(['GLOBAL','SEC','NTE','ESCOLA'].includes(explicit))return explicit;
  const p=profile(u);
  if(p==='Master')return 'GLOBAL';
  if(p==='SEC')return 'SEC';
  const id=userNteId(u);
  if(id!==null&&id>0)return 'NTE';
  if(p==='Gestor'){
    const vinc=norm(u.nte??u.nte_nome??u.nte_vinculado??u.grupo??u.territorio??'');
    if(vinc.includes('TODOS')||vinc.includes('SEC'))return 'SEC';
  }
  return 'NEGADO';
}
function gestorSecGlobal(t){return unitType(t)==='SEC'&&profile(t)==='Gestor';}
function isGlobal(t){return unitType(t)==='GLOBAL'||unitType(t)==='SEC';}
function isSchool(t){return unitType(t)==='ESCOLA';}
function isNte(t){return unitType(t)==='NTE';}
function isSec(t){return unitType(t)==='SEC';}
function userNteId(t){const u=user(t);const direct=u.nte_id??u.id_nte??u.territorio_id;const n=number(direct);if(n!==null&&n>0)return n;const textual=number(u.nte??u.nte_nome??u.nte_vinculado??u.grupo??u.territorio);return textual!==null&&textual>0?textual:null;}
function userNte(t){const u=user(t);return u.nte||u.nte_nome||u.nte_vinculado||u.grupo||u.territorio||u.nte_id||u.id_nte||u.territorio_id||'';}
function userSchoolId(t){const u=user(t),v=u.escola_id??u.escolaId??u.unidade_id??u.unidadeId;const n=Number(v);return Number.isFinite(n)&&n>0?n:null;}
function recordNteId(r){const direct=r?.nte_id??r?.id_nte??r?.territorio_id;const n=number(direct);if(n!==null&&n>0)return n;const textual=number(r?.nte??r?.nte_nome??r?.nte_vinculado??r?.grupo??r?.territorio??r?.NTE);return textual!==null&&textual>0?textual:null;}
function recordNte(r){return r?.nte||r?.nte_nome||r?.nte_vinculado||r?.grupo||r?.territorio||r?.NTE||r?.nte_id||r?.id_nte||r?.territorio_id||'';}
function recordSchoolId(r){const v=r?.escola_id??r?.escolaId;const n=Number(v);return Number.isFinite(n)&&n>0?n:null;}
function recordScope(r){const s=norm(r?.escopo_tipo||r?.escopoTipo);return s||'NTE';}
function same(a,b){const x=number(a),y=number(b);return x!==null&&y!==null?x===y:norm(a)===norm(b);}
function validateRecord(r,t){
  const tipo=unitType(t);
  if(tipo==='GLOBAL'||tipo==='SEC')return true;
  if(tipo==='NTE'){
    const own=userNteId(t),rid=recordNteId(r);
    return recordScope(r)==='NTE'&&own!==null&&rid!==null&&own===rid;
  }
  if(tipo==='ESCOLA'){
    const own=userSchoolId(t),rid=recordSchoolId(r);
    return recordScope(r)==='ESCOLA'&&own!==null&&rid!==null&&own===rid;
  }
  return false;
}
function filter(list,t){const arr=Array.isArray(list)?list:[];return arr.filter(r=>validateRecord(r,t));}
function assertRecord(r,t,message){if(validateRecord(r,t))return true;throw new Error(message||'Acesso negado: o registro está fora do escopo autorizado para este usuário.');}
function scopeType(t){return unitType(t);}
function context(t){
  const u=user(t),tipo=unitType(u),nteId=userNteId(u),escolaId=userSchoolId(u);
  return Object.freeze({
    usuario:u,
    global:tipo==='GLOBAL'||tipo==='SEC',
    territorial:tipo==='NTE',
    escolar:tipo==='ESCOLA',
    tipo,
    nte:(tipo==='NTE'||tipo==='ESCOLA')?(nteId===null?userNte(u):`NTE-${String(nteId).padStart(2,'0')}`):null,
    nteId:(tipo==='NTE'||tipo==='ESCOLA')?nteId:null,
    escolaId:tipo==='ESCOLA'?escolaId:null
  });
}
function queryFilter(query,t,field){
  const tipo=unitType(t);
  if(tipo==='GLOBAL'||tipo==='SEC')return query;
  if(tipo==='ESCOLA'){
    const id=userSchoolId(t);if(id===null)throw new Error('Usuário escolar sem escola vinculada.');
    return query.eq(field||'escola_id',id);
  }
  if(tipo==='NTE'){
    const id=userNteId(t);if(id===null)throw new Error('Usuário territorial sem NTE válido.');
    const campo=field||'nte_id';const valor=campo==='nte'||campo==='nte_nome'||campo==='grupo'||campo==='territorio'?`NTE-${String(id).padStart(2,'0')}`:id;
    return query.eq(campo,valor);
  }
  throw new Error('Usuário sem escopo de acesso válido.');
}
function processQuery(query,t){
  const tipo=unitType(t);
  if(tipo==='GLOBAL'||tipo==='SEC')return query;
  if(tipo==='NTE'){
    const id=userNteId(t);if(id===null)throw new Error('Usuário territorial sem NTE válido.');
    return query.eq('escopo_tipo','NTE').eq('nte_id',id);
  }
  if(tipo==='ESCOLA'){
    const id=userSchoolId(t);if(id===null)throw new Error('Usuário escolar sem escola vinculada.');
    return query.eq('escopo_tipo','ESCOLA').eq('escola_id',id);
  }
  throw new Error('Usuário sem escopo de acesso válido.');
}
function processNte(t){const c=context(t);if(c.tipo==='GLOBAL'||c.tipo==='SEC')return null;if(!c.nte)throw new Error('Usuário sem território válido.');return c.nte;}
window.SIGEE_ESCOPO=Object.freeze({usuario:user,contexto:context,tipo:scopeType,tipoUnidade:unitType,ehGlobal:isGlobal,ehSec:isSec,ehTerritorial:isNte,ehEscola:isSchool,gestorSecGlobal,nteUsuario:userNte,nteIdUsuario:userNteId,escolaIdUsuario:userSchoolId,numeroNte:number,mesmoNte:same,nteRegistro:recordNte,nteIdRegistro:recordNteId,escolaIdRegistro:recordSchoolId,escopoRegistro:recordScope,validarRegistro:validateRecord,exigirRegistro:assertRecord,filtrar:filter,aplicarQuery:queryFilter,aplicarQueryProcessos:processQuery,nteProcessosUsuario:processNte,versao:'RC11.0.0'});
})(window);
