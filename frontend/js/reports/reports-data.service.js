/* SIGEE Enterprise RC6.5.0 — Serviço central de relatórios */
(function(){
'use strict';
if(window.SIGEE_REPORTS_DATA) return;
const CACHE_MS=5*60*1000;
let cache={at:0,data:null};
const txt=v=>v==null?'':String(v).trim();
const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function nte(v){const s=txt(v);const m=s.match(/NTE\s*[- ]?\s*(\d{1,2})/i);if(m)return 'NTE-'+String(Number(m[1])).padStart(2,'0');if(/^\d{1,2}$/.test(s))return 'NTE-'+String(Number(s)).padStart(2,'0');return s||'SEM NTE';}
function usuario(){return window.SIGEE_AUTORIZACAO?.usuario?.()||window.usuarioLogado||window.usuarioAtual||{};}
function contexto(){const u=usuario(),p=norm(u.perfil||u.role||u.tipo),global=['MASTER','SEC'].includes(p);return {perfil:p,global,nte:global?null:nte(window.SIGEE_ESCOPO?.nteUsuario?.(u)||u.nte||u.nte_nome||u.nte_id)};}
function supabase(){try{return window.obterSupabaseSIGEE?.()||window.criarClienteSupabaseSIGEE?.()||window.SIGEE_SUPABASE?.criarCliente?.()||window.supabaseClient||null;}catch(_){return null;}}
async function buscarTodos(){const cli=supabase();if(!cli)return {dados:Array.isArray(window.processosDB)?window.processosDB.slice():[],fonte:'MEMORIA_LOCAL'};let todos=[],de=0,lote=1000;while(true){const {data,error}=await cli.from('processos').select('*').range(de,de+lote-1);if(error)throw error;const arr=Array.isArray(data)?data:[];todos.push(...arr);if(arr.length<lote)break;de+=lote;}return {dados:todos,fonte:'SUPABASE_PAGINADO'};}
async function carregar(forcar=false){if(!forcar&&cache.data&&Date.now()-cache.at<CACHE_MS)return {...cache.data,cache:true};const ctx=contexto(),r=await buscarTodos(),dados=ctx.global?r.dados:r.dados.filter(p=>nte(p.nte||p.nte_nome||p.nte_id)===ctx.nte);cache={at:Date.now(),data:{processos:dados,totalCarregado:r.dados.length,fonte:r.fonte,contexto:ctx,cache:false}};return cache.data;}
function limpar(){cache={at:0,data:null};}
window.SIGEE_REPORTS_DATA={carregar,limpar,nte,contexto,versao:'RC6.5.0'};
})();
