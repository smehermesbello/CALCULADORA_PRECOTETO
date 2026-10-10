// --- Database / State with Sample Stocks & JSON support ---
let stockDatabase = [
    {
        ticker: "PETR4",
        cotacao: 38.50,
        pl: 4.17,
        pvp: 1.43,
        roe: 34.2,
        lucro: 120000000000,
        plInicial: 350000000000,
        dpaHist: 4.50,
        payout: 60.0,
        papeis: 13000000000,
        receita: 500000000000,
        valorMercado: 450000000000
    },
    {
        ticker: "VALE3",
        cotacao: 62.40,
        pl: 6.80,
        pvp: 1.20,
        roe: 18.5,
        lucro: 40000000000,
        plInicial: 220000000000,
        dpaHist: 3.80,
        payout: 50.0,
        papeis: 4500000000,
        receita: 200000000000,
        valorMercado: 280000000000
    },
    {
        ticker: "BBAS3",
        cotacao: 27.20,
        pl: 4.50,
        pvp: 0.85,
        roe: 21.0,
        lucro: 35000000000,
        plInicial: 160000000000,
        dpaHist: 2.90,
        payout: 45.0,
        papeis: 5700000000,
        receita: 150000000000,
        valorMercado: 155000000000
    },
    {
        ticker: "TAEE11",
        cotacao: 35.80,
        pl: 8.90,
        pvp: 2.10,
        roe: 24.0,
        lucro: 2200000000,
        plInicial: 9500000000,
        dpaHist: 3.20,
        payout: 85.0,
        papeis: 1034000000,
        receita: 6000000000,
        valorMercado: 37000000000
    }
];

let currentChart = null;

// --- Navigation setup ---
document.addEventListener("DOMContentLoaded", () => {
    const navButtons = document.querySelectorAll(".nav-btn");
    const sections = document.querySelectorAll(".module-section");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active"));

            btn.classList.add("active");
            const targetId = btn.getAttribute("data-target");
            document.getElementById(targetId).classList.add("active");
        });
    });

    // Initialize with default stock data
    loadStockIntoForms("PETR4");

    // Event Listeners for I/O
    document.getElementById("exportJson").addEventListener("click", exportToJson);
    document.getElementById("exportExcel").addEventListener("click", exportToExcel);
    document.getElementById("importJson").addEventListener("change", importFromJson);
    document.getElementById("btnFetchInvestidor10").addEventListener("click", fetchInvestidor10Data);
    document.getElementById("btnRunAll").addEventListener("click", runAllModules);

    // Initial calculations
    calcBazin();
    calcDyProj();
    calcRoeProj();
    calcPegRatio();
    calcLongTerm();
});

// --- Find and Load Stock Data into Inputs ---
function loadStockIntoForms(tickerSymbol) {
    const stock = stockDatabase.find(s => s.ticker.toUpperCase() === tickerSymbol.toUpperCase());
    if (!stock) return false;

    // Badge
    document.getElementById("currentStockBadge").innerHTML = `<i class="fa-solid fa-tag"></i> Ticker: <strong>${stock.ticker}</strong> (Cotação: R$ ${stock.cotacao.toFixed(2)})`;
    document.getElementById("tickerSearch").value = stock.ticker;

    // Integrated / General
    setVal("int-ticker", stock.ticker);
    setVal("int-cotacao", stock.cotacao);
    setVal("int-pl", stock.plInicial);
    setVal("int-lucro", stock.lucro);
    setVal("int-dpa-hist", stock.dpaHist);
    setVal("int-payout", stock.payout);
    setVal("int-papeis", stock.papeis);
    setVal("int-pl-multiplo", stock.pl);
    setVal("int-pvp", stock.pvp);
    setVal("int-roe", stock.roe);

    // Module 1: Bazin
    setVal("bazin-dpa", stock.dpaHist);
    setVal("bazin-cotacao", stock.cotacao);

    // Module 2: DY Projetivo
    setVal("dy-lucro", stock.lucro);
    setVal("dy-papeis", stock.papeis);
    setVal("dy-payout", stock.payout);
    setVal("dy-cotacao", stock.cotacao);

    // Module 3: ROE Projetivo
    setVal("roe-pli", stock.plInicial);
    setVal("roe-lucro", stock.lucro);
    setVal("roe-divs", stock.lucro * (stock.payout / 100));

    // Module 4: PEG
    setVal("peg-pl", stock.pl);
    setVal("peg-payout", stock.payout);
    setVal("peg-roe", stock.roe);
    setVal("peg-receita", stock.receita);
    setVal("peg-valormercado", stock.valorMercado);

    // Module 5: Long Term
    setVal("lt-pli", stock.plInicial);
    setVal("lt-lucro", stock.lucro);
    setVal("lt-roe", stock.roe);
    setVal("lt-pvp", stock.pvp);
    setVal("lt-papeis", stock.papeis);
    setVal("lt-payout", stock.payout);

    return true;
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function getNum(id) {
    const el = document.getElementById(id);
    return el ? parseFloat(el.value) || 0 : 0;
}

// --- Investidor 10 / Web Search Simulation ---
function fetchInvestidor10Data() {
    const query = document.getElementById("tickerSearch").value.trim().toUpperCase();
    if (!query) {
        alert("Digite um ticker válido.");
        return;
    }

    const found = loadStockIntoForms(query);
    if (found) {
        alert(`Dados de ${query} carregados com sucesso do banco simulado (Investidor 10 / Mercado)!`);
        runAllModules();
    } else {
        const newStock = {
            ticker: query,
            cotacao: 25.00,
            pl: 8.0,
            pvp: 1.5,
            roe: 15.0,
            lucro: 500000000,
            plInicial: 3000000000,
            dpaHist: 1.80,
            payout: 50.0,
            papeis: 200000000,
            receita: 2000000000,
            valorMercado: 5000000000
        };
        stockDatabase.push(newStock);
        loadStockIntoForms(query);
        alert(`Ticker ${query} não estava na base local. Adicionado com dados padrão para edição!`);
        runAllModules();
    }
}

// --- MODULE 1: BAZIN ---
function calcBazin() {
    const dpa = getNum("bazin-dpa");
    const cotacao = getNum("bazin-cotacao");

    const yields = [0.06, 0.08, 0.10, 0.12, 0.15];
    const container = document.getElementById("bazinPyramid");
    container.innerHTML = "";

    yields.forEach(y => {
        const precoTeto = dpa / y;
        const isAtrativo = cotacao <= precoTeto;
        const tierClass = `tier-${Math.round(y * 100)}`;
        const highlight = isAtrativo ? "highlight" : "";

        container.innerHTML += `
            <div class="pyramid-tier ${tierClass} ${highlight}">
                <span>${(y * 100)}% (DPA / ${(y * 100)}%)</span>
                <span>R$ ${precoTeto.toFixed(2)} ${isAtrativo ? '✅ (Atrativo)' : '❌ (Acima do Teto)'}</span>
            </div>
        `;
    });
}

// --- MODULE 2: DY PROJETIVO ---
function calcDyProj() {
    const lucro = getNum("dy-lucro");
    const papeis = getNum("dy-papeis");
    const payout = getNum("dy-payout") / 100;
    const cotacao = getNum("dy-cotacao");

    const lpa = papeis > 0 ? lucro / papeis : 0;
    const dpa = lpa * payout;

    const resultsDiv = document.getElementById("dyProjResults");
    resultsDiv.innerHTML = `
        <div class="metric-row"><span>LPA Projetado:</span><strong>R$ ${lpa.toFixed(2)}</strong></div>
        <div class="metric-row"><span>DPA Projetado:</span><strong>R$ ${dpa.toFixed(2)}</strong></div>
        <div class="metric-row"><span>Cotação Atual:</span><strong>R$ ${cotacao.toFixed(2)}</strong></div>
    `;

    const yields = [0.06, 0.08, 0.10, 0.12, 0.15];
    const container = document.getElementById("dyPyramid");
    container.innerHTML = "";

    yields.forEach(y => {
        const precoTeto = dpa / y;
        const isAtrativo = cotacao <= precoTeto;
        const tierClass = `tier-${Math.round(y * 100)}`;
        const highlight = isAtrativo ? "highlight" : "";

        container.innerHTML += `
            <div class="pyramid-tier ${tierClass} ${highlight}">
                <span>${(y * 100)}% Retorno</span>
                <span>R$ ${precoTeto.toFixed(2)} ${isAtrativo ? '✅' : '❌'}</span>
            </div>
        `;
    });
}

// --- MODULE 3: ROE PROJETIVO ---
function calcRoeProj() {
    const pli = getNum("roe-pli");
    const lucro = getNum("roe-lucro");
    const divs = getNum("roe-divs");

    const plFinal = pli + lucro - divs;
    const plMedio = (pli + plFinal) / 2;
    const roeProj = plMedio > 0 ? (lucro / plMedio) * 100 : 0;

    const resDiv = document.getElementById("roeResults");
    resDiv.innerHTML = `
        <div class="metric-row"><span>PL Inicial:</span><strong>R$ ${pli.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong></div>
        <div class="metric-row"><span>PL Final Projetado:</span><strong>R$ ${plFinal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong></div>
        <div class="metric-row"><span>PL Médio Projetado:</span><strong>R$ ${plMedio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong></div>
        <div class="metric-row"><span>ROE Projetivo:</span><strong style="color: var(--success);">${roeProj.toFixed(2)}%</strong></div>
    `;

    return { plFinal, plMedio, roeProj };
}

// --- MODULE 4: PEG RATIO ---
function calcPegRatio() {
    const pl = getNum("peg-pl");
    const payout = getNum("peg-payout");
    const roe = getNum("peg-roe");
    const receita = getNum("peg-receita");
    const valorMercado = getNum("peg-valormercado");

    let resHtml = "";
    if (pl <= 0) {
        const psr = receita > 0 ? valorMercado / receita : 0;
        const psrAtrativo = psr < 1.0;
        resHtml = `
            <div class="metric-row"><span>Empresa sem Lucro Líquido:</span><strong style="color: var(--warning);">Análise via PSR</strong></div>
            <div class="metric-row"><span>PSR (Preço / Vendas):</span><strong>${psr.toFixed(2)}</strong></div>
            <div class="metric-row"><span>Avaliação:</span><strong style="color: ${psrAtrativo ? 'var(--success)' : 'var(--danger)'};">${psrAtrativo ? 'Atrativo (PSR < 1)' : 'Caro (PSR > 1)'}</strong></div>
        `;
    } else {
        const effectivePayout = payout > 1 ? payout / 100 : payout;
        const effectiveRoe = roe > 1 ? roe / 100 : roe;
        
        const denominador = (1 - effectivePayout) * effectiveRoe;
        const peg = denominador !== 0 ? pl / (denominador * 100) : 0;

        let interpretacao = "";
        let cor = "var(--text-primary)";
        if (peg < 1) { interpretacao = "Muito Barato (Excelente)", cor = "var(--success)"; }
        else if (peg <= 2) { interpretacao = "Valor Bom (Justo)", cor = "var(--accent)"; }
        else if (peg <= 3) { interpretacao = "Cara", cor = "var(--warning)"; }
        else { interpretacao = "Sobrevalorizada (Risco Alto)", cor = "var(--danger)"; }

        resHtml = `
            <div class="metric-row"><span>P/L:</span><strong>${pl.toFixed(2)}</strong></div>
            <div class="metric-row"><span>Retenção (1 - Payout):</span><strong>${((1 - effectivePayout) * 100).toFixed(1)}%</strong></div>
            <div class="metric-row"><span>ROE:</span><strong>${roe.toFixed(1)}%</strong></div>
            <div class="metric-row"><span>PEG Ratio Calculado:</span><strong style="font-size: 18px; color: ${cor};">${peg.toFixed(2)}</strong></div>
            <div class="metric-row"><span>Interpretação:</span><strong style="color: ${cor};">${interpretacao}</strong></div>
        `;
    }

    document.getElementById("pegResults").innerHTML = resHtml;
}

// --- MODULE 5: LONG TERM PROJECTION (15 YEARS) ---
function calcLongTerm() {
    let pli = getNum("lt-pli");
    let lucro = getNum("lt-lucro");
    const roe = getNum("lt-roe") / 100;
    const pvp = getNum("lt-pvp");
    const papeis = getNum("lt-papeis");
    const payout = getNum("lt-payout") / 100;

    const tbody = document.querySelector("#longTermTable tbody");
    tbody.innerHTML = "";

    const anosLabels = [];
    const lucrosData = [];
    const plsData = [];

    for (let ano = 1; ano <= 15; ano++) {
        const lucroAno = pli * roe;
        const patrimonioRetido = lucroAno * (1 - payout);
        const plFinal = pli + patrimonioRetido;
        const lpa = papeis > 0 ? lucroAno / papeis : 0;
        const dpa = lpa * payout;
        const roeEq = pvp > 0 ? (roe * 100) / pvp : 0;

        anosLabels.push(`Ano ${ano}`);
        lucrosData.push(lucroAno);
        plsData.push(plFinal);

        tbody.innerHTML += `
            <tr>
                <td>Ano ${ano}</td>
                <td>R$ ${lucroAno.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</td>
                <td>R$ ${patrimônioRetido ? patrimonioRetido.toLocaleString('pt-BR', {maximumFractionDigits: 0}) : 0}</td>
                <td>R$ ${plFinal.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</td>
                <td>R$ ${lpa.toFixed(2)}</td>
                <td>R$ ${dpa.toFixed(2)}</td>
                <td>${roeEq.toFixed(2)}%</td>
            </tr>
        `;

        pli = plFinal;
    }

    renderChart(anosLabels, lucrosData, plsData);
}

function renderChart(labels, lucros, pls) {
    const ctx = document.getElementById("longTermChart").getContext("2d");
    if (currentChart) {
        currentChart.destroy();
    }

    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Patrimônio Líquido (PL) (R$)',
                    data: pls,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.2
                },
                {
                    label: 'Lucro Líquido do Ano (R$)',
                    data: lucros,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: '#f8fafc' } }
            },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
            }
        }
    });
}

// --- RUN ALL MODULES (VISÃO INTEGRADA) ---
function runAllModules() {
    const ticker = document.getElementById("int-ticker").value;
    const cotacao = getNum("int-cotacao");
    const pl = getNum("int-pl");
    const lucro = getNum("int-lucro");
    const dpaHist = getNum("int-dpa-hist");
    const payout = getNum("int-payout");
    const papeis = getNum("int-papeis");
    const plMultiplo = getNum("int-pl-multiplo");
    const pvp = getNum("int-pvp");
    const roe = getNum("int-roe");

    setVal("bazin-dpa", dpaHist);
    setVal("bazin-cotacao", cotacao);

    setVal("dy-lucro", lucro);
    setVal("dy-papeis", papeis);
    setVal("dy-payout", payout);
    setVal("dy-cotacao", cotacao);

    setVal("roe-pli", pl);
    setVal("roe-lucro", lucro);
    setVal("roe-divs", lucro * (payout / 100));

    setVal("peg-pl", plMultiplo);
    setVal("peg-payout", payout);
    setVal("peg-roe", roe);

    setVal("lt-pli", pl);
    setVal("lt-lucro", lucro);
    setVal("lt-roe", roe);
    setVal("lt-pvp", pvp);
    setVal("lt-papeis", papeis);
    setVal("lt-payout", payout);

    calcBazin();
    calcDyProj();
    const roeRes = calcRoeProj();
    calcPegRatio();
    calcLongTerm();

    const bazinTeto6 = dpaHist / 0.06;
    const bazinTeto10 = dpaHist / 0.10;
    const summaryDiv = document.getElementById("integratedSummary");

    summaryDiv.innerHTML = `
        <div class="metric-row"><span>Ticker Analisado:</span><strong>${ticker}</strong></div>
        <div class="metric-row"><span>Cotação Atual:</span><strong>R$ ${cotacao.toFixed(2)}</strong></div>
        <div class="metric-row"><span>Preço Teto Bazin (6%):</span><strong style="color: var(--success);">R$ ${bazinTeto6.toFixed(2)}</strong></div>
        <div class="metric-row"><span>Preço Teto Bazin (10%):</span><strong style="color: var(--warning);">R$ ${bazinTeto10.toFixed(2)}</strong></div>
        <div class="metric-row"><span>ROE Projetivo:</span><strong style="color: var(--success);">${roeRes.roeProj.toFixed(2)}%</strong></div>
        <div class="metric-row"><span>Status Geral:</span><strong style="color: ${cotacao <= bazinTeto10 ? 'var(--success)' : 'var(--danger)'};">${cotacao <= bazinTeto10 ? 'Excelente Oportunidade (Abaixo do Teto)' : 'Atenção / Acima do Preço Teto'}</strong></div>
    `;
}

// --- IMPORT & EXPORT JSON / EXCEL ---
function exportToJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stockDatabase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "acoes_valuation_portfolio.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                importedData.forEach(importedStock => {
                    const index = stockDatabase.findIndex(s => s.ticker.toUpperCase() === importedStock.ticker.toUpperCase());
                    if (index >= 0) {
                        stockDatabase[index] = importedStock;
                    } else {
                        stockDatabase.push(importedStock);
                    }
                });
                alert(`JSON importado com sucesso! ${importedData.length} ações integradas. Novas ações foram somadas à base.`);
                loadStockIntoForms(importedData[0].ticker);
                runAllModules();
            } else {
                alert("Formato de JSON inválido. Deve ser um array de objetos.");
            }
        } catch (err) {
            alert("Erro ao ler o arquivo JSON: " + err.message);
        }
    };
    reader.readAsText(file);
}

function exportToExcel() {
    const table = document.getElementById("longTermTable");
    const wb = XLSX.utils.table_to_book(table, {sheet: "Projeção 15 Anos"});
    XLSX.writeFile(wb, "Projecao_Valuation_15Anos.xlsx");
}
