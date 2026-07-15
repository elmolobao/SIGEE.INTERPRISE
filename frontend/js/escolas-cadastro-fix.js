/* =====================================================================
   SIGEE Sprint 2.4.6B — Cadastro e Edição de Escolas por Perfil
   Master/Admin cadastram. Técnico altera somente situação/acervo/local.
   ===================================================================== */
(function(){
  'use strict';
  if(window.__SIGEE_ESCOLAS_246B__)return;
  window.__SIGEE_ESCOLAS_246B__=true;

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
  const user=()=>window.usuarioLogado||(typeof usuarioLogado!=='undefined'?usuarioLogado:null);
  const perfil=()=>norm(user()?.perfil);
  const isMaster=()=>perfil().includes('MASTER');
  const isAdmin=()=>perfil().includes('ADMIN');
  const isTecnico=()=>perfil().includes('TECN');
  const isSEC=()=>perfil()==='SEC'||perfil().includes('SECRETARIA');
  const podeCadastrar=()=>isMaster()||isAdmin();
  const podeAlterar=()=>isMaster()||isAdmin()||isTecnico();
  const nteNumero=v=>Number(txt(v).match(/\d{1,2}/)?.[0]||0);
  const nteUsuario=()=>nteNumero(user()?.nte||user()?.nte_nome||user()?.grupo||user()?.nte_id);
  const nteLabel=n=>n?`NTE-${String(n).padStart(2,'0')} (${NTE_NOMES[n]||'Território'})`:'';

  function lista(){
    if(Array.isArray(window.escolasDB))return window.escolasDB;
    try{if(typeof escolasDB!=='undefined'&&Array.isArray(escolasDB))return escolasDB}catch(_){}
    window.escolasDB=[];
    return window.escolasDB;
  }

  function mesmoNte(escola){
    return isMaster() || nteNumero(escola?.nte||escola?.nte_id)===nteUsuario();
  }

  function cliente(){
    try{
      if(typeof obterSupabaseSIGEE==='function')return obterSupabaseSIGEE();
    }catch(_){}
    return window.supabaseClient||window.supabase||window.sb||null;
  }

  function modal(){
    let m=document.getElementById('modal-escola-246b');
    if(m)return m;

    m=document.createElement('div');
    m.id='modal-escola-246b';
    m.className='hidden fixed inset-0 bg-blue-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[10050]';
    m.innerHTML=`
      <div class="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-blue-200">
        <div class="bg-blue-900 text-white px-5 py-4 flex justify-between items-center">
          <div>
            <h3 id="escola246b-titulo" class="font-black text-sm">🏫 Escola</h3>
            <p id="escola246b-subtitulo" class="text-[10px] text-blue-100 mt-1"></p>
          </div>
          <button type="button" id="escola246b-fechar" class="text-white font-bold">✕</button>
        </div>
        <form id="escola246b-form" class="p-5 space-y-4">
          <input type="hidden" id="escola246b-id">
          <input type="hidden" id="escola246b-modo">
          <div id="escola246b-aviso-perfil" class="hidden p-3 rounded-lg border text-xs font-bold"></div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Código MEC</label>
              <input id="escola246b-mec" required class="campo-completo w-full p-2 border rounded-lg text-xs font-medium">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Código SEC</label>
              <input id="escola246b-sec" class="campo-completo w-full p-2 border rounded-lg text-xs font-medium">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo da Unidade</label>
              <select id="escola246b-tipo" class="campo-completo w-full p-2 border rounded-lg text-xs bg-white">
                <option value="Não informado">NÃO INFORMADO</option>
                <option value="Sede">SEDE</option>
                <option value="Anexo">ANEXO</option>
                <option value="Unidade vinculada">UNIDADE VINCULADA</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome da Escola</label>
              <input id="escola246b-nome" required class="campo-completo w-full p-2 border rounded-lg text-xs font-medium uppercase">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Município</label>
              <input id="escola246b-municipio" required class="campo-completo w-full p-2 border rounded-lg text-xs uppercase">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">NTE</label>
              <select id="escola246b-nte" required class="campo-completo w-full p-2 border rounded-lg text-xs font-bold bg-white"></select>
              <p id="escola246b-nte-ajuda" class="text-[9px] text-gray-500 mt-1"></p>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Dependência Administrativa</label>
              <select id="escola246b-dependencia" class="campo-completo w-full p-2 border rounded-lg text-xs bg-white">
                <option value="Estadual">ESTADUAL</option>
                <option value="Municipal">MUNICIPAL</option>
                <option value="Particular">PARTICULAR</option>
                <option value="Federal">FEDERAL</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Situação Funcional</label>
              <select id="escola246b-situacao" required class="campo-tecnico w-full p-2 border rounded-lg text-xs bg-white">
                <option value="Extinta">EXTINTA</option>
                <option value="Ativa">ATIVA</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Status do Acervo</label>
              <select id="escola246b-acervo" required class="campo-tecnico w-full p-2 border rounded-lg text-xs bg-white">
                <option value="Recolhido">RECOLHIDO</option>
                <option value="Não recolhido">NÃO RECOLHIDO</option>
                <option value="Não acolhido">NÃO ACOLHIDO</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Local do Acervo</label>
              <input id="escola246b-local" class="campo-tecnico w-full p-2 border rounded-lg text-xs">
            </div>
          </div>

          <div id="escola246b-aviso" class="hidden p-3 rounded-lg text-xs font-bold"></div>
          <div class="flex justify-end gap-2 border-t pt-3">
            <button type="button" id="escola246b-cancelar" class="px-4 py-2 border rounded-lg text-xs font-semibold bg-gray-100">Cancelar</button>
            <button type="submit" id="escola246b-salvar" class="bg-blue-900 hover:bg-blue-950 text-white font-bold px-5 py-2 rounded-lg text-xs shadow">Salvar Alterações</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(m);
    m.querySelector('#escola246b-fechar').addEventListener('click',fechar);
    m.querySelector('#escola246b-cancelar').addEventListener('click',fechar);
    m.querySelector('#escola246b-form').addEventListener('submit',salvar);
    return m;
  }

  function setCampo(id,v){const el=document.getElementById(id);if(el)el.value=v??''}

  function preencherNte(valor){
    const sel=document.getElementById('escola246b-nte');
    const ajuda=document.getElementById('escola246b-nte-ajuda');
    sel.innerHTML='<option value="">SELECIONE</option>';

    if(isMaster()){
      for(let i=1;i<=27;i++)sel.insertAdjacentHTML('beforeend',`<option value="${i}">${nteLabel(i)}</option>`);
      sel.disabled=false;
      ajuda.textContent='Master: escolha disponível para os 27 NTEs.';
    }else{
      const n=nteUsuario()||nteNumero(valor);
      if(n)sel.insertAdjacentHTML('beforeend',`<option value="${n}">${nteLabel(n)}</option>`);
      sel.value=n?String(n):'';
      sel.disabled=true;
      ajuda.textContent='NTE vinculado ao perfil do usuário.';
    }

    const n=nteNumero(valor)||nteUsuario();
    if(n)sel.value=String(n);
  }

  function bloquearCamposTecnico(){
    const aviso=document.getElementById('escola246b-aviso-perfil');
    document.querySelectorAll('#modal-escola-246b .campo-completo').forEach(el=>{
      el.disabled=true;
      el.classList.add('bg-gray-100','text-gray-500','cursor-not-allowed');
    });
    document.querySelectorAll('#modal-escola-246b .campo-tecnico').forEach(el=>{
      el.disabled=false;
      el.classList.remove('bg-gray-100','text-gray-500','cursor-not-allowed');
    });
    aviso.className='p-3 rounded-lg border text-xs font-bold bg-blue-50 text-blue-900 border-blue-200';
    aviso.textContent='Perfil Técnico: somente Situação Funcional, Status do Acervo e Local do Acervo podem ser alterados.';
  }

  function liberarCamposCompletos(){
    document.querySelectorAll('#modal-escola-246b input,#modal-escola-246b select').forEach(el=>{
      if(el.type!=='hidden')el.disabled=false;
      el.classList.remove('bg-gray-100','text-gray-500','cursor-not-allowed');
    });
    if(isAdmin()){
      document.getElementById('escola246b-nte').disabled=true;
    }
    document.getElementById('escola246b-aviso-perfil').className='hidden p-3 rounded-lg border text-xs font-bold';
  }

  function carregar(escola,modo){
    modal();
    setCampo('escola246b-id',escola?.id||'');
    setCampo('escola246b-modo',modo);
    setCampo('escola246b-mec',escola?.cod_mec||'');
    setCampo('escola246b-sec',escola?.cod_sec||'');
    setCampo('escola246b-tipo',escola?.tipo_unidade||'Não informado');
    setCampo('escola246b-nome',escola?.nome_escola||escola?.nome||'');
    setCampo('escola246b-municipio',escola?.municipio||'');
    setCampo('escola246b-dependencia',escola?.dependencia_adm||escola?.dependencia||'Estadual');
    setCampo('escola246b-situacao',escola?.situacao_funcional||escola?.situacao||'Extinta');
    setCampo('escola246b-acervo',escola?.status_acervo||escola?.acervo||'Recolhido');
    setCampo('escola246b-local',escola?.local_acervo||'');
    preencherNte(escola?.nte||escola?.nte_id);

    const novo=modo==='novo';
    document.getElementById('escola246b-titulo').textContent=novo?'🏫 Cadastrar Nova Escola':'✏️ Alterar Escola';
    document.getElementById('escola246b-subtitulo').textContent=novo
      ?'Cadastro disponível para Master e Administrador.'
      :'Atualização conforme as permissões do perfil.';
    document.getElementById('escola246b-salvar').textContent=novo?'Cadastrar Escola':'Salvar Alterações';

    if(isTecnico())bloquearCamposTecnico();
    else liberarCamposCompletos();

    document.getElementById('escola246b-aviso').className='hidden p-3 rounded-lg text-xs font-bold';
    document.getElementById('modal-escola-246b').classList.remove('hidden');
  }

  function abrirNova(){
    if(!podeCadastrar()){
      alert('Somente Master e Administrador podem cadastrar novas escolas.');
      return;
    }
    carregar({},'novo');
  }

  function abrirEditar(id){
    if(!podeAlterar()){
      alert('Seu perfil não possui permissão para alterar escolas.');
      return;
    }
    const escola=lista().find(x=>String(x.id)===String(id)||String(x.cod_mec)===String(id));
    if(!escola){
      alert('Escola não localizada.');
      return;
    }
    if(!mesmoNte(escola)){
      alert('Você só pode alterar escolas vinculadas ao seu NTE.');
      return;
    }
    carregar(escola,'editar');
  }

  function fechar(){document.getElementById('modal-escola-246b')?.classList.add('hidden')}

  function chave(e){
    return [norm(e.cod_sec),norm(e.nome_escola||e.nome),norm(e.municipio),norm(e.tipo_unidade||'NAO INFORMADO')].join('|');
  }

  async function criarNoBanco(payload){
    const c=cliente();
    if(!c?.from)throw new Error('Cliente Supabase não localizado.');
    const {data,error}=await c.from('escolas_sigee').insert([payload]).select().single();
    if(error)throw error;
    return data;
  }

  async function atualizarNoBanco(id,payload){
    const c=cliente();
    if(!c?.from)throw new Error('Cliente Supabase não localizado.');
    let query=c.from('escolas_sigee').update(payload);
    query=id?query.eq('id',id):query.eq('cod_mec',payload.cod_mec);
    const {data,error}=await query.select().single();
    if(error)throw error;
    return data;
  }

  function payloadCompleto(){
    const nte=Number(document.getElementById('escola246b-nte').value||nteUsuario());
    return {
      cod_mec:txt(document.getElementById('escola246b-mec').value),
      cod_sec:txt(document.getElementById('escola246b-sec').value)||null,
      nome_escola:txt(document.getElementById('escola246b-nome').value).toUpperCase(),
      municipio:txt(document.getElementById('escola246b-municipio').value).toUpperCase(),
      nte_id:nte,
      dependencia_adm:txt(document.getElementById('escola246b-dependencia').value),
      situacao_funcional:txt(document.getElementById('escola246b-situacao').value),
      acervo:txt(document.getElementById('escola246b-acervo').value),
      status_acervo:txt(document.getElementById('escola246b-acervo').value),
      local_acervo:txt(document.getElementById('escola246b-local').value)||null,
      ativo:true
    };
  }

  function payloadTecnico(){
    return {
      situacao_funcional:txt(document.getElementById('escola246b-situacao').value),
      acervo:txt(document.getElementById('escola246b-acervo').value),
      status_acervo:txt(document.getElementById('escola246b-acervo').value),
      local_acervo:txt(document.getElementById('escola246b-local').value)||null
    };
  }

  async function salvar(event){
    event.preventDefault();
    const modo=document.getElementById('escola246b-modo').value;
    const id=document.getElementById('escola246b-id').value;
    const aviso=document.getElementById('escola246b-aviso');
    const btn=document.getElementById('escola246b-salvar');
    const base=lista();

    if(modo==='novo'&&!podeCadastrar()){
      alert('Somente Master e Administrador podem cadastrar escolas.');
      return;
    }

    const existente=modo==='editar'
      ?base.find(x=>String(x.id)===String(id)||String(x.cod_mec)===String(id))
      :null;

    if(modo==='editar'&&(!existente||!mesmoNte(existente))){
      alert('Escola não localizada ou sem permissão.');
      return;
    }

    const payload=isTecnico()?payloadTecnico():payloadCompleto();

    if(!isTecnico()){
      if(!payload.cod_mec||!payload.nome_escola||!payload.municipio||!payload.nte_id){
        aviso.className='p-3 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200';
        aviso.textContent='Preencha Código MEC, Nome da Escola, Município e NTE.';
        return;
      }

      const candidato={...payload,tipo_unidade:document.getElementById('escola246b-tipo').value};
      const duplicada=base.find(x=>x!==existente&&chave(x)===chave(candidato));
      if(duplicada){
        aviso.className='p-3 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200';
        aviso.textContent='Duplicidade real: já existe registro com o mesmo Código SEC, nome, município e tipo.';
        return;
      }
    }

    btn.disabled=true;
    const original=btn.textContent;
    btn.textContent='Salvando...';

    try{
      let gravada;
      if(modo==='novo'){
        gravada=await criarNoBanco(payload);
        base.push({
          ...payload,
          ...gravada,
          tipo_unidade:document.getElementById('escola246b-tipo').value,
          nte:nteLabel(payload.nte_id),
          nome:payload.nome_escola,
          dependencia:payload.dependencia_adm,
          situacao:payload.situacao_funcional
        });
      }else{
        gravada=await atualizarNoBanco(existente.id||id,payload);
        Object.assign(existente,payload,gravada||{});
        existente.nome=existente.nome_escola;
        existente.dependencia=existente.dependencia_adm;
        existente.situacao=existente.situacao_funcional;
        existente.nte=existente.nte||nteLabel(existente.nte_id);
      }

      try{window.renderizarListaEscolasBufferMemoria?.()}catch(_){}
      try{window.carregarDadosDashboardReal?.()}catch(_){}
      try{
        const acao=modo==='novo'?'Cadastrou escola':'Alterou escola';
        window.registrarLog?.(`${acao}: ${modo==='novo'?payload.nome_escola:existente.nome_escola}`);
      }catch(_){}

      fechar();
      alert(modo==='novo'?'Escola cadastrada com sucesso.':'Escola alterada com sucesso.');
    }catch(err){
      aviso.className='p-3 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200';
      aviso.textContent=`Não foi possível salvar: ${err?.message||err}`;
    }finally{
      btn.disabled=false;
      btn.textContent=original;
    }
  }

  function aplicarPermissoes(){
    const botoes=document.querySelectorAll('button[onclick*="abrirModalNovaEscola"],.btn-nova-escola');
    botoes.forEach(btn=>btn.classList.toggle('hidden',!podeCadastrar()));
  }

  window.abrirModalNovaEscola=abrirNova;
  window.editarEscolaSIGEEV45=abrirEditar;
  window.editarEscolaSIGEE=abrirEditar;

  document.addEventListener('click',event=>{
    const novo=event.target.closest('button[onclick*="abrirModalNovaEscola"],.btn-nova-escola');
    if(novo){
      event.preventDefault();
      event.stopImmediatePropagation();
      abrirNova();
    }
  },true);

  document.addEventListener('DOMContentLoaded',()=>setTimeout(aplicarPermissoes,700));
  window.addEventListener('load',()=>setTimeout(aplicarPermissoes,700));
  const antigoNavegar=window.navegar;
  window.navegar=function(){
    const r=typeof antigoNavegar==='function'?antigoNavegar.apply(this,arguments):undefined;
    setTimeout(aplicarPermissoes,80);
    return r;
  };

  console.info('[SIGEE] Cadastro e edição de escolas 2.4.6B carregados.');
})();
