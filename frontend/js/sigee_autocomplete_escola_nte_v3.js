/* SIGEE Sprint 02 - Autocomplete Escola por NTE v3
   IMPORTANTE: carregar APÓS js/app.js e remover v1/v2/hotfix anteriores.
   Substitui o <select id="novo-proc-escola"> por campo digitável, com busca por trecho e filtro por NTE.
*/
(function(){
  'use strict';
  const V='SIGEE_AUTO_ESCOLA_NTE_V3';
  const IDS={select:'novo-proc-escola',wrap:'sigee-escola-auto-wrap-v3',input:'sigee-escola-auto-input-v3',list:'sigee-escola-auto-list-v3'};
  const SUPABASE_URL='https://ckxbvsfjsknbgpfpxcyy.supabase.co';
  const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImNreGJ2c2Zqc2tuYmdwZnB4Y3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTc4MjUsImV4cCI6MjA5ODc3MzgyNX0.ecJr_MYR9GPnaYMZ3V6kgeed7uGtg-vQ4THpdwAtTxk';
  let selected=null, timer=null, sb=null;

  const txt=v=>v==null?'':String(v).trim();
  const clean=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  const normNte=v=>clean(v).replace(/[^A-Z0-9]/g,'');
  const getPerfil=()=>clean(window.usuarioLogado && window.usuarioLogado.perfil);
  const getNteUsuario=()=>txt(window.usuarioLogado && window.usuarioLogado.nte);
  const isGlobal=()=>['MASTER','SEC'].includes(getPerfil());
  const numNte=v=>{const m=txt(v).match(/NTE\s*-?\s*(\d{1,2})/i); return m?parseInt(m[1],10):null;};
  const mesmoNte=(a,b)=>{const na=numNte(a), nb=numNte(b); return na&&nb ? na===nb : normNte(a)===normNte(b);};
  const nome=e=>txt(e && (e.nome || e.nome_escola || e.instituicao));
  const cod=e=>txt(e && (e.cod_mec || e.codigo_mec || e.mec));
  const mun=e=>txt(e && (e.municipio || e.cidade));
  const nte=e=>txt(e && (e.nte || e.nte_nome || e.nte_associado || e.dep_adm || e.departamento));
  const dep=e=>txt(e && (e.dependencia || e.dependencia_adm || e.dep_administrativo));
  const sit=e=>txt(e && (e.situacao || e.situacao_funcional));
  const ace=e=>txt(e && (e.status_acervo || e.acervo));
  const loc=e=>txt(e && (e.local_acervo || e.local_fisico_acervo));

  function client(){
    if(sb) return sb;
    if(window.supabase && typeof window.supabase.createClient==='function') sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    return sb;
  }

  function allowed(e){
    if(isGlobal()) return true;
    const nU=getNteUsuario();
    if(!nU || /SEC\s*-?\s*TODOS|TODOS\s*OS\s*NTES/i.test(nU)) return false;
    return mesmoNte(nte(e), nU);
  }

  function localData(){
    try{ if(Array.isArray(window.escolasDB) && window.escolasDB.length) return window.escolasDB; }catch(e){}
    try{ if(Array.isArray(window.cacheEscolasModalSIGEE_V23) && window.cacheEscolasModalSIGEE_V23.length) return window.cacheEscolasModalSIGEE_V23; }catch(e){}
    return [];
  }

  function mapSB(e){
    const nteTxt=e.nte || e.nte_nome || e.dep_adm || (e.nte_id ? ('NTE '+String(e.nte_id).padStart(2,'0')) : '');
    return { cod_mec:e.cod_mec, nome:e.nome_escola||e.nome, municipio:e.municipio, nte:nteTxt, dependencia:e.dependencia_adm||e.dependencia, situacao:e.situacao_funcional||e.situacao, acervo:e.status_acervo||e.acervo, status_acervo:e.status_acervo||e.acervo, local_acervo:e.local_acervo };
  }

  async function buscaSupabase(term){
    const c=client(); if(!c) return [];
    try{
      let q=c.from('escolas_sigee')
        .select('cod_mec,nome_escola,municipio,nte,nte_id,dependencia_adm,situacao_funcional,status_acervo,acervo,local_acervo')
        .ilike('nome_escola','%'+term+'%')
        .limit(30);
      if(!isGlobal()){
        const n=numNte(getNteUsuario());
        if(!n) return [];
        q=q.eq('nte_id', n);
      }
      const {data,error}=await q;
      if(error) throw error;
      return (data||[]).map(mapSB);
    }catch(err){ console.warn(V,'Supabase indisponível na busca:',err); return []; }
  }

  async function search(term){
    const t=clean(term); if(t.length<2) return [];
    const parts=t.split(' ').filter(Boolean);
    const found=localData().filter(allowed).filter(e=>{
      const alvo=clean(nome(e)+' '+mun(e)+' '+cod(e));
      return parts.every(p=>alvo.includes(p));
    }).slice(0,30);
    if(found.length) return found;
    return await buscaSupabase(term);
  }

  function setVal(id,v){const el=document.getElementById(id); if(el) el.value=v||'';}
  function clearAuto(){['novo-autofill-mec','novo-autofill-nte','novo-autofill-municipio','novo-autofill-dep','novo-autofill-situacao','novo-autofill-acervo','novo-autofill-local-acervo'].forEach(id=>setVal(id,''));}
  function fill(e){
    setVal('novo-autofill-mec',cod(e)); setVal('novo-autofill-nte',nte(e)); setVal('novo-autofill-municipio',mun(e));
    setVal('novo-autofill-dep',dep(e)); setVal('novo-autofill-situacao',sit(e)); setVal('novo-autofill-acervo',ace(e)); setVal('novo-autofill-local-acervo',loc(e));
  }
  function hideList(){const l=document.getElementById(IDS.list); if(l) l.style.display='none';}
  function message(msg){const l=document.getElementById(IDS.list); if(l){l.innerHTML='<div class="sigee-auto-msg-v3">'+msg+'</div>'; l.style.display='block';}}

  function choose(e){
    selected=e;
    const s=document.getElementById(IDS.select), i=document.getElementById(IDS.input);
    const value=nome(e).toUpperCase();
    if(i) i.value=value;
    if(s){
      s.innerHTML='';
      const o=document.createElement('option'); o.value=value; o.textContent=value; o.selected=true; s.appendChild(o);
      s.value=value; s.dataset.sigeeSelected='1'; s.dataset.codMec=cod(e);
    }
    fill(e); hideList();
  }

  async function render(term){
    const list=document.getElementById(IDS.list); if(!list) return;
    if(clean(term).length<2){message('Digite pelo menos 2 letras para pesquisar.'); return;}
    list.innerHTML='<div class="sigee-auto-msg-v3">Pesquisando...</div>'; list.style.display='block';
    const rows=await search(term);
    if(!rows.length){message(isGlobal()?'Nenhuma escola encontrada.':'Nenhuma escola encontrada para o NTE do usuário.'); return;}
    list.innerHTML='';
    rows.forEach(e=>{
      const b=document.createElement('button'); b.type='button'; b.className='sigee-auto-item-v3';
      b.innerHTML='<strong>'+nome(e).toUpperCase()+'</strong><small>MEC: '+(cod(e)||'-')+' | '+(mun(e)||'-')+' | '+(nte(e)||'-')+'</small>';
      b.onmousedown=function(ev){ev.preventDefault(); ev.stopPropagation(); choose(e);};
      list.appendChild(b);
    });
    list.style.display='block';
  }

  function onInput(){
    selected=null; clearAuto();
    const s=document.getElementById(IDS.select); if(s){s.value=''; delete s.dataset.sigeeSelected;}
    const i=document.getElementById(IDS.input); clearTimeout(timer); timer=setTimeout(()=>render(i ? i.value : ''), 220);
  }

  function install(){
    const s=document.getElementById(IDS.select); if(!s) return false;
    let wrap=document.getElementById(IDS.wrap);
    if(!wrap){
      wrap=document.createElement('div'); wrap.id=IDS.wrap; wrap.className='sigee-auto-wrap-v3';
      wrap.innerHTML='<input id="'+IDS.input+'" type="text" autocomplete="off" placeholder="🔎 Digite trecho do nome da escola..." class="sigee-auto-input-v3"><div id="'+IDS.list+'" class="sigee-auto-list-v3" style="display:none"></div>';
      s.parentNode.insertBefore(wrap, s);
    }
    s.style.setProperty('display','none','important');
    s.classList.add('hidden');
    s.required=false;
    if(!s.value){s.innerHTML='<option value="">SELECIONE PELA PESQUISA</option>';}
    const i=document.getElementById(IDS.input);
    if(i && !i.dataset.sigeeBound){
      i.dataset.sigeeBound='1';
      i.addEventListener('input', onInput);
      i.addEventListener('focus', ()=>{ if(clean(i.value).length>=2) render(i.value); else message('Digite pelo menos 2 letras para pesquisar.'); });
      i.addEventListener('keydown', ev=>{ if(ev.key==='Enter'){ const first=document.querySelector('#'+IDS.list+' .sigee-auto-item-v3'); if(first){ev.preventDefault(); first.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true}));} } });
    }
    return true;
  }

  function css(){
    if(document.getElementById('sigee-auto-css-v3')) return;
    const st=document.createElement('style'); st.id='sigee-auto-css-v3';
    st.textContent=`
      .sigee-auto-wrap-v3{position:relative;width:100%;margin-bottom:.25rem}
      .sigee-auto-input-v3{width:100%;padding:.72rem .85rem;border:1px solid #22d3ee;border-radius:.55rem;background:#020617;color:#e5f7ff;font-size:.8rem;font-weight:700;outline:none}
      .sigee-auto-input-v3:focus{box-shadow:0 0 0 3px rgba(34,211,238,.22)}
      .sigee-auto-input-v3::placeholder{color:#93a9b8}
      .sigee-auto-list-v3{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:999999;max-height:315px;overflow:auto;background:#fff;border:1px solid #0891b2;border-radius:.55rem;box-shadow:0 20px 50px rgba(0,0,0,.42);padding:.25rem}
      .sigee-auto-item-v3{display:block;width:100%;text-align:left;background:#fff;border:0;border-bottom:1px solid #e5e7eb;padding:.68rem .75rem;cursor:pointer;color:#0f172a}
      .sigee-auto-item-v3:hover{background:#e0f2fe}
      .sigee-auto-item-v3 strong{display:block;font-size:.8rem}.sigee-auto-item-v3 small{display:block;color:#475569;font-weight:700;margin-top:.15rem}
      .sigee-auto-msg-v3{padding:.8rem;color:#475569;background:#f8fafc;font-size:.78rem;font-weight:800}`;
    document.head.appendChild(st);
  }

  function patchOpen(){
    const old=window.abrirFormularioNovaSolicitacao;
    if(old && !old.__sigeeAutoV3){
      const novo=function(){
        const ret=old.apply(this,arguments);
        setTimeout(()=>{css(); install(); const i=document.getElementById(IDS.input); if(i) i.focus();}, 120);
        setTimeout(()=>{css(); install();}, 600);
        return ret;
      };
      novo.__sigeeAutoV3=true;
      window.abrirFormularioNovaSolicitacao=novo;
    }
  }

  function patchSave(){
    const old=window.salvarNovaSolicitacao;
    if(old && !old.__sigeeAutoV3){
      const novo=function(ev){
        const s=document.getElementById(IDS.select), i=document.getElementById(IDS.input);
        if(s && !s.value){ if(ev) ev.preventDefault(); alert('Selecione a instituição pela pesquisa.'); if(i) i.focus(); return false; }
        return old.apply(this,arguments);
      };
      novo.__sigeeAutoV3=true;
      window.salvarNovaSolicitacao=novo;
    }
  }

  function init(){
    css(); patchOpen(); patchSave(); install();
    document.addEventListener('click', function(ev){ const w=document.getElementById(IDS.wrap); if(w && !w.contains(ev.target)) hideList(); }, true);
    const modal=document.getElementById('modal-nova-solicitacao');
    if(modal && !modal.dataset.sigeeAutoObsV3){
      modal.dataset.sigeeAutoObsV3='1';
      new MutationObserver(()=>{ if(!modal.classList.contains('hidden')) setTimeout(()=>{css(); install();},50); }).observe(modal,{attributes:true,attributeFilter:['class']});
    }
    setInterval(()=>{ const modal=document.getElementById('modal-nova-solicitacao'); if(modal && !modal.classList.contains('hidden')) install(); }, 700);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
  console.info(V,'carregado');
})();
