/* =====================================================================
   SIGEE RC10.8.46 — Diretório Único de Responsáveis
   Fonte autoritativa: public.usuarios_sigee
   Objetivos:
   - eliminar usuários fantasmas oriundos de cache/dados legados;
   - resolver NTE por nte, nte_nome, nte_vinculado, grupo ou nte_id;
   - filtrar sempre pelo NTE do processo/etapa;
   - repetir a consulta em falhas transitórias;
   - nunca misturar cache local quando a consulta oficial responde.
   ===================================================================== */
(function(w){
  'use strict';

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const txt = v => v == null ? '' : String(v).trim();
  const norm = v => txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const nteNumero = v => {
    const s = txt(v);
    const m = s.match(/NTE\s*[- ]?\s*(\d{1,2})/i);
    if(m) return Number(m[1]);
    if(/^\d{1,2}$/.test(s)) return Number(s);
    return null;
  };
  const nteTexto = u => {
    if(!u) return '';
    // RC10.8.46: nte_id é a autoridade territorial. O texto nte é apenas rótulo.
    const n = Number(u.nte_id ?? u.nteId ?? u.id_nte ?? u.territorio_id);
    if(Number.isFinite(n) && n > 0) return `NTE ${String(n).padStart(2,'0')}`;
    return txt(u.nte || u.nte_nome || u.nte_vinculado || '');
  };
  const mesmoNte = (a,b) => {
    const na = nteNumero(a), nb = nteNumero(b);
    if(na && nb) return na === nb;
    return norm(a).replace(/[^A-Z0-9]/g,'') === norm(b).replace(/[^A-Z0-9]/g,'');
  };
  const perfil = u => norm(u?.perfil || u?.role || u?.tipo_perfil || u?.tipo || u?.nivel || '');
  const ativo = u => {
    if(!u || u.bloqueado === true) return false;
    // Banco atual possui legado "Ativo" e coluna canônica ativo.
    // Se uma delas declarar explicitamente false e a outra não for true, considera inativo.
    const atual = u.ativo;
    const legado = u['Ativo'];
    if(atual === false && legado !== true) return false;
    if(legado === false && atual !== true) return false;
    const st = norm(u.status || u.situacao || 'ATIVO');
    return !st.includes('INATIV') && !st.includes('BLOQUEAD') && !st.includes('EXCLUID');
  };
  const elegivel = (u, incluirEstagiarios) => {
    if(!ativo(u)) return false;
    const p = perfil(u);
    return p.includes('TECNIC') || p.includes('ADMIN') || (incluirEstagiarios && p.includes('ESTAG'));
  };
  const normalizar = u => ({
    ...u,
    nome: txt(u?.nome || u?.nome_completo || u?.display_name || u?.email),
    email: txt(u?.email).toLowerCase(),
    perfil: txt(u?.perfil || u?.role || u?.tipo_perfil || u?.tipo),
    nte: nteTexto(u),
    ativo: ativo(u)
  });
  const cliente = () => {
    try {
      return w.SIGEE_SUPABASE_CLIENT || w.sigEESupabaseClient || w.supabaseClient || w.__SIGEE_V38_CLIENT ||
        w.obterSupabaseSIGEE?.() || w.criarClienteSupabaseSIGEE?.() || w.SIGEE_SUPABASE?.criarCliente?.() || null;
    } catch(_) { return null; }
  };

  async function consultarOficial({nteId=null,tentativas=3}={}){
    let ultimoErro = null;
    for(let i=0;i<Math.max(1,tentativas);i++){
      try{
        const c = cliente();
        if(!c) throw new Error('Cliente Supabase indisponível.');
        let q = c.from('usuarios_sigee').select('*');
        const id = Number(nteId);
        if(Number.isFinite(id) && id > 0) q = q.eq('nte_id', id);
        const {data,error} = await q;
        if(error) throw error;
        return {ok:true, dados:Array.isArray(data)?data:[], erro:null};
      }catch(e){
        ultimoErro = e;
        if(i < tentativas-1) await sleep(400 * (i+1));
      }
    }
    return {ok:false, dados:[], erro:ultimoErro};
  }

  async function listar({nte='',nteId=null,incluirEstagiarios=false,tentativas=3}={}){
    const alvo = txt(nte);
    let idAlvo = Number(nteId);
    if(!Number.isFinite(idAlvo) || idAlvo <= 0) idAlvo = nteNumero(alvo);
    const resp = await consultarOficial({nteId:idAlvo,tentativas});
    if(!resp.ok){
      console.error('[SIGEE RC10.8.46] Falha ao consultar diretório oficial de responsáveis.', resp.erro);
      return {ok:false, lista:[], erro:resp.erro, nte:alvo, nteId:idAlvo||null, fonte:'usuarios_sigee'};
    }

    const mapa = new Map();
    resp.dados.map(normalizar).forEach(u => {
      if(!u.nome) return;
      const chave = u.email || `${norm(u.nome)}|${Number(u.nte_id)||norm(u.nte)}`;
      mapa.set(chave,u);
    });

    let lista = [...mapa.values()].filter(u => elegivel(u, incluirEstagiarios));
    if(idAlvo){
      lista = lista.filter(u => Number(u.nte_id) === idAlvo || nteNumero(u.nte) === idAlvo);
    } else if(alvo){
      lista = lista.filter(u => mesmoNte(u.nte, alvo));
    }
    lista.sort((a,b) => txt(a.nome).localeCompare(txt(b.nome),'pt-BR'));
    try { w.__SIGEE_USUARIOS_OFICIAIS = resp.dados.map(normalizar); } catch(_) {}
    return {ok:true, lista, erro:null, nte:alvo, nteId:idAlvo||null, fonte:'usuarios_sigee'};
  }

  async function preencherSelect(select, {nte='', nteId=null, incluirEstagiarios=false, placeholder='Selecione o profissional...', vazio='Nenhum profissional ativo cadastrado para este NTE.', erro='Não foi possível carregar os profissionais. Tente novamente.'}={}){
    if(!select) return {ok:false,lista:[],erro:new Error('Select inexistente')};
    select.disabled = true;
    select.innerHTML = '<option value="">Carregando cadastro oficial...</option>';
    const r = await listar({nte,nteId,incluirEstagiarios,tentativas:3});
    select.innerHTML = `<option value="">${placeholder}</option>`;
    if(!r.ok){
      const o=document.createElement('option'); o.disabled=true; o.textContent=erro; select.appendChild(o); select.disabled=false; return r;
    }
    r.lista.forEach(u=>{
      const o=document.createElement('option');
      o.value=u.nome; o.textContent=`${u.nome}${u.nte?' — '+u.nte:''}`;
      o.dataset.email=u.email||''; o.dataset.nte=u.nte||''; o.dataset.perfil=u.perfil||'';
      select.appendChild(o);
    });
    if(!r.lista.length){ const o=document.createElement('option'); o.disabled=true; o.textContent=vazio; select.appendChild(o); }
    select.disabled=false;
    return r;
  }

  w.SIGEE_DIRETORIO_RESPONSAVEIS = Object.freeze({listar, preencherSelect, normalizar, mesmoNte, nteNumero});

  // Autoridade final para o Desarquivamento.
  w.preencherResponsaveisDesarquivamentoSIGEE = async function(selectId, nteFiltro, nteIdFiltro){
    const select=document.getElementById(selectId);
    if(!select) return [];
    const nte=txt(nteFiltro || w.usuarioLogado?.nte || '');
    const r=await preencherSelect(select,{
      nte,
      nteId:nteIdFiltro,
      incluirEstagiarios:false,
      placeholder:'-- Selecione o Servidor --',
      vazio:`Nenhum técnico/administrador ativo cadastrado para ${nte || 'este NTE'}.`,
      erro:'Falha ao carregar o cadastro oficial. Feche e abra novamente a etapa.'
    });
    try { w.validarDesarquivamentoV27?.(); } catch(_) {}
    return r.lista || [];
  };

  console.info('[SIGEE] RC10.8.46 Diretório Único de Responsáveis ativo.');
})(window);
