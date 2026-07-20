/**
 * SIGEE RC4.2 — Sessão única e protegida.
 * Nenhum módulo deve normalizar ou persistir perfil fora deste arquivo.
 */
(function (window) {
  'use strict';
  if (window.__SIGEE_SESSION_RC42__) return;
  window.__SIGEE_SESSION_RC42__ = true;

  const KEYS = Object.freeze(['SIGEE_USUARIO_LOGADO','usuarioLogadoSIGEE']);
  let currentUser = null;

  function canonicalProfile(value) {
    if (window.SIGEE_PERFIS?.normalizar) return window.SIGEE_PERFIS.normalizar(value);
    const p=String(value??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    if(!p) return '';
    if(p.includes('MASTER')) return 'Master';
    if(p==='SEC'||p.includes('SECRETARIA')) return 'SEC';
    if(p.includes('GESTOR')||p.includes('DIRIGENTE')) return 'Gestor';
    if(p.includes('ADMIN')) return 'Administrador';
    if(p.includes('TECNIC')) return 'Técnico';
    if(p.includes('ESTAG')) return 'Estagiário';
    if(p.includes('CONSULT')) return 'Consulta';
    return '';
  }
  function emailOf(u){return String(u?.email||u?.login||u?.usuario||'').trim().toLowerCase();}
  function nteOf(u){return String(u?.nte||u?.nte_nome||u?.nte_vinculado||u?.grupo||u?.territorio||u?.nte_id||'').trim();}
  function normalizeUser(user){
    if(!user||typeof user!=='object') return null;
    const out={...user};
    let lockedProfile=canonicalProfile(out.perfil||out.tipo||out.role||out.tipo_perfil);
    Object.defineProperty(out,'perfil',{
      enumerable:true,
      configurable:false,
      get(){return lockedProfile;},
      set(value){
        const next=canonicalProfile(value);
        // Compatibilidade segura: módulos legados podem repetir o mesmo perfil,
        // mas não podem rebaixar/trocar o perfil durante a sessão.
        if(!lockedProfile && next) lockedProfile=next;
        else if(next===lockedProfile) lockedProfile=next;
      }
    });
    return out;
  }
  function sameIdentity(a,b){return emailOf(a) && emailOf(a)===emailOf(b);}
  function sameUser(a,b){return sameIdentity(a,b)&&canonicalProfile(a?.perfil)===canonicalProfile(b?.perfil)&&nteOf(a)===nteOf(b)&&String(a?.nome||'')===String(b?.nome||'');}
  function read(){
    for(const key of KEYS){
      try{const raw=localStorage.getItem(key);if(raw){const u=normalizeUser(JSON.parse(raw));if(u)return u;}}catch(_){ }
    }
    return null;
  }
  function persist(user){
    for(const key of KEYS){try{user?localStorage.setItem(key,JSON.stringify(user)):localStorage.removeItem(key);}catch(_){}}
  }
  function emit(name,user){document.dispatchEvent(new CustomEvent(name,{detail:user}));}
  function getUser(){if(currentUser)return currentUser;currentUser=read();return currentUser;}
  function setUser(user, options){
    const opts={persist:true,emit:true,source:'core',forceProfile:false,...(options||{})};
    let incoming=normalizeUser(user);
    const old=currentUser||read();
    // Proteção contra módulos legados: o mesmo usuário não pode ser rebaixado/trocado
    // por atribuição indireta. Mudança de perfil só ocorre no login ou com forceProfile.
    if(incoming&&old&&sameIdentity(old,incoming)&&!opts.forceProfile&&opts.source!=='login'){
      incoming={...incoming,perfil:canonicalProfile(old.perfil)||canonicalProfile(incoming.perfil)};
    }
    if(sameUser(old,incoming)){currentUser=old;return old;}
    currentUser=incoming;
    if(opts.persist)persist(currentUser);
    if(opts.emit)emit(currentUser?'sigee:usuario-logado':'sigee:usuario-deslogado',currentUser);
    return currentUser;
  }
  function patchUser(changes,options){return setUser({...getUser(),...(changes||{})},options);}
  function clear(options){return setUser(null,{source:'logout',...(options||{})});}

  // Compatibilidade controlada com o legado. Atribuições a window.usuarioLogado
  // passam pela sessão e não podem transformar Gestor/SEC/etc. em Técnico.
  try{
    Object.defineProperty(window,'usuarioLogado',{
      configurable:true,
      get(){return getUser();},
      set(value){setUser(value,{persist:true,emit:false,source:'legacy'});}
    });
  }catch(_){window.usuarioLogado=getUser();}

  window.SIGEE_SESSION=Object.freeze({getUser,setUser,patchUser,clear,normalizarPerfil:canonicalProfile,normalizarUsuario:normalizeUser,emailDoUsuario:emailOf,nteDoUsuario:nteOf});
})(window);
