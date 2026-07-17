/* SIGEE Enterprise — M5.3.0 | Importação Histórica Definitiva Auditada
   Exclusivo Master. Reexecuta o preflight imediatamente antes da gravação.
   A persistência ocorre por uma única RPC transacional no Supabase. */
(function(){
  'use strict';
  if(window.__SIGEE_M52_IMPORTACAO_OFICIAL__) return;
  window.__SIGEE_M52_IMPORTACAO_OFICIAL__=true;

  const VERSION='M5.3.0';
  let payloadPreparado=null;
  let preflightConfirmado=null;
  let resultadoImportacao=null;

  const txt=v=>v==null?'':String(v).trim();
  const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const master=()=>norm(window.usuarioLogado?.perfil).includes('MASTER');
  const resultadoM4=()=>window.SIGEE_MIGRACAO_HISTORICA?.resultado?.()||null;
  const arquivoAtual=()=>document.getElementById('mig-arquivo')?.files?.[0]||null;
  const numeroNte=v=>{const m=txt(v).match(/(?:NTE\s*[-–]?\s*)?(\d{1,2})/i);return m?String(Number(m[1])).padStart(2,'0'):'';};
  const uuid=()=>window.crypto?.randomUUID?window.crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16);});

  async function sha256(file){
    const buffer=await file.arrayBuffer();
    const digest=await crypto.subtle.digest('SHA-256',buffer);
    return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function usuariosAtuais(){return window.usuariosDB||window.usuariosSIGEE||window.usuarios||window.listaUsuarios||[];}
  function nomeTecnicoAtual(p){
    if(!p.tecnico_responsavel_id) return '';
    const u=usuariosAtuais().find(x=>String(x.id)===String(p.tecnico_responsavel_id));
    return txt(u&&(u.nome||u.nome_completo||u.display_name));
  }

  function prepararEventos(p){
    return (p.eventos_validos||[]).map(e=>({
      etapa:e.etapa||'',evento:e.evento||'',data:e.data||'',tipo_data:e.tipo_data||'REAL',
      responsavel:e.responsavel||'',status:e.status||'',aba:e.aba||''
    }));
  }

  async function montarPayload(){
    if(!master()) throw new Error('A importação definitiva é exclusiva do perfil Master.');
    const r=resultadoM4();
    if(!r?.validacao_final?.executada||r.validacao_final.qualidade_percentual!==100) throw new Error('A homologação M4 precisa estar concluída em 100%.');
    const file=arquivoAtual();
    if(!file) throw new Error('Selecione novamente a planilha homologada.');
    const nte=numeroNte(document.getElementById('mig-nte')?.value||r.nte_selecionado||r.processos?.[0]?.nte_origem);
    if(!nte) throw new Error('NTE do lote não identificado.');
    const processos=(r.processos||[]).filter(p=>p.status_validacao==='PRONTO'&&!p.ignorar_migracao);
    const pendentes=(r.processos||[]).filter(p=>p.status_validacao==='PENDENTE'&&!p.ignorar_migracao);
    if(pendentes.length) throw new Error(`${pendentes.length} processo(s) ainda estão pendentes de decisão ou correção.`);
    if(!processos.length) throw new Error('Nenhum processo autorizado no lote.');
    const hash=await sha256(file);
    return {
      versao:VERSION,nte:`NTE-${nte}`,arquivo:file.name,hash_sha256:hash,qualidade_m4:100,
      executor:{nome:window.usuarioLogado?.nome||'Master',email:window.usuarioLogado?.email||'',perfil:window.usuarioLogado?.perfil||''},
      processos:processos.map(p=>({
        migration_key:p.migration_key,aluno_nome:p.aluno_nome,escola_nome:p.escola_nome||p.escola_nome_original,
        escola_id:p.escola_id,cod_mec:p.codigo_mec||p.cod_mec||'',documento_tipo:p.documento_tipo||'Histórico',
        nivel_oferta:p.nivel_oferta||'',modalidade:p.modalidade||'',prioridade:p.prioridade||'Normal',
        etapa_atual:p.etapa_atual||'Desarquivamento',data_solicitacao:p.data_solicitacao,
        data_etapa_atual:p.data_etapa_atual||p.data_solicitacao,workflow_instance_id:p.workflow_instance_id||uuid(),
        tecnico_responsavel:nomeTecnicoAtual(p),etapa_codigo:p.etapa_codigo||'',contexto_analise:p.contexto_analise||'',
        auditoria_migracao:p.auditoria_m53||[],decisao_master:p.decisao_m53||'IMPORTAR',eventos:prepararEventos(p)
      }))
    };
  }

  function garantirPainel(){
    const host=document.getElementById('m5-painel')||document.getElementById('aba-migracao-historica');
    if(!host||document.getElementById('m52-painel')) return;
    const sec=document.createElement('section');
    sec.id='m52-painel';sec.className='m52-painel';
    sec.innerHTML=`
      <header class="m52-topo"><div><span>SIGEE ENTERPRISE</span><h3>Importação Definitiva Controlada</h3><p>Gravação atômica do lote homologado, sem sobrescrever registros existentes.</p></div><strong>🔐 MASTER</strong></header>
      <div class="m52-alerta"><b>Atenção:</b> esta etapa grava definitivamente no Supabase. Em caso de falha, todo o lote é revertido automaticamente.</div>
      <div class="m52-acoes"><button id="m52-preparar" type="button">🔍 Preparar autorização final</button><button id="m52-importar" type="button" disabled>🔒 Importar definitivamente</button><button id="m52-certificado" type="button" disabled>📄 Exportar certificado</button></div>
      <div id="m52-status" class="m52-status">Aguardando conclusão da auditoria.</div>
      <div id="m52-resumo" class="m52-resumo hidden"></div>
      <div id="m52-progresso" class="m52-progresso hidden"><div><span>Importação transacional</span><strong id="m52-progresso-texto">Aguardando</strong></div><div class="m52-barra"><i id="m52-barra-i"></i></div></div>
      <footer class="m52-engine-versao">Engine de Migração 5.4.0</footer>`;
    host.appendChild(sec);
    sec.querySelector('#m52-preparar').addEventListener('click',preparar);
    sec.querySelector('#m52-importar').addEventListener('click',confirmarEImportar);
    sec.querySelector('#m52-certificado').addEventListener('click',exportarCertificado);
  }

  function status(msg,tipo=''){const el=document.getElementById('m52-status');if(el){el.className='m52-status '+tipo;el.textContent=msg;}}
  function resumo(payload,pre){
    const processos=payload.processos.length;
    const eventos=payload.processos.reduce((s,p)=>s+p.eventos.length,0);
    const box=document.getElementById('m52-resumo');box.classList.remove('hidden');
    box.innerHTML=`<div><span>NTE</span><strong>${esc(payload.nte)}</strong></div><div><span>Arquivo</span><strong>${esc(payload.arquivo)}</strong></div><div><span>Processos</span><strong>${processos}</strong></div><div><span>Eventos</span><strong>${eventos}</strong></div><div><span>Hash</span><strong>${esc(payload.hash_sha256.slice(0,16))}…</strong></div><div><span>Preflight</span><strong class="ok">${pre.autorizado?'APROVADO':'BLOQUEADO'}</strong></div>`;
  }

  async function preparar(){
    status('Montando o lote definitivo e repetindo o preflight no banco...','carregando');
    try{
      payloadPreparado=await montarPayload();
      const motor=window.SIGEE_MOTOR_PERSISTENCIA;
      if(!motor?.preflight||!motor?.importar) throw new Error('Motor de persistência não carregado.');
      preflightConfirmado=await motor.preflight(payloadPreparado);
      resumo(payloadPreparado,preflightConfirmado);
      if(!preflightConfirmado.autorizado) throw new Error(preflightConfirmado.mensagem||'Preflight bloqueado.');
      document.getElementById('m52-importar').disabled=false;
      status('Autorização final aprovada. Confira os totais antes de importar.','ok');
    }catch(e){
      payloadPreparado=null;preflightConfirmado=null;
      document.getElementById('m52-importar').disabled=true;
      status('Importação bloqueada: '+(e.message||e),'erro');
    }
  }

  function modalConfirmacao(){
    return new Promise(resolve=>{
      const antigo=document.getElementById('m52-modal');antigo?.remove();
      const nte=payloadPreparado.nte;
      const el=document.createElement('div');el.id='m52-modal';el.className='m52-modal-bg';
      el.innerHTML=`<section class="m52-modal"><header><h3>Confirmar importação definitiva</h3></header><p>Esta operação incorporará <b>${payloadPreparado.processos.length} processos</b> ao ${esc(nte)}. Ela não atualizará registros existentes.</p><label><input type="checkbox" id="m52-check-backup"> Confirmo que o backup/snapshot do Supabase está disponível.</label><label><input type="checkbox" id="m52-check-lote"> Confirmei o arquivo, NTE, quantidade de processos e eventos.</label><label>Digite <b>MIGRAR ${esc(nte)}</b><input id="m52-frase" autocomplete="off"></label><div class="m52-modal-acoes"><button data-cancelar>Cancelar</button><button data-confirmar disabled>Importar definitivamente</button></div></section>`;
      document.body.appendChild(el);
      const validar=()=>{el.querySelector('[data-confirmar]').disabled=!(el.querySelector('#m52-check-backup').checked&&el.querySelector('#m52-check-lote').checked&&norm(el.querySelector('#m52-frase').value)===norm(`MIGRAR ${nte}`));};
      el.querySelectorAll('input').forEach(i=>i.addEventListener('input',validar));
      el.querySelector('[data-cancelar]').onclick=()=>{el.remove();resolve(false);};
      el.querySelector('[data-confirmar]').onclick=()=>{el.remove();resolve(true);};
    });
  }

  async function confirmarEImportar(){
    if(!payloadPreparado||!preflightConfirmado?.autorizado) return status('Prepare novamente a autorização final.','erro');
    if(!(await modalConfirmacao())) return;
    const btn=document.getElementById('m52-importar');btn.disabled=true;
    document.getElementById('m52-preparar').disabled=true;
    document.getElementById('m52-progresso').classList.remove('hidden');
    document.getElementById('m52-progresso-texto').textContent='Processando lote no Supabase...';
    document.getElementById('m52-barra-i').style.width='55%';
    status('Importação em andamento. Não feche nem atualize esta página.','carregando');
    try{
      // Preflight imediatamente anterior à gravação para reduzir janela de concorrência.
      const motor=window.SIGEE_MOTOR_PERSISTENCIA;
      const pre=await motor.preflight(payloadPreparado);
      if(!pre.autorizado) throw new Error('O preflight deixou de autorizar a importação: '+pre.mensagem);
      resultadoImportacao=await motor.importar(payloadPreparado);
      if(!resultadoImportacao?.sucesso) throw new Error(resultadoImportacao?.erro||resultadoImportacao?.mensagem||'Importação revertida.');
      document.getElementById('m52-barra-i').style.width='100%';
      document.getElementById('m52-progresso-texto').textContent='Concluída';
      document.getElementById('m52-certificado').disabled=false;
      status(`Migração concluída: ${resultadoImportacao.processos_importados} processos e ${resultadoImportacao.eventos_importados} eventos incorporados. Desative a função para este NTE.`,'ok');
      if(window.recarregarCentralProcessosSIGEE) await window.recarregarCentralProcessosSIGEE(true);
    }catch(e){
      document.getElementById('m52-barra-i').style.width='0%';
      document.getElementById('m52-progresso-texto').textContent='Revertida';
      document.getElementById('m52-preparar').disabled=false;
      status('Importação não concluída: '+(e.message||e)+' Nenhum processo parcial deve permanecer.','erro');
    }
  }

  function exportarCertificado(){
    if(!resultadoImportacao?.sucesso) return;
    const certificado={
      titulo:'CERTIFICADO DE MIGRAÇÃO OFICIAL — SIGEE',versao:VERSION,
      nte:resultadoImportacao.nte,arquivo:resultadoImportacao.arquivo,hash_sha256:resultadoImportacao.hash_sha256,
      lote_id:resultadoImportacao.lote_id,processos:resultadoImportacao.processos_importados,eventos:resultadoImportacao.eventos_importados,
      executor:payloadPreparado.executor,concluido_em:resultadoImportacao.concluido_em,status:'CONCLUÍDO'
    };
    const blob=new Blob([JSON.stringify(certificado,null,2)],{type:'application/json;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`sigee_certificado_migracao_${resultadoImportacao.nte}.json`;a.click();URL.revokeObjectURL(a.href);
  }

  function iniciar(){garantirPainel();setTimeout(garantirPainel,1200);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();
