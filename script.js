/* ---------- Tipo de Ativo Atual ---------- */
let currentAssetType = 'acoes';

function setAssetType(type) {
    currentAssetType = type;
    document.getElementById('btn-type-acoes').classList.toggle('active', type === 'acoes');
    document.getElementById('btn-type-fii').classList.toggle('active', type === 'fii');
    
    document.getElementById('form-acoes').style.display = type === 'acoes' ? 'block' : 'none';
    document.getElementById('form-fii').style.display = type === 'fii' ? 'block' : 'none';

    document.getElementById('results-acoes').style.display = type === 'acoes' ? 'block' : 'none';
    document.getElementById('results-fii').style.display = type === 'fii' ? 'block' : 'none';

    if (type === 'fii') autoCalcFII(); else autoCalc();
}

/* ---------- Ajuda e Explicações ---------- */
const HELP = {
    // Ações
    lucro_atual: ['Lucro Líquido Atual', 'Patrimônio líquido × ROE normalizado.', 'Estima o lucro anual que a empresa gera hoje, assumindo que o ROE normalizado é o retorno típico sobre o patrimônio.', 'Lucro Atual = Patrimônio Líquido × (ROE Norm. ÷ 100)'],
    lucro_proj: ['Lucro Líquido Projetivo', 'Lucro atual crescido por 1 ano à taxa g.', 'Projeta o lucro do próximo período aplicando o crescimento escolhido (SGR ou CAGR).', 'Lucro Proj. = Lucro Atual × (1 + g ÷ 100)'],
    sgr: ['Crescimento (g) aplicado', 'SGR ou CAGR, conforme a base escolhida.', 'O SGR é a parte do lucro que a empresa retém e reinveste.', 'SGR = ROE Norm. × (1 − Payout ÷ 100)'],
    patrimonio_proj: ['Patrimônio Líquido Projetado', 'Patrimônio atual + lucro projetivo retido.', 'Soma ao patrimônio atual a parte do lucro projetado retida.', 'PL Proj. = PL Atual + Lucro Proj. × (1 − Payout ÷ 100)'],
    lpa_atual: ['LPA Atual', 'Lucro atual dividido pelo número de ações.', 'Lucro por ação.', 'LPA Atual = Lucro Atual ÷ Nº de Papéis'],
    lpa_proj: ['LPA Projetivo', 'Lucro projetivo dividido pelo número de ações.', 'Lucro por ação esperado.', 'LPA Proj. = Lucro Proj. ÷ Nº de Papéis'],
    vpa_atual: ['VPA Atual', 'Patrimônio atual dividido pelo número de ações.', 'Valor patrimonial por ação.', 'VPA Atual = PL Atual ÷ Nº de Papéis'],
    vpa_proj: ['VPA Projetivo', 'Patrimônio projetado dividido pelo número de ações.', 'Valor patrimonial por ação projetado.', 'VPA Proj. = PL Proj. ÷ Nº de Papéis'],
    pl_atual: ['P/L Atual', 'Cotação dividida pelo LPA atual.', 'Quantos anos de lucro atual você paga ao comprar a ação.', 'P/L Atual = Cotação ÷ LPA Atual'],
    dpa_proj: ['DPA Projetivo', 'LPA projetivo vezes o payout.', 'Dividendo por ação esperado.', 'DPA Proj. = LPA Proj. × (Payout ÷ 100)'],
    graham_constante: ['Constante de Graham', 'P/L máximo × P/VP máximo.', 'Padrão 15 × 1,5 = 22,5.', 'K = P/L máx. × P/VP máx.'],
    res_anos: ['Anos de projeção', 'Prazo usado no múltiplo futuro.', 'Quantos anos o LPA cresce.', 'LPA Futuro = LPA × (1 + g)^anos'],
    res_risco: ['Taxa de risco de desconto', 'Retorno mínimo exigido ao ano.', 'Traz o preço futuro a valor presente.', 'Valor Presente = Preço Futuro ÷ (1 + risco)^anos'],
    peg_atual: ['PEG Ratio (P/L atual)', 'P/L atual dividido pelo crescimento g.', 'Compara preço e crescimento.', 'PEG = P/L Atual ÷ g'],
    peg_hist: ['PEG Ratio (P/L médio)', 'P/L médio histórico dividido por g.', 'Usando P/L médio histórico.', 'PEG = P/L Médio Hist. ÷ g'],
    graham_trad_a: ['Graham Tradicional (atual)', 'Raiz de K × LPA × VPA atuais.', 'Preço justo segundo Graham.', 'Preço = √( K × LPA Atual × VPA Atual )'],
    graham_trad_p: ['Graham Tradicional (projetado)', 'Raiz de K × LPA × VPA projetados.', 'Usando LPA e VPA projetados.', 'Preço = √( K × LPA Proj. × VPA Proj. )'],
    graham_mod_a: ['Graham Modificado (LPA atual)', 'LPA × (8,5 + 2g) × 4,4 ÷ Y.', 'Modelo ajustado por crescimento e taxa de juros Y.', 'Preço = LPA Atual × (8,5 + 2 × g) × 4,4 ÷ Y'],
    graham_mod_p: ['Graham Modificado (LPA proj.)', 'Mesma fórmula com o LPA projetivo.', 'Usando o LPA projetado.', 'Preço = LPA Proj. × (8,5 + 2 × g) × 4,4 ÷ Y'],
    justo_a: ['Preço Justo (P/L médio)', 'LPA atual × P/L médio histórico.', 'Preço justo pelo múltiplo médio.', 'Preço Justo = LPA Atual × P/L Médio Hist.'],
    justo_p: ['Preço Justo (P/L médio + LPA proj.)', 'LPA projetivo × P/L médio histórico.', 'Preço justo com LPA projetivo.', 'Preço Justo = LPA Proj. × P/L Médio Hist.'],
    futuro: ['Alvo do Múltiplo Futuro', 'Preço futuro descontado a valor presente.', 'Múltiplo futuro descontado.', 'Alvo = Preço Futuro ÷ (1 + risco)^N'],
    bazin_h: ['Bazin: teto histórico', 'DPA histórico dividido pelo yield desejado.', 'Preço teto para cada yield.', 'Teto = DPA Histórico ÷ (Yield ÷ 100)'],
    bazin_p: ['Bazin: teto projetivo', 'DPA projetivo dividido pelo yield desejado.', 'Usando DPA projetivo.', 'Teto = DPA Projetivo ÷ (Yield ÷ 100)'],
    
    // FII de Tijolo
    fii_pvp_100: ['P/VP Teto (1,00)', 'Valor Patrimonial da cota.', 'Preço teto sem pagar ágio sobre a avaliação laudada dos imóveis.', 'Preço Teto = VPA × 1,00'],
    fii_pvp_105: ['P/VP Teto com Margem (1,05)', 'VPA + 5% de ágio.', 'Preço teto aceitável apenas para FIIs Triple A, de alta qualidade e baixa vacância.', 'Preço Teto = VPA × 1,05'],
    fii_gordon: ['Modelo de Gordon (DDM)', 'Fluxo de Caixa Descontado para FIIs.', 'Calcula o Preço Justo projetando o provento anual (D1) descontado pela taxa K deduzida do crescimento g.', 'Preço Teto = D1 ÷ (K - g)\nOnde D1 = Média Mensal × 12 × (1 + Reajuste/100)'],
    fii_bazin_h: ['Bazin FII: Teto Histórico', 'Rendimento anualizado histórico ÷ Yield desejado.', 'Preço teto baseado no histórico de rendimentos.', 'Teto = Dividendos Históricos Anuais ÷ (Yield ÷ 100)'],
    fii_bazin_p: ['Bazin FII: Teto Projetado (D1)', 'D1 projetado ÷ Yield desejado.', 'Preço teto baseado no rendimento projetado para os próximos 12 meses.', 'Teto = D1 Projetado ÷ (Yield ÷ 100)'],
};

const q = k => `<button type="button" class="q" data-h="${k}" aria-label="Como é calculado">?</button>`;

function addHelp() {
    Object.keys(HELP).forEach(id => {
        const el = document.getElementById(id);
        const lb = el && el.closest('.input-group') && el.closest('.input-group').querySelector('label');
        if (lb) lb.insertAdjacentHTML('beforeend', q(id));
    });
}

const tip = document.getElementById('tip');
document.addEventListener('mouseover', e => showTip(e.target.closest('.q')));
document.addEventListener('focusin', e => showTip(e.target.closest('.q')));
document.addEventListener('mouseout', () => tip.classList.remove('on'));
document.addEventListener('focusout', () => tip.classList.remove('on'));
function showTip(b) {
    if (!b || !HELP[b.dataset.h]) return;
    tip.innerHTML = `${HELP[b.dataset.h][1]}<em>Clique para ver a fórmula</em>`;
    tip.classList.add('on');
    const r = b.getBoundingClientRect(), w = tip.offsetWidth;
    tip.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)) + 'px';
    const top = r.bottom + 8 + tip.offsetHeight > innerHeight ? r.top - tip.offsetHeight - 8 : r.bottom + 8;
    tip.style.top = top + 'px';
}
document.addEventListener('click', e => {
    const b = e.target.closest('.q');
    if (b && HELP[b.dataset.h]) {
        e.preventDefault();
        const [t, , l, f] = HELP[b.dataset.h];
        document.getElementById('mbody').innerHTML = `<h3>${t}</h3><p>${l}</p><div class="lbl">Fórmula usada</div><div class="formula">${f}</div>`;
        tip.classList.remove('on');
        document.getElementById('modal').showModal();
    }
});
document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') e.target.close(); });

/* ---------- Utilitários de Formatação ---------- */
const N = v => parseFloat(v) || 0;
const NUM_IDS = ['n_papeis', 'cotacao', 'patrimonio_atual', 'dpa_hist', 'lucro_atual', 'lucro_proj', 'patrimonio_proj', 'lpa_atual', 'lpa_proj', 'vpa_atual', 'vpa_proj', 'dpa_proj', 'fii_cotacao', 'fii_patrimonio', 'fii_n_cotas', 'fii_vpa', 'fii_div_mensal', 'fii_div_hist_anual', 'fii_d1_proj'];
const INT_IDS = ['n_papeis', 'fii_n_cotas'];
const UNITS = { mil: 1e3, k: 1e3, m: 1e6, mm: 1e6, mi: 1e6, milhao: 1e6, milhoes: 1e6, b: 1e9, bi: 1e9, bilhao: 1e9, bilhoes: 1e9, t: 1e12, tri: 1e12, trilhao: 1e12, trilhoes: 1e12 };
const BIG_IDS = ['n_papeis', 'patrimonio_atual', 'lucro_atual', 'lucro_proj', 'fii_patrimonio', 'fii_n_cotas'];

const parseBR = s => {
    s = String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
    const m = s.match(/^(-?[\d.,]+)([a-z]+)?$/);
    if (!m) return '';
    let num = m[1], mult = 1;
    if (m[2]) { mult = UNITS[m[2]]; if (!mult) return ''; }
    if (m[2] && !num.includes(',') && /^-?\d+\.\d{1,2}$/.test(num)) num = num.replace('.', ',');
    const v = parseFloat(num.replace(/\./g, '').replace(',', '.')) * mult;
    return isNaN(v) ? '' : String(Math.round(v * 100) / 100);
};

const fmtField = (id, v) => {
    v = parseFloat(v);
    if (isNaN(v)) return '';
    const d = INT_IDS.includes(id) ? 0 : 2;
    return v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
};

function liveFmt(el) {
    if (/[a-zA-Z]/.test(el.value)) return;
    const neg = el.value.trim().startsWith('-');
    const keep = el.value.slice(0, el.selectionStart).replace(/[^\d,]/g, '').length;
    const raw = el.value.replace(/[^\d,]/g, '');
    const i = raw.indexOf(',');
    const allowDec = !INT_IDS.includes(el.id);
    let int = (i < 0 ? raw : raw.slice(0, i)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    let out = int;
    if (i >= 0 && allowDec) out += ',' + raw.slice(i + 1).replace(/,/g, '').slice(0, 2);
    out = (neg ? '-' : '') + out;
    el.value = out;
    let seen = 0, pos = neg ? 1 : 0;
    while (pos < out.length && seen < keep) { if (/[\d,]/.test(out[pos])) seen++; pos++; }
    el.setSelectionRange(pos, pos);
}

function initNumFields() {
    NUM_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.type = 'text'; el.inputMode = 'decimal'; el.removeAttribute('step'); el.classList.add('num');
        if (BIG_IDS.includes(id)) el.placeholder = 'ex.: 1.200.000.000 ou 1,2 bi';
        el.addEventListener('keydown', e => { if (e.key === 'Enter') el.blur(); });
        el.addEventListener('input', () => liveFmt(el));
        el.addEventListener('blur', () => { const p = parseBR(el.value); el.value = p === '' ? '' : fmtField(id, p); });
    });
}

const brl = v => v > 0 ? 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 3200);
}
function switchTab(id, scroll = false) {
    // Ao abrir a aba de resultados, sempre recalcula com os dados atuais do formulário
    if (id === 'results') { if (currentAssetType === 'fii') calcularTudoFII(); else calcularTudo(); }
    document.querySelectorAll('.tab-content').forEach(el => el.classList.toggle('active', el.id === id));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    if (scroll) requestAnimationFrame(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.querySelector('.tabs').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
}

/* Botão "Ver resultados": calcula, abre a aba de resultados e rola até ela */
function verResultados(btn) {
    switchTab('results', true);
    flash(btn);
}

/* ---------- Feedback visual dos botões ---------- */
function flash(btn, ms = 1400) {
    if (!btn) return;
    btn.classList.add('is-done');
    clearTimeout(btn._f); btn._f = setTimeout(() => btn.classList.remove('is-done'), ms);
}
async function withBusy(btn, fn) {
    if (btn) { if (btn.classList.contains('is-busy')) return; btn.classList.add('is-busy'); }
    await new Promise(r => setTimeout(r, 80)); // deixa o navegador desenhar o "carregando"
    let ok = true;
    try { ok = (await fn()) !== false; } catch (err) { console.error(err); toast('Não foi possível gerar o arquivo.'); ok = false; }
    if (btn) { btn.classList.remove('is-busy'); if (ok) flash(btn); }
}
document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn, .btn-asset, .tab-btn, .row-btn');
    if (!b || b.disabled) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
    const sp = document.createElement('span');
    sp.className = 'ripple';
    sp.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(sp);
    setTimeout(() => sp.remove(), 650);
});
document.addEventListener('keydown', e => {   // o "label" de importar também responde a Enter/Espaço
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('label.btn')) { e.preventDefault(); e.target.click(); }
});

/* ---------- Leitura do Formulário ---------- */
function readForm() {
    const r = { assetType: currentAssetType };
    const containerId = currentAssetType === 'fii' ? '#form-fii' : '#form-acoes';
    document.querySelectorAll(`${containerId} input, ${containerId} select, #results input`).forEach(i => {
        if (i.id) r[i.id] = NUM_IDS.includes(i.id) ? parseBR(i.value) : i.value;
    });
    return r;
}

function fillForm(inputs) {
    if (inputs.assetType) setAssetType(inputs.assetType);
    Object.keys(inputs).forEach(k => {
        const el = document.getElementById(k);
        if (el) el.value = NUM_IDS.includes(k) ? fmtField(k, inputs[k]) : inputs[k];
    });
}

/* ---------- Payback Ações ---------- */
function paybackGrowth(pl, g) {
    const gr = g / 100;
    if (Math.abs(gr) < 1e-9) return pl;
    const x = 1 + gr * pl;
    return (x <= 0 || gr <= -1) ? null : Math.log(x) / Math.log(1 + gr);
}
function requiredGrowth(pl, n) {
    const S = g => Math.abs(g) < 1e-9 ? n : (Math.pow(1 + g, n) - 1) / g;
    let lo = -0.99, hi = 10;
    if (pl < S(lo) || pl > S(hi)) return null;
    for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (S(m) < pl) lo = m; else hi = m; }
    return (lo + hi) / 2 * 100;
}

/* ---------- Cálculo Ações ---------- */
function compute(r) {
    const cot = N(r.cotacao), n = N(r.n_papeis), pat = N(r.patrimonio_atual), roe = N(r.roe_norm);
    const pay = N(r.payout), cagr = N(r.cagr), y = N(r.taxa_y), plHist = N(r.pl_hist), dpaHist = N(r.dpa_hist);
    const K = N(r.graham_pl) * N(r.graham_pvp);
    const sgr = (roe > 0 && pay >= 0) ? roe * (1 - pay / 100) : 0;
    const g = r.growth_type === 'cagr' ? cagr : sgr;

    const lucA = (pat > 0 && roe > 0) ? pat * roe / 100 : N(r.lucro_atual);
    const lucP = (lucA > 0 && g !== 0) ? lucA * (1 + g / 100) : N(r.lucro_proj);
    const patP = (pat > 0 && lucP > 0) ? pat + lucP * (1 - pay / 100) : N(r.patrimonio_proj);
    const lpaA = (n > 0 && lucA > 0) ? lucA / n : N(r.lpa_atual);
    const lpaP = (n > 0 && lucP > 0) ? lucP / n : N(r.lpa_proj);
    const vpaA = (n > 0 && pat > 0) ? pat / n : N(r.vpa_atual);
    const vpaP = (n > 0 && patP > 0) ? patP / n : N(r.vpa_proj);
    const plA = (cot > 0 && lpaA > 0) ? cot / lpaA : N(r.pl_atual);
    const dpaP = (lpaP > 0 && pay > 0) ? lpaP * pay / 100 : N(r.dpa_proj);

    const peg = pl => (g > 0 && pl > 0) ? pl / g : null;
    const gt = (l, v) => (l > 0 && v > 0) ? Math.sqrt(K * l * v) : 0;
    const gm = l => (l <= 0 || y <= 0) ? 0 : (l * (8.5 + 2 * g) * 4.4) / y;

    const anos = N(r.res_anos) || 5;
    const risco = (r.res_risco !== undefined && r.res_risco !== '') ? N(r.res_risco) : y;
    const futBruto = lpaA * Math.pow(1 + g / 100, anos) * plHist;
    const levels = [15, 12, 10, 8, 6];

    const vm = cot * n;
    const plV = (vm > 0 && lucA > 0) ? vm / lucA : null;
    const ey = plV === null ? null : lucA / vm * 100;
    const alvo = N(r.res_payback_alvo) || 10;

    return {
        assetType: 'acoes',
        vm, plV, ey, alvo, dy: ey === null ? null : ey * pay / 100,
        pbCru: ey === null ? null : 100 / ey,
        pbG: plV === null ? null : paybackGrowth(plV, g),
        gReq: plV === null ? null : requiredGrowth(plV, alvo),
        ticker: r.ticker || 'Ação', cot, n, pat, roe, pay, cagr, gType: r.growth_type === 'cagr' ? 'CAGR' : 'SGR',
        dpaHist, plHist, y, g, K, anos, risco,
        derived: { lucro_atual: lucA, lucro_proj: lucP, sgr: g, patrimonio_proj: patP, lpa_atual: lpaA, lpa_proj: lpaP, vpa_atual: vpaA, vpa_proj: vpaP, pl_atual: plA, dpa_proj: dpaP, graham_constante: K },
        lucA, lucP, lpaA, lpaP, vpaA, vpaP,
        pegA: peg(plA), pegH: peg(plHist),
        gtA: gt(lpaA, vpaA), gtP: gt(lpaP, vpaP), gmA: gm(lpaA), gmP: gm(lpaP),
        jA: lpaA * plHist, jP: lpaP * plHist,
        futBruto, futVP: futBruto / Math.pow(1 + risco / 100, anos),
        bazH: levels.map(dy => dpaHist > 0 ? dpaHist / (dy / 100) : 0),
        bazP: levels.map(dy => dpaP > 0 ? dpaP / (dy / 100) : 0),
        levels
    };
}

/* ---------- Cálculo FII de Tijolo ---------- */
function computeFII(r) {
    const ticker = r.fii_ticker || 'FII';
    const cot = N(r.fii_cotacao);
    const pat = N(r.fii_patrimonio);
    const nCotas = N(r.fii_n_cotas);
    
    // VPA Calculado automaticamente a partir do PL e nº de cotas
    const vpa = (pat > 0 && nCotas > 0) ? pat / nCotas : N(r.fii_vpa);

    const divMensal = N(r.fii_div_mensal);
    const divHistAnual = N(r.fii_div_hist_anual) || (divMensal * 12);
    const reajustePct = N(r.fii_reajuste_pct);
    const taxaK = N(r.fii_taxa_k);
    const taxaG = N(r.fii_taxa_g);

    const baseAnual = divMensal * 12;
    const d1Proj = baseAnual > 0 ? baseAnual * (1 + reajustePct / 100) : N(r.fii_d1_proj);

    const pvpAtual = (cot > 0 && vpa > 0) ? cot / vpa : null;
    const tetoPvp100 = vpa * 1.00;
    const tetoPvp105 = vpa * 1.05;

    let gordonVal = 0;
    const kDec = taxaK / 100, gDec = taxaG / 100;
    if (kDec > gDec && d1Proj > 0) {
        gordonVal = d1Proj / (kDec - gDec);
    }

    const levels = [15, 12, 10, 8, 6];
    const bazH = levels.map(dy => divHistAnual > 0 ? divHistAnual / (dy / 100) : 0);
    const bazP = levels.map(dy => d1Proj > 0 ? d1Proj / (dy / 100) : 0);

    return {
        assetType: 'fii',
        ticker, cot, vpa, pat, nCotas, divMensal, divHistAnual, reajustePct, taxaK, taxaG, d1Proj, pvpAtual,
        tetoPvp100, tetoPvp105, gordonVal, bazH, bazP, levels,
        derived: { fii_vpa: vpa, fii_d1_proj: d1Proj }
    };
}

let vData = null, portfolio = [];

function autoCalc() {
    if (currentAssetType === 'fii') return autoCalcFII();
    const rk = document.getElementById('res_risco');
    if (rk.value === '') rk.value = document.getElementById('taxa_y').value;
    const c = compute(readForm());
    Object.keys(c.derived).forEach(id => {
        const el = document.getElementById(id), v = c.derived[id];
        if (el && document.activeElement !== el) el.value = v ? (NUM_IDS.includes(id) ? fmtField(id, v) : v.toFixed(2)) : '';
    });
    return c;
}

function autoCalcFII() {
    const c = computeFII(readForm());
    Object.keys(c.derived).forEach(id => {
        const el = document.getElementById(id), v = c.derived[id];
        if (el && document.activeElement !== el) el.value = v ? fmtField(id, v) : '';
    });
    return c;
}

function calcularTudo() {
    if (currentAssetType === 'fii') return calcularTudoFII();
    vData = autoCalc();
    document.getElementById('res_ticker').textContent = vData.ticker;
    document.getElementById('res_cotacao').textContent = vData.cot > 0 ? brl(vData.cot) : 'N/A';
    renderCards();
    renderPayback();
    renderPyramids();
}

function calcularTudoFII() {
    vData = autoCalcFII();
    document.getElementById('fii_res_ticker').textContent = vData.ticker;
    document.getElementById('fii_res_cotacao').textContent = vData.cot > 0 ? brl(vData.cot) : 'N/A';
    document.getElementById('fii_res_vpa').textContent = vData.vpa > 0 ? brl(vData.vpa) : 'N/A';
    document.getElementById('fii_res_pvp').textContent = vData.pvpAtual !== null ? vData.pvpAtual.toFixed(2) : 'N/A';

    renderFIICards();
    renderFIIPyramids();
}

/* ---------- Renderização ---------- */
function pegBadge(v) {
    if (v === null) return ['Indisponível', 'gray'];
    if (v < 1) return ['Barato', 'green'];
    if (v <= 2) return ['Razoável', 'yellow'];
    if (v <= 3) return ['Caro', 'orange'];
    return ['Muito caro', 'red'];
}
function margin(val, cot) {
    if (!(val > 0 && cot > 0)) return '';
    const m = (val / cot - 1) * 100;
    return `<span class="chip ${m >= 0 ? 'up' : 'down'}">${m >= 0 ? '+' : ''}${m.toFixed(1)}% vs cotação</span>`;
}
function card(key, title, val, sub, color) {
    return `<div class="result-card" style="--c:${color}"><h4>${title}${q(key)}</h4><div class="value">${brl(val)}</div>${margin(val, vData.cot)}<span class="sub">${sub}</span></div>`;
}
function pegCard(key, title, v) {
    const [t, cls] = pegBadge(v);
    return `<div class="result-card" style="--c:#5b6b7a"><h4>${title}${q(key)}</h4><div class="value">${v === null ? 'N/A' : v.toFixed(2)}</div><span class="badge ${cls}">${t}</span></div>`;
}

function renderCards() {
    const d = vData, gi = `g=${d.g.toFixed(2)}% | Y=${d.y}%`;
    document.getElementById('results_container').innerHTML =
        pegCard('peg_atual', 'PEG Ratio (P/L atual)', d.pegA) + pegCard('peg_hist', 'PEG Ratio (P/L médio)', d.pegH) +
        card('graham_trad_a', 'Graham Tradicional (atual)', d.gtA, `LPA/VPA atuais | K=${d.K.toFixed(2)}`, '#0b7a64') +
        card('graham_trad_p', 'Graham Tradicional (projetado)', d.gtP, 'LPA/VPA projetados', '#0b7a64') +
        card('graham_mod_a', 'Graham Modificado (LPA atual)', d.gmA, gi, '#1d6fa5') +
        card('graham_mod_p', 'Graham Modificado (LPA proj.)', d.gmP, gi, '#1d6fa5') +
        card('justo_a', 'Preço Justo (P/L médio)', d.jA, 'Usando LPA atual', '#b8872b') +
        card('justo_p', 'Preço Justo (P/L médio + LPA proj.)', d.jP, 'Usando LPA projetivo', '#b8872b') +
        `<div class="result-card wide" style="--c:#c2410c"><div><h4>Alvo do múltiplo futuro (${d.anos} anos) a valor presente${q('futuro')}</h4><div class="value">${brl(d.futVP)}</div>${margin(d.futVP, d.cot)}<span class="sub">Descontado à taxa de risco de ${d.risco.toFixed(2)}%</span></div><div class="side"><h4>Preço bruto no futuro</h4><div class="value" style="font-size:1.4rem">${brl(d.futBruto)}</div></div></div>`;
}

function renderFIICards() {
    const d = vData;
    document.getElementById('fii_results_container').innerHTML =
        card('fii_pvp_100', 'P/VP Teto (1,00) - Sem Ágio', d.tetoPvp100, `VPA = ${brl(d.vpa)} (Critério laudado de avaliação física)`, '#0b7a64') +
        card('fii_pvp_105', 'P/VP Teto com Margem (1,05)', d.tetoPvp105, `Até 5% de ágio aceitável apenas para FIIs Triple A`, '#1d6fa5') +
        card('fii_gordon', 'Modelo de Gordon / DDM', d.gordonVal, `Provento D1 = ${brl(d.d1Proj)} | K=${d.taxaK}% | g=${d.taxaG}%`, '#c2410c') +
        card('fii_bazin_p', 'Bazin Projetado 6%', d.bazP[4], `Preço Teto p/ receber ao menos 6% a.a. sobre D1`, '#b8872b');
}

function renderPayback() {
    const d = vData;
    const f = (v, u, dec = 2) => v === null ? 'N/A' : v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + u;
    const t = (k, label, val, sub = '', cls = '') => `<div class="pb-tile ${cls}"><h4>${label}${q(k)}</h4><div class="value">${val}</div>${sub}</div>`;
    const vs = d.gReq === null ? '' : `<span class="chip ${d.g >= d.gReq ? 'up' : 'down'}">${d.g >= d.gReq ? 'g aplicado já supera' : 'exige mais que o g aplicado'} (${f(d.g, '%')})</span>`;
    document.getElementById('pb_grid').innerHTML =
        t('vm', 'Valor de mercado', brl(d.vm), '<span class="sub">Cotação × nº de papéis</span>') +
        t('pb_lucro', 'Lucro líquido atual', brl(d.lucA)) +
        t('pb_pl', 'P/L atual', f(d.plV, ' anos')) +
        t('ey', 'Earning yield', f(d.ey, '%')) +
        t('dy', 'Dividend yield', f(d.dy, '%'), `<span class="sub">Com payout médio de ${f(d.pay, '%')}</span>`) +
        t('pb_cru', 'Payback cru', f(d.pbCru, ' anos'), '<span class="sub">100 ÷ earning yield</span>') +
        t('pb_cresc', 'Payback por crescimento', f(d.pbG, ' anos'), `<span class="sub">Com g = ${f(d.g, '%')} ao ano</span>`) +
        t('pb_req', `Cresc. esperado (payback de ${f(d.alvo, '', 0)} anos)`, f(d.gReq, '% ao ano'), vs, 'key');
}

function renderPyramids() {
    const lv = (arr) => arr.map((v, i) => `<div class="pyramid-level pyr-${vData.levels[i]}">${brl(v)}<span>Yield ${vData.levels[i]}%</span></div>`).join('');
    document.getElementById('pyramid_hist').innerHTML = lv(vData.bazH);
    document.getElementById('pyramid_proj').innerHTML = lv(vData.bazP);
}

function renderFIIPyramids() {
    const lv = (arr) => arr.map((v, i) => `<div class="pyramid-level pyr-${vData.levels[i]}">${brl(v)}<span>Yield ${vData.levels[i]}%</span></div>`).join('');
    document.getElementById('fii_pyramid_hist').innerHTML = lv(vData.bazH);
    document.getElementById('fii_pyramid_proj').innerHTML = lv(vData.bazP);
}

/* ---------- Carteira ---------- */
function upsert(inputs) {
    const isFII = inputs.assetType === 'fii';
    const c = isFII ? computeFII(inputs) : compute(inputs);
    const i = portfolio.findIndex(p => p.c.ticker === c.ticker);
    const item = { inputs, c };
    if (i >= 0) portfolio[i] = item; else portfolio.push(item);
}

function saveCurrent(btn) {
    const r = readForm();
    if (!r.ticker) return toast('Informe o ticker antes de salvar.');
    upsert(r); renderPortfolio(); flash(btn); toast(`${r.ticker} salva na carteira.`);
}

function saveCurrentFII(btn) {
    const r = readForm();
    if (!r.fii_ticker) return toast('Informe o ticker antes de salvar.');
    upsert(r); renderPortfolio(); flash(btn); toast(`${r.fii_ticker} salvo na carteira.`);
}

function loadStock(i) { fillForm(portfolio[i].inputs); if (portfolio[i].inputs.assetType === 'fii') calcularTudoFII(); else calcularTudo(); switchTab('results', true); }
function removeStock(i) { portfolio.splice(i, 1); renderPortfolio(); }
function clearPortfolio() { if (portfolio.length && confirm('Remover todos os ativos da carteira?')) { portfolio = []; renderPortfolio(); } }

function renderPortfolio() {
    document.getElementById('port_count').textContent = portfolio.length;
    const body = document.getElementById('port_body');
    if (!portfolio.length) { body.innerHTML = '<div class="empty">Importe um ou mais arquivos JSON, ou use "Salvar na carteira" nos resultados.</div>'; return; }
    const cell = (v, cot) => `<td class="${v > 0 && cot > 0 ? (v >= cot ? 'ok' : 'no') : ''}">${brl(v)}</td>`;
    
    body.innerHTML = `<table><thead><tr><th>Tipo</th><th>Ticker</th><th>Cotação</th><th>Teto Bazin (6%)</th><th>Graham / Gordon</th><th>P/VP 1.05 / Futuro</th><th></th></tr></thead><tbody>` +
        portfolio.map(({ c, inputs }, i) => {
            const isFII = inputs.assetType === 'fii';
            const baz6 = isFII ? c.bazP[4] : c.bazP[4];
            const mainVal = isFII ? c.gordonVal : c.gtA;
            const subVal = isFII ? c.tetoPvp105 : c.futVP;
            return `<tr><td><span class="badge ${isFII ? 'yellow' : 'gray'}">${isFII ? 'FII' : 'Ação'}</span></td><td class="tk">${c.ticker}</td><td>${brl(c.cot)}</td>${cell(baz6, c.cot)}${cell(mainVal, c.cot)}${cell(subVal, c.cot)}<td><button class="row-btn" onclick="loadStock(${i})">Abrir</button><button class="row-btn del" onclick="removeStock(${i})">Remover</button></td></tr>`;
        }).join('') + '</tbody></table>';
}

/* ---------- Exportação e Importação JSON ---------- */
function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportJSON(btn) {
    const inputs = readForm();
    const ticker = inputs.ticker || inputs.fii_ticker || 'dados';
    download(new Blob([JSON.stringify({ inputs, results: vData })], { type: 'application/json' }), `Valuation_${ticker}.json`);
    flash(btn);
}
function exportPortfolioJSON(btn) {
    if (!portfolio.length) return toast('A carteira está vazia.');
    download(new Blob([JSON.stringify({ stocks: portfolio.map(p => ({ inputs: p.inputs })) })], { type: 'application/json' }), 'Valuation_Carteira.json');
    flash(btn);
}
async function importJSON(event) {
    const files = [...event.target.files];
    if (!files.length) return;
    let count = 0, last = null;
    for (const f of files) {
        try {
            const d = JSON.parse(await f.text());
            const items = Array.isArray(d) ? d : (d.stocks || [d]);
            items.forEach(it => { if (it && it.inputs) { upsert(it.inputs); last = it.inputs; count++; } });
        } catch (err) { toast(`Erro ao ler ${f.name}.`); }
    }
    event.target.value = '';
    if (!count) return;
    renderPortfolio();
    fillForm(last); 
    if (last.assetType === 'fii') calcularTudoFII(); else calcularTudo();
    switchTab(count > 1 ? 'portfolio' : 'results', true);
    toast(`${count} ${count > 1 ? 'ativos importados' : 'ativo importado'}.`);
}

/* ---------- Excel (ExcelJS) ----------
   Gera .xlsx padrão (sem macros, tabelas dinâmicas ou formatação condicional),
   que abre igual no Excel, LibreOffice e OnlyOffice.
   Colunas A (ativo) e B (cotação atual) e as 2 linhas de cabeçalho ficam congeladas. */
const XL = { ink: 'FF14211C', line: 'FFD9DFD6', frozen: 'FFEEF1EC', okBg: 'FFE3F4EA', okFg: 'FF0B5D4B', noBg: 'FFFCEBE9', noFg: 'FF9B2C20' };
const GC = {   // cor de cada grupo de colunas
    'Ativo': 'FF14211C', 'Dados básicos': 'FF0B7A64', 'Dados do FII': 'FF0B7A64', 'Métricas calculadas': 'FF6D5BD0',
    'Projeção e Gordon': 'FF6D5BD0', 'PEG Ratio': 'FF5B6B7A', 'Preços-alvo': 'FF1D6FA5', 'Payback': 'FFB8872B',
    'Bazin histórico': 'FF0B5D4B', 'Bazin projetivo': 'FF3F9B7F'
};
const FMT = { brl: '"R$" #,##0.00', num: '#,##0.00', int: '#,##0', pct: '0.00%', yrs: '0.00" anos"', x: '0.00' };
const pos = v => (typeof v === 'number' && isFinite(v) && v > 0) ? v : null;
const fin = v => (typeof v === 'number' && isFinite(v)) ? v : null;
const pc = v => fin(v) === null ? null : v / 100;
const bazCols = (g, key) => [15, 12, 10, 8, 6].map((y, i) => ({ g, h: `Teto Yield ${y}%`, w: 15, f: FMT.brl, teto: true, v: c => pos(c[key][i]) }));

const STOCK_COLS = [
    { g: 'Ativo', h: 'Ticker', w: 14, v: c => c.ticker },
    { g: 'Ativo', h: 'Cotação atual', w: 16, f: FMT.brl, v: c => pos(c.cot) },

    { g: 'Dados básicos', h: 'Valor de mercado', w: 20, f: FMT.brl, v: c => pos(c.vm) },
    { g: 'Dados básicos', h: 'Nº de papéis', w: 16, f: FMT.int, v: c => pos(c.n) },
    { g: 'Dados básicos', h: 'Patrimônio líquido', w: 20, f: FMT.brl, v: c => pos(c.pat) },
    { g: 'Dados básicos', h: 'ROE normalizado', w: 14, f: FMT.pct, v: c => pc(c.roe) },
    { g: 'Dados básicos', h: 'Payout médio', w: 13, f: FMT.pct, v: c => pc(c.pay) },
    { g: 'Dados básicos', h: 'CAGR 5 anos', w: 13, f: FMT.pct, v: c => pc(c.cagr) },
    { g: 'Dados básicos', h: 'Base de crescimento', w: 14, v: c => c.gType },
    { g: 'Dados básicos', h: 'Crescimento (g) aplicado', w: 15, f: FMT.pct, v: c => pc(c.g) },
    { g: 'Dados básicos', h: 'Taxa de juros Y', w: 13, f: FMT.pct, v: c => pc(c.y) },
    { g: 'Dados básicos', h: 'P/L médio histórico', w: 14, f: FMT.x, v: c => pos(c.plHist) },
    { g: 'Dados básicos', h: 'DPA histórico médio', w: 15, f: FMT.brl, v: c => pos(c.dpaHist) },
    { g: 'Dados básicos', h: 'Anos de projeção', w: 13, f: FMT.int, v: c => pos(c.anos) },
    { g: 'Dados básicos', h: 'Taxa de risco de desconto', w: 15, f: FMT.pct, v: c => pc(c.risco) },

    { g: 'Métricas calculadas', h: 'Lucro líquido atual', w: 20, f: FMT.brl, v: c => pos(c.lucA) },
    { g: 'Métricas calculadas', h: 'Lucro líquido projetivo', w: 20, f: FMT.brl, v: c => pos(c.lucP) },
    { g: 'Métricas calculadas', h: 'LPA atual', w: 13, f: FMT.brl, v: c => pos(c.lpaA) },
    { g: 'Métricas calculadas', h: 'LPA projetivo', w: 13, f: FMT.brl, v: c => pos(c.lpaP) },
    { g: 'Métricas calculadas', h: 'VPA atual', w: 13, f: FMT.brl, v: c => pos(c.vpaA) },
    { g: 'Métricas calculadas', h: 'VPA projetivo', w: 13, f: FMT.brl, v: c => pos(c.vpaP) },
    { g: 'Métricas calculadas', h: 'P/L atual', w: 12, f: FMT.x, v: c => pos(c.derived.pl_atual) },
    { g: 'Métricas calculadas', h: 'DPA projetivo', w: 14, f: FMT.brl, v: c => pos(c.derived.dpa_proj) },

    { g: 'PEG Ratio', h: 'PEG (P/L atual)', w: 13, f: FMT.x, v: c => fin(c.pegA) },
    { g: 'PEG Ratio', h: 'PEG (P/L médio)', w: 13, f: FMT.x, v: c => fin(c.pegH) },

    { g: 'Preços-alvo', h: 'Graham tradicional (atual)', w: 16, f: FMT.brl, teto: true, v: c => pos(c.gtA) },
    { g: 'Preços-alvo', h: 'Graham tradicional (projetado)', w: 16, f: FMT.brl, teto: true, v: c => pos(c.gtP) },
    { g: 'Preços-alvo', h: 'Graham modificado (LPA atual)', w: 16, f: FMT.brl, teto: true, v: c => pos(c.gmA) },
    { g: 'Preços-alvo', h: 'Graham modificado (LPA proj.)', w: 16, f: FMT.brl, teto: true, v: c => pos(c.gmP) },
    { g: 'Preços-alvo', h: 'Preço justo (P/L médio)', w: 16, f: FMT.brl, teto: true, v: c => pos(c.jA) },
    { g: 'Preços-alvo', h: 'Preço justo (LPA proj.)', w: 16, f: FMT.brl, teto: true, v: c => pos(c.jP) },
    { g: 'Preços-alvo', h: 'Alvo múltiplo futuro (valor presente)', w: 18, f: FMT.brl, teto: true, v: c => pos(c.futVP) },

    { g: 'Payback', h: 'Earning yield', w: 13, f: FMT.pct, v: c => pc(c.ey) },
    { g: 'Payback', h: 'Dividend yield', w: 13, f: FMT.pct, v: c => pc(c.dy) },
    { g: 'Payback', h: 'Payback cru', w: 14, f: FMT.yrs, v: c => fin(c.pbCru) },
    { g: 'Payback', h: 'Payback por crescimento', w: 15, f: FMT.yrs, v: c => fin(c.pbG) },
    { g: 'Payback', h: 'Payback alvo (anos)', w: 13, f: FMT.num, v: c => fin(c.alvo) },
    { g: 'Payback', h: 'Cresc. esperado p/ payback alvo', w: 16, f: FMT.pct, v: c => pc(c.gReq) },

    ...bazCols('Bazin histórico', 'bazH'),
    ...bazCols('Bazin projetivo', 'bazP')
];

const FII_COLS = [
    { g: 'Ativo', h: 'Ticker', w: 14, v: c => c.ticker },
    { g: 'Ativo', h: 'Cotação atual', w: 16, f: FMT.brl, v: c => pos(c.cot) },

    { g: 'Dados do FII', h: 'VPA', w: 14, f: FMT.brl, v: c => pos(c.vpa) },
    { g: 'Dados do FII', h: 'P/VP atual', w: 12, f: FMT.x, v: c => fin(c.pvpAtual) },
    { g: 'Dados do FII', h: 'Patrimônio líquido', w: 20, f: FMT.brl, v: c => pos(c.pat) },
    { g: 'Dados do FII', h: 'Nº de cotas', w: 16, f: FMT.int, v: c => pos(c.nCotas) },
    { g: 'Dados do FII', h: 'Dividendo mensal médio', w: 16, f: FMT.brl, v: c => pos(c.divMensal) },
    { g: 'Dados do FII', h: 'Rendimento anual histórico', w: 16, f: FMT.brl, v: c => pos(c.divHistAnual) },

    { g: 'Projeção e Gordon', h: 'Reajuste dos contratos', w: 14, f: FMT.pct, v: c => pc(c.reajustePct) },
    { g: 'Projeção e Gordon', h: 'Provento projetado D1', w: 16, f: FMT.brl, v: c => pos(c.d1Proj) },
    { g: 'Projeção e Gordon', h: 'Retorno exigido K', w: 13, f: FMT.pct, v: c => pc(c.taxaK) },
    { g: 'Projeção e Gordon', h: 'Crescimento perpétuo g', w: 14, f: FMT.pct, v: c => pc(c.taxaG) },

    { g: 'Preços-alvo', h: 'Teto P/VP 1,00', w: 15, f: FMT.brl, teto: true, v: c => pos(c.tetoPvp100) },
    { g: 'Preços-alvo', h: 'Teto P/VP 1,05', w: 15, f: FMT.brl, teto: true, v: c => pos(c.tetoPvp105) },
    { g: 'Preços-alvo', h: 'Gordon (DDM)', w: 15, f: FMT.brl, teto: true, v: c => pos(c.gordonVal) },

    ...bazCols('Bazin histórico', 'bazH'),
    ...bazCols('Bazin projetivo', 'bazP')
];

function buildSheet(wb, name, cols, items, tab) {
    const ws = wb.addWorksheet(name, {
        properties: { tabColor: { argb: tab } },
        // Congela as colunas A (ativo) e B (cotação) e as 2 linhas de cabeçalho
        views: [{ state: 'frozen', xSplit: 2, ySplit: 2, topLeftCell: 'C3', activeCell: 'C3' }]
    });
    cols.forEach((c, i) => { ws.getColumn(i + 1).width = c.w || 16; });
    const thin = { style: 'thin', color: { argb: XL.line } };
    const border = { top: thin, left: thin, bottom: thin, right: thin };

    const gRow = ws.addRow(cols.map((c, i) => (i === 0 || cols[i - 1].g !== c.g) ? c.g : null));
    const hRow = ws.addRow(cols.map(c => c.h));
    gRow.height = 22; hRow.height = 40;

    let start = 1;                       // mescla o título de cada grupo de colunas
    for (let i = 1; i <= cols.length; i++) {
        if (i === cols.length || cols[i].g !== cols[start - 1].g) {
            if (i > start) ws.mergeCells(1, start, 1, i);
            start = i + 1;
        }
    }
    cols.forEach((c, i) => {
        const argb = GC[c.g] || XL.ink;
        [gRow.getCell(i + 1), hRow.getCell(i + 1)].forEach((cell, k) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
            cell.font = { name: 'Arial', bold: true, size: k === 0 ? 11 : 10, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = border;
        });
    });

    items.forEach(item => {
        const row = ws.addRow(cols.map(col => col.v(item)));
        row.height = 20;
        cols.forEach((col, i) => {
            const cell = row.getCell(i + 1), val = cell.value;
            cell.border = border;
            cell.font = { name: 'Arial', size: 10, bold: i < 2, color: { argb: XL.ink } };
            cell.alignment = { horizontal: i === 0 ? 'left' : (typeof val === 'string' ? 'center' : 'right'), vertical: 'middle' };
            if (col.f) cell.numFmt = col.f;
            if (i < 2) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.frozen } };
            if (col.teto && typeof val === 'number' && item.cot > 0) {   // verde = teto acima da cotação
                const ok = val >= item.cot;
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ok ? XL.okBg : XL.noBg } };
                cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: ok ? XL.okFg : XL.noFg } };
            }
        });
    });

    ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: cols.length } };
    ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:2' };
    return ws;
}

function buildLegend(wb) {
    const ws = wb.addWorksheet('Legenda', { properties: { tabColor: { argb: 'FF6B7A72' } } });
    ws.columns = [{ width: 18 }, { width: 85 }];
    const font = { name: 'Arial', size: 10, color: { argb: XL.ink } };
    const add = (a, b, fill, fg) => {
        const r = ws.addRow([a, b]);
        r.getCell(1).font = { ...font, bold: true, color: { argb: fg || XL.ink } };
        r.getCell(2).font = font;
        r.getCell(2).alignment = { wrapText: true, vertical: 'middle' };
        if (fill) r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
        r.height = 20;
    };
    const t = ws.addRow(['Legenda']); t.getCell(1).font = { name: 'Arial', size: 13, bold: true, color: { argb: XL.ink } }; t.height = 24;
    ws.addRow([]);
    add('Verde', 'Preço-alvo/teto igual ou acima da cotação atual (há margem).', XL.okBg, XL.okFg);
    add('Vermelho', 'Preço-alvo/teto abaixo da cotação atual (sem margem).', XL.noBg, XL.noFg);
    add('Colunas A e B', 'Ticker e cotação atual ficam congelados ao rolar para a direita.');
    add('Filtros', 'A segunda linha do cabeçalho tem filtros para ordenar e filtrar os ativos.');
    add('Gerado em', new Date().toLocaleString('pt-BR'));
}

const safeName = s => String(s || 'Ativo').replace(/[^\w\-]+/g, '_');

async function exportItems(items, filename) {
    if (typeof ExcelJS === 'undefined') { toast('A biblioteca do Excel não carregou. Verifique a internet e recarregue a página.'); return false; }
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Valuation & Preço Teto';
    wb.created = new Date();
    const acoes = items.filter(c => c.assetType !== 'fii'), fiis = items.filter(c => c.assetType === 'fii');
    if (acoes.length) buildSheet(wb, 'Ações', STOCK_COLS, acoes, 'FF0B7A64');
    if (fiis.length) buildSheet(wb, 'FIIs', FII_COLS, fiis, 'FFB8872B');
    buildLegend(wb);
    const buf = await wb.xlsx.writeBuffer();
    download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
    return true;
}

function exportExcel(btn) {
    if (!vData || vData.assetType === 'fii') return toast('Gere os resultados primeiro.');
    return withBusy(btn, async () => {
        const c = compute(readForm());
        const ok = await exportItems([c], `Valuation_${safeName(c.ticker)}.xlsx`);
        if (ok) toast(`Excel de ${c.ticker} baixado.`);
        return ok;
    });
}

function exportExcelFII(btn) {
    if (!vData || vData.assetType !== 'fii') return toast('Gere os resultados primeiro.');
    return withBusy(btn, async () => {
        const c = computeFII(readForm());
        const ok = await exportItems([c], `Valuation_${safeName(c.ticker)}.xlsx`);
        if (ok) toast(`Excel do FII ${c.ticker} baixado.`);
        return ok;
    });
}

function exportPortfolioExcel(btn) {
    if (!portfolio.length) return toast('A carteira está vazia.');
    return withBusy(btn, async () => {
        const ok = await exportItems(portfolio.map(p => p.c), 'Valuation_Carteira.xlsx');
        if (ok) toast(`Carteira baixada (${portfolio.length} ${portfolio.length > 1 ? 'ativos' : 'ativo'}).`);
        return ok;
    });
}

initNumFields();
addHelp();
renderPortfolio();
