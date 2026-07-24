/** SIGEE Enterprise RC5.0.0 — Fonte territorial única para módulos de leitura. */
(function(window){'use strict';if(window.__SIGEE_DADOS_ESCOPO_RC500__)return;window.__SIGEE_DADOS_ESCOPO_RC500__=true;
function usuario(){return window.SIGEE_AUTORIZACAO?.usuario?.()||window.SIGEE_SESSION?.getUser?.()||null;}
function array(...nomes){for(const n of nomes){try{if(Array.isArray(window[n]))return window[n]}catch(_){}}return [];}
function escopar(lista,u=usuario()){return window.SIGEE_ESCOPO?.filtrar?.(Array.isArray(lista)?lista:[],u)||[];}
function processos(){return escopar(array('processosDB','processos'));}
function escolas(){return escopar(array('escolasDB','escolas','catalogoEscolas'));}
function usuarios(){return escopar(array('usuariosDB','usuarios'));}
function aplicarQuery(query,campo='nte_id',u=usuario()){return window.SIGEE_ESCOPO?.aplicarQuery?.(query,u,campo)||query;}
window.SIGEE_DADOS=Object.freeze({usuario,array,escopar,processos,escolas,usuarios,aplicarQuery});
})(window);
