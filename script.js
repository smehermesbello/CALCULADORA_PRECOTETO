/* ---------- Ajuda: explicações dos cálculos ---------- */
const HELP = {
    lucro_atual: ['Lucro Líquido Atual', 'Patrimônio líquido × ROE normalizado.', 'Estima o lucro anual que a empresa gera hoje, assumindo que o ROE normalizado é o retorno típico sobre o patrimônio.', 'Lucro Atual = Patrimônio Líquido × (ROE Norm. ÷ 100)'],
    lucro_proj: ['Lucro Líquido Projetivo', 'Lucro atual crescido por 1 ano à taxa g.', 'Projeta o lucro do próximo período aplicando o crescimento escolhido (SGR ou CAGR).', 'Lucro Proj. = Lucro Atual × (1 + g ÷ 100)'],
    sgr: ['Crescimento (g) aplicado', 'SGR ou CAGR, conforme a base escolhida.', 'O SGR (taxa de crescimento sustentável) é a parte do lucro que a empresa retém e reinveste ao ROE normalizado. Se você escolher CAGR, usa-se o crescimento histórico informado.', 'SGR = ROE Norm. × (1 − Payout ÷ 100)\ng = SGR  ou  g = CAGR'],
    patrimonio_proj: ['Patrimônio Líquido Projetado', 'Patrimônio atual + lucro projetivo retido.', 'Soma ao patrimônio atual a parte do lucro projetado que não foi distribuída como dividendo.', 'PL Proj. = PL Atual + Lucro Proj. × (1 − Payout ÷ 100)'],
    lpa_atual: ['LPA Atual', 'Lucro atual dividido pelo número de ações.', 'Lucro por ação: quanto do lucro cabe a cada papel.', 'LPA Atual = Lucro Atual ÷ Nº de Papéis'],
    lpa_proj: ['LPA Projetivo', 'Lucro projetivo dividido pelo número de ações.', 'Lucro por ação esperado após o crescimento projetado.', 'LPA Proj. = Lucro Proj. ÷ Nº de Papéis'],
    vpa_atual: ['VPA Atual', 'Patrimônio atual dividido pelo número de ações.', 'Valor patrimonial por ação.', 'VPA Atual = PL Atual ÷ Nº de Papéis'],
    vpa_proj: ['VPA Projetivo', 'Patrimônio projetado dividido pelo número de ações.', 'Valor patrimonial por ação após reter o lucro projetado.', 'VPA Proj. = PL Proj. ÷ Nº de Papéis'],
    pl_atual: ['P/L Atual', 'Cotação dividida pelo LPA atual.', 'Quantos anos de lucro atual você paga ao comprar a ação ao preço de hoje.', 'P/L Atual = Cotação ÷ LPA Atual'],
    dpa_proj: ['DPA Projetivo', 'LPA projetivo vezes o payout.', 'Dividendo por ação esperado, usado no Bazin projetivo.', 'DPA Proj. = LPA Proj. × (Payout ÷ 100)'],
    graham_constante: ['Constante de Graham', 'P/L máximo × P/VP máximo.', 'Graham aceita pagar no máximo 15× o lucro e 1,5× o patrimônio, o que dá 22,5. Você pode ajustar os dois limites.', 'K = P/L máx. × P/VP máx.'],
    res_anos: ['Anos de projeção', 'Prazo usado no múltiplo futuro.', 'Quantos anos o LPA cresce antes de aplicar o P/L médio e descontar de volta ao presente.', 'Usado em: LPA Futuro = LPA × (1 + g)^anos'],
    res_risco: ['Taxa de risco de desconto', 'Retorno mínimo exigido ao ano.', 'Traz o preço futuro a valor presente. Por padrão começa igual à taxa de juros Y.', 'Valor Presente = Preço Futuro ÷ (1 + risco)^anos'],
    peg_atual: ['PEG Ratio (P/L atual)', 'P/L atual dividido pelo crescimento g.', 'Compara o preço com o crescimento. Menor que 1: barato; até 2: razoável; até 3: caro; acima: muito caro. Só calcula com g e P/L positivos.', 'PEG = P/L Atual ÷ g (g em %)'],
    peg_hist: ['PEG Ratio (P/L médio)', 'P/L médio histórico dividido por g.', 'Mesma leitura do PEG, usando o P/L médio histórico em vez do atual.', 'PEG = P/L Médio Hist. ÷ g (g em %)'],
    graham_trad_a: ['Graham Tradicional (atual)', 'Raiz de K × LPA × VPA atuais.', 'Preço máximo que Graham considera justo para uma empresa com esse lucro e patrimônio por ação.', 'Preço = √( K × LPA Atual × VPA Atual )'],
    graham_trad_p: ['Graham Tradicional (projetado)', 'Raiz de K × LPA × VPA projetados.', 'Mesma fórmula, usando lucro e patrimônio por ação projetados.', 'Preço = √( K × LPA Proj. × VPA Proj. )'],
    graham_mod_a: ['Graham Modificado (LPA atual)', 'LPA × (8,5 + 2g) × 4,4 ÷ Y.', 'Versão de Graham que inclui o crescimento (g, em %) e ajusta pela taxa de juros Y: quanto maior o juro, menor o preço justo.', 'Preço = LPA Atual × (8,5 + 2 × g) × 4,4 ÷ Y'],
    graham_mod_p: ['Graham Modificado (LPA proj.)', 'Mesma fórmula com o LPA projetivo.', 'Usa o lucro por ação projetado no lugar do atual.', 'Preço = LPA Proj. × (8,5 + 2 × g) × 4,4 ÷ Y'],
    justo_a: ['Preço Justo (P/L médio)', 'LPA atual × P/L médio histórico.', 'Quanto a ação valeria se negociasse ao seu P/L médio de sempre.', 'Preço Justo = LPA Atual × P/L Médio Hist.'],
    justo_p: ['Preço Justo (P/L médio + LPA proj.)', 'LPA projetivo × P/L médio histórico.', 'Igual ao anterior, mas com o lucro por ação projetado.', 'Preço Justo = LPA Proj. × P/L Médio Hist.'],
    futuro: ['Alvo do Múltiplo Futuro', 'Preço daqui a N anos trazido ao presente.', 'Projeta o LPA por N anos com o crescimento g, multiplica pelo P/L médio e desconta pela taxa de risco.', 'LPA Futuro = LPA Atual × (1 + g)^N\nPreço Futuro = LPA Futuro × P/L Médio\nAlvo = Preço Futuro ÷ (1 + risco)^N'],
    bazin_h: ['Bazin: teto histórico', 'DPA histórico dividido pelo yield desejado.', 'Preço máximo para receber, em dividendos, pelo menos o yield de cada nível (15%, 12%, 10%, 8%, 6%). Yield maior significa preço menor e mais margem.', 'Teto = DPA Histórico ÷ (Yield ÷ 100)'],
    bazin_p: ['Bazin: teto projetivo', 'DPA projetivo dividido pelo yield desejado.', 'Mesma lógica do Bazin, usando o dividendo projetado (LPA projetivo × payout).', 'Teto = DPA Projetivo ÷ (Yield ÷ 100)'],
    vm: ['Valor de Mercado', 'Cotação × número de papéis.', 'Quanto o mercado paga pela empresa inteira hoje.', 'Valor de Mercado = Cotação × Nº de Papéis'],
    pb_lucro: ['Lucro Líquido Atual', 'Patrimônio líquido × ROE normalizado.', 'Mesmo lucro das métricas calculadas, usado como base do payback.', 'Lucro Atual = Patrimônio Líquido × (ROE Norm. ÷ 100)'],
    pb_pl: ['P/L Atual (em anos)', 'Valor de mercado ÷ lucro líquido atual.', 'Quantos anos de lucro atual, mantido constante, equivalem ao valor de mercado.', 'P/L = Valor de Mercado ÷ Lucro Líquido Atual'],
    ey: ['Earning Yield', 'Lucro líquido ÷ valor de mercado.', 'Retorno em lucro que você teria ao comprar a empresa inteira pelo valor de mercado. É o inverso do P/L.', 'EY (%) = Lucro Líquido Atual ÷ Valor de Mercado × 100'],
    dy: ['Dividend Yield (estimado)', 'Earning Yield × payout médio.', 'Se a empresa pagasse 100% do lucro em dividendos, o DY seria igual ao EY. Como paga apenas o payout médio, o DY é essa fração do EY.', 'DY (%) = EY × (Payout Médio ÷ 100)'],
    pb_cru: ['Payback Cru', '100 ÷ earning yield, em anos.', 'Tempo para o lucro, sem nenhum crescimento, devolver o valor investido. Dá o mesmo número do P/L.', 'Payback Cru = 100 ÷ EY (%)'],
    pb_cresc: ['Payback por Crescimento', 'Anos para o lucro, crescendo a g ao ano, pagar o valor de mercado.', 'Em vez de lucro constante, o lucro cresce à taxa de crescimento aplicada (g). Somam-se os lucros de cada ano até igualar o valor de mercado. Com g = 0 o resultado é igual ao Payback Cru.', 'Anos = ln(1 + g × P/L) ÷ ln(1 + g)\n(g em decimal, P/L em anos)'],
    pb_req: ['Crescimento Esperado', 'Crescimento anual necessário para o payback alvo.', 'Encontra, por aproximações sucessivas, a taxa g para a qual o lucro acumulado em N anos (padrão 10) iguala o valor de mercado. Se o P/L já é menor que N, o resultado é negativo: a empresa pode até encolher e ainda se pagar no prazo.', 'Encontrar g tal que:\nP/L = ((1 + g)^N − 1) ÷ g'],
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

/* ---------- Utilitários ---------- */
const N = v => parseFloat(v) || 0;

/* Campos com números grandes/dinheiro: texto formatado em pt-BR (1.234.567,89) */
const NUM_IDS = ['n_papeis', 'cotacao', 'patrimonio_atual', 'dpa_hist', 'lucro_atual', 'lucro_proj', 'patrimonio_proj', 'lpa_atual', 'lpa_proj', 'vpa_atual', 'vpa_proj', 'dpa_proj'];
const INT_IDS = ['n_papeis'];
const parseBR = s => {
    s = String(s).trim();
    if (s === '' || s === '-') return '';
    const v = parseFloat(s.replace(/\./g, '').replace(',', '.'));
    return isNaN(v) ? '' : String(v);
};
const fmtField = (id, v) => {
    v = parseFloat(v);
    if (isNaN(v)) return '';
    const d = INT_IDS.includes(id) ? 0 : 2;
    return v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
};
function liveFmt(el) {
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
function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.toggle('active', el.id === id));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
}
function readForm() {
    const r = {};
    document.querySelectorAll('#inputs input, #inputs select, #results input').forEach(i => {
        if (i.id) r[i.id] = NUM_IDS.includes(i.id) ? parseBR(i.value) : i.value;
    });
    return r;
}
function fillForm(inputs) {
    Object.keys(inputs).forEach(k => {
        const el = document.getElementById(k);
        if (el) el.value = NUM_IDS.includes(k) ? fmtField(k, inputs[k]) : inputs[k];
    });
}

/* ---------- Payback ---------- */
// Anos para o lucro acumulado, crescendo a g% ao ano, igualar o valor de mercado (pl = VM ÷ lucro)
function paybackGrowth(pl, g) {
    const gr = g / 100;
    if (Math.abs(gr) < 1e-9) return pl;
    const x = 1 + gr * pl;
    return (x <= 0 || gr <= -1) ? null : Math.log(x) / Math.log(1 + gr);
}
// Crescimento anual (%) necessário para o payback ser de n anos (bissecção)
function requiredGrowth(pl, n) {
    const S = g => Math.abs(g) < 1e-9 ? n : (Math.pow(1 + g, n) - 1) / g;
    let lo = -0.99, hi = 10;
    if (pl < S(lo) || pl > S(hi)) return null;
    for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (S(m) < pl) lo = m; else hi = m; }
    return (lo + hi) / 2 * 100;
}

/* ---------- Cálculo (função pura: recebe os inputs, devolve tudo) ---------- */
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

let vData = null, isFirstCalc = true, portfolio = [];

function autoCalc() {
    const rk = document.getElementById('res_risco');
    if (rk.value === '') rk.value = document.getElementById('taxa_y').value;
    const c = compute(readForm());
    Object.keys(c.derived).forEach(id => {
        const el = document.getElementById(id), v = c.derived[id];
        if (el && document.activeElement !== el) el.value = v ? (NUM_IDS.includes(id) ? fmtField(id, v) : v.toFixed(2)) : '';
    });
    return c;
}

function calcularTudo() {
    vData = autoCalc();
    document.getElementById('res_ticker').textContent = vData.ticker;
    document.getElementById('res_cotacao').textContent = vData.cot > 0 ? brl(vData.cot) : 'N/A';
    renderCards();
    renderPayback();
    renderPyramids();
    if (isFirstCalc) { switchTab('results'); isFirstCalc = false; }
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

/* ---------- Carteira ---------- */
function upsert(inputs) {
    const c = compute(inputs);
    const i = portfolio.findIndex(p => p.c.ticker === c.ticker);
    const item = { inputs, c };
    if (i >= 0) portfolio[i] = item; else portfolio.push(item);
}
function saveCurrent() {
    const r = readForm();
    if (!r.ticker) return toast('Informe o ticker antes de salvar.');
    upsert(r); renderPortfolio(); toast(`${r.ticker} salva na carteira.`);
}
function loadStock(i) { fillForm(portfolio[i].inputs); calcularTudo(); switchTab('results'); }
function removeStock(i) { portfolio.splice(i, 1); renderPortfolio(); }
function clearPortfolio() { if (portfolio.length && confirm('Remover todas as ações da carteira?')) { portfolio = []; renderPortfolio(); } }
function renderPortfolio() {
    document.getElementById('port_count').textContent = portfolio.length;
    const body = document.getElementById('port_body');
    if (!portfolio.length) { body.innerHTML = '<div class="empty">Importe um ou mais arquivos JSON, ou use "Salvar na carteira" nos resultados.</div>'; return; }
    const cell = (v, cot) => `<td class="${v > 0 && cot > 0 ? (v >= cot ? 'ok' : 'no') : ''}">${brl(v)}</td>`;
    body.innerHTML = `<table><thead><tr><th>Ticker</th><th>Cotação</th><th>Bazin hist. 6%</th><th>Bazin proj. 6%</th><th>Graham trad.</th><th>Graham mod.</th><th>Justo P/L</th><th>Múlt. futuro</th><th></th></tr></thead><tbody>` +
        portfolio.map(({ c }, i) => `<tr><td class="tk">${c.ticker}</td><td>${brl(c.cot)}</td>${cell(c.bazH[4], c.cot)}${cell(c.bazP[4], c.cot)}${cell(c.gtA, c.cot)}${cell(c.gmA, c.cot)}${cell(c.jA, c.cot)}${cell(c.futVP, c.cot)}<td><button onclick="loadStock(${i})">Abrir</button><button class="del" onclick="removeStock(${i})">Remover</button></td></tr>`).join('') +
        '</tbody></table>';
}

/* ---------- JSON ---------- */
function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportJSON() {
    const inputs = readForm();
    download(new Blob([JSON.stringify({ inputs, results: vData })], { type: 'application/json' }), `Valuation_Completo_${inputs.ticker || 'dados'}.json`);
}
function exportPortfolioJSON() {
    if (!portfolio.length) return toast('A carteira está vazia.');
    download(new Blob([JSON.stringify({ stocks: portfolio.map(p => ({ inputs: p.inputs })) })], { type: 'application/json' }), 'Valuation_Carteira.json');
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
    fillForm(last); calcularTudo();
    switchTab(count > 1 ? 'portfolio' : 'results');
    toast(`${count} ${count > 1 ? 'ações importadas' : 'ação importada'}. Baixe o Excel da carteira na aba Carteira.`);
}

/* ---------- Excel bonito (ExcelJS) ---------- */
const MONEY = '"R$" #,##0.00', FONT = 'Segoe UI';
const priceCols = () => {
    const cols = [
        { g: 'Ativo', h: 'Ticker', f: c => c.ticker, k: '14211C', w: 13, bold: 1 },
        { g: 'Ativo', h: 'Cotação', f: c => c.cot, fm: MONEY, k: '14211C' },
        { g: 'PEG Ratio', h: 'P/L atual', f: c => c.pegA === null ? 'N/A' : c.pegA, fm: '0.00', k: '5B6B7A' },
        { g: 'PEG Ratio', h: 'P/L médio', f: c => c.pegH === null ? 'N/A' : c.pegH, fm: '0.00', k: '5B6B7A' },
        { g: 'Graham Tradicional', h: 'Atual', f: c => c.gtA, p: 1, fm: MONEY, k: '0B7A64' },
        { g: 'Graham Tradicional', h: 'Projetado', f: c => c.gtP, p: 1, fm: MONEY, k: '0B7A64' },
        { g: 'Graham Modificado', h: 'Atual', f: c => c.gmA, p: 1, fm: MONEY, k: '1D6FA5' },
        { g: 'Graham Modificado', h: 'Projetado', f: c => c.gmP, p: 1, fm: MONEY, k: '1D6FA5' },
        { g: 'Preço Justo (P/L médio)', h: 'LPA atual', f: c => c.jA, p: 1, fm: MONEY, k: 'B8872B', w: 15 },
        { g: 'Preço Justo (P/L médio)', h: 'LPA proj.', f: c => c.jP, p: 1, fm: MONEY, k: 'B8872B', w: 15 },
        { g: 'Múltiplo Futuro', h: 'Valor presente', f: c => c.futVP, p: 1, fm: MONEY, k: 'C2410C' },
        { g: 'Múltiplo Futuro', h: 'Preço futuro', f: c => c.futBruto, fm: MONEY, k: 'C2410C' }
    ];
    [15, 12, 10, 8, 6].forEach((dy, i) => cols.push({ g: 'Bazin Histórico', h: `Yield ${dy}%`, f: c => c.bazH[i], p: 1, fm: MONEY, k: '2D6A4F', w: 14 }));
    [15, 12, 10, 8, 6].forEach((dy, i) => cols.push({ g: 'Bazin Projetivo', h: `Yield ${dy}%`, f: c => c.bazP[i], p: 1, fm: MONEY, k: '7A4E9C', w: 14 }));
    return cols;
};
const inputCols = () => [
    ['Ticker', c => c.ticker], ['Cotação', c => c.cot, MONEY], ['Nº de papéis', c => c.n, '#,##0'],
    ['Patrimônio líquido', c => c.pat, MONEY], ['ROE norm. (%)', c => c.roe, '0.00'], ['Payout (%)', c => c.pay, '0.00'],
    ['CAGR (%)', c => c.cagr, '0.00'], ['Base de crescimento', c => c.gType], ['g aplicado (%)', c => c.g, '0.00'],
    ['DPA hist.', c => c.dpaHist, MONEY], ['P/L médio', c => c.plHist, '0.00'], ['Taxa Y (%)', c => c.y, '0.00'],
    ['Lucro atual', c => c.lucA, MONEY], ['Lucro proj.', c => c.lucP, MONEY],
    ['LPA atual', c => c.lpaA, MONEY], ['LPA proj.', c => c.lpaP, MONEY], ['VPA atual', c => c.vpaA, MONEY], ['VPA proj.', c => c.vpaP, MONEY],
    ['Valor de mercado', c => c.vm, MONEY], ['P/L (anos)', c => c.plV === null ? 'N/A' : c.plV, '0.00'],
    ['Earning yield (%)', c => c.ey === null ? 'N/A' : c.ey, '0.00'], ['DY estimado (%)', c => c.dy === null ? 'N/A' : c.dy, '0.00'],
    ['Payback cru (anos)', c => c.pbCru === null ? 'N/A' : c.pbCru, '0.00'], ['Payback por cresc. (anos)', c => c.pbG === null ? 'N/A' : c.pbG, '0.00'],
    ['Cresc. esperado p/ payback alvo (%)', c => c.gReq === null ? 'N/A' : c.gReq, '0.00']
].map(([h, f, fm]) => ({ g: 'Dados de entrada e métricas', h, f, fm, k: '14211C', w: 18, bold: h === 'Ticker' }));

function fillSheet(ws, cols, list, legend) {
    const side = { style: 'thin', color: { argb: 'FFD9DFD6' } }, border = { top: side, bottom: side, left: side, right: side };
    const mid = { horizontal: 'center', vertical: 'middle', wrapText: true };
    ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 2, showGridLines: false }];
    cols.forEach((c, i) => {
        ws.getColumn(i + 1).width = c.w || 17;
        [ws.getCell(1, i + 1), ws.getCell(2, i + 1)].forEach((x, j) => {
            x.value = j ? c.h : c.g;
            x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + c.k } };
            x.font = { name: FONT, bold: true, size: j ? 10.5 : 12, color: { argb: 'FFFFFFFF' } };
            x.alignment = mid; x.border = border;
        });
    });
    let s = 0;
    cols.forEach((c, i) => { if (i === cols.length - 1 || cols[i + 1].g !== c.g) { if (i > s) ws.mergeCells(1, s + 1, 1, i + 1); s = i + 1; } });
    ws.getRow(1).height = 28; ws.getRow(2).height = 32;
    list.forEach((c, r) => {
        const row = ws.getRow(r + 3); row.height = 26;
        cols.forEach((col, i) => {
            const cell = row.getCell(i + 1), v = col.f(c);
            const empty = col.p && !(v > 0);
            cell.value = empty ? '—' : v;
            if (col.fm && !empty) cell.numFmt = col.fm;
            let fill = r % 2 ? 'FFF3F6F1' : 'FFFFFFFF', color = 'FF14211C';
            if (col.p && v > 0 && c.cot > 0) { const ok = v >= c.cot; fill = ok ? 'FFDCF3E6' : 'FFFBE1DE'; color = ok ? 'FF0B5D4B' : 'FF9B2C20'; }
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
            cell.font = { name: FONT, size: 11, bold: !!col.bold || (col.p && v > 0), color: { argb: color } };
            cell.alignment = mid; cell.border = border;
        });
    });
    if (legend) {
        const r = list.length + 4;
        ws.mergeCells(r, 1, r, 8);
        const c = ws.getCell(r, 1);
        c.value = 'Verde: preço teto acima da cotação (ação abaixo do teto). Vermelho: preço teto abaixo da cotação.';
        c.font = { name: FONT, italic: true, size: 10, color: { argb: 'FF5D6B63' } };
        c.alignment = { horizontal: 'left', vertical: 'middle' };
    }
}
async function buildExcel(list, filename) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Valuation & Preço Teto';
    fillSheet(wb.addWorksheet('Preços Teto', { properties: { tabColor: { argb: 'FFB8872B' } } }), priceCols(), list, true);
    fillSheet(wb.addWorksheet('Dados de Entrada', { properties: { tabColor: { argb: 'FF0B7A64' } } }), inputCols(), list, false);
    download(new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
}
function exportExcel() {
    if (!vData) return toast('Gere os resultados primeiro.');
    buildExcel([vData], `Valuation_${vData.ticker || 'Acao'}.xlsx`);
}
function exportPortfolioExcel() {
    if (!portfolio.length) return toast('A carteira está vazia.');
    buildExcel(portfolio.map(p => p.c), 'Valuation_Carteira.xlsx');
}

initNumFields();
addHelp();
renderPortfolio();
