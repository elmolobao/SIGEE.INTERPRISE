/* =====================================================================
   SIGEE ENTERPRISE V31 - Hotfix Dashboard GLOBAL
   - Remove a opção duplicada "SEC - TODOS OS NTEs" dos filtros.
   - Mantém apenas "GLOBAL - TODOS OS NTEs" para visão geral.
   - Deduplica opções globais criadas por rotinas antigas.
   - Não altera a conexão Supabase nem a estrutura do banco.
   ===================================================================== */
(function(){
  'use strict';

  const GLOBAL_VALUE = 'GLOBAL';
  const GLOBAL_LABEL = 'GLOBAL - TODOS OS NTEs';

  function normalizar(txt){
    return String(txt || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toUpperCase().trim();
  }

  function isOpcaoGlobalAntiga(opt){
    const t = normalizar((opt && (opt.textContent || opt.innerText || opt.value)) || '');
    return t.includes('SEC - TODOS OS NTE') || t.includes('SEC - TODOS OS NTES') ||
           (t.includes('SEC') && t.includes('TODOS OS NTE'));
  }

  function isOpcaoGlobal(opt){
    const t = normalizar((opt && (opt.textContent || opt.innerText || opt.value)) || '');
    return opt && (opt.value === GLOBAL_VALUE || t.includes('GLOBAL - TODOS OS NTE'));
  }

  function corrigirSelect(select){
    if (!select || select.tagName !== 'SELECT') return;

    let temGlobal = false;
    Array.from(select.options || []).forEach(opt => {
      if (isOpcaoGlobalAntiga(opt)) opt.remove();
    });

    Array.from(select.options || []).forEach(opt => {
      if (isOpcaoGlobal(opt)) {
        if (!temGlobal) {
          opt.value = GLOBAL_VALUE;
          opt.textContent = GLOBAL_LABEL;
          temGlobal = true;
        } else {
          opt.remove();
        }
      }
    });

    const idNome = normalizar(select.id + ' ' + select.name + ' ' + (select.getAttribute('aria-label') || ''));
    const pareceFiltroNte = idNome.includes('NTE') || idNome.includes('DASHBOARD') || idNome.includes('ABRANGENCIA');

    if (pareceFiltroNte && !temGlobal) {
      const opt = document.createElement('option');
      opt.value = GLOBAL_VALUE;
      opt.textContent = GLOBAL_LABEL;
      select.insertBefore(opt, select.firstChild);
    }

    if (select.value && isOpcaoGlobalAntiga({textContent: select.value, value: select.value})) {
      select.value = GLOBAL_VALUE;
    }
  }

  function corrigirDashboard(){
    document.querySelectorAll('select').forEach(corrigirSelect);
  }

  document.addEventListener('DOMContentLoaded', corrigirDashboard);
  window.addEventListener('load', corrigirDashboard);
  document.addEventListener('click', () => setTimeout(corrigirDashboard, 80), true);
  document.addEventListener('change', () => setTimeout(corrigirDashboard, 80), true);
  setInterval(corrigirDashboard, 1200);

  window.SIGEE_V31_GLOBAL_HOTFIX = { corrigirDashboard };
})();
