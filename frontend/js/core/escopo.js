/** SIGEE RC4.2 — Escopo territorial único. Somente Master possui visão global. */
(function(window){'use strict';
function user(t){return t||window.SIGEE_SESSION?.getUser?.()||{};}
function norm(v){return String(v??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();}
function number(v){const m=String(v??'').match(/(?:NTE\s*[- ]?)?(\d{1,2})/i);return m?Number(m[1]):null;}
function nte(t){const u=user(t);return u.nte||u.nte_nome||u.nte_vinculado||u.grupo||u.territorio||u.nte_id||'';}
function global(t){return window.SIGEE_PERMISSOES?.pode?.('global',user(t))===true;}
function same(a,b){const x=number(a),y=number(b);return x&&y?x===y:norm(a)===norm(b);}
function recordNte(r){return r?.nte||r?.nte_nome||r?.nte_vinculado||r?.grupo||r?.territorio||r?.NTE||r?.nte_id||r?.id_nte||r?.territorio_id||'';}
function filter(list,t){const arr=Array.isArray(list)?list:[];if(global(t))return arr.slice();const own=nte(t);if(!own)return[];return arr.filter(r=>same(recordNte(r),own));}
window.SIGEE_ESCOPO=Object.freeze({usuario:user,ehGlobal:global,nteUsuario:nte,numeroNte:number,mesmoNte:same,nteRegistro:recordNte,filtrar:filter});
})(window);
