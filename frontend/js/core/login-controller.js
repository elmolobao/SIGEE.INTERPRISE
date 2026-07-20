/** SIGEE RC4.2.1 — Login com perfil oficial do Supabase. Carregado após o legado. */
(function(window,document){'use strict';if(window.__SIGEE_LOGIN_RC42__)return;window.__SIGEE_LOGIN_RC42__=true;
function txt(v){return String(v??'').trim();}function email(v){return txt(v).toLowerCase();}
async function ensureUsers(){try{if(typeof window.carregarUsuariosRapidoSupabaseSIGEE==='function')await Promise.race([window.carregarUsuariosRapidoSupabaseSIGEE(),new Promise(r=>setTimeout(r,1500))]);}catch(_){} }
function users(){return Array.isArray(window.usuariosDB)?window.usuariosDB:(typeof usuariosDB!=='undefined'&&Array.isArray(usuariosDB)?usuariosDB:[]);}
async function authoritativeUserByEmail(mail){
  try{
    const client=window.SIGEE_SUPABASE?.criarCliente?.()||window.criarClienteSupabaseSIGEE?.()||window.SIGEE_SUPABASE_CLIENT||null;
    if(!client)return null;
    const table=(window.SIGEE_CONFIG?.tabelas?.usuarios)||(window.SIGEE_SUPABASE_TABELAS?.usuarios)||'usuarios_sigee';
    const {data,error}=await client.from(table).select('*').ilike('email',mail).maybeSingle();
    if(error){console.warn('[SIGEE RC4.2.1] Perfil oficial não pôde ser confirmado no Supabase.',error);return null;}
    return data||null;
  }catch(error){console.warn('[SIGEE RC4.2.1] Falha ao consultar perfil oficial.',error);return null;}
}
function render(u){const nome=document.getElementById('user-nome'),perfil=document.getElementById('user-perfil');if(nome)nome.textContent=u.nome||u.nome_completo||u.email||'';if(perfil)perfil.textContent=`${u.perfil}${u.nte?' | '+u.nte:''}`;window.SIGEE_PERMISSOES?.aplicar?.();window.SIGEE_FOOTER_INSTITUCIONAL?.atualizar?.();}
async function login(event){event?.preventDefault?.();const e=email(document.getElementById('login-email')?.value),s=txt(document.getElementById('login-senha')?.value);if(!e||!s)return alert('Informe e-mail e senha.');await ensureUsers();const local=users().find(x=>email(x.email||x.login)===e&&txt(x.senha||x.senha_hash)===s&&x.ativo!==false&&x.Ativo!==false);if(!local)return alert('Credenciais inválidas ou usuário desativado.');const official=await authoritativeUserByEmail(e);const u={...local,...(official||{})};const canonical=window.SIGEE_SESSION.normalizarUsuario(u);if(!canonical?.perfil)return alert('Perfil de usuário inválido. Procure o administrador.');window.SIGEE_SESSION.setUser(canonical,{source:'login',forceProfile:true,persist:true,emit:true});document.getElementById('tela-login')?.classList.add('hidden');document.getElementById('sistema-dashboard')?.classList.remove('hidden');render(canonical);try{window.registrarLog?.('Acesso realizado ao SIGEE.');}catch(_){}try{window.navegar?.('processos');}catch(_){}try{window.carregarEContarProcessosHorizontais?.();}catch(_){}setTimeout(()=>{try{window.sincronizarSupabaseSegundoPlanoSIGEE?.();}catch(_){}},300);window.SIGEE_AUTH?.verificarPrimeiroAcesso?.();return true;}
function logout(){window.SIGEE_SESSION.clear({persist:true,emit:true});document.getElementById('sistema-dashboard')?.classList.add('hidden');document.getElementById('tela-login')?.classList.remove('hidden');const form=document.getElementById('form-login');form?.reset?.();return true;}
window.handleLogin=login;window.logout=logout;try{globalThis.handleLogin=login;globalThis.logout=logout;}catch(_){}
})(window,document);
