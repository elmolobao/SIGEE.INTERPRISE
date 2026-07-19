/**
 * SIGEE Enterprise RC4.1.3 — Catálogo único de perfis.
 * Nenhum módulo de interface deve manter listas ou normalizadores próprios.
 */
(function (window) {
  'use strict';

  const PERFIS = Object.freeze([
    Object.freeze({ key: 'MASTER', value: 'Master', label: 'Master' }),
    Object.freeze({ key: 'SEC', value: 'SEC', label: 'SEC' }),
    Object.freeze({ key: 'GESTOR', value: 'Gestor', label: 'Gestor' }),
    Object.freeze({ key: 'ADMINISTRADOR', value: 'Administrador', label: 'Administrador' }),
    Object.freeze({ key: 'TECNICO', value: 'Técnico', label: 'Técnico' }),
    Object.freeze({ key: 'ESTAGIARIO', value: 'Estagiário', label: 'Estagiário' }),
    Object.freeze({ key: 'CONSULTA', value: 'Consulta', label: 'Consulta' })
  ]);

  const POR_CHAVE = Object.freeze(PERFIS.reduce(function (acc, item) {
    acc[item.key] = item;
    return acc;
  }, {}));

  function token(value) {
    return String(value == null ? '' : value)
      .trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  }

  function normalizar(value) {
    const t = token(value);
    if (!t) return '';
    if (t === 'SEC' || t.includes('SECRETARIA')) return 'SEC';
    if (t.includes('MASTER')) return 'Master';
    if (t.includes('GESTOR') || t.includes('DIRIGENTE')) return 'Gestor';
    if (t.includes('ADMIN')) return 'Administrador';
    if (t.includes('ESTAG')) return 'Estagiário';
    if (t.includes('CONSULT')) return 'Consulta';
    if (t.includes('TECNIC')) return 'Técnico';
    return '';
  }

  function chave(value) {
    const canonico = normalizar(value);
    const item = PERFIS.find(function (perfil) { return perfil.value === canonico; });
    return item ? item.key : '';
  }

  function listar() {
    return PERFIS.slice();
  }

  function preencherSelect(select, valorAtual, incluirPlaceholder) {
    if (!select) return false;
    const atual = normalizar(valorAtual == null ? select.value : valorAtual);
    const prefixo = incluirPlaceholder ? '<option value="">Selecione o Perfil</option>' : '';
    select.innerHTML = prefixo + PERFIS.map(function (item) {
      return '<option value="' + item.value + '">' + item.label + '</option>';
    }).join('');
    if (atual) select.value = atual;
    return true;
  }

  function garantirSelects(root) {
    const base = root && root.querySelectorAll ? root : document;
    const seletores = [
      '#user-form-perfil', '#usuario-perfil', '#perfil-usuario',
      'select[name="perfil"]', 'select[data-sigee-perfis]'
    ];
    const vistos = new Set();
    seletores.forEach(function (seletor) {
      base.querySelectorAll(seletor).forEach(function (select) {
        if (vistos.has(select)) return;
        vistos.add(select);
        const atual = select.value;
        const placeholder = Array.from(select.options || []).some(function (o) { return !o.value; });
        preencherSelect(select, atual, placeholder);
      });
    });
    return vistos.size;
  }

  window.SIGEE_PERFIS = Object.freeze({
    LISTA: PERFIS,
    POR_CHAVE: POR_CHAVE,
    normalizar: normalizar,
    chave: chave,
    listar: listar,
    preencherSelect: preencherSelect,
    garantirSelects: garantirSelects
  });
})(window);
