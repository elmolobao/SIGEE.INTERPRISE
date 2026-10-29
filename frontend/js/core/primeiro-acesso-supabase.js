/* SIGEE — ativação e recuperação via Supabase Auth (fase preparatória).
 * Não provisiona usuários, não vincula IDs por e-mail e não altera o login legado.
 * Os links só funcionam para contas previamente provisionadas no Auth.
 */
(function(window, document){
 'use strict';
 const $ = id => document.getElementById(id);
 const client = () => window.SIGEE_SUPABASE?.criarCliente?.() || window.criarClienteSupabaseSIGEE?.() || window.SIGEE_SUPABASE_CLIENT;
 const panel = $('sigee-auth-painel');
 if(!panel) return;
 let modo='primeiro';
 const msg=(s,erro=false)=>{const e=$('sigee-auth-mensagem');e.textContent=s;e.className='mt-2 text-sm '+(erro?'text-red-700':'text-gray-700');};
 function abrir(tipo){
   modo=tipo;panel.classList.remove('hidden');$('sigee-auth-email-form').classList.remove('hidden');$('sigee-auth-senha-form').classList.add('hidden');
   $('sigee-auth-titulo').textContent=tipo==='primeiro'?'Primeiro acesso ao SIGEE':'Recuperação de senha';
   $('sigee-auth-ajuda').textContent='Informe seu e-mail cadastrado. Se a conta já estiver habilitada, você receberá um link para definir a senha neste portal.';
   $('sigee-auth-email').value=$('login-email')?.value||'';msg('');
 }
 $('sigee-primeiro-acesso').addEventListener('click',()=>abrir('primeiro'));
 $('sigee-esqueci-senha').addEventListener('click',()=>abrir('recuperacao'));
 $('sigee-auth-fechar').addEventListener('click',()=>{panel.classList.add('hidden');msg('');});
 $('sigee-auth-email-form').addEventListener('submit',async event=>{
   event.preventDefault();const email=$('sigee-auth-email').value.trim().toLowerCase();
   const c=client();if(!c?.auth?.resetPasswordForEmail){msg('Serviço de autenticação indisponível.',true);return;}
   const btn=event.currentTarget.querySelector('button[type=submit]');btn.disabled=true;
   try{
     const redirectTo=window.location.origin+window.location.pathname;
     const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo});
     if(error) {console.warn('[SIGEE] Falha no envio do link:',error.message);}
     msg('Se a conta estiver habilitada, enviaremos um link para o e-mail informado. Verifique também o spam.');
   }catch(e){console.error('[SIGEE] Recuperação indisponível:',e);msg('Não foi possível solicitar o link. Tente novamente mais tarde.',true);}
   finally{btn.disabled=false;}
 });
 $('sigee-auth-senha-form').addEventListener('submit',async event=>{
   event.preventDefault();const a=$('sigee-auth-nova-senha').value,b=$('sigee-auth-confirma-senha').value;
   if(a.length<10||a!==b){msg('As senhas devem coincidir e conter ao menos 10 caracteres.',true);return;}
   const c=client();if(!c?.auth?.getUser){msg('Serviço de autenticação indisponível.',true);return;}
   const btn=event.currentTarget.querySelector('button[type=submit]');btn.disabled=true;
   try{
     const {data:userData,error:userError}=await c.auth.getUser();
     if(userError||!userData?.user)throw new Error('Sessão de verificação não encontrada. Solicite outro link.');
     const {error}=await c.auth.updateUser({password:a});if(error)throw error;
     await c.auth.signOut();$('sigee-auth-senha-form').reset();
     $('sigee-auth-senha-form').classList.add('hidden');
     msg('Senha cadastrada. Faça login com seu e-mail e a nova senha após a ativação do Supabase Auth no SIGEE.');
   }catch(e){msg(e.message||'Não foi possível cadastrar a senha.',true);}finally{btn.disabled=false;}
 });
 async function processarRecuperacao(){
   const hash=window.location.hash||'';
   const recovery=hash.includes('type=recovery');
   const c=client();if(!c?.auth)return;
   c.auth.onAuthStateChange((event)=>{
     if(event==='PASSWORD_RECOVERY'){
       panel.classList.remove('hidden');$('sigee-auth-email-form').classList.add('hidden');$('sigee-auth-senha-form').classList.remove('hidden');
       $('sigee-auth-titulo').textContent='Definir nova senha';$('sigee-auth-ajuda').textContent='Escolha sua nova senha para o SIGEE.';msg('');
     }
   });
   if(recovery){
     panel.classList.remove('hidden');$('sigee-auth-email-form').classList.add('hidden');$('sigee-auth-senha-form').classList.remove('hidden');
     $('sigee-auth-titulo').textContent='Definir nova senha';$('sigee-auth-ajuda').textContent='Confirme a sessão do link recebido e defina sua senha.';
   }
 }
 processarRecuperacao();
})(window,document);
