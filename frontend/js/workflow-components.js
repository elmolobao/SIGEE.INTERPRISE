/* =====================================================================
   SIGEE Sprint 2.4.5B — Componentes Institucionais do Workflow
   Converte visualmente os blocos legados para o modelo oficial aprovado.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_WORKFLOW_COMPONENTS_245B__)return;
  window.__SIGEE_WORKFLOW_COMPONENTS_245B__=true;

  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();

  function primeiroTexto(el,seletores){
    for(const seletor of seletores){
      const alvo=el.querySelector(seletor);
      const t=alvo?.textContent?.trim();
      if(t)return t;
    }
    return '';
  }

  function campoSelect(bloco){
    return bloco.querySelector('select');
  }

  function montarResponsavel(bloco){
    if(!bloco||bloco.dataset.sigeeComponenteResponsavel==='1')return;
    const select=campoSelect(bloco);
    if(!select)return;

    const texto=norm(bloco.textContent);
    if(!texto.includes('RESPONSAVEL')&&!texto.includes('SELECAO OBRIGATORIA'))return;

    bloco.classList.add('sigee-responsavel-card');

    const tituloExistente=primeiroTexto(bloco,['h2','h3','strong','.sigee-wam-title','.sigee-wfe-title']);
    const label=bloco.querySelector('label');
    const titulo=texto.includes('CONFERENCIA')?'Responsável pela Conferência':
      texto.includes('DIGITACAO')?'Responsável pela Digitação':
      texto.includes('ANALISE')?'Responsável pela Análise':
      texto.includes('ASSINATURA')?'Responsável pela Assinatura':
      tituloExistente||'Seleção do Responsável';

    let topo=bloco.querySelector('.sigee-responsavel-topo');
    if(!topo){
      topo=document.createElement('div');
      topo.className='sigee-responsavel-topo';
      topo.innerHTML=`
        <div class="sigee-responsavel-icone" aria-hidden="true">👤</div>
        <div class="sigee-responsavel-titulos">
          <h3>${titulo}</h3>
          <p>Selecione o profissional que realizará esta etapa e liberará o avanço do processo.</p>
        </div>`;
      bloco.prepend(topo);
    }

    if(label){
      label.textContent=`${titulo} *`;
    }

    let status=bloco.querySelector('.sigee-responsavel-status');
    if(!status){
      status=document.createElement('div');
      status.className='sigee-responsavel-status pendente';
      bloco.appendChild(status);
    }

    function atualizarStatus(){
      const opt=select.selectedOptions?.[0];
      const valor=String(select.value||'').trim();
      const valido=valor && !/SELECIONE/i.test(opt?.textContent||'');
      status.classList.toggle('pendente',!valido);
      status.innerHTML=valido
        ?`<span aria-hidden="true">●</span><span>Profissional selecionado: ${String(opt?.textContent||valor).replace(/\s*-\s*NTE.*$/i,'')}</span>`
        :'<span aria-hidden="true">▲</span><span>Selecione um profissional para liberar o avanço.</span>';
    }

    select.addEventListener('change',atualizarStatus);
    atualizarStatus();
    bloco.dataset.sigeeComponenteResponsavel='1';
  }

  function montarTarefa(bloco){
    if(!bloco||bloco.dataset.sigeeComponenteTarefa==='1')return;
    const texto=norm(bloco.textContent);
    const checkbox=bloco.querySelector('input[type="checkbox"]');
    if(!checkbox||(!texto.includes('TAREFA OBRIGATORIA')&&!texto.includes('ENVIAR E-MAIL')&&!texto.includes('CONFIRMO')))return;

    bloco.classList.add('sigee-tarefa-card');

    const titulo=primeiroTexto(bloco,['h2','h3','strong','.sigee-wam-title','.sigee-wfe-title'])
      ||'Tarefa obrigatória';

    let topo=bloco.querySelector('.sigee-tarefa-topo');
    if(!topo){
      topo=document.createElement('div');
      topo.className='sigee-tarefa-topo';
      topo.innerHTML=`
        <div class="sigee-tarefa-icone" aria-hidden="true">✉</div>
        <div class="sigee-tarefa-conteudo">
          <span class="sigee-tarefa-selo">Tarefa obrigatória</span>
          <h3>${titulo}</h3>
          <p>Execute a mensagem institucional na ferramenta de e-mail. Em seguida, confirme a realização da tarefa para liberar o avanço.</p>
        </div>`;
      bloco.prepend(topo);
    }

    const label=checkbox.closest('label')||checkbox.parentElement;
    if(label){
      label.classList.add('sigee-tarefa-confirmacao');
      const spans=label.querySelectorAll('span');
      if(spans.length){
        spans[spans.length-1].textContent='Confirmo que executei esta tarefa.';
      }else if(label.childNodes.length===1){
        label.append(document.createTextNode(' Confirmo que executei esta tarefa.'));
      }
    }

    bloco.dataset.sigeeComponenteTarefa='1';
  }

  function classificarBotoes(modal){
    modal.querySelectorAll('button').forEach(btn=>{
      const t=norm(btn.textContent);
      if(t.includes('CANCELAR')||t.includes('VOLTAR'))btn.classList.add('sigee-workflow-acao-secundaria');
      if(t.includes('ENVIAR PARA')||t.includes('DEFERIR')||t.includes('INDEFERIR')||t.includes('FINALIZAR')||t.includes('EXECUTAR')||t.includes('CONCLUIR'))btn.classList.add('sigee-workflow-acao-principal');
    });
  }

  function processarModal(modal){
    if(!modal)return;

    const candidatos=[
      ...modal.querySelectorAll('.sigee-wam-selection,.sigee-wam-responsible,.sigee-wfe-responsible,.sigee-field33,.sigee-gridpend33 fieldset'),
      ...modal.querySelectorAll('section,article,fieldset,div')
    ];

    candidatos.forEach(bloco=>{
      montarResponsavel(bloco);
      montarTarefa(bloco);
    });
    classificarBotoes(modal);
  }

  function aplicar(){
    document.querySelectorAll('.sigee-wam-dialog,.sigee-wfe-panel,.sigee-modal33,[id^="modal-fluxo-"]:not(.hidden)')
      .forEach(processarModal);
  }

  let agendado=false;
  const observer=new MutationObserver(()=>{
    if(agendado)return;
    agendado=true;
    requestAnimationFrame(()=>{agendado=false;aplicar()});
  });

  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',aplicar);
  window.addEventListener('load',()=>setTimeout(aplicar,350));
  console.info('[SIGEE] Componentes Institucionais do Workflow 2.4.5B carregados.');
})();
