/**
 * SIGEE Enterprise RC7.4.0 — Autoridade territorial única.
 * Master e SEC: GLOBAL. Todos os demais perfis: NTE vinculado.
 */
(function(window){'use strict';
if(window.__SIGEE_ESCOPO_RC740__)return;window.__SIGEE_ESCOPO_RC740__=true;
function user(t){return t||window.SIGEE_SESSION?.getUser?.()||{};}
function norm(v){return String(v??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();}
function number(v){if(v===0||v==='0')return 0;if(typeof v==='number'&&Number.isFinite(v))return v;const m=String(v??'').match(/(?:NTE\s*[-–— ]?)?(\d{1,2})/i);return m?Number(m[1]):null;}
function profile(t){return window.SIGEE_PERFIS?.normalizar?.(user(t)?.perfil)||'';}
function isGlobal(t){return window.SIGEE_PERFIS?.ehGlobal?.(profile(t))===true;}
function userNteId(t){const u=user(t);const direct=u.nte_id??u.id_nte??u.territorio_id;const n=number(direct);if(n!==null)return n;return number(u.nte??u.nte_nome??u.nte_vinculado??u.grupo??u.territorio);}
function userNte(t){const u=user(t);return u.nte||u.nte_nome||u.nte_vinculado||u.grupo||u.territorio||u.nte_id||u.id_nte||u.territorio_id||'';}
function recordNteId(r){const direct=r?.nte_id??r?.id_nte??r?.territorio_id;const n=number(direct);if(n!==null)return n;return number(r?.nte??r?.nte_nome??r?.nte_vinculado??r?.grupo??r?.territorio??r?.NTE);}
function recordNte(r){return r?.nte||r?.nte_nome||r?.nte_vinculado||r?.grupo||r?.territorio||r?.NTE||r?.nte_id||r?.id_nte||r?.territorio_id||'';}
function same(a,b){const x=number(a),y=number(b);return x!==null&&y!==null?x===y:norm(a)===norm(b);}
function validateRecord(r,t){if(isGlobal(t))return true;const own=userNteId(t),rid=recordNteId(r);return own!==null&&rid!==null&&own===rid;}
function filter(list,t){const arr=Array.isArray(list)?list:[];return isGlobal(t)?arr.slice():arr.filter(r=>validateRecord(r,t));}
function assertRecord(r,t,message){if(validateRecord(r,t))return true;throw new Error(message||'Acesso negado: o registro não pertence ao NTE vinculado ao usuário.');}
function scopeType(t){return isGlobal(t)?'GLOBAL':'NTE';}
function context(t){const u=user(t),global=isGlobal(u),id=userNteId(u);return Object.freeze({usuario:u,global,territorial:!global,tipo:global?'GLOBAL':'NTE',nte:global?null:(id===null?userNte(u):`NTE-${String(id).padStart(2,'0')}`),nteId:global?null:id});}
function queryFilter(query,t,field){if(isGlobal(t))return query;const id=userNteId(t);if(id===null)throw new Error('Usuário territorial sem NTE válido.');const campo=field||'nte_id';const valor=campo==='nte'||campo==='nte_nome'||campo==='grupo'||campo==='territorio'?`NTE-${String(id).padStart(2,'0')}`:id;return query.eq(campo,valor);}
function processQuery(query,t){return queryFilter(query,t,'nte');}
window.SIGEE_ESCOPO=Object.freeze({usuario:user,contexto:context,tipo:scopeType,ehGlobal:isGlobal,ehTerritorial:t=>!isGlobal(t),nteUsuario:userNte,nteIdUsuario:userNteId,numeroNte:number,mesmoNte:same,nteRegistro:recordNte,nteIdRegistro:recordNteId,validarRegistro:validateRecord,exigirRegistro:assertRecord,filtrar:filter,aplicarQuery:queryFilter,aplicarQueryProcessos:processQuery,versao:'RC7.4.1'});
})(window);
