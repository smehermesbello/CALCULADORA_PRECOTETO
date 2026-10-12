function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

let vData = {};

function getV(id) { return parseFloat(document.getElementById(id).value) || 0; }
function setV(id, val) { document.getElementById(id).value = val > 0 || val < 0 ? val.toFixed(2) : ''; }

function autoCalc() {
    const cot = getV('cotacao');
    const n = getV('n_papeis');
    const pat_a = getV('patrimonio_atual');
    const pat_p = getV('patrimonio_proj');
    const roe_norm = getV('roe_norm');
    const pay = getV('payout');
    const cagr = getV('cagr');
    const gType = document.getElementById('growth_type').value;

    // 1. Calcular Lucro Líquido Atual = PL * ROE Normalizado
    if (pat_a > 0 && roe_norm > 0) {
        setV('lucro_atual', pat_a * (roe_norm / 100));
    }
    
    const luc_a = getV('lucro_atual');

    // 2. Calcular SGR (Taxa de Retenção) = ROE Norm * (1 - Payout)
    if (roe_norm > 0 && pay >= 0) {
        const ret_ratio = 1 - (pay / 100);
        setV('sgr', roe_norm * ret_ratio);
    }
    const sgr = getV('sgr');

    // 3. Calcular Lucro Projetado = Lucro Atual * (1 + Crescimento)
    const g = gType === 'cagr' ? cagr : sgr;
    if (luc_a > 0 && g > 0) {
        setV('lucro_proj', luc_a * (1 + (g / 100)));
    }
    
    const luc_p = getV('lucro_proj');

    // 4. Calcular Métricas por Ação (LPA e VPA)
    if(n > 0) {
        if(luc_a > 0) setV('lpa_atual', luc_a / n);
        if(luc_p > 0) setV('lpa_proj', luc_p / n);
        if(pat_a > 0) setV('vpa_atual', pat_a / n);
        if(pat_p > 0) setV('vpa_proj', pat_p / n);
    }
    
    const lpa_a = getV('lpa_atual');
    
    // 5. P/L Atual
    if(cot > 0 && lpa_a > 0) setV('pl_atual', cot / lpa_a);
    
    // 6. ROE Calculado Real (para conferência)
    if(pat_a > 0 && luc_a > 0) setV('roe_atual', (luc_a / pat_a) * 100);
    if(pat_p > 0 && luc_p > 0) setV('roe_proj', (luc_p / pat_p) * 100);
    
    // 7. DPA Projetivo
    const lpa_p = getV('lpa_proj');
    if(lpa_p > 0 && pay > 0) {
        setV('dpa_proj', lpa_p * (pay / 100));
    }
}

function calcularTudo() {
    const ticker = document.getElementById('ticker').value || 'Ação';
    document.getElementById('res_ticker').innerText = ticker;

    const cot = getV('cotacao');
    const lpa_a = getV('lpa_atual');
    const vpa_a = getV('vpa_atual');
    const lpa_p = getV('lpa_proj');
    const vpa_p = getV('vpa_proj');
    const pl_a = getV('pl_atual');
    
    const pl_hist = getV('pl_hist');
    const dpa_hist = getV('dpa_hist');
    const dpa_proj = getV('dpa_proj');
    
    const cagr = getV('cagr');
    const sgr = getV('sgr');
    const gType = document.getElementById('growth_type').value;
    const g = gType === 'cagr' ? cagr : sgr;

    // PEG Ratio
    let peg = 'N/A';
    let pegBadge = { text: 'Indisponível', class: 'gray' };
    
    if (g > 0 && pl_a > 0) {
        peg = (pl_a / g).toFixed(2);
        const pVal = parseFloat(peg);
        if(pVal < 1) pegBadge = {text: 'Muito Barato', class: 'green'};
        else if(pVal <= 2) pegBadge = {text: 'Valor Bom', class: 'yellow'};
        else if(pVal <= 3) pegBadge = {text: 'Cara', class: 'orange'};
        else pegBadge = {text: 'Sobrevalorizada', class: 'red'};
    } else if (lpa_a <= 0) {
        pegBadge = {text: 'Sem Lucro (Use PSR)', class: 'red'};
    }

    // Graham
    const calcGraham = (l, v) => (l > 0 && v > 0) ? Math.sqrt(22.5 * l * v) : 0;
    const graham_a = calcGraham(lpa_a, vpa_a);
    const graham_p = calcGraham(lpa_p, vpa_p);

    // Múltiplo Histórico
    const val_pl = lpa_a * pl_hist;

    // Bazin Levels
    const levels = [15, 12, 10, 8, 6];
    let bazin_h = [], bazin_p = [];
    
    levels.forEach(dy => {
        bazin_h.push({ dy, val: dpa_hist > 0 ? (dpa_hist / (dy/100)) : 0 });
        bazin_p.push({ dy, val: dpa_proj > 0 ? (dpa_proj / (dy/100)) : 0 });
    });

    vData = { ticker, cot, peg, pegBadge, graham_a, graham_p, val_pl, bazin_h, bazin_p };

    renderCards();
    renderPyramids();

    switchTab('results');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
}

function renderCards() {
    const c = document.getElementById('results_container');
    c.innerHTML = `
        <div class="result-card">
            <h4>PEG Ratio</h4>
            <div class="value">${vData.peg}</div>
            <div class="badge ${vData.pegBadge.class}">${vData.pegBadge.text}</div>
        </div>
        <div class="result-card">
            <h4>Graham (Atual)</h4>
            <div class="value">R$ ${vData.graham_a.toFixed(2)}</div>
            <span style="font-size:0.8rem; color:#64748b;">Com base em LPA e VPA atuais</span>
        </div>
        <div class="result-card">
            <h4>Graham (Projetivo)</h4>
            <div class="value">R$ ${vData.graham_p.toFixed(2)}</div>
            <span style="font-size:0.8rem; color:#64748b;">Com base em LPA e VPA projetivos</span>
        </div>
        <div class="result-card">
            <h4>Preço Justo (P/L Hist.)</h4>
            <div class="value">R$ ${vData.val_pl.toFixed(2)}</div>
            <span style="font-size:0.8rem; color:#64748b;">LPA Atual x P/L Médio</span>
        </div>
    `;
}

function renderPyramids() {
    const ph = document.getElementById('pyramid_hist');
    const pp = document.getElementById('pyramid_proj');
    ph.innerHTML = ''; pp.innerHTML = '';

    vData.bazin_h.forEach(b => {
        ph.innerHTML += `<div class="pyramid-level pyr-${b.dy}">R$ ${b.val.toFixed(2)} <span>Yield ${b.dy}%</span></div>`;
    });
    
    vData.bazin_p.forEach(b => {
        pp.innerHTML += `<div class="pyramid-level pyr-${b.dy}">R$ ${b.val.toFixed(2)} <span>Yield ${b.dy}%</span></div>`;
    });
}

function exportJSON() {
    let inputs = {};
    document.querySelectorAll('input, select').forEach(i => {
        if(i.id && i.id !== 'import-json') inputs[i.id] = i.value;
    });
    const finalData = { inputs, results: vData };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalData));
    const a = document.createElement('a');
    a.href = dataStr; a.download = "valuation_" + (vData.ticker || 'dados') + ".json";
    document.body.appendChild(a); a.click(); a.remove();
}

function importJSON(event) {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if(data.inputs) {
                Object.keys(data.inputs).forEach(k => {
                    const el = document.getElementById(k);
                    if(el) el.value = data.inputs[k];
                });
                autoCalc();
                alert("Dados importados! Clique em calcular para ver os resultados.");
            }
        } catch(err) { alert("Erro ao ler JSON."); }
    };
    reader.readAsText(file);
}

function exportExcel() {
    if(!vData.bazin_h) return alert("Calcule primeiro!");
    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.aoa_to_sheet([
        ["Métrica", "Valor", "Classificação"],
        ["PEG Ratio", vData.peg, vData.pegBadge.text],
        ["Graham (Atual)", "R$ " + vData.graham_a.toFixed(2), ""],
        ["Graham (Projetivo)", "R$ " + vData.graham_p.toFixed(2), ""],
        ["Preço Justo (P/L Hist.)", "R$ " + vData.val_pl.toFixed(2), ""]
    ]);
    
    let bData = [["Yield Alvo (%)", "Preço Teto Histórico (R$)", "Preço Teto Projetivo (R$)"]];
    for(let i=0; i<vData.bazin_h.length; i++) {
        bData.push([
            vData.bazin_h[i].dy + "%",
            vData.bazin_h[i].val.toFixed(2),
            vData.bazin_p[i].val.toFixed(2)
        ]);
    }
    const ws2 = XLSX.utils.aoa_to_sheet(bData);

    XLSX.utils.book_append_sheet(wb, ws1, "Resumo Valuation");
    XLSX.utils.book_append_sheet(wb, ws2, "Preços Teto Bazin");
    XLSX.writeFile(wb, `Valuation_${vData.ticker || 'Acao'}.xlsx`);
}
