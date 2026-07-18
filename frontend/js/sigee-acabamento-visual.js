/* =====================================================================
   SIGEE Enterprise — Sprint 2.3.5
   Classificação visual segura e cabeçalho do modo edição.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_ACABAMENTO_VISUAL_235__) return;
  window.__SIGEE_ACABAMENTO_VISUAL_235__=true;

  const txt=v=>v==null?'':String(v).trim();
  const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();

  function classificarBotoes(){
    document.querySelectorAll('#tabela-processos-corpo button').forEach(btn=>{
      const t=norm(btn.textContent);
      const oc=norm(btn.getAttribute('onclick')||'');
      if((t.includes('PRONTUARIO')||t.includes('HISTORICO')||oc.includes('ABRIRHISTORICO'))&&!btn.classList.contains('sigee-acao-prontuario')) btn.classList.add('sigee-acao-prontuario');
      if((t==='EDITAR'||t.includes('CORRIGIR CADASTRO')||oc.includes('EDITARPROCESSO'))&&!btn.classList.contains('sigee-acao-editar')) btn.classList.add('sigee-acao-editar');
      if((t.includes('AVANCAR')||oc.includes('AVANCARPROCESSO'))&&!btn.classList.contains('sigee-acao-avancar')) btn.classList.add('sigee-acao-avancar');
      if((t.includes('REGREDIR')||oc.includes('REGREDIRPROCESSO'))&&!btn.classList.contains('sigee-acao-regredir')) btn.classList.add('sigee-acao-regredir');
      if((t.includes('EXCLUIR')||oc.includes('EXCLUIRPROCESSO'))&&!btn.classList.contains('sigee-acao-excluir')) btn.classList.add('sigee-acao-excluir');
    });
  }


  const CLASSES_ACAO=['sigee-btn-seguir','sigee-btn-atencao','sigee-btn-critico','sigee-btn-neutro','sigee-btn-atas','sigee-btn-confirmacao'];

  function classificarBotoesWorkflow(){
    document.querySelectorAll('button').forEach(btn=>{
      const t=norm(btn.textContent);
      if(!t) return;
      btn.classList.remove(...CLASSES_ACAO);
      if(/INDEFERIR|CANCELAR|EXCLUIR/.test(t)) btn.classList.add('sigee-btn-critico');
      else if(/PEDIDO DE ATAS|ENVIAR PEDIDO DE ATAS/.test(t)) btn.classList.add('sigee-btn-atas');
      else if(/RETIFICACAO|RETIFICAR|REINICIAR CICLO/.test(t)) btn.classList.add('sigee-btn-neutro');
      else if(/CONFIRMACAO DOS DADOS|CONFIRMAR DADOS/.test(t)) btn.classList.add('sigee-btn-confirmacao');
      else if(/REGISTRAR PENDENCIA|REITERACAO/.test(t) && !/URG/.test(t)) btn.classList.add('sigee-btn-atencao');
      else if(/REITERACAO COM URGENCIA|REITERACAO URGENTE/.test(t)) btn.classList.add('sigee-btn-critico');
      else if(/PROSSEGUIR|ENVIAR PARA|RECEBER DOCUMENTO|REGISTRAR DOCUMENTO RECEBIDO|CONCLUIR RETIRADA|DEFERIR|DEFERIDO|DOCUMENTO CONFERIDO|AVANCAR/.test(t)) btn.classList.add('sigee-btn-seguir');
    });
  }

  function dadosProcessoAtual(){
    const modal=document.getElementById('modal-nova-solicitacao');
    if(!modal||modal.dataset.sigeeModo!=='editar') return null;
    const titulo=modal.querySelector('h1,h2,h3,.modal-title,[data-modal-title]');
    const textoTitulo=txt(titulo?.textContent);
    const codigo=(textoTitulo.match(/(?:SEEX|SEX)\.[A-Z]+\.\d+\.\d+/i)||[])[0]||'Processo em edição';
    const u=window.usuarioLogado||{};
    return {codigo,perfil:txt(u.perfil)||'Perfil não informado'};
  }

  function decorarFormulario(){
    const modal=document.getElementById('modal-nova-solicitacao');
    if(!modal||modal.dataset.sigeeModo!=='editar') return;

    const host=modal.querySelector('form')||modal.querySelector('.modal-content')||modal.firstElementChild;
    if(!host) return;

    const dados=dadosProcessoAtual();
    if(!host.querySelector('.sigee-edicao-cabecalho')){
      const cab=document.createElement('section');
      cab.className='sigee-edicao-cabecalho';
      cab.innerHTML=`
        <div>
          <span>PROCESSO</span>
          <strong>${dados?.codigo||'Processo em edição'}</strong>
        </div>
        <div class="sigee-edicao-selo">✎ ${dados?.perfil||'Usuário autorizado'}</div>`;
      host.prepend(cab);
    }

    if(!host.querySelector('.sigee-aviso-protegido')){
      const aviso=document.createElement('div');
      aviso.className='sigee-aviso-protegido';
      aviso.innerHTML='<span aria-hidden="true">🔒</span><span>Workflow, etapas, ciclos, mensagens e prazos permanecem protegidos nesta edição.</span>';
      const cab=host.querySelector('.sigee-edicao-cabecalho');
      cab?.insertAdjacentElement('afterend',aviso);
    }
  }

  function identidadeUsuario(){
    const u=window.usuarioLogado;
    if(!u) return;
    const alvo=document.querySelector('[data-user-info], .user-info, #usuario-logado-info, .topbar-user');
    if(!alvo||alvo.querySelector('.sigee-identidade-usuario')) return;

    const nome=txt(u.nome||u.name||u.email||'Usuário SIGEE');
    const perfil=txt(u.perfil||'Usuário');
    const nte=txt(u.nte||u.nte_nome||u.grupo||'');
    const iniciais=nome.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();

    const card=document.createElement('div');
    card.className='sigee-identidade-usuario';
    card.innerHTML=`
      <div class="sigee-avatar">${iniciais||'SG'}</div>
      <div class="sigee-identidade-texto">
        <strong>${nome}</strong>
        <span>${perfil}${nte?' • '+nte:''}</span>
      </div>`;
    alvo.appendChild(card);
  }

  let agendado=false;
  function aplicar(){
    if(agendado) return;
    agendado=true;
    requestAnimationFrame(()=>{
      agendado=false;
      classificarBotoes();
      classificarBotoesWorkflow();
      decorarFormulario();
      identidadeUsuario();
    });
  }

  const obs=new MutationObserver(aplicar);
  obs.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',aplicar);
  window.addEventListener('load',()=>setTimeout(aplicar,200));

  console.info('[SIGEE] Acabamento Visual Institucional 2.3.5 carregado.');
})();
