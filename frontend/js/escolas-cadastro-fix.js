/* =====================================================================
   SIGEE Sprint 2.4.6A — Cadastro de Escolas e NTE
   Correção aditiva do botão, modal, permissões e integridade básica.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_ESCOLAS_CADASTRO_246A__)return;
  window.__SIGEE_ESCOLAS_CADASTRO_246A__=true;

  const NTE_NOMES={
    1:'Irecê',2:'Bom Jesus da Lapa',3:'Seabra',4:'Serrinha',5:'Itabuna',
    6:'Valença',7:'Teixeira de Freitas',8:'Itapetinga',9:'Amargosa',10:'Juazeiro',
    11:'Barreiras',12:'Macaúbas',13:'Caetité',14:'Itaberaba',15:'Ipirá',
    16:'Jacobina',17:'Ribeira do Pombal',18:'Alagoinhas',19:'Feira de Santana',
    20:'Vitória da Conquista',21:'Santo Antônio de Jesus',22:'Jequié',
    23:'Santa Maria da Vitória',24:'Paulo Afonso',25:'Senhor do Bonfim',
    26:'Salvador',27:'Eunápolis'
  };

  const txt=v=>v==null?'':String(v).trim();
  const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const usuario=()=>window.usuarioLogado||(typeof usuarioLogado!=='undefined'?usuarioLogado:null);
  const perfil=()=>norm(usuario()?.perfil);
  const nteNumero=v=>Number(txt(v).match(/\d{1,2}/)?.[0]||0);
  const nteUsuario=()=>nteNumero(usuario()?.nte||usuario()?.nte_nome||usuario()?.grupo||usuario()?.nte_id);
  const nteLabel=n=>n?`NTE-${String(n).padStart(2,'0')} (${NTE_NOMES[n]||'Território'})`:'';
  const listaEscolas=()=>{
    if(Array.isArray(window.escolasDB))return window.escolasDB;
    try{if(typeof escolasDB!=='undefined'&&Array.isArray(escolasDB))return escolasDB}catch(_){}
    window.escolasDB=[];
    return window.escolasDB;
  };

  function podeCadastrar(){
    const p=perfil();
    return p.includes('MASTER')||p.includes('ADMIN')||p.includes('TECN');
  }
  function nteEditavel(){
    return perfil().includes('MASTER');
  }

  function modal(){
    let m=document.getElementById('modal-cadastro-escola-246');
    if(m)return m;
    m=document.createElement('div');
    m.id='modal-cadastro-escola-246';
    m.className='hidden fixed inset-0 bg-blue-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[10050]';
    m.innerHTML=`
      <div class="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-blue-200">
        <div class="bg-blue-900 text-white px-5 py-4 flex justify-between items-center">
          <div>
            <h3 id="escola246-titulo" class="font-black text-sm">🏫 Cadastrar Nova Escola</h3>
            <p class="text-[10px] text-blue-100 mt-1">Cadastro institucional do Catálogo de Escolas Extintas</p>
          </div>
          <button type="button" id="escola246-fechar" class="text-white font-bold cursor-pointer">✕</button>
        </div>
        <form id="escola246-form" class="p-5 space-y-4">
          <input type="hidden" id="escola246-id">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Código MEC</label>
              <input id="escola246-mec" required class="w-full p-2 border rounded-lg text-xs font-medium">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Código SEC</label>
              <input id="escola246-sec" class="w-full p-2 border rounded-lg text-xs font-medium">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo da Unidade</label>
              <select id="escola246-tipo" class="w-full p-2 border rounded-lg text-xs font-medium bg-white">
                <option value="Não informado">NÃO INFORMADO</option>
                <option value="Sede">SEDE</option>
                <option value="Anexo">ANEXO</option>
                <option value="Unidade vinculada">UNIDADE VINCULADA</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome da Escola</label>
              <input id="escola246-nome" required class="w-full p-2 border rounded-lg text-xs font-medium uppercase">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Município</label>
              <input id="escola246-municipio" required class="w-full p-2 border rounded-lg text-xs font-medium uppercase">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">NTE</label>
              <select id="escola246-nte" required class="w-full p-2 border rounded-lg text-xs font-bold bg-white"></select>
              <p id="escola246-nte-ajuda" class="text-[9px] text-gray-500 mt-1"></p>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Dependência Administrativa</label>
              <select id="escola246-dependencia" required class="w-full p-2 border rounded-lg text-xs font-medium bg-white">
                <option value="Estadual">ESTADUAL</option>
                <option value="Municipal">MUNICIPAL</option>
                <option value="Particular">PARTICULAR</option>
                <option value="Federal">FEDERAL</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Situação Funcional</label>
              <select id="escola246-situacao" required class="w-full p-2 border rounded-lg text-xs font-medium bg-white">
                <option value="Extinta">EXTINTA</option>
                <option value="Ativa">ATIVA</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Status do Acervo</label>
              <select id="escola246-acervo" required class="w-full p-2 border rounded-lg text-xs font-medium bg-white">
                <option value="Recolhido">RECOLHIDO</option>
                <option value="Não recolhido">NÃO RECOLHIDO</option>
                <option value="Não acolhido">NÃO ACOLHIDO</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Local do Acervo</label>
              <input id="escola246-local" class="w-full p-2 border rounded-lg text-xs font-medium">
            </div>
          </div>
          <div id="escola246-aviso" class="hidden p-3 rounded-lg text-xs font-bold"></div>
          <div class="flex justify-end gap-2 border-t pt-3">
            <button type="button" id="escola246-cancelar" class="px-4 py-2 border rounded-lg text-xs font-semibold bg-gray-100">Cancelar</button>
            <button type="submit" id="escola246-salvar" class="bg-blue-900 hover:bg-blue-950 text-white font-bold px-5 py-2 rounded-lg text-xs shadow">Salvar Escola</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(m);
    m.querySelector('#escola246-fechar').addEventListener('click',fechar);
    m.querySelector('#escola246-cancelar').addEventListener('click',fechar);
    m.querySelector('#escola246-form').addEventListener('submit',salvar);
    return m;
  }

  function preencherNte(valor){
    const sel=document.getElementById('escola246-nte');
    const ajuda=document.getElementById('escola246-nte-ajuda');
    if(!sel)return;
    sel.innerHTML='<option value="">SELECIONE</option>';
    const numeroUsuario=nteUsuario();

    if(nteEditavel()){
      for(let i=1;i<=27;i++){
        sel.insertAdjacentHTML('beforeend',`<option value="${i}">${nteLabel(i)}</option>`);
      }
      sel.disabled=false;
      ajuda.textContent='Perfil Master: seleção disponível para os 27 NTEs.';
      if(valor)sel.value=String(nteNumero(valor)||valor);
    }else{
      const n=numeroUsuario||nteNumero(valor);
      if(n)sel.insertAdjacentHTML('beforeend',`<option value="${n}">${nteLabel(n)}</option>`);
      sel.value=n?String(n):'';
      sel.disabled=true;
      ajuda.textContent='NTE preenchido automaticamente conforme o cadastro do usuário.';
    }
  }

  function limpar(){
    ['escola246-id','escola246-mec','escola246-sec','escola246-nome','escola246-municipio','escola246-local'].forEach(id=>{
      const el=document.getElementById(id);if(el)el.value='';
    });
    document.getElementById('escola246-tipo').value='Não informado';
    document.getElementById('escola246-dependencia').value='Estadual';
    document.getElementById('escola246-situacao').value='Extinta';
    document.getElementById('escola246-acervo').value='Recolhido';
    document.getElementById('escola246-aviso').className='hidden p-3 rounded-lg text-xs font-bold';
    document.getElementById('escola246-aviso').textContent='';
  }

  function abrir(){
    if(!podeCadastrar()){
      alert('Seu perfil não possui permissão para cadastrar escolas.');
      return;
    }
    modal();
    limpar();
    preencherNte(nteUsuario());
    document.getElementById('modal-cadastro-escola-246').classList.remove('hidden');
  }
  function fechar(){
    document.getElementById('modal-cadastro-escola-246')?.classList.add('hidden');
  }

  function chaveComposta(e){
    return [
      norm(e.cod_sec),
      norm(e.nome_escola||e.nome),
      norm(e.municipio),
      norm(e.tipo_unidade||'NAO INFORMADO')
    ].join('|');
  }

  function proximoId(lista){
    return Math.max(0,...lista.map(x=>Number(x?.id)||0))+1;
  }

  async function persistir(payload){
    if(typeof window.upsertTabela==='function'){
      return await window.upsertTabela('escolas_sigee',[payload],'id');
    }
    const cliente=window.supabaseClient||window.supabase||window.sb;
    if(cliente?.from){
      return await cliente.from('escolas_sigee').upsert([payload]);
    }
    return {error:new Error('Cliente Supabase não localizado')};
  }

  async function salvar(event){
    event.preventDefault();
    const lista=listaEscolas();
    const btn=document.getElementById('escola246-salvar');
    const aviso=document.getElementById('escola246-aviso');
    const nte=Number(document.getElementById('escola246-nte').value||nteUsuario());

    const escola={
      id:proximoId(lista),
      cod_mec:txt(document.getElementById('escola246-mec').value),
      cod_sec:txt(document.getElementById('escola246-sec').value),
      nome_escola:txt(document.getElementById('escola246-nome').value).toUpperCase(),
      municipio:txt(document.getElementById('escola246-municipio').value).toUpperCase(),
      tipo_unidade:txt(document.getElementById('escola246-tipo').value||'Não informado'),
      nte_id:nte,
      nte:nteLabel(nte),
      dependencia_adm:txt(document.getElementById('escola246-dependencia').value),
      situacao_funcional:txt(document.getElementById('escola246-situacao').value),
      status_acervo:txt(document.getElementById('escola246-acervo').value),
      acervo:txt(document.getElementById('escola246-acervo').value),
      local_acervo:txt(document.getElementById('escola246-local').value),
      ativo:true
    };

    if(!escola.cod_mec||!escola.nome_escola||!escola.municipio||!nte){
      aviso.className='p-3 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200';
      aviso.textContent='Preencha Código MEC, Nome da Escola, Município e NTE.';
      return;
    }

    const duplicada=lista.find(x=>chaveComposta(x)===chaveComposta(escola));
    if(duplicada){
      aviso.className='p-3 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200';
      aviso.textContent='Duplicidade real: já existe uma escola com o mesmo Código SEC, nome, município e tipo de unidade.';
      return;
    }

    btn.disabled=true;
    const original=btn.textContent;
    btn.textContent='Salvando...';
    try{
      const payload={
        cod_mec:escola.cod_mec,
        cod_sec:escola.cod_sec||null,
        nome_escola:escola.nome_escola,
        municipio:escola.municipio,
        nte_id:escola.nte_id,
        dependencia_adm:escola.dependencia_adm,
        situacao_funcional:escola.situacao_funcional,
        acervo:escola.acervo,
        status_acervo:escola.status_acervo,
        local_acervo:escola.local_acervo,
        ativo:true
      };

      const {error}=await persistir(payload);
      if(error)throw error;

      lista.push(escola);
      if(typeof window.renderizarListaEscolasBufferMemoria==='function')window.renderizarListaEscolasBufferMemoria();
      if(typeof window.carregarDadosDashboardReal==='function')window.carregarDadosDashboardReal();
      if(typeof window.registrarLog==='function')window.registrarLog(`Cadastrou escola ${escola.nome_escola} — ${nteLabel(nte)}.`);
      fechar();
      alert('Escola cadastrada com sucesso.');
    }catch(err){
      aviso.className='p-3 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200';
      aviso.textContent=`Não foi possível gravar a escola: ${err?.message||err}`;
    }finally{
      btn.disabled=false;
      btn.textContent=original;
    }
  }

  window.abrirModalNovaEscola=abrir;
  window.fecharModalEscola=fechar;

  document.addEventListener('click',event=>{
    const botao=event.target.closest('button[onclick*="abrirModalNovaEscola"],.btn-nova-escola');
    if(!botao)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    abrir();
  },true);

  console.info('[SIGEE] Cadastro de Escolas 2.4.6A carregado.');
})();
