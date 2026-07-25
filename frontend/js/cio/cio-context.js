(function (global) {
  'use strict';
  const NS = global.SIGEE_CIO = global.SIGEE_CIO || {};
  const VERSION = 'RC6.2.1';
  const txt = v => v == null ? '' : String(v).trim();
  const norm = v => txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  function usuarioAtual() {
    try { return global.SIGEE_SESSION?.getUser?.() || global.usuarioLogado || null; } catch (_) { return global.usuarioLogado || null; }
  }
  function perfil(u) {
    const p = norm(u?.perfil || u?.role || u?.tipo);
    if (p.includes('MASTER')) return 'MASTER';
    if (p.includes('GESTOR')) return 'GESTOR';
    if (p.includes('ADMIN')) return 'ADMINISTRADOR';
    return p;
  }
  function numeroNte(v) {
    const m = txt(v).match(/(?:NTE\s*[-:]?\s*)?(\d{1,2})/i);
    return m ? Number(m[1]) : null;
  }
  function nteCanonico(v) {
    const n = numeroNte(v);
    return n ? `NTE-${String(n).padStart(2,'0')}` : txt(v);
  }
  function nteUsuario(u) {
    return nteCanonico(u?.nte || u?.nte_nome || u?.nte_vinculado || u?.grupo || (u?.nte_id ? `NTE-${u.nte_id}` : ''));
  }
  function getContext(user) {
    const u = user || usuarioAtual();
    const p = perfil(u);
    if (p === 'MASTER') return Object.freeze({ permitido:true, perfil:p, escopo:'ESTADUAL', nte:null, usuario:u, version:VERSION });
    if (p === 'GESTOR' || p === 'ADMINISTRADOR') {
      const nte = nteUsuario(u);
      return Object.freeze({ permitido:Boolean(nte), perfil:p, escopo:'NTE', nte, usuario:u, motivo:nte?'':'NTE_NAO_IDENTIFICADO', version:VERSION });
    }
    return Object.freeze({ permitido:false, perfil:p || 'NAO_IDENTIFICADO', escopo:'NEGADO', nte:null, usuario:u, motivo:'PERFIL_NAO_AUTORIZADO', version:VERSION });
  }
  NS.context = Object.freeze({ VERSION, getContext, perfil, nteCanonico, numeroNte });
})(window);