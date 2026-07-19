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
