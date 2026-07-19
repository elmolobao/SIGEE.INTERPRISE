/* SIGEE — Autoridade final de perfis de usuário. Não altera o workflow. */
(function(){
'use strict';
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
function perfil(v){const p=norm(v);if(p.includes('MASTER'))return'Master';if(p==='SEC'||p.includes('SECRETARIA'))return'SEC';if(p.includes('GESTOR')||p.includes('DIRIGENTE'))return'Gestor';if(p.includes('ADMIN'))return'Administrador';if(p.includes('ESTAG'))return'Estagiario';if(p.includes('CONSULT'))return'Consulta';if(p.includes('TECNIC'))return'Tecnico';return v||'';}
function u(){return window.usuarioLogado||null;} function pf(){return perfil(u()?.perfil);}
const regras={
 Master:{usuarios:1,relatorios:1,sala:1,nova:1,cadEscola:1,editEscola:1,importar:1,editarProcesso:1},
 SEC:{usuarios:0,relatorios:1,sala:1,nova:0,cadEscola:0,editEscola:0,importar:0,editarProcesso:0},
 Gestor:{usuarios:0,relatorios:1,sala:1,nova:0,cadEscola:0,editEscola:0,importar:0,editarProcesso:0},
 Administrador:{usuarios:0,relatorios:1,sala:0,nova:1,cadEscola:0,editEscola:1,importar:0,editarProcesso:1},
 Tecnico:{usuarios:0,relatorios:0,sala:0,nova:1,cadEscola:0,editEscola:1,importar:0,editarProcesso:0},
 Estagiario:{usuarios:0,relatorios:0,sala:0,nova:1,cadEscola:0,editEscola:0,importar:0,editarProcesso:0},
 Consulta:{usuarios:0,relatorios:0,sala:0,nova:0,cadEscola:0,editEscola:0,importar:0,editarProcesso:0}
};
function can(k){return !!regras[pf()]?.[k];}
function show(sel,ok){document.querySelectorAll(sel).forEach(e=>{e.classList.toggle('hidden',!ok);e.style.display=ok?'':'none';if('disabled'in e)e.disabled=!ok;});}
function aplicar(){if(!u())return;u().perfil=pf();show('#menu-usuarios',can('usuarios'));show('#menu-relatorios',can('relatorios'));show('#menu-sala-situacao',can('sala'));show('[data-acao="nova-solicitacao"],#btn-nova-solicitacao,.btn-nova-solicitacao',can('nova'));show('button[onclick*="abrirModalNovaEscola"],.btn-nova-escola',can('cadEscola'));show('#btn-importar-dados-master,.import-only',can('importar'));show('[onclick*="editarProcessoMaster"],.btn-editar-processo',can('editarProcesso'));}
window.perfilCanonicoSIGEE=perfil;window.SIGEE_PERFIS_OFICIAL={perfil,regras,pode:can,aplicar};
const oldNova=window.abrirModalNovaEscola;window.abrirModalNovaEscola=function(){if(!can('cadEscola')){alert('Somente o perfil Master pode cadastrar escola.');return false;}return oldNova?.apply(this,arguments);};
const oldNav=window.navegar;if(typeof oldNav==='function'){window.navegar=function(aba){if(aba==='usuarios'&&!can('usuarios'))return alert('Acesso exclusivo do perfil Master.');if(aba==='sala-situacao'&&!can('sala'))return alert('Acesso permitido apenas para Master, SEC e Gestor.');const r=oldNav.apply(this,arguments);aplicar();return r;};try{navegar=window.navegar}catch(e){}}
document.addEventListener('DOMContentLoaded',aplicar);window.addEventListener('load',aplicar);document.addEventListener('sigee:usuario-logado',aplicar);
})();
