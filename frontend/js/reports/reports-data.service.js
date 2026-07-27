/* SIGEE Enterprise RC7.4.0 — Serviço central de relatórios */
(function(){
'use strict';
if(window.SIGEE_REPORTS_DATA) return;
const CACHE_MS=5*60*1000;
const cache=new Map();
const txt=v=>v==null?'':String(v).trim();
const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function nte(v){const s=txt(v);const m=s.match(/NTE\s*[- ]?\s*(\d{1,2})/i);if(m)return 'NTE-'+String(Number(m[1])).padStart(2,'0');if(/^\d{1,2}$/.test(s))return 'NTE-'+String(Number(s)).padStart(2,'0');return s||'SEM NTE';}
function usuario(){return window.SIGEE_AUTORIZACAO?.usuario?.()||window.usuarioLogado||window.usuarioAtual||{};}
function contexto(){const u=usuario(),oficial=window.SIGEE_ESCOPO?.contexto?.(u),p=norm(u.perfil||u.role||u.tipo),global=oficial?oficial.global:['MASTER','SEC'].includes(p);return {perfil:p,global,nte:global?null:nte(oficial?.nte||window.SIGEE_ESCOPO?.nteUsuario?.(u)||u.nte||u.nte_nome||u.nte_id)};}
function supabase(){try{return window.obterSupabaseSIGEE?.()||window.criarClienteSupabaseSIGEE?.()||window.SIGEE_SUPABASE?.criarCliente?.()||window.supabaseClient||null;}catch(_){return null;}}
async function buscarTodos(){const u=usuario(),cli=supabase();if(!cli){const local=Array.isArray(window.processosDB)?window.processosDB.slice():[];return {dados:window.SIGEE_ESCOPO?.filtrar?window.SIGEE_ESCOPO.filtrar(local,u):local,fonte:'MEMORIA_LOCAL'};}let todos=[],de=0,lote=1000;while(true){let q=cli.from('processos').select('*');q=window.SIGEE_ESCOPO?.aplicarQueryProcessos?window.SIGEE_ESCOPO.aplicarQueryProcessos(q,u):q;const {data,error}=await q.range(de,de+lote-1);if(error)throw error;const arr=Array.isArray(data)?data:[];todos.push(...arr);if(arr.length<lote)break;de+=lote;}return {dados:window.SIGEE_ESCOPO?.filtrar?window.SIGEE_ESCOPO.filtrar(todos,u):todos,fonte:'SUPABASE_PAGINADO_TERRITORIAL'};}
async function carregar(forcar=false){const ctx=contexto(),key=`${ctx.global?'GLOBAL':ctx.nte}`;const salvo=cache.get(key);if(!forcar&&salvo&&Date.now()-salvo.at<CACHE_MS)return {...salvo.data,cache:true};const r=await buscarTodos();const dados=window.SIGEE_ESCOPO?.filtrar?window.SIGEE_ESCOPO.filtrar(r.dados,usuario()):(ctx.global?r.dados:r.dados.filter(p=>nte(p.nte||p.nte_nome||p.nte_id)===ctx.nte));const data={processos:dados,totalCarregado:r.dados.length,fonte:r.fonte,contexto:ctx,cache:false};cache.set(key,{at:Date.now(),data});return data;}
function limpar(){cache.clear();}
window.SIGEE_REPORTS_DATA={carregar,limpar,nte,contexto,versao:'RC7.4.0'};
})();
