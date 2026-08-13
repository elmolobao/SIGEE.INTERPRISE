/** SIGEE Enterprise — GT-04 Cobertura das Formações e atuação territorial. */
(function(window){
'use strict';
if(window.SIGEE_TERRITORIAL_FORMACOES_SERVICE) return;
function cliente(){try{return window.SIGEE_SUPABASE?.criarCliente?.()||window.SIGEE_SUPABASE_CLIENT||window.supabaseClient||null;}catch(_){return null;}}
function usuario(){return window.SIGEE_SESSION?.getUser?.()||window.usuarioLogado||null;}
function perfil(){return window.SIGEE_PERFIS?.normalizar?.(usuario()?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(usuario()?.perfil)||String(usuario()?.perfil||'');}
function master(){return perfil()==='Master';}
function exigir(){if(!master())throw new Error('Acesso restrito ao perfil Master.');const c=cliente();if(!c)throw new Error('Cliente Supabase indisponível.');return c;}
async function agenda(){const c=exigir();const {data,error}=await c.from('gt_agenda').select('*').order('inicio',{ascending:true});if(error)throw error;return data||[];}
async function monitoramento(){const c=exigir();const {data,error}=await c.from('gt_monitoramento').select('id,nte_numero,fase,data_registro,titulo,categoria,relevancia,resultado').order('data_registro',{ascending:false});if(error)throw error;return data||[];}
async function carregar(){const [a,m]=await Promise.all([agenda(),monitoramento()]);return{agenda:a,monitoramento:m};}
window.SIGEE_TERRITORIAL_FORMACOES_SERVICE=Object.freeze({agenda,monitoramento,carregar,master,versao:'GT-04.0'});
})(window);
