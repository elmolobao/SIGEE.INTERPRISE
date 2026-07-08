/* =====================================================================
   SIGEE Enterprise 2.0 - Parte 3
   Módulo: Dashboard
   Objetivo: centralizar a renderização do dashboard sem alterar a base.
   Este módulo é aplicado após o carregamento do app legado e preserva
   as rotinas de carregamento V38/V45.
   ===================================================================== */
(function () {
    'use strict';

    function texto(valor) {
        return (valor ?? '').toString().trim();
    }

    function normalizar(valor) {
        return texto(valor)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/\s+/g, ' ');
    }

    function perfilAtual() {
        const p = normalizar(typeof usuarioLogado !== 'undefined' && usuarioLogado ? usuarioLogado.perfil : '');
        if (p === 'TECNICO') return 'TÉCNICO';
        return p;
    }

    function usuarioEhGlobal() {
        const perfil = perfilAtual();
        return perfil === 'SEC' || perfil === 'MASTER';
    }

    function nteUsuarioAtual() {
        if (typeof usuarioLogado === 'undefined' || !usuarioLogado) return '';
        return texto(usuarioLogado.nte || usuarioLogado.nte_nome || usuarioLogado.grupo || '');
    }

    function mesmoNte(item) {
        if (usuarioEhGlobal()) return true;
        const nteUser = normalizar(nteUsuarioAtual());
        const nteItem = normalizar(item?.nte || item?.nte_nome || item?.grupo || item?.NTE || '');
        return !!nteUser && !!nteItem && nteUser === nteItem;
    }

    function nteFiltroDashboard() {
        const select = document.getElementById('filtro-dashboard-nte');
        if (!select || !usuarioEhGlobal()) return nteUsuarioAtual();
        return select.value || 'GLOBAL';
    }

    function filtrarPorAbrangencia(lista) {
        const dados = Array.isArray(lista) ? lista : [];
        const filtro = nteFiltroDashboard();
        if (usuarioEhGlobal()) {
            if (!filtro || filtro === 'GLOBAL') return dados;
            return dados.filter(item => normalizar(item?.nte || item?.nte_nome || item?.grupo || item?.NTE || '') === normalizar(filtro));
        }
        return dados.filter(mesmoNte);
    }

    function setText(id, valor) {
        const el = document.getElementById(id);
        if (el) el.innerText = valor;
    }

    function calcularDias(data) {
        if (!data) return 0;
        let d;
        const s = texto(data);
        if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
            const [dia, mes, ano] = s.split('/');
            d = new Date(Number(ano), Number(mes) - 1, Number(dia));
        } else {
            d = new Date(s);
        }
        if (Number.isNaN(d.getTime())) return 0;
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        d.setHours(0,0,0,0);
        return Math.max(0, Math.floor((hoje - d) / 86400000));
    }

    function atualizarDashboardTecnicoModular(processosVisiveis) {
        const container = document.getElementById('dash-tec-top-escolas');
        const processos = Array.isArray(processosVisiveis) ? processosVisiveis : [];
        const porEscola = {};
        processos.forEach(p => {
            const nome = texto(p.escola || p.escola_nome || p.instituicao || 'NÃO INFORMADO');
            const nte = texto(p.nte || '');
            const chave = `${nome}||${nte}`;
            if (!porEscola[chave]) porEscola[chave] = { nome, nte, qtd: 0 };
            porEscola[chave].qtd++;
        });
        const top = Object.values(porEscola).sort((a,b) => b.qtd - a.qtd).slice(0,5);
        if (container) {
            container.innerHTML = top.length ? top.map((e, i) => `
                <div class="flex items-center justify-between border-b border-gray-100 py-1">
                    <span>${i + 1}. ${e.nome}<br><small class="text-gray-400">${e.nte}</small></span>
                    <b>${e.qtd}</b>
                </div>
            `).join('') : 'Sem dados';
        }

        const finalizados = processos.filter(p => normalizar(p.etapa || p.etapa_atual || p.fase_atual) === 'RETIRADO');
        const mediaEntrega = finalizados.length
            ? Math.round(finalizados.reduce((acc, p) => acc + calcularDias(p.created_at || p.data_inicio || p.data_etapa_atual), 0) / finalizados.length)
            : 0;
        setText('dash-tec-media-entrega', `${mediaEntrega} dia${mediaEntrega === 1 ? '' : 's'}`);

        const diasPeriodo = Math.max(1, new Set(processos.map(p => texto(p.created_at || p.data_inicio || '').slice(0,10)).filter(Boolean)).size);
        setText('dash-tec-media-pedidos-dia', (processos.length / diasPeriodo).toFixed(1));

        const pastas = processos.filter(p => normalizar(p.tipo_arquivo || p.tipo_arquivo_recebido || '').includes('PASTA')).length;
        setText('dash-tec-media-pasta-dia', (pastas / diasPeriodo).toFixed(1));
    }

    function carregarDashboardModular() {
        if (typeof escolasDB === 'undefined' || typeof processosDB === 'undefined' || typeof usuariosDB === 'undefined') return;
        const escolasVisiveis = filtrarPorAbrangencia(escolasDB);
        const processosVisiveis = filtrarPorAbrangencia(processosDB);

        setText('dash-escolas', escolasVisiveis.length);
        setText('dash-acervos', escolasVisiveis.filter(e => normalizar(e.status_acervo || e.acervo).includes('RECOLHIDO')).length);
        setText('dash-estaduais', escolasVisiveis.filter(e => normalizar(e.dependencia_adm || e.dependencia).includes('ESTADUAL')).length);
        setText('dash-municipios', new Set(escolasVisiveis.map(e => normalizar(e.municipio)).filter(Boolean)).size);
        setText('dash-usuarios', Array.isArray(usuariosDB) ? usuariosDB.length : 0);

        const etapas = {
            'dash-proc-desarquivamento': 'DESARQUIVAMENTO',
            'dash-proc-analise': 'ANÁLISE',
            'dash-proc-pendencia': 'PENDÊNCIA',
            'dash-proc-digitacao': 'DIGITAÇÃO',
            'dash-proc-conferencia': 'CONFERÊNCIA',
            'dash-proc-assinatura': 'ASSINATURA',
            'dash-proc-aguardando': 'AGUARDANDO RETIRADA',
            'dash-proc-retirado': 'RETIRADO'
        };
        Object.entries(etapas).forEach(([id, etapa]) => {
            setText(id, processosVisiveis.filter(p => normalizar(p.etapa || p.etapa_atual || p.fase_atual) === etapa).length);
        });
        atualizarDashboardTecnicoModular(processosVisiveis);
    }

    function inicializarFiltroDashboardModular() {
        const box = document.getElementById('box-filtro-dashboard-master');
        const select = document.getElementById('filtro-dashboard-nte');
        if (!box || !select) return;
        box.classList.toggle('hidden', !usuarioEhGlobal());
        if (!usuarioEhGlobal()) return;
        const ntes = new Set(['GLOBAL']);
        if (Array.isArray(typeof LISTA_OFICIAL_27_NTES !== 'undefined' ? LISTA_OFICIAL_27_NTES : [])) {
            LISTA_OFICIAL_27_NTES.forEach(n => ntes.add(n));
        }
        if (Array.isArray(typeof escolasDB !== 'undefined' ? escolasDB : [])) {
            escolasDB.forEach(e => { if (e.nte) ntes.add(e.nte); });
        }
        const valorAtual = select.value || 'GLOBAL';
        select.innerHTML = Array.from(ntes).map(n => `<option value="${n}">${n === 'GLOBAL' ? 'GLOBAL - TODOS OS NTES' : n}</option>`).join('');
        select.value = Array.from(ntes).includes(valorAtual) ? valorAtual : 'GLOBAL';
    }

    function aplicarModuloDashboard() {
        window.carregarDadosDashboardReal = function () {
            inicializarFiltroDashboardModular();
            carregarDashboardModular();
        };
        window.atualizarDashboardTecnicoSIGEE = atualizarDashboardTecnicoModular;
        window.inicializarFiltroDashboardMasterSIGEE = inicializarFiltroDashboardModular;
    }

    window.SIGEE_Dashboard = {
        carregar: carregarDashboardModular,
        inicializarFiltro: inicializarFiltroDashboardModular,
        filtrarPorAbrangencia,
        atualizarTecnico: atualizarDashboardTecnicoModular
    };

    window.addEventListener('load', aplicarModuloDashboard);
})();
