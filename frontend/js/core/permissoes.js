/**
 * SIGEE Enterprise 1.0.2 — Matriz oficial e central de permissões.
 * Fonte única de verdade para os perfis atuais.
 */
(function(window){
  'use strict';

  const PERFIS={
    SEC:'SEC',
    MASTER:'Master',
    ADMIN:'Administrador',
    TECNICO:'Tecnico',
    ESTAGIARIO:'Estagiario',
    GESTOR:'Gestor',
    CONSULTA:'Consulta'
  };

  const MATRIZ={
    Master:{
      global:true,
      usuarios:true,
      logs:true,
      importar:true,
      exportar:true,
      abrirSolicitacao:true,
      visualizarProcesso:true,
      moverProcesso:true,
      editarProcesso:true,
      excluirProcesso:true,
      regredirProcesso:true,
      editarEscola:true
    },

    SEC:{global:true,usuarios:false,logs:true,importar:false,exportar:true,abrirSolicitacao:false,visualizarProcesso:true,moverProcesso:false,editarProcesso:false,excluirProcesso:false,regredirProcesso:false,editarEscola:false,salaSituacao:true,relatorios:true},

    Gestor:{global:true,usuarios:false,logs:false,importar:false,exportar:true,abrirSolicitacao:false,visualizarProcesso:true,moverProcesso:false,editarProcesso:false,excluirProcesso:false,regredirProcesso:false,editarEscola:false,salaSituacao:true,relatorios:true},

    Administrador:{global:false,usuarios:false,logs:true,importar:false,exportar:true,abrirSolicitacao:true,visualizarProcesso:true,moverProcesso:true,editarProcesso:true,excluirProcesso:false,regredirProcesso:false,editarEscola:true},

    Tecnico:{global:false,usuarios:false,logs:false,importar:false,exportar:false,abrirSolicitacao:true,visualizarProcesso:true,moverProcesso:true,editarProcesso:false,excluirProcesso:false,regredirProcesso:false,editarEscola:true},

    Estagiario:{global:false,usuarios:false,logs:false,importar:false,exportar:false,abrirSolicitacao:true,visualizarProcesso:true,moverProcesso:false,editarProcesso:false,excluirProcesso:false,regredirProcesso:false,editarEscola:false},

    Consulta:{global:false,usuarios:false,logs:false,importar:false,exportar:false,abrirSolicitacao:false,visualizarProcesso:true,moverProcesso:false,editarProcesso:false,excluirProcesso:false,regredirProcesso:false,editarEscola:false}
  };

  const semAcento=v=>String(v??'')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'');

  function normalizarPerfil(v){
    const p=semAcento(v).toUpperCase();
    if(p==='SEC'||p.includes('SECRETARIA'))return PERFIS.SEC;
    if(p.includes('MASTER'))return PERFIS.MASTER;
    if(p.includes('ADMIN'))return PERFIS.ADMIN;
    if(p.includes('ESTAG'))return PERFIS.ESTAGIARIO;
    if(p.includes('GESTOR')||p.includes('DIRIGENTE'))return PERFIS.GESTOR;
    if(p.includes('CONSULT'))return PERFIS.CONSULTA;
    if(p.includes('TECNIC'))return PERFIS.TECNICO;
    return String(v??'').trim();
  }

  function usuarioAtual(){
    return window.usuarioLogado||null;
  }

  function pode(acao,u){
    const alvo=u||usuarioAtual()||{};
    const perfil=normalizarPerfil(alvo.perfil);
    return Boolean(MATRIZ[perfil]&&MATRIZ[perfil][acao]);
  }

  function aplicarMenu(){
    const u=usuarioAtual();
    if(!u)return;

    const toggle=(sel,vis)=>{
      document.querySelectorAll(sel).forEach(el=>{
        el.classList.toggle('hidden',!vis);
        el.style.display=vis?'':'none';
        el.style.visibility=vis?'visible':'hidden';
        el.setAttribute('aria-hidden',vis?'false':'true');
        if('disabled' in el)el.disabled=!vis;
      });
    };

    toggle('#menu-usuarios',pode('usuarios',u));
    toggle('#menu-logs',pode('logs',u));
    toggle('#menu-sala-situacao',pode('salaSituacao',u));
    toggle('#menu-relatorios',pode('relatorios',u)||pode('visualizarProcesso',u));
    toggle('#btn-importar-dados-master,.import-only',pode('importar',u));
    toggle('.export-only',pode('exportar',u));
    toggle('[onclick*="abrirFormularioNovaSolicitacao"],.btn-nova-solicitacao,#btn-nova-solicitacao,[data-acao="nova-solicitacao"]',pode('abrirSolicitacao',u));
    toggle('[onclick*="editarProcesso"],.btn-editar-processo',pode('editarProcesso',u));

    const abaUsuarios=document.getElementById('aba-usuarios');
    if(abaUsuarios&&!abaUsuarios.classList.contains('hidden')&&!pode('usuarios',u)){
      try{window.navegar?.('painel');}
      catch(e){
        abaUsuarios.classList.add('hidden');
        document.getElementById('aba-painel')?.classList.remove('hidden');
      }
    }
  }


  let observadorPermissoes=null;
  function instalarObservadorPermissoes(){
    if(observadorPermissoes||!document.body)return;
    observadorPermissoes=new MutationObserver(()=>{
      const menu=document.getElementById('menu-usuarios');
      const deveExibir=pode('usuarios',usuarioAtual());
      if(menu){
        const visivel=menu.style.display!=='none'&&!menu.classList.contains('hidden');
        if(visivel!==deveExibir)aplicarMenu();
      }
    });
    observadorPermissoes.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  }


  function protegerNovaSolicitacao(){
    const original=window.abrirFormularioNovaSolicitacao;
    if(typeof original!=='function'||original.__SIGEE_PERMISSAO_NOVA_SOLICITACAO__)return;
    const protegida=function(){
      if(!pode('abrirSolicitacao',usuarioAtual())){
        alert('Seu perfil não possui permissão para criar nova solicitação.');
        return false;
      }
      return original.apply(this,arguments);
    };
    protegida.__SIGEE_PERMISSAO_NOVA_SOLICITACAO__=true;
    window.abrirFormularioNovaSolicitacao=protegida;
    try{abrirFormularioNovaSolicitacao=protegida}catch(e){}
  }

  window.SIGEE_PERMISSOES={
    PERFIS,
    MATRIZ,
    normalizarPerfil,
    perfilAtual:()=>normalizarPerfil((usuarioAtual()||{}).perfil),
    pode,
    ehGlobal:u=>pode('global',u),
    aplicarMenu
  };

  window.aplicarPermissoesMenuPorPerfil=aplicarMenu;

  document.addEventListener('DOMContentLoaded',()=>{
    aplicarMenu();
    protegerNovaSolicitacao();
    setTimeout(aplicarMenu,250);
    setTimeout(aplicarMenu,900);
  });
  window.addEventListener('load',()=>{
    aplicarMenu();
    protegerNovaSolicitacao();
      });
})(window);


/* Reforço final após scripts legados */
setTimeout(function(){
  try{
    window.SIGEE_PERMISSOES?.aplicarMenu?.();
  }catch(e){}
},1800);


/* =====================================================================
   AUTORIDADE ÚNICA DE PERFIS E PERMISSÕES
   Consolidado na reorganização RC3.
   ===================================================================== */

/* ---- origem consolidada: perfis-usuarios-oficial.js ---- */
/* SIGEE — Autoridade final de perfis de usuário. Não altera o workflow. */
(function(){
'use strict';
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
function perfil(v){const p=norm(v);if(p.includes('MASTER'))return'Master';if(p==='SEC'||p.includes('SECRETARIA'))return'SEC';if(p.includes('GESTOR')||p.includes('DIRIGENTE'))return'Gestor';if(p.includes('ADMIN'))return'Administrador';if(p.includes('ESTAG'))return'Estagiario';if(p.includes('CONSULT'))return'Consulta';if(p.includes('TECNIC'))return'Tecnico';return v||'';}
function u(){
  if(window.usuarioLogado) return window.usuarioLogado;
  try { if(typeof usuarioLogado!=='undefined' && usuarioLogado) return usuarioLogado; } catch(e){}
  return null;
}
function pf(){return perfil(u()?.perfil);}
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
function aplicar(){
  const atual=u();
  if(!atual) return false;
  atual.perfil=pf();
  try { window.usuarioLogado=atual; } catch(e){}
  ['master','sec','gestor','administrador','tecnico','estagiario','consulta'].forEach(function(nome){
    document.body.classList.remove('sigee-perfil-'+nome+'-oficial');
  });
  const classePerfil=norm(pf()).toLowerCase();
  if(classePerfil) document.body.classList.add('sigee-perfil-'+classePerfil+'-oficial');
  show('#menu-usuarios',can('usuarios'));
  show('#menu-relatorios',can('relatorios'));
  show('#menu-sala-situacao',can('sala'));
  show('[data-acao="nova-solicitacao"],#btn-nova-solicitacao,.btn-nova-solicitacao',can('nova'));
  show('button[onclick*="abrirModalNovaEscola"],.btn-nova-escola',can('cadEscola'));
  show('#btn-importar-dados-master,.import-only',can('importar'));
  show('[onclick*="editarProcessoMaster"],.btn-editar-processo',can('editarProcesso'));
  return true;
}
window.perfilCanonicoSIGEE=perfil;window.SIGEE_PERFIS_OFICIAL={perfil,regras,pode:can,aplicar};
const oldNova=window.abrirModalNovaEscola;window.abrirModalNovaEscola=function(){if(!can('cadEscola')){alert('Somente o perfil Master pode cadastrar escola.');return false;}return oldNova?.apply(this,arguments);};
const oldNav=window.navegar;if(typeof oldNav==='function'){window.navegar=function(aba){if(aba==='usuarios'&&!can('usuarios'))return alert('Acesso exclusivo do perfil Master.');if(aba==='sala-situacao'&&!can('sala'))return alert('Acesso permitido apenas para Master, SEC e Gestor.');const r=oldNav.apply(this,arguments);aplicar();return r;};try{navegar=window.navegar}catch(e){}}
function reaplicarEmSequencia(){
  [0,80,250,700,1600,3200].forEach(ms=>setTimeout(aplicar,ms));
}
function envolverPermissoes(nome){
  const original=window[nome];
  if(typeof original!=='function'||original.__sigeePerfisOficial) return;
  const wrapper=function(){
    const r=original.apply(this,arguments);
    setTimeout(aplicar,0);
    return r;
  };
  wrapper.__sigeePerfisOficial=true;
  window[nome]=wrapper;
  try { eval(nome+' = window[nome]'); } catch(e){}
}
function instalarAutoridade(){
  ['aplicarPermissoes','aplicarPermissoesV39','aplicarPermissoesV40','aplicarPermissoesV41','aplicarPermissoesV42'].forEach(envolverPermissoes);
  reaplicarEmSequencia();
}
const css=document.createElement('style');
css.id='sigee-perfis-oficial-css';
css.textContent=[
'body.sigee-perfil-master-oficial #menu-usuarios,body.sigee-perfil-master-oficial #menu-relatorios,body.sigee-perfil-master-oficial #menu-sala-situacao{display:block!important;visibility:visible!important;opacity:1!important;}',
'body.sigee-perfil-sec-oficial #menu-relatorios,body.sigee-perfil-sec-oficial #menu-sala-situacao{display:block!important;visibility:visible!important;opacity:1!important;}',
'body.sigee-perfil-gestor-oficial #menu-relatorios,body.sigee-perfil-gestor-oficial #menu-sala-situacao{display:block!important;visibility:visible!important;opacity:1!important;}',
'body:not(.sigee-perfil-master-oficial) #menu-usuarios{display:none!important;}',
'body.sigee-perfil-administrador-oficial #menu-sala-situacao,body.sigee-perfil-tecnico-oficial #menu-sala-situacao,body.sigee-perfil-estagiario-oficial #menu-sala-situacao,body.sigee-perfil-consulta-oficial #menu-sala-situacao{display:none!important;}'
].join('\n');
document.head.appendChild(css);
document.addEventListener('DOMContentLoaded',instalarAutoridade);
window.addEventListener('load',instalarAutoridade);
document.addEventListener('sigee:usuario-logado',reaplicarEmSequencia);
document.addEventListener('submit',function(ev){if(ev.target&&ev.target.closest('#form-login,form'))reaplicarEmSequencia();},true);
window.addEventListener('focus',function(){setTimeout(aplicar,50);});
window.SIGEE_REAPLICAR_PERFIS_OFICIAL=reaplicarEmSequencia;
})();

