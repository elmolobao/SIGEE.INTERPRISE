/* SIGEE - Sprint 02 Autocomplete Escola por NTE v2
   Carregar APÓS js/app.js no index.html.
   Corrige: select travado, pesquisa por trecho e filtro por NTE por perfil.
*/
(function(){
  'use strict';
  const V='sigee_autocomplete_escola_nte_v2';
  const IDS={select:'novo-proc-escola',box:'sigee-escola-auto-box-v2',input:'sigee-escola-auto-input-v2',lista:'sigee-escola-auto-lista-v2'};
  const SUPABASE_URL='https://ckxbvsfjsknbgpfpxcyy.supabase.co';
  const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImNreGJ2c2Zqc2tuYmdwZnB4Y3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTc4MjUsImV4cCI6MjA5ODc3MzgyNX0.ecJr_MYR9GPnaYMZ3V6kgeed7uGtg-vQ4THpdwAtTxk';
  let selecionada=null, timer=null, cliente=null;
  function t(v){return v===undefined||v===null?'':String(v).trim();}
  function sem(v){return t(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function up(v){return sem(v).toUpperCase().replace(/\s+/g,' ').trim();}
  function perfil(){return up(window.usuarioLogado?.perfil||'');}
  function nteUser(){return t(window.usuarioLogado?.nte||'');}
  function isGlobal(){const p=perfil(); return p==='MASTER'||p==='SEC';}
  function numNte(v){const m=t(v).match(/NTE\s*-?\s*(\d{1,2})/i); return m?Number(m[1]):null;}
  function mesmoNte(a,b){const na=numNte(a), nb=numNte(b); if(na&&nb) return na===nb; return up(a)===up(b);}
  function nome(e){return t(e?.nome||e?.nome_escola||e?.instituicao);}
  function cod(e){return t(e?.cod_mec||e?.codigo_mec||e?.mec);}
  function municipio(e){return t(e?.municipio||e?.cidade);}
  function nte(e){return t(e?.nte||e?.nte_nome||e?.nte_associado||e?.dep_adm);}
  function dep(e){return t(e?.dependencia||e?.dependencia_adm||e?.dep_administrativo);}
  function situacao(e){return t(e?.situacao||e?.situacao_funcional);}
  function acervo(e){return t(e?.status_acervo||e?.acervo).toUpperCase();}
  function local(e){return t(e?.local_acervo||e?.local_fisico_acervo);}
  function clienteSupabase(){
    if(cliente) return cliente;
    if(window.supabase?.createClient) cliente=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    return cliente;
  }
  function baseLocal(){
    try{ if(Array.isArray(window.escolasDB) && window.escolasDB.length) return window.escolasDB; }catch(e){}
    return [];
  }
  function permitido(e){
    if(isGlobal()) return true;
    const nU=nteUser();
    if(!nU || /TODOS OS NTES|^SEC\b/i.test(nU)) return false;
    return mesmoNte(nte(e), nU);
  }
  function mapSupabase(e){
    return {
      cod_mec:e.cod_mec, nome:e.nome_escola||e.nome, municipio:e.municipio,
      nte:e.nte || e.nte_nome || e.dep_adm || e.departamento || (e.nte_id?('NTE '+String(e.nte_id).padStart(2,'0')):''),
      dependencia:e.dependencia||e.dependencia_adm, situacao:e.situacao||e.situacao_funcional,
      status_acervo:e.status_acervo||e.acervo, acervo:e.acervo||e.status_acervo,
      local_acervo:e.local_acervo
    };
  }
  function opcoesSelect(){
    const s=document.getElementById(IDS.select); if(!s) return [];
    return Array.from(s.options||[]).filter(o=>o.value).map(o=>{
      const txt=t(o.textContent||o.value);
      const mec=(o.dataset&&o.dataset.codMec)||'';
      const parts=txt.split(' - ');
      return {nome:parts[0]||o.value, municipio:parts[1]||'', nte:(txt.match(/\(([^)]+)\)/)||[])[1]||'', cod_mec:mec, _value:o.value};
    });
  }
  async function buscarSupabase(q){
    const c=clienteSupabase(); if(!c) return [];
    try{
      let query=c.from('escolas_sigee')
        .select('cod_mec,nome_escola,municipio,nte,nte_id,dependencia_adm,situacao_funcional,status_acervo,acervo,local_acervo')
        .ilike('nome_escola','%'+q+'%')
        .limit(30);
      if(!isGlobal()){
        const n=numNte(nteUser());
        if(!n) return [];
        query=query.eq('nte_id', n);
      }
      const {data,error}=await query;
      if(error) throw error;
      return (data||[]).map(mapSupabase);
    }catch(e){ console.warn(V,'busca supabase falhou:',e); return []; }
  }
  async function buscar(termo){
    const q=up(termo); if(q.length<2) return [];
    const partes=q.split(' ').filter(Boolean);
    const local=baseLocal().filter(permitido).filter(e=>{
      const alvo=up(nome(e)+' '+municipio(e)+' '+cod(e));
      return partes.every(p=>alvo.includes(p));
    }).slice(0,30);
    if(local.length) return local;
    const opt=opcoesSelect().filter(permitido).filter(e=>{
      const alvo=up(nome(e)+' '+municipio(e)+' '+cod(e)); return partes.every(p=>alvo.includes(p));
    }).slice(0,30);
    if(opt.length) return opt;
    return buscarSupabase(termo);
  }
  function setVal(id,v){const el=document.getElementById(id); if(el) el.value=v||'';}
  function limpar(){['novo-autofill-mec','novo-autofill-nte','novo-autofill-municipio','novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo','novo-autofill-local-acervo'].forEach(id=>setVal(id,''));}
  function preencher(e){
    if(!e){limpar();return;}
    setVal('novo-autofill-mec',cod(e)); setVal('novo-autofill-nte',nte(e)); setVal('novo-autofill-municipio',municipio(e));
    setVal('novo-autofill-dep',dep(e)); setVal('novo-autofill-situacao',situacao(e)); setVal('novo-autofill-acervo',acervo(e)); setVal('novo-autofill-local-acervo',local(e));
  }
  function msg(m){const l=document.getElementById(IDS.lista); if(l){l.innerHTML='<div class="sigee-auto-msg-v2">'+m+'</div>'; l.style.display='block';}}
  function fechar(){const l=document.getElementById(IDS.lista); if(l) l.style.display='none';}
  function selecionar(e){
    selecionada=e;
    const s=document.getElementById(IDS.select), i=document.getElementById(IDS.input);
    const valor=nome(e).toUpperCase();
    if(s){
      s.innerHTML='';
      const o=document.createElement('option'); o.value=valor; o.textContent=valor; o.selected=true; s.appendChild(o);
      s.value=valor; s.dataset.codMecSelecionado=cod(e); s.dataset.sigeeSelecionado='1';
    }
    if(i) i.value=valor;
    preencher(e); fechar();
    try{ if(typeof window.handleSelecaoInstituicaoFluxoAutomatico==='function') window.handleSelecaoInstituicaoFluxoAutomatico(); }catch(_e){}
  }
  async function render(termo){
    const l=document.getElementById(IDS.lista); if(!l) return;
    if(up(termo).length<2){msg('Digite pelo menos 2 letras para pesquisar.');return;}
    l.innerHTML='<div class="sigee-auto-msg-v2">Pesquisando...</div>'; l.style.display='block';
    const r=await buscar(termo);
    if(!r.length){ msg(isGlobal()?'Nenhuma escola encontrada.':'Nenhuma escola encontrada para o NTE cadastrado.'); return; }
    l.innerHTML='';
    r.forEach(e=>{const b=document.createElement('button'); b.type='button'; b.className='sigee-auto-item-v2';
      b.innerHTML='<b>'+nome(e).toUpperCase()+'</b><small>MEC: '+(cod(e)||'-')+' | '+(municipio(e)||'-')+' | '+(nte(e)||'-')+'</small>';
      b.addEventListener('mousedown',ev=>{ev.preventDefault();selecionar(e);}); l.appendChild(b);});
    l.style.display='block';
  }
  function pesquisar(){const i=document.getElementById(IDS.input); if(!i) return; selecionada=null; const s=document.getElementById(IDS.select); if(s){s.value=''; delete s.dataset.codMecSelecionado;} limpar(); clearTimeout(timer); timer=setTimeout(()=>render(i.value),220);}
  function instalar(){
    const s=document.getElementById(IDS.select); if(!s) return;
    let box=document.getElementById(IDS.box);
    if(!box){
      box=document.createElement('div'); box.id=IDS.box; box.className='sigee-auto-box-v2';
      box.innerHTML='<input id="'+IDS.input+'" type="text" autocomplete="off" placeholder="🔎 Digite trecho do nome da escola..." class="sigee-auto-input-v2"><div id="'+IDS.lista+'" class="sigee-auto-lista-v2" style="display:none"></div>';
      s.parentNode.insertBefore(box,s);
    }
    s.style.display='none'; s.setAttribute('aria-hidden','true');
    if(!s.dataset.sigeeSelecionado){s.innerHTML='<option value="">SELECIONE PELA PESQUISA</option>'; s.value='';}
    const i=document.getElementById(IDS.input); if(i && !i.dataset.instalado){
      i.dataset.instalado='1'; i.addEventListener('input',pesquisar); i.addEventListener('focus',()=>{ if(up(i.value).length<2) msg('Digite pelo menos 2 letras para pesquisar.'); else render(i.value); });
      i.addEventListener('keydown',ev=>{if(ev.key==='Enter'){const p=document.querySelector('#'+IDS.lista+' .sigee-auto-item-v2'); if(p){ev.preventDefault(); p.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true}));}}});
    }
  }
  function css(){ if(document.getElementById('sigee-auto-css-v2')) return; const st=document.createElement('style'); st.id='sigee-auto-css-v2'; st.textContent=`
    .sigee-auto-box-v2{position:relative;width:100%;margin-bottom:.25rem}.sigee-auto-input-v2{width:100%;padding:.72rem .85rem;border:1px solid #22d3ee;border-radius:.55rem;background:#020617;color:#e5f7ff;font-size:.8rem;font-weight:700;outline:none}.sigee-auto-input-v2:focus{box-shadow:0 0 0 3px rgba(34,211,238,.2)}.sigee-auto-input-v2::placeholder{color:#93a9b8}.sigee-auto-lista-v2{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:999999;max-height:310px;overflow:auto;background:#fff;border:1px solid #0891b2;border-radius:.55rem;box-shadow:0 20px 50px rgba(0,0,0,.4);padding:.25rem}.sigee-auto-item-v2{display:block;width:100%;text-align:left;background:#fff;border:0;border-bottom:1px solid #e5e7eb;padding:.68rem .75rem;cursor:pointer;color:#0f172a}.sigee-auto-item-v2:hover{background:#e0f2fe}.sigee-auto-item-v2 b{display:block;font-size:.8rem}.sigee-auto-item-v2 small{display:block;color:#475569;font-weight:700;margin-top:.15rem}.sigee-auto-msg-v2{padding:.8rem;color:#475569;background:#f8fafc;font-size:.78rem;font-weight:800}`; document.head.appendChild(st);}
  const abrirOriginal=window.abrirFormularioNovaSolicitacao;
  window.abrirFormularioNovaSolicitacao=function(){ if(typeof abrirOriginal==='function') abrirOriginal.apply(this,arguments); setTimeout(()=>{css(); instalar(); const i=document.getElementById(IDS.input); if(i) i.focus();},80); };
  const handleOriginal=window.handleSelecaoInstituicaoFluxoAutomatico;
  window.handleSelecaoInstituicaoFluxoAutomatico=function(){ if(selecionada){preencher(selecionada); return;} if(typeof handleOriginal==='function') return handleOriginal.apply(this,arguments); };
  const salvarOriginal=window.salvarNovaSolicitacao;
  if(typeof salvarOriginal==='function') window.salvarNovaSolicitacao=function(ev){const s=document.getElementById(IDS.select); if(s && !s.value){ev&&ev.preventDefault(); alert('Selecione a instituição pela pesquisa.'); document.getElementById(IDS.input)?.focus(); return false;} return salvarOriginal.apply(this,arguments);};
  function init(){css(); instalar(); const modal=document.getElementById('modal-nova-solicitacao'); if(modal){new MutationObserver(()=>{if(!modal.classList.contains('hidden')) setTimeout(instalar,30);}).observe(modal,{attributes:true,attributeFilter:['class']});}}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  console.info('SIGEE autocomplete escola NTE v2 carregado');
})();
