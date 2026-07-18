/* =====================================================================
   SIGEE Sprint 4.0 — Janela Institucional Única
   Camada aditiva e segura: não recria modais, não move campos e não
   altera payloads do Supabase. Padroniza estrutura, responsável e ações.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_WINDOW_STANDARD_400__) return;
  window.__SIGEE_WINDOW_STANDARD_400__=true;

  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const sessao=()=>window.usuarioLogado||{};
  const nomeOperador=()=>{
    const u=sessao();
    return String(u.nome||u.name||u.nome_completo||u.email||'Usuário SIGEE').trim();
  };
  const metaOperador=()=>{
    const u=sessao();
    return [u.perfil||u.role, u.nte||u.nte_nome||u.nte_vinculado||u.grupo].filter(Boolean).join(' • ');
  };

  function tituloModal(modal){
    return norm(modal.querySelector('.sigee-modal33-header h2,.sigee-wfe-head h2,h1,h2,h3')?.textContent||'');
  }

  function etapaClasse(t){
    if(t.includes('WORKFLOW EXTERNO')||t.includes('DESARQUIVAMENTO')) return 'sigee-padrao-desarquivamento';
    if(t.includes('ANALISE')) return 'sigee-padrao-analise';
    if(t.includes('PENDENCIA')) return 'sigee-padrao-pendencia';
    if(t.includes('DIGITACAO')) return 'sigee-padrao-digitacao';
    if(t.includes('CONFERENCIA')) return 'sigee-padrao-conferencia';
    if(t.includes('ASSINATURA')||t.includes('DOCUMENTO ASSINADO')) return 'sigee-padrao-assinatura';
    if(t.includes('RETIRADA')||t.includes('RETIRADO')) return 'sigee-padrao-retirada';
    if(t.includes('INDEFER')) return 'sigee-padrao-indeferido';
    if(t.includes('DOCUMENTO RECEBIDO')) return 'sigee-padrao-documento';
    if(t.includes('RETIFICACAO')) return 'sigee-padrao-retificacao';
    if(t.includes('ATAS')) return 'sigee-padrao-atas';
    return 'sigee-padrao-neutro';
  }

  function possuiSelecaoResponsavel(modal){
    return [...modal.querySelectorAll('select')].some(s=>{
      const texto=norm((s.closest('section,fieldset,article,div')||s.parentElement)?.textContent);
      return texto.includes('RESPONSAVEL')||texto.includes('ANALISTA')||texto.includes('DIGITADOR')||texto.includes('CONFERENTE');
    });
  }

  function criarResponsavelAutomatico(){
    const box=document.createElement('section');
    box.className='sigee-responsavel-padrao sigee-responsavel-automatico';
    box.innerHTML=`
      <div class="sigee-responsavel-padrao-icone" aria-hidden="true">👤</div>
      <div class="sigee-responsavel-padrao-corpo">
        <span>RESPONSÁVEL PELA AÇÃO</span>
        <label>
          <input type="text" value="${esc(nomeOperador())}" readonly aria-readonly="true">
        </label>
        <small>${esc(metaOperador()||'Atribuição automática ao operador autenticado')}</small>
      </div>`;
    return box;
  }

  function inserirResponsavel(modal){
    if(modal.querySelector('.sigee-responsavel-padrao,.sigee-responsavel-card,.sigee-wam-selection,.sigee-wam-responsible,.sigee-wfe-responsible')) return;
    if(possuiSelecaoResponsavel(modal)) return;
    const resumo=modal.querySelector('.sigee-resumo33,.sigee-wam-summary,.sigee-wfe-summary');
    const corpo=modal.querySelector('.sigee-modal33-body,.sigee-wam-body,.sigee-wfe-body')||modal;
    const box=criarResponsavelAutomatico();
    if(resumo && resumo.parentNode) resumo.insertAdjacentElement('afterend',box);
    else corpo.insertAdjacentElement('afterbegin',box);
  }

  function classificarBotoes(modal){
    modal.querySelectorAll('button').forEach(btn=>{
      const t=norm(btn.textContent);
      btn.classList.remove('sigee-acao-avancar','sigee-acao-pendencia','sigee-acao-critica','sigee-acao-secundaria','sigee-acao-retificacao','sigee-acao-atas','sigee-acao-confirmacao');
      if(!t || t==='X' || t==='×' || t==='✕') return;
      if(t.includes('HISTORICO')||t.includes('CANCELAR')||t.includes('VOLTAR')) btn.classList.add('sigee-acao-secundaria');
      else if(t.includes('INDEFER')||t.includes('EXCLUIR')||t.includes('REITERACAO URGENTE')) btn.classList.add('sigee-acao-critica');
      else if(t.includes('PENDENCIA')||t==='REITERACAO'||t.includes('EXECUTAR REITERACAO')) btn.classList.add('sigee-acao-pendencia');
      else if(t.includes('RETIFICACAO')||t==='ABRIR') btn.classList.add('sigee-acao-retificacao');
      else if(t.includes('ATAS')) btn.classList.add('sigee-acao-atas');
      else if(t.includes('CONFIRMAR DADOS')) btn.classList.add('sigee-acao-confirmacao');
      else if(/ENVIAR|PROSSEGUIR|AVANCAR|RECEBER|CONCLUIR|DEFERIR|DEFERIDO|REGISTRAR DOCUMENTO|FINALIZAR/.test(t)) btn.classList.add('sigee-acao-avancar');
    });
  }

  function corrigirPendencia(modal){
    const titulo=tituloModal(modal);
    if(!titulo.includes('TRATAR PENDENCIA')) return;
    const status=modal.querySelector('.sigee-tarefa-status331');
    const acao=modal.querySelector('[data-salvar-receb33]');
    if(!status || status.dataset.sigeeObrigatoria==='1') return;
    status.dataset.sigeeObrigatoria='1';
    const texto=status.querySelector('span')?.textContent||status.textContent||'ENVIAR E-MAIL: 07 - Aluno Pendência';
    status.className='sigee-tarefa-obrigatoria33 sigee-mensagem-rodape-padrao';
    status.innerHTML=`<div class="sigee-tarefa-icone33">📧</div><div class="sigee-tarefa-conteudo33"><span>TAREFA OBRIGATÓRIA</span><strong>${esc(texto.replace(/^\s*ENVIAR E-MAIL:\s*/i,'ENVIAR E-MAIL: '))}</strong><p>Execute a mensagem institucional na ferramenta de e-mail e confirme a realização da tarefa antes de concluir esta ação.</p><label><input type="checkbox" data-pendencia-email-obrigatorio> Confirmo que executei esta tarefa.</label></div>`;
    if(acao){
      acao.disabled=true;
      const check=status.querySelector('[data-pendencia-email-obrigatorio]');
      check.addEventListener('change',()=>{acao.disabled=!check.checked;});
      acao.addEventListener('click',e=>{
        if(!check.checked){
          e.preventDefault();e.stopImmediatePropagation();
          alert('Confirme a execução da mensagem institucional obrigatória.');
        }
      },true);
    }
  }

  function padronizar(modal){
    if(!modal || modal.nodeType!==1) return;
    modal.classList.add('sigee-janela-padrao');
    const t=tituloModal(modal);
    modal.classList.add(etapaClasse(t));
    inserirResponsavel(modal);
    corrigirPendencia(modal);
    classificarBotoes(modal);
    modal.dataset.sigeePadraoAplicado='1';
  }

  function aplicar(){
    document.querySelectorAll('.sigee-modal33,.sigee-wfe-panel,.sigee-wam-dialog,[id^="modal-fluxo-"] > div').forEach(padronizar);
  }

  let raf=0;
  const observer=new MutationObserver(()=>{
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(aplicar);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',aplicar);
  window.addEventListener('load',()=>setTimeout(aplicar,250));
  console.info('[SIGEE] Janela Institucional Única 4.0 carregada.');
})();
