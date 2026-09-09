/** SIGEE RC12.0.4 — Cadastro de Técnicos Territoriais. */
(function(window){
'use strict';
if(window.SIGEE_TERRITORIAL_TECNICOS_SERVICE?.versao==='RC12.0.4')return;
const T='gt_tecnicos';
function cliente(){try{return window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||window.supabaseClient||null;}catch(_){return null;}}
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||window.usuarioAtual||null;}
function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil)||String(usuario()?.perfil||'').trim();}
function autorizado(){return ['Master','SEC'].includes(perfil());}
function exigir(){if(!autorizado())throw new Error('Cadastro de Técnicos disponível somente para Master e SEC.');const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível.');return c;}
function txt(v){return String(v??'').trim();}
async function listar(f={}){const c=exigir();let q=c.from(T).select('*').order('nte_numero',{ascending:true}).order('nome_completo',{ascending:true});if(f.nte)q=q.eq('nte_numero',Number(f.nte));if(f.situacao==='ativos')q=q.eq('faz_parte_setor',true);if(f.situacao==='inativos')q=q.eq('faz_parte_setor',false);if(f.novos===true)q=q.eq('novo_cadastro',true);const {data,error}=await q;if(error)throw error;return data||[];}
async function contarNovos(){const c=exigir();const {count,error}=await c.from(T).select('id',{count:'exact',head:true}).eq('novo_cadastro',true).eq('faz_parte_setor',true);if(error)throw error;return Number(count||0);}
async function atualizar(id,p={}){const c=exigir(),u=usuario()||{};const reg={nome_completo:txt(p.nome_completo),nte_numero:Number(p.nte_numero)||null,login_rede:txt(p.login_rede)||null,email_enova:txt(p.email_enova).toLowerCase()||null,email_atividades:txt(p.email_atividades).toLowerCase()||null,data_nascimento:p.data_nascimento||null,cpf:txt(p.cpf)||null,telefone:txt(p.telefone)||null,nome_mae:txt(p.nome_mae)||null,acesso_glpi:p.acesso_glpi===true,acesso_edoc:p.acesso_edoc===true,acesso_sigeduc:p.acesso_sigeduc===true,acesso_sigee:p.acesso_sigee===true,faz_parte_setor:p.faz_parte_setor!==false,novo_cadastro:false,revisado_em:new Date().toISOString(),revisado_por:u.nome||u.name||u.email||perfil(),updated_at:new Date().toISOString()};if(!reg.nome_completo)throw new Error('Informe o nome do técnico.');if(!reg.nte_numero)throw new Error('Informe o NTE.');const {data,error}=await c.from(T).update(reg).eq('id',Number(id)).select('*').single();if(error)throw error;document.dispatchEvent(new CustomEvent('sigee:gt-tecnicos-atualizado'));return data;}
async function marcarInativo(id){const c=exigir(),u=usuario()||{};const agora=new Date().toISOString();const {data,error}=await c.from(T).update({faz_parte_setor:false,novo_cadastro:false,data_saida_setor:agora.slice(0,10),revisado_em:agora,revisado_por:u.nome||u.name||u.email||perfil(),updated_at:agora}).eq('id',Number(id)).select('*').single();if(error)throw error;document.dispatchEvent(new CustomEvent('sigee:gt-tecnicos-atualizado'));return data;}
let canal=null;
function iniciarRealtime(){if(canal||!autorizado())return;const c=cliente();if(!c?.channel)return;try{canal=c.channel('gt-tecnicos-novos').on('postgres_changes',{event:'INSERT',schema:'public',table:T},payload=>{document.dispatchEvent(new CustomEvent('sigee:gt-tecnicos-novo',{detail:payload.new||{}}));}).subscribe();}catch(e){console.warn('[Técnicos] realtime indisponível:',e?.message||e);}}
window.addEventListener('sigee:session-ready',()=>setTimeout(iniciarRealtime,500));
window.addEventListener('sigee:login-concluido',()=>setTimeout(iniciarRealtime,500));
window.SIGEE_TERRITORIAL_TECNICOS_SERVICE=Object.freeze({listar,contarNovos,atualizar,marcarInativo,autorizado,iniciarRealtime,versao:'RC12.0.4'});
})(window);
