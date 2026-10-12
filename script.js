// Trocar de abas
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Global Results Object
let valuationResults = {};

// Cálculos
function calcularTudo() {
    // Captura dados
    const getVal = id => parseFloat(document.getElementById(id).value) || 0;
    
    const p_atual = getVal('preco_atual');
    const lpa_atual = getVal('lpa_atual');
    const vpa_atual = getVal('vpa_atual');
    const pl_atual = getVal('pl_atual');
    
    const lpa_norm = getVal('lpa_norm');
    const vpa_norm = getVal('vpa_norm');
    const pl_hist = getVal('pl_hist');
    const dpa_hist = getVal('dpa_hist');
    const payout_hist = getVal('payout_hist') / 100;
    
    const cagr = getVal('cagr');
    const sgr = getVal('sgr');
    const growthType = document.getElementById('growth_type').value;
    const growthRate = growthType === 'cagr' ? cagr : sgr;
    
    const dy_targets_str = document.getElementById('dy_targets').value;
    const dy_targets = dy_targets_str.split(',').map(s => parseFloat(s.trim())/100).filter(n => !isNaN(n));

    // 1. PEG Ratio
    const peg_ratio = growthRate > 0 ? (pl_atual / growthRate).toFixed(2) : 'N/A';

    // 2. Preço Justo Graham (Recente vs Normalizado)
    const calcGraham = (lpa, vpa) => (lpa > 0 && vpa > 0) ? Math.sqrt(22.5 * lpa * vpa) : 0;
    const graham_recente = calcGraham(lpa_atual, vpa_atual);
    const graham_norm = calcGraham(lpa_norm, vpa_norm);

    // 3. Valuation P/L Histórico
    const pl_valuation = lpa_atual * pl_hist;

    // 4. Preço Teto Bazin (Tabela)
    const bazin_table_body = document.querySelector('#bazin_table tbody');
    bazin_table_body.innerHTML = '';
    
    const bazinResults = [];
    const dpa_proj = lpa_norm * payout_hist;

    dy_targets.forEach(dy => {
        const teto_hist = dpa_hist / dy;
        const teto_proj = dpa_proj / dy;
        
        bazinResults.push({
            dy: (dy * 100).toFixed(2) + '%',
            teto_hist: teto_hist,
            teto_proj: teto_proj
        });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${(dy * 100).toFixed(2)}%</td>
            <td>R$ ${teto_hist.toFixed(2)}</td>
            <td>R$ ${teto_proj.toFixed(2)}</td>
        `;
        bazin_table_body.appendChild(tr);
    });

    // Save state for exports
    valuationResults = {
        peg_ratio, graham_recente, graham_norm, pl_valuation, bazinResults,
        inputs: {
            p_atual, lpa_atual, vpa_atual, pl_atual, lpa_norm, vpa_norm, pl_hist, dpa_hist, payout_hist, cagr, sgr
        }
    };

    // Renderizar Cards de Resultado
    renderCards(peg_ratio, graham_recente, graham_norm, pl_valuation);
    
    // Mudar para a aba de resultados
    switchTab('results');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
}

function renderCards(peg, graham_r, graham_n, pl_val) {
    const container = document.getElementById('results_container');
    container.innerHTML = `
        <div class="result-card">
            <h4>PEG Ratio</h4>
            <div class="value">${peg}</div>
            <div class="desc">Abaixo de 1 indica desconto.</div>
        </div>
        <div class="result-card">
            <h4>Graham (Recente)</h4>
            <div class="value">R$ ${graham_r.toFixed(2)}</div>
            <div class="desc">Baseado no LPA e VPA atuais.</div>
        </div>
        <div class="result-card">
            <h4>Graham (Normalizado)</h4>
            <div class="value">R$ ${graham_n.toFixed(2)}</div>
            <div class="desc">Baseado no LPA e VPA históricos.</div>
        </div>
        <div class="result-card">
            <h4>P/L Histórico</h4>
            <div class="value">R$ ${pl_val.toFixed(2)}</div>
            <div class="desc">LPA Atual x P/L Médio.</div>
        </div>
    `;
}

// Export JSON
function exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(valuationResults));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "valuation_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Import JSON
function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.inputs) {
                Object.keys(data.inputs).forEach(key => {
                    const el = document.getElementById(key);
                    if (el) el.value = data.inputs[key];
                });
                alert("Dados importados com sucesso! Clique em calcular para atualizar a tela.");
            }
        } catch (err) {
            alert("Erro ao ler JSON.");
        }
    };
    reader.readAsText(file);
}

// Export Excel (SheetJS)
function exportExcel() {
    if (!valuationResults.bazinResults) {
        alert("Por favor, calcule os resultados primeiro.");
        return;
    }

    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Resumo Valuation
    const ws1_data = [
        ["Métrica", "Valor"],
        ["PEG Ratio", valuationResults.peg_ratio],
        ["Graham (Dados Recentes)", "R$ " + valuationResults.graham_recente.toFixed(2)],
        ["Graham (Dados Normalizados)", "R$ " + valuationResults.graham_norm.toFixed(2)],
        ["Preço Justo por P/L Histórico", "R$ " + valuationResults.pl_valuation.toFixed(2)]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(ws1_data);
    
    // Sheet 2: Bazin
    const ws2_data = [["Dividend Yield Alvo", "Preço Teto Histórico (R$)", "Preço Teto Projetivo (R$)"]];
    valuationResults.bazinResults.forEach(r => {
        ws2_data.push([r.dy, r.teto_hist, r.teto_proj]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(ws2_data);

    XLSX.utils.book_append_sheet(wb, ws1, "Resumo Valuation");
    XLSX.utils.book_append_sheet(wb, ws2, "Preços Teto Bazin");

    XLSX.writeFile(wb, "Precos_Alvo_Valuation.xlsx");
}
