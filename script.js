function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if(btn.innerText.includes(tabId === 'inputs' ? '1.' : '2.')) btn.classList.add('active');
    });
}

let vData = {};
let isFirstCalc = true;

function getV(id) { return parseFloat(document.getElementById(id).value) || 0; }
function setV(id, val) { document.getElementById(id).value = isNaN(val) ? '' : val.toFixed(2); }

function autoCalc() {
    const cot = getV('cotacao');
    const n = getV('n_papeis');
    const pat_a = getV('patrimonio_atual');
    const roe_norm = getV('roe_norm');
    const pay = getV('payout');
    const cagr = getV('cagr');
    const gType = document.getElementById('growth_type').value;
    const taxa_y = getV('taxa_y');

    // Inicializa Taxa de Risco se vazio
    if (document.getElementById('res_risco').value === '') {
        document.getElementById('res_risco').value = taxa_y;
    }

    // Graham Constante
    const g_pl = getV('graham_pl');
    const g_pvp = getV('graham_pvp');
    const g_const = g_pl * g_pvp;
    setV('graham_constante', g_const);

    // 1. Lucro Atual
    if (pat_a > 0 && roe_norm > 0) {
        setV('lucro_atual', pat_a * (roe_norm / 100));
    }
    const luc_a = getV('lucro_atual');

    // 2. Crescimento SGR
    let sgr_val = 0;
    if (roe_norm > 0 && pay >= 0) {
        sgr_val = roe_norm * (1 - (pay / 100));
    }
    const g_percent = gType === 'cagr' ? cagr : sgr_val;
    setV('sgr', g_percent);

    // 3. Lucro Projetado
    if (luc_a > 0 && g_percent !== 0) {
        setV('lucro_proj', luc_a * (1 + (g_percent / 100)));
    }
    const luc_p = getV('lucro_proj');

    // 4. Patrimônio Projetado (PatAtual + LucroProj*(1-Payout))
    if (pat_a > 0 && luc_p > 0) {
        setV('patrimonio_proj', pat_a + (luc_p * (1 - (pay / 100))));
    }
    const pat_p = getV('patrimonio_proj');

    // 5. Métricas por Ação
    if(n > 0) {
        if(luc_a > 0) setV('lpa_atual', luc_a / n);
        if(luc_p > 0) setV('lpa_proj', luc_p / n);
        if(pat_a > 0) setV('vpa_atual', pat_a / n);
        if(pat_p > 0) setV('vpa_proj', pat_p / n);
    }
    
    const lpa_a = getV('lpa_atual');
    
    // 6. P/L Atual
    if(cot > 0 && lpa_a > 0) setV('pl_atual', cot / lpa_a);
    
    // 7. DPA Projetivo
    const lpa_p = getV('lpa_proj');
    if(lpa_p > 0 && pay > 0) {
        setV('dpa_proj', lpa_p * (pay / 100));
    }
}

function calcularTudo() {
    autoCalc();

    const ticker = document.getElementById('ticker').value || 'Ação';
    const cot = getV('cotacao');
    
    document.getElementById('res_ticker').innerText = ticker;
    document.getElementById('res_cotacao').innerText = cot > 0 ? `R$ ${cot.toFixed(2)}` : 'N/A';

    const lpa_a = getV('lpa_atual');
    const vpa_a = getV('vpa_atual');
    const lpa_p = getV('lpa_proj');
    const vpa_p = getV('vpa_proj');
    
    const pl_a = getV('pl_atual');
    const pl_hist = getV('pl_hist');
    const dpa_hist = getV('dpa_hist');
    const dpa_proj = getV('dpa_proj');
    
    const g_percent = getV('sgr'); 
    const y_tax = getV('taxa_y'); 
    const const_graham = getV('graham_constante');

    // --- CÁLCULOS DOS MÚLTIPLOS E TETOS ---
    
    // PEG Ratio
    const calcPeg = (pl, g) => (g > 0 && pl > 0) ? (pl / g).toFixed(2) : 'N/A';
    const peg_atual = calcPeg(pl_a, g_percent);
    const peg_hist = calcPeg(pl_hist, g_percent);

    const getPegBadge = valStr => {
        if (valStr === 'N/A') return { text: 'Indisponível', class: 'gray' };
        const v = parseFloat(valStr);
        if(v < 1) return {text: 'Barato', class: 'green'};
        if(v <= 2) return {text: 'Razoável', class: 'yellow'};
        if(v <= 3) return {text: 'Caro', class: 'orange'};
        return {text: 'Muito Caro', class: 'red'};
    };

    // Graham Tradicional
    const calcGraham = (l, v) => (l > 0 && v > 0) ? Math.sqrt(const_graham * l * v) : 0;
    const graham_trad_a = calcGraham(lpa_a, vpa_a);
    const graham_trad_p = calcGraham(lpa_p, vpa_p);

    // Graham Modificado: V = [LPA * (8.5 + 2g) * 4.4] / Y
    const calcGrahamMod = (lpa, g_val, y_val) => {
        if(lpa <= 0 || y_val <= 0) return 0;
        return (lpa * (8.5 + 2 * g_val) * 4.4) / y_val;
    };
    const graham_mod_a = calcGrahamMod(lpa_a, g_percent, y_tax);
    const graham_mod_p = calcGrahamMod(lpa_p, g_percent, y_tax);

    // Preço Justo P/L Histórico
    const justo_pl_hist_a = lpa_a * pl_hist;
    const justo_pl_hist_p = lpa_p * pl_hist;

    // Preço Alvo por Múltiplo Futuro
    const n_anos = getV('res_anos') || 5;
    const t_risco = getV('res_risco') / 100;
    
    // LPA Futuro com base no crescimento aplicado e nº de anos
    const lpa_futuro = lpa_a * Math.pow(1 + (g_percent / 100), n_anos);
    const preco_futuro = lpa_futuro * pl_hist;
    const multiplo_futuro = preco_futuro / Math.pow(1 + t_risco, n_anos);

    // Bazin Levels
    const levels = [15, 12, 10, 8, 6];
    let bazin_h = [], bazin_p = [];
    levels.forEach(dy => {
        bazin_h.push({ dy, val: dpa_hist > 0 ? (dpa_hist / (dy/100)) : 0 });
        bazin_p.push({ dy, val: dpa_proj > 0 ? (dpa_proj / (dy/100)) : 0 });
    });

    // Guardar Dados Globalmente
    vData = { 
        ticker, cot, n_anos, t_risco: t_risco*100, y_tax, g_percent, const_graham,
        peg_atual, peg_hist, getPegBadge, 
        graham_trad_a, graham_trad_p, graham_mod_a, graham_mod_p, 
        justo_pl_hist_a, justo_pl_hist_p, multiplo_futuro, preco_futuro,
        bazin_h, bazin_p 
    };

    renderCards();
    renderPyramids();

    if(isFirstCalc) {
        switchTab('results');
        isFirstCalc = false;
    }
}

function renderCards() {
    const c = document.getElementById('results_container');
    c.innerHTML = `
        <div class="result-card">
            <h4>PEG Ratio (P/L Atual)</h4>
            <div class="value">${vData.peg_atual}</div>
            <div class="badge ${vData.getPegBadge(vData.peg_atual).class}">${vData.getPegBadge(vData.peg_atual).text}</div>
        </div>
        <div class="result-card">
            <h4>PEG Ratio (P/L Médio Hist.)</h4>
            <div class="value">${vData.peg_hist}</div>
            <div class="badge ${vData.getPegBadge(vData.peg_hist).class}">${vData.getPegBadge(vData.peg_hist).text}</div>
        </div>

        <div class="result-card" style="border-left-color: #8b5cf6;">
            <h4>Graham Tradicional (Atual)</h4>
            <div class="value">R$ ${vData.graham_trad_a.toFixed(2)}</div>
            <span style="font-size:0.75rem; color:#64748b; margin-top:5px;">LPA/VPA Atuais | K=${vData.const_graham.toFixed(2)}</span>
        </div>
        <div class="result-card" style="border-left-color: #8b5cf6;">
            <h4>Graham Tradicional (Projetado)</h4>
            <div class="value">R$ ${vData.graham_trad_p.toFixed(2)}</div>
            <span style="font-size:0.75rem; color:#64748b; margin-top:5px;">LPA/VPA Projetados</span>
        </div>
        
        <div class="result-card" style="border-left-color: #0ea5e9;">
            <h4>Graham Modificado (LPA Atual)</h4>
            <div class="value">R$ ${vData.graham_mod_a.toFixed(2)}</div>
            <span style="font-size:0.75rem; color:#64748b; margin-top:5px;">g=${vData.g_percent.toFixed(2)}% | Y=${vData.y_tax}%</span>
        </div>
        <div class="result-card" style="border-left-color: #0ea5e9;">
            <h4>Graham Modificado (LPA Proj.)</h4>
            <div class="value">R$ ${vData.graham_mod_p.toFixed(2)}</div>
            <span style="font-size:0.75rem; color:#64748b; margin-top:5px;">g=${vData.g_percent.toFixed(2)}% | Y=${vData.y_tax}%</span>
        </div>

        <div class="result-card" style="border-left-color: #10b981;">
            <h4>Preço Justo (P/L Médio)</h4>
            <div class="value">R$ ${vData.justo_pl_hist_a.toFixed(2)}</div>
            <span style="font-size:0.75rem; color:#64748b; margin-top:5px;">Usando LPA Atual</span>
        </div>
        <div class="result-card" style="border-left-color: #10b981;">
            <h4>Preço Justo (P/L Médio + LPA Proj)</h4>
            <div class="value">R$ ${vData.justo_pl_hist_p.toFixed(2)}</div>
            <span style="font-size:0.75rem; color:#64748b; margin-top:5px;">Usando LPA Projetivo</span>
        </div>

        <div class="result-card" style="border-left-color: #f59e0b; grid-column: 1 / -1; display:flex; flex-direction:row; align-items:center; justify-content:space-between;">
            <div>
                <h4>Alvo Múltiplo Futuro (${vData.n_anos} Anos) trazido a V.P.</h4>
                <div class="value" style="font-size: 2rem;">R$ ${vData.multiplo_futuro.toFixed(2)}</div>
                <span style="font-size:0.85rem; color:#64748b; margin-top:5px;">Descontado à Taxa de Risco de ${vData.t_risco.toFixed(2)}%</span>
            </div>
            <div style="text-align: right; background: #fef3c7; padding: 1rem; border-radius:8px;">
                <h4 style="color:#b45309; font-size:0.8rem;">Preço Bruto no Futuro</h4>
                <div style="font-size: 1.2rem; font-weight:bold; color:#92400e;">R$ ${vData.preco_futuro.toFixed(2)}</div>
            </div>
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
    a.href = dataStr; a.download = `Valuation_Completo_${vData.ticker || 'dados'}.json`;
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
                alert("Dados importados! Clique em Calcular para ver os resultados.");
            }
        } catch(err) { alert("Erro ao ler JSON."); }
    };
    reader.readAsText(file);
}

function exportExcel() {
    if(!vData.bazin_h) return alert("Calcule os resultados primeiro!");
    const wb = XLSX.utils.book_new();
    
    // Organizar excel em colunas (flat)
    const row1_headers = [
        "Ticker", "Cotação Atual", "PEG Ratio (Atual)", "PEG Ratio (Histórico)", 
        "Graham Trad. (Atual)", "Graham Trad. (Proj)", "Graham Mod. (Atual)", "Graham Mod. (Proj)",
        "Preço Justo (P/L Médio)", "Preço Justo (P/L Médio + LPA Proj)", 
        "Preço Alvo Múltiplo Futuro (VP)"
    ];
    
    const row2_values = [
        vData.ticker, vData.cot, vData.peg_atual, vData.peg_hist,
        vData.graham_trad_a.toFixed(2), vData.graham_trad_p.toFixed(2), 
        vData.graham_mod_a.toFixed(2), vData.graham_mod_p.toFixed(2),
        vData.justo_pl_hist_a.toFixed(2), vData.justo_pl_hist_p.toFixed(2),
        vData.multiplo_futuro.toFixed(2)
    ];

    // Adiciona Bazin nas colunas dinamicamente
    vData.bazin_h.forEach(b => {
        row1_headers.push(`Bazin Hist. (${b.dy}%)`);
        row2_values.push(b.val.toFixed(2));
    });
    vData.bazin_p.forEach(b => {
        row1_headers.push(`Bazin Proj. (${b.dy}%)`);
        row2_values.push(b.val.toFixed(2));
    });

    const ws1 = XLSX.utils.aoa_to_sheet([row1_headers, row2_values]);
    
    // Formatação básica de colunas
    const wscols = row1_headers.map(() => ({wch: 22}));
    ws1['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws1, "Resumo Completo");
    XLSX.writeFile(wb, `Valuation_${vData.ticker || 'Acao'}.xlsx`);
}
