/**
 * SIGEE Enterprise RC4.7.0 — Autoridade única de capacidades.
 * Perfis definem capacidades; SIGEE_ESCOPO define em quais registros elas valem.
 */
(function(window){
'use strict';
if(window.__SIGEE_PERMISSOES_RC470__)return;
window.__SIGEE_PERMISSOES_RC470__=true;

const C=Object.freeze({
  Master:Object.freeze({
    'escopo.global':1,'processos.visualizar':1,'processos.criar':1,'processos.movimentar':1,'processos.editar_administrativo':1,'processos.editar_estrutural':1,'processos.reatribuir':1,'processos.regredir':1,'processos.excluir':1,
    'indicadores.visualizar':1,'relatorios.visualizar':1,'relatorios.exportar':1,'produtividade.visualizar':1,
    'escolas.visualizar':1,'escolas.editar_operacional':1,'escolas.editar_cadastral':1,'escolas.importar':1,
    'usuarios.visualizar':1,'usuarios.gerenciar_nte':1,'usuarios.gerenciar_global':1,'logs.visualizar':1,'migracao.executar':1,'sistema.suspender_nte':1
  }),
  SEC:Object.freeze({
    'escopo.global':1,'processos.visualizar':1,'indicadores.visualizar':1,'relatorios.visualizar':1,'relatorios.exportar':1,'produtividade.visualizar':1,'escolas.visualizar':1
  }),
  Gestor:Object.freeze({
    'processos.visualizar':1,'processos.reatribuir':1,'indicadores.visualizar':1,'relatorios.visualizar':1,'relatorios.exportar':1,'produtividade.visualizar':1,'escolas.visualizar':1,'usuarios.visualizar_nte':1
  }),
  Administrador:Object.freeze({
    'processos.visualizar':1,'processos.criar':1,'processos.movimentar':1,'processos.editar_administrativo':1,'processos.reatribuir':1,
    'indicadores.visualizar':1,'relatorios.visualizar':1,'relatorios.exportar':1,'produtividade.visualizar':1,
    'escolas.visualizar':1,'escolas.editar_operacional':1,'usuarios.visualizar_nte':1,'usuarios.gerenciar_nte':1
  }),
  'Técnico':Object.freeze({
    'processos.visualizar':1,'processos.criar':1,'processos.movimentar':1,'indicadores.visualizar':1,'relatorios.visualizar':1,'escolas.visualizar':1,'escolas.editar_operacional':1
  }),
  'Estagiário':Object.freeze({'processos.criar':1,'escolas.visualizar':1}),
  Consulta:Object.freeze({'processos.visualizar':1,'relatorios.visualizar':1,'escolas.visualizar':1})
});

// Compatibilidade temporária. Novos módulos devem usar apenas as capacidades acima.
const LEGADO=Object.freeze({
 global:'escopo.global',usuarios:'usuarios.gerenciar_global',logs:'logs.visualizar',salaSituacao:'indicadores.visualizar',inteligencia:'indicadores.visualizar',relatorios:'relatorios.visualizar',
 importarEscola:'escolas.importar',exportar:'relatorios.exportar',abrirSolicitacao:'processos.criar',visualizarProcesso:'processos.visualizar',moverProcesso:'processos.movimentar',
 editarProcesso:'processos.editar_administrativo',excluirProcesso:'processos.excluir',regredirProcesso:'processos.regredir',cadastrarEscola:'escolas.editar_cadastral',editarEscola:'escolas.editar_operacional'
});
function user(target){return target||window.SIGEE_SESSION?.getUser?.()||null;}
function profile(target){return window.SIGEE_PERFIS?.normalizar?.(user(target)?.perfil)||window.SIGEE_SESSION?.normalizarPerfil?.(user(target)?.perfil)||'';}
function capability(action){return LEGADO[action]||action;}
function can(action,target){return Boolean(C[profile(target)]?.[capability(action)]);}
function requireCapability(action,target,message){if(can(action,target))return true; if(message!==false)alert(message||'Seu perfil não possui permissão para esta ação.');return false;}
function apply(){
 const u=user();if(!u||!document.body)return false; const p=profile(u);document.body.dataset.sigeePerfil=p;document.body.dataset.sigeeEscopo=can('escopo.global',u)?'GLOBAL':'NTE';
 const vis=(s,v)=>document.querySelectorAll(s).forEach(e=>{e.classList.toggle('hidden',!v);e.style.display=v?'':'none';e.setAttribute('aria-hidden',v?'false':'true');if('disabled'in e)e.disabled=!v;});
 vis('#menu-usuarios,#menu-administracao-bloco',can('usuarios.gerenciar_global')||can('usuarios.gerenciar_nte'));
 vis('#menu-logs',can('logs.visualizar'));vis('#menu-relatorios',can('relatorios.visualizar'));vis('#menu-sala-situacao,#menu-inteligencia,[onclick*="centro-inteligencia"]',can('indicadores.visualizar'));
 vis('#btn-nova-solicitacao,[data-acao="nova-solicitacao"],.btn-nova-solicitacao',can('processos.criar'));vis('#btn-importar-dados-master,.import-only',can('escolas.importar'));vis('.export-only',can('relatorios.exportar'));
 vis('button[onclick*="abrirModalNovaEscola"],.btn-nova-escola',can('escolas.editar_cadastral'));vis('[data-sigee-permissao="editar-escola"],.btn-editar-escola,.btn-alterar-escola-sigee,button[onclick*="editarEscola"],button[onclick*="abrirModalEditarEscola"]',can('escolas.editar_operacional'));
 return true;
}
function matrix(){return C;}
function capabilities(target){return Object.keys(C[profile(target)]||{}).filter(k=>C[profile(target)][k]);}
window.SIGEE_PERMISSOES=Object.freeze({MATRIZ:C,LEGADO,normalizarPerfil:v=>window.SIGEE_PERFIS?.normalizar?.(v)||'',obterUsuario:user,obterPerfil:profile,pode:can,exigir:requireCapability,ehGlobal:t=>can('escopo.global',t),capacidades:capabilities,matriz:matrix,aplicar,nteAtual:t=>window.SIGEE_ESCOPO?.nteUsuario?.(t)||'',filtrarTerritorio:(l,t)=>window.SIGEE_ESCOPO?.filtrar?.(l,t)||[]});
})(window);
