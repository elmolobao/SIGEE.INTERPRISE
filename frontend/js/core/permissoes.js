/** SIGEE RC4.2.2 — Matriz única de permissões e escopo analítico. */
(function(window){
'use strict';
const M=Object.freeze({
 Master:Object.freeze({global:1,usuarios:1,logs:1,salaSituacao:1,inteligencia:1,relatorios:1,importarEscola:1,exportar:1,abrirSolicitacao:1,visualizarProcesso:1,moverProcesso:1,editarProcesso:1,excluirProcesso:1,regredirProcesso:1,cadastrarEscola:1,editarEscola:1}),
 SEC:Object.freeze({global:1,usuarios:0,logs:0,salaSituacao:1,inteligencia:1,relatorios:1,importarEscola:0,exportar:1,abrirSolicitacao:0,visualizarProcesso:1,moverProcesso:0,editarProcesso:0,excluirProcesso:0,regredirProcesso:0,cadastrarEscola:0,editarEscola:1}),
 Gestor:Object.freeze({global:1,usuarios:0,logs:0,salaSituacao:1,inteligencia:1,relatorios:1,importarEscola:0,exportar:1,abrirSolicitacao:0,visualizarProcesso:1,moverProcesso:0,editarProcesso:0,excluirProcesso:0,regredirProcesso:0,cadastrarEscola:0,editarEscola:0}),
 Administrador:Object.freeze({global:0,usuarios:0,logs:0,salaSituacao:0,inteligencia:1,relatorios:1,importarEscola:0,exportar:1,abrirSolicitacao:1,visualizarProcesso:1,moverProcesso:1,editarProcesso:1,excluirProcesso:0,regredirProcesso:0,cadastrarEscola:0,editarEscola:1}),
 'Técnico':Object.freeze({global:0,usuarios:0,logs:0,salaSituacao:0,inteligencia:1,relatorios:1,importarEscola:0,exportar:0,abrirSolicitacao:1,visualizarProcesso:1,moverProcesso:1,editarProcesso:0,excluirProcesso:0,regredirProcesso:0,cadastrarEscola:0,editarEscola:1}),
 'Estagiário':Object.freeze({global:0,usuarios:0,logs:0,salaSituacao:0,inteligencia:1,relatorios:1,importarEscola:0,exportar:0,abrirSolicitacao:1,visualizarProcesso:1,moverProcesso:0,editarProcesso:0,excluirProcesso:0,regredirProcesso:0,cadastrarEscola:0,editarEscola:0}),
 Consulta:Object.freeze({global:0,usuarios:0,logs:0,salaSituacao:0,inteligencia:0,relatorios:1,importarEscola:0,exportar:0,abrirSolicitacao:0,visualizarProcesso:1,moverProcesso:0,editarProcesso:0,excluirProcesso:0,regredirProcesso:0,cadastrarEscola:0,editarEscola:0})
});
function user(target){return target||window.SIGEE_SESSION?.getUser?.()||null;}
function profile(target){return window.SIGEE_SESSION?.normalizarPerfil?.(user(target)?.perfil)||'';}
function can(action,target){return Boolean(M[profile(target)]?.[action]);}
function apply(){const u=user();if(!u||!document.body)return false;document.body.dataset.sigeePerfil=profile(u);const vis=(s,v)=>document.querySelectorAll(s).forEach(e=>{e.classList.toggle('hidden',!v);e.style.display=v?'':'none';if('disabled'in e)e.disabled=!v;});vis('#menu-usuarios,#menu-administracao-bloco',can('usuarios'));vis('#menu-logs',can('logs'));vis('#menu-relatorios',can('relatorios'));vis('#menu-sala-situacao',can('salaSituacao'));vis('#menu-inteligencia,[onclick*="centro-inteligencia"]',can('inteligencia'));vis('#btn-nova-solicitacao,[data-acao="nova-solicitacao"],.btn-nova-solicitacao',can('abrirSolicitacao'));vis('#btn-importar-dados-master,.import-only',can('importarEscola'));vis('.export-only',can('exportar'));vis('button[onclick*="abrirModalNovaEscola"],.btn-nova-escola',can('cadastrarEscola'));vis('[data-sigee-permissao="editar-escola"],.btn-editar-escola,.btn-alterar-escola-sigee,button[onclick*="editarEscola"],button[onclick*="abrirModalEditarEscola"]',can('editarEscola'));return true;}
function isGlobal(target){return can('global',target);}
function currentNte(target){const u=user(target)||{};return u.nte||u.nte_nome||u.nte_vinculado||u.grupo||u.territorio||u.nte_id||'';}
function filterTerritory(list,target){const arr=Array.isArray(list)?list:[];if(isGlobal(target))return arr.slice();return window.SIGEE_ESCOPO?.filtrar?window.SIGEE_ESCOPO.filtrar(arr,target):[];}
window.SIGEE_PERMISSOES=Object.freeze({MATRIZ:M,normalizarPerfil:v=>window.SIGEE_SESSION?.normalizarPerfil?.(v)||'',obterUsuario:user,obterPerfil:profile,pode:can,ehGlobal:isGlobal,nteAtual:currentNte,filtrarTerritorio:filterTerritory,aplicar:apply});
})(window);
