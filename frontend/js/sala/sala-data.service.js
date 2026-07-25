/* SIGEE Enterprise RC6.4.0 — Serviço territorial da Sala de Situação */
(function(){
 'use strict';
 const txt=v=>v==null?'':String(v).trim();
 const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 function nte(v){const s=txt(v);const m=s.match(/NTE\s*[- ]?\s*(\d{1,2})/i);if(m)return 'NTE-'+String(Number(m[1])).padStart(2,'0');if(/^\d{1,2}$/.test(s))return 'NTE-'+String(Number(s)).padStart(2,'0');return s||'SEM NTE';}
 function usuario(){return window.SIGEE_AUTORIZACAO?.usuario?.()||window.usuarioLogado||window.usuarioAtual||{};}
 function perfil(){return norm(usuario().perfil||usuario().role||usuario().tipo);}
 function nteUsuario(){const u=usuario();return nte(window.SIGEE_ESCOPO?.nteUsuario?.(u)||window.SIGEE_ESCOPO?.nteIdUsuario?.(u)||u.nte||u.nte_nome||u.nte_id);}
 function contexto(){const p=perfil();const global=p==='MASTER';return {permitido:['MASTER','GESTOR','ADMINISTRADOR'].includes(p),perfil:p,global,nte:global?null:nteUsuario(),escopo:global?'ESTADUAL':'NTE'};}
 function supabase(){try{return window.obterSupabaseSIGEE?.()||window.criarClienteSupabaseSIGEE?.()||window.SIGEE_SUPABASE?.criarCliente?.()||window.supabaseClient||null;}catch(_){return null;}}
 async function buscarTodos(){
   const cli=supabase();
   if(!cli){const local=Array.isArray(window.processosDB)?window.processosDB:[];return {dados:local.slice(),fonte:'MEMORIA_LOCAL'};}
   const lote=1000;let de=0;let todos=[];
   while(true){
     const {data,error}=await cli.from('processos').select('*').range(de,de+lote-1);
     if(error)throw error;
     const arr=Array.isArray(data)?data:[];todos=todos.concat(arr);
     if(arr.length<lote)break;de+=lote;
   }
   return {dados:todos,fonte:'SUPABASE_PAGINADO'};
 }
 function aplicarEscopo(dados,ctx){if(ctx.global)return dados.slice();return dados.filter(p=>nte(p.nte||p.nte_nome||p.territorio||p.nte_id)===ctx.nte);}
 window.SIGEE_SALA_DATA={contexto,carregar:async function(){const ctx=contexto();if(!ctx.permitido)throw new Error('Perfil sem acesso à Sala de Situação 2.0.');const r=await buscarTodos();return {contexto:ctx,processos:aplicarEscopo(r.dados,ctx),totalCarregado:r.dados.length,fonte:r.fonte};},nte};
})();
