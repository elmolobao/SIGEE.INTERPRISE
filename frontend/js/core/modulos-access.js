/**
 * SIGEE Enterprise RC12.0.0 — Autoridade de módulos.
 *
 * Separa, dentro da sessão institucional, o domínio de Escolas Extintas do
 * domínio de Legalização. O usuário continua único em usuarios_sigee e recebe
 * vínculos funcionais de usuarios_modulos_sigee.
 */
(function(window){
'use strict';
if (window.__SIGEE_MODULOS_RC1210A9__) return;
window.__SIGEE_MODULOS_RC1210A9__ = true;

const CODIGOS = Object.freeze({
  EXTINTAS: 'ESCOLAS_EXTINTAS',
  LEGALIZACAO: 'LEGALIZACAO'
});
const TODOS = Object.freeze([CODIGOS.EXTINTAS, CODIGOS.LEGALIZACAO]);

function texto(v){ return v == null ? '' : String(v).trim(); }
function token(v){ return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function normalizarModulo(v){
  const t=token(v).replace(/[\s-]+/g,'_');
  if(['EXTINTAS','ESCOLAS_EXTINTAS','ESCOLA_EXTINTA'].includes(t)) return CODIGOS.EXTINTAS;
  if(['LEGALIZACAO','LEGALIZAÇÃO'].includes(t)) return CODIGOS.LEGALIZACAO;
  return '';
}
function usuario(){ return window.SIGEE_SESSION?.getUser?.() || window.usuarioLogado || null; }
function perfilBase(u=usuario()){
  return window.SIGEE_PERFIS?.normalizar?.(u?.perfil) || window.SIGEE_SESSION?.normalizarPerfil?.(u?.perfil) || texto(u?.perfil);
}
function ehMaster(u=usuario()){ return perfilBase(u)==='Master'; }
function cliente(){
  try{return window.SIGEE_SUPABASE?.criarCliente?.() || window.SIGEE_SUPABASE_CLIENT || null;}catch(_){return null;}
}
function legadoVinculos(u=usuario()){
  if(!u) return [];
  if(ehMaster(u)) return TODOS.map(modulo_codigo=>({modulo_codigo,perfil_codigo:'Master',nte_id:null,ativo:true,pode_configurar:true,legado:true}));
  // Compatibilidade: antes da RC12 todos os usuários pertenciam ao domínio Extintas.
  return [{
    modulo_codigo:CODIGOS.EXTINTAS,
    perfil_codigo:perfilBase(u)||'Consulta',
    nte_id:u?.nte_id ?? null,
    ativo:true,
    pode_configurar:['Administrador','Gestor'].includes(perfilBase(u)),
    legado:true
  }];
}
function normalizarVinculo(v){
  const modulo_codigo=normalizarModulo(v?.modulo_codigo || v?.modulo || v?.codigo);
  if(!modulo_codigo) return null;
  return {
    ...v,
    modulo_codigo,
    perfil_codigo: window.SIGEE_PERFIS?.normalizar?.(v?.perfil_codigo || v?.perfil) || texto(v?.perfil_codigo || v?.perfil),
    nte_id: v?.nte_id ?? null,
    ativo: v?.ativo !== false,
    pode_configurar: v?.pode_configurar === true
  };
}
function vinculos(u=usuario()){
  if(!u) return [];
  if(ehMaster(u)) return legadoVinculos(u);
  const raw = Array.isArray(u?.vinculos_modulo) ? u.vinculos_modulo : [];
  const ativos=raw.map(normalizarVinculo).filter(v=>v&&v.ativo);
  if(ativos.length) return ativos;
  // RC12.0.10A.9: se a sessão já possui módulos explícitos, eles são autoridade.
  // Nunca transformar um usuário exclusivo de Legalização em Extintas por fallback legado.
  const explicitos = Array.isArray(u?.modulos_acesso)
    ? u.modulos_acesso.map(normalizarModulo).filter(Boolean)
    : [];
  if(explicitos.length){
    const p=perfilBase(u)||'Consulta';
    return [...new Set(explicitos)].map(modulo_codigo=>({
      modulo_codigo, perfil_codigo:p, nte_id:u?.nte_id??null, ativo:true,
      pode_configurar:['Administrador','Gestor'].includes(p), sessao_explicita:true
    }));
  }
  return legadoVinculos(u);
}
function vinculo(modulo,u=usuario()){
  const cod=normalizarModulo(modulo);
  if(!cod) return null;
  if(ehMaster(u)) return {modulo_codigo:cod,perfil_codigo:'Master',nte_id:null,ativo:true,pode_configurar:true};
  return vinculos(u).find(v=>v.modulo_codigo===cod) || null;
}
function podeAcessar(modulo,u=usuario()){ return !!vinculo(modulo,u); }
function perfilNoModulo(modulo,u=usuario()){ return vinculo(modulo,u)?.perfil_codigo || ''; }
function nteNoModulo(modulo,u=usuario()){
  const v=vinculo(modulo,u);
  if(!v) return null;
  if(ehMaster(u)) return null;
  return v.nte_id ?? u?.nte_id ?? null;
}
function podeConfigurar(modulo,u=usuario()){
  if(ehMaster(u)) return true;
  const v=vinculo(modulo,u);
  return !!v && (v.pode_configurar===true || ['Administrador','Gestor'].includes(v.perfil_codigo));
}
async function buscarVinculos(usuarioId){
  if(usuarioId==null) return [];
  const c=cliente(); if(!c) return [];
  try{
    const {data,error}=await c.from('usuarios_modulos_sigee')
      .select('id,usuario_id,modulo_codigo,perfil_codigo,nte_id,ativo,pode_configurar')
      .eq('usuario_id',usuarioId)
      .eq('ativo',true);
    if(error){
      // A migração pode ainda não ter sido aplicada. O login legado não deve quebrar.
      console.warn('[SIGEE RC12] Vínculos de módulos ainda indisponíveis; usando compatibilidade Extintas.', error.message||error);
      return [];
    }
    return (data||[]).map(normalizarVinculo).filter(Boolean);
  }catch(erro){
    console.warn('[SIGEE RC12] Falha ao carregar módulos do usuário.',erro);
    return [];
  }
}
async function hidratarUsuario(u){
  if(!u||typeof u!=='object') return u;
  if(ehMaster(u)) return {...u,vinculos_modulo:legadoVinculos(u),modulos_acesso:TODOS.slice()};
  const encontrados=await buscarVinculos(u.id);
  // Se a tabela respondeu, inclusive com um único módulo, ela prevalece integralmente.
  // O fallback legado só existe para instalações onde a estrutura modular ainda não foi aplicada.
  const lista=encontrados.length ? encontrados : vinculos(u);
  return {...u,vinculos_modulo:lista,modulos_acesso:lista.map(v=>v.modulo_codigo)};
}

async function reconciliarSessaoPersistida(){
  const atual=usuario();
  if(!atual||ehMaster(atual)||atual.id==null) return atual;
  try{
    const hidratado=await hidratarUsuario(atual);
    const antes=JSON.stringify(vinculos(atual).map(v=>[v.modulo_codigo,v.perfil_codigo,v.nte_id,v.ativo!==false]));
    const depois=JSON.stringify(vinculos(hidratado).map(v=>[v.modulo_codigo,v.perfil_codigo,v.nte_id,v.ativo!==false]));
    if(antes!==depois || !Array.isArray(atual.vinculos_modulo) || !atual.vinculos_modulo.length){
      window.SIGEE_SESSION?.setUser?.(hidratado,{source:'modulos-reconcile-rc12.0.10A.9',persist:true,emit:true,forceProfile:true});
    }
    aplicarDataset(hidratado);
    return hidratado;
  }catch(erro){
    console.warn('[SIGEE RC12.0.10A.9] Falha ao reconciliar módulos da sessão.',erro);
    return atual;
  }
}
function aplicarDataset(u=usuario()){
  if(!document?.body||!u) return;
  document.body.dataset.sigeeModulos=vinculos(u).map(v=>v.modulo_codigo).join(',');
}

document?.addEventListener?.('sigee:usuario-logado',()=>aplicarDataset());
window?.addEventListener?.('sigee:session-ready',()=>setTimeout(reconciliarSessaoPersistida,0));
window.SIGEE_MODULOS=Object.freeze({
  CODIGOS,TODOS,normalizarModulo,usuario,ehMaster,vinculos,vinculo,podeAcessar,
  perfilNoModulo,nteNoModulo,podeConfigurar,buscarVinculos,hidratarUsuario,reconciliarSessaoPersistida,aplicarDataset
});
})(window);
