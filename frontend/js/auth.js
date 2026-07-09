/* =====================================================================
 * SIGEE ENTERPRISE 2.0 - auth.js
 * Funções auxiliares de autenticação e sessão.
 * O handleLogin atual permanece no app.js durante esta fase.
 * ===================================================================== */
(function (window) {
  'use strict';

  function normalizarEmailSIGEE(email) {
    return String(email || '').trim().toLowerCase();
  }

  function normalizarPerfilSIGEE(perfil) {
    const p = String(perfil || '').trim();
    if (!p) return '';
    const base = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (base === 'sec') return 'SEC';
    if (base === 'master') return 'Master';
    if (base === 'administrador') return 'Administrador';
    if (base === 'tecnico') return 'Tecnico';
    if (base === 'consulta') return 'Consulta';
    return p;
  }

  function obterUsuarioLogadoSIGEE() {
    return window.usuarioLogado || null;
  }

  function usuarioTemPerfilSIGEE(...perfis) {
    const u = obterUsuarioLogadoSIGEE();
    const perfilUsuario = normalizarPerfilSIGEE(u && u.perfil);
    return perfis.map(normalizarPerfilSIGEE).includes(perfilUsuario);
  }

  window.SIGEE_AUTH = {
    normalizarEmail: normalizarEmailSIGEE,
    normalizarPerfil: normalizarPerfilSIGEE,
    obterUsuarioLogado: obterUsuarioLogadoSIGEE,
    usuarioTemPerfil: usuarioTemPerfilSIGEE
  };

  window.normalizarPerfilSIGEE = window.normalizarPerfilSIGEE || normalizarPerfilSIGEE;
})(window);

/* =====================================================================
   SIGEE Sprint 2.6.1 - Autenticação e primeiro acesso
   ===================================================================== */
(function(){
  'use strict';
  const SENHA_PADRAO = 'SEC@2026';
  function txt(v){ return (v===null||v===undefined)?'':String(v).trim(); }
  function low(v){ return txt(v).toLowerCase(); }
  function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function perfilCanonico(v){
    const p = semAcento(v).toUpperCase();
    if (p.includes('SEC')) return 'SEC';
    if (p.includes('MASTER')) return 'Master';
    if (p.includes('ADMIN')) return 'Administrador';
    if (p.includes('ESTAG')) return 'Estagiario';
    if (p.includes('CONSULT')) return 'Consulta';
    if (p.includes('TECNIC')) return 'Tecnico';
    return txt(v);
  }
  function client(){
    try { if (typeof obterSupabaseSIGEE === 'function') return obterSupabaseSIGEE(); } catch(e) {}
    try { if (window.SIGEE_SUPABASE && typeof window.SIGEE_SUPABASE.criarCliente === 'function') return window.SIGEE_SUPABASE.criarCliente(); } catch(e) {}
    return window.SIGEE_SUPABASE_CLIENT || window.supabaseClient || null;
  }
  function usuario(){ try { return window.usuarioLogado || usuarioLogado || null; } catch(e){ return window.usuarioLogado || null; } }
  function criarModalTrocaSenha(){
    if (document.getElementById('modal-troca-senha-primeiro-acesso')) return;
    const div = document.createElement('div');
    div.id = 'modal-troca-senha-primeiro-acesso';
    div.className = 'hidden fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4';
    div.innerHTML = `<div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-gray-900">
      <h2 class="text-xl font-black text-blue-900 mb-2">Primeiro acesso ao SIGEE</h2>
      <p class="text-sm text-gray-600 mb-4">Por segurança, cadastre uma nova senha para continuar.</p>
      <label class="text-xs font-bold uppercase text-gray-600">Nova senha</label>
      <input id="primeiro-acesso-nova-senha" type="password" autocomplete="new-password" class="w-full border rounded-lg p-3 mb-3" placeholder="Digite a nova senha">
      <label class="text-xs font-bold uppercase text-gray-600">Confirmar senha</label>
      <input id="primeiro-acesso-confirma-senha" type="password" autocomplete="new-password" class="w-full border rounded-lg p-3 mb-4" placeholder="Confirme a nova senha">
      <button id="btn-salvar-primeiro-acesso" type="button" class="w-full bg-blue-700 text-white font-black rounded-lg p-3">Salvar nova senha</button>
    </div>`;
    document.body.appendChild(div);
    document.getElementById('btn-salvar-primeiro-acesso').onclick = salvarSenhaPrimeiroAcesso;
  }
  function mostrarModalTrocaSenha(){ criarModalTrocaSenha(); document.getElementById('modal-troca-senha-primeiro-acesso')?.classList.remove('hidden'); setTimeout(()=>document.getElementById('primeiro-acesso-nova-senha')?.focus(),100); }
  function esconderModalTrocaSenha(){ document.getElementById('modal-troca-senha-primeiro-acesso')?.classList.add('hidden'); }
  async function salvarSenhaPrimeiroAcesso(){
    const senha = txt(document.getElementById('primeiro-acesso-nova-senha')?.value);
    const confirma = txt(document.getElementById('primeiro-acesso-confirma-senha')?.value);
    if (!senha || senha.length < 6) return alert('A nova senha deve ter pelo menos 6 caracteres.');
    if (senha !== confirma) return alert('As senhas não conferem.');
    const u = usuario();
    if (!u || !u.email) return alert('Sessão não localizada. Faça login novamente.');
    const c = client();
    if (!c) return alert('Cliente Supabase indisponível.');
    const payload = { senha, senha_hash: senha, forcar_troca_senha: false };
    const { data, error } = await c.from('usuarios_sigee').update(payload).eq('email', low(u.email)).select('*').maybeSingle();
    if (error) return alert('Erro ao salvar nova senha: ' + error.message);
    Object.assign(u, payload, data || {});
    window.usuarioLogado = u;
    try { usuarioLogado = u; } catch(e) {}
    try { localStorage.setItem('usuarioLogadoSIGEE', JSON.stringify(u)); localStorage.setItem('SIGEE_USUARIO_LOGADO', JSON.stringify(u)); } catch(e) {}
    esconderModalTrocaSenha();
    alert('Senha cadastrada com sucesso.');
    try { if (typeof navegar === 'function') navegar('dashboard'); } catch(e) {}
  }
  function verificarPrimeiroAcesso(){ const u=usuario(); if (u && u.forcar_troca_senha === true) mostrarModalTrocaSenha(); }
  const antigo = window.SIGEE_AUTH || {};
  window.SIGEE_AUTH = Object.assign({}, antigo, {
    normalizarPerfil: perfilCanonico,
    SENHA_PADRAO,
    mostrarModalTrocaSenha,
    salvarSenhaPrimeiroAcesso,
    verificarPrimeiroAcesso
  });
  window.normalizarPerfilSIGEE = perfilCanonico;
  document.addEventListener('DOMContentLoaded', ()=>setInterval(verificarPrimeiroAcesso, 1200));
  window.addEventListener('load', ()=>setTimeout(verificarPrimeiroAcesso, 800));
})();

