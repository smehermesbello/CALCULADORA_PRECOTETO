/**
 * Script Principal - Calculadora de Valuation Multi-Metodologia
 * Inclui sincronização global, suporte a bilhões com vírgula e importação/exportação JSON/Excel.
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initGlobalSync();
    initBazinModule();
    initDyProjetivoModule();
    initPegModule();
    initRoeProjModule();
    initRoeEqModule();
    initImportExport();
});

/**
 * Utilitários de formatação e conversão numérica
 */
function formatBRL(value) {
    if (isNaN(value) || !isFinite(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatPercent(value) {
    if (isNaN(value) || !isFinite(value)) return '0,00%';
    return (value * 100).toFixed(2).replace('.', ',') + '%';
}

function parseNumber(value) {
    if (typeof value !== 'string') value = String(value || '0');
    const cleanVal = value.trim().replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanVal);
    return isNaN(num) ? 0 : num;
}

/**
 * Converte valor permitindo abreviação em bilhões com vírgula (ex: "10,3" vira 10.300.000.000)
 */
function parseFinancialInput(valueStr, isBillionMode) {
    if (typeof valueStr !== 'string') valueStr = String(valueStr || '0');
    valueStr = valueStr.trim();
    if (!valueStr) return 0;

    const num = parseNumber(valueStr);
    // Se o modo bilhões estiver ativado e o número for relativamente pequeno (< 1,000,000), interpretamos como bilhões.
    if (isBillionMode && Math.abs(num) > 0 && Math.abs(num) < 1000000) {
        return num * 1000000000;
    }
    return num;
}

/**
 * Gerenciamento de abas
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const activeSection = document.getElementById(targetTab);
            if (activeSection) activeSection.classList.add('active');
        });
    });
}

/**
 * Simulação de busca de cotação e sincronização global
 */
function setupTickerLookup(tickerInputId, statusId, priceInputId, callback) {
    const tickerInput = document.getElementById(tickerInputId);
    const statusMsg = document.getElementById(statusId);
    const priceInput = document.getElementById(priceInputId);

    if (!tickerInput || !priceInput) return;

    let timeout = null;
    tickerInput.addEventListener('input', () => {
        const ticker = tickerInput.value.trim().toUpperCase();
        if (ticker.length < 3) {
            if (statusMsg) statusMsg.textContent = '';
            return;
        }

        if (statusMsg) statusMsg.textContent = `Buscando cotação de ${ticker}... (modo simulado)`;

        clearTimeout(timeout);
        timeout = setTimeout(() => {
            let simulatedPrice = 15.00;
            for (let i = 0; i < ticker.length; i++) {
                simulatedPrice += ticker.charCodeAt(i);
            }
            simulatedPrice = (simulatedPrice % 80 + 10).toFixed(2);

            priceInput.value = simulatedPrice;
            priceInput.dispatchEvent(new Event('input'));

            if (statusMsg) statusMsg.textContent = `Cotação de ${ticker} carregada!`;
            setTimeout(() => { if (statusMsg) statusMsg.textContent = ''; }, 3000);
            if (callback) callback();
        }, 800);
    });
}

/**
 * Sincronização da Aba Consolidada ("Todas de uma vez") com as demais abas
 */
function initGlobalSync() {
    setupTickerLookup('g-ticker', 'g-ticker-status', 'g-preco', updateConsolidated);

    const gInputs = [
        'g-ticker', 'g-preco', 'g-lucro', 'g-pl-atual', 'g-acoes', 
        'g-payout', 'g-roe', 'g-pl-multi', 'g-pvp', 'g-dy-min', 'global-scale-billion'
    ];

    gInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updateConsolidated);
            el.addEventListener('change', updateConsolidated);
        }
    });

    function updateConsolidated() {
        const isBillion = document.getElementById('global-scale-billion').checked;
        const ticker = document.getElementById('g-ticker').value;
        const preco = parseNumber(document.getElementById('g-preco').value);
        const lucro = parseFinancialInput(document.getElementById('g-lucro').value, isBillion);
        const plAtual = parseFinancialInput(document.getElementById('g-pl-atual').value, isBillion);
        const acoes = parseNumber(document.getElementById('g-acoes').value);
        const payout = parseNumber(document.getElementById('g-payout').value);
        const roe = parseNumber(document.getElementById('g-roe').value);
        const plMulti = parseNumber(document.getElementById('g-pl-multi').value);
        const pvp = parseNumber(document.getElementById('g-pvp').value);
        const dyMin = parseNumber(document.getElementById('g-dy-min').value);

        // Alimentar Abas Individuais automaticamente
        if (ticker) {
            const bazinTick = document.getElementById('bazin-ticker');
            const dypTick = document.getElementById('dyp-ticker');
            if (bazinTick) bazinTick.value = ticker;
            if (dypTick) dypTick.value = ticker;
        }
        if (preco > 0) {
            const bazinPreco = document.getElementById('bazin-preco');
            const dypPreco = document.getElementById('dyp-preco');
            if (bazinPreco) bazinPreco.value = preco;
            if (dypPreco) dypPreco.value = preco;
        }

        // 1. Bazin Summary (estimado via DPA médio simulado ou atual)
        const dpaEstimado = acoes > 0 ? (lucro * (payout / 100)) / acoes : 2.00;
        const bazinTeto = dyMin > 0 ? dpaEstimado / dyMin : 0;
        document.getElementById('sum-bazin-teto').textContent = formatBRL(bazinTeto);
        const sumBazinBadge = document.getElementById('sum-bazin-status');
        if (bazinTeto > 0 && preco > 0) {
            sumBazinBadge.className = preco <= bazinTeto ? 'badge success' : 'badge danger';
            sumBazinBadge.textContent = preco <= bazinTeto ? 'Atrativo' : 'Esticado';
        } else {
            sumBazinBadge.className = 'badge info';
            sumBazinBadge.textContent = 'Preencha dados';
        }

        // 2. DY Projetivo Summary
        const lpa = acoes > 0 ? lucro / acoes : 0;
        const dpaProj = lpa * (payout / 100);
        const dyProj = preco > 0 ? dpaProj / preco : 0;
        document.getElementById('sum-dyp-dy').textContent = formatPercent(dyProj);
        const sumDypBadge = document.getElementById('sum-dyp-status');
        sumDypBadge.className = dyProj >= dyMin ? 'badge success' : 'badge warning';
        sumDypBadge.textContent = dyProj >= dyMin ? 'Acima do DY Mín' : 'Abaixo do DY Mín';

        // 3. PEG Ratio Summary
        const payoutDec = payout / 100;
        const roeDec = roe / 100;
        let denom = 1 - payoutDec;
        if (denom <= 0) denom = 0.01;
        const peg = (plMulti / denom) * roeDec;
        document.getElementById('sum-peg-val').textContent = isNaN(peg) ? '0.00' : peg.toFixed(2).replace('.', ',');
        const sumPegBadge = document.getElementById('sum-peg-status');
        if (peg < 1) { sumPegBadge.className = 'badge success'; sumPegBadge.textContent = 'Muito Barato'; }
        else if (peg <= 2) { sumPegBadge.className = 'badge info'; sumPegBadge.textContent = 'Bom Valor'; }
        else if (peg <= 3) { sumPegBadge.className = 'badge warning'; sumPegBadge.textContent = 'Caro'; }
        else { sumPegBadge.className = 'badge danger'; sumPegBadge.textContent = 'Sobrevalorizado'; }

        // 4. ROE Projetivo Summary
        const divEsperados = lucro * 0.4; // Estimativa padrão se não informado
        const plFinal = plAtual + lucro - divEsperados;
        const plMedio = (plAtual + plFinal) / 2;
        const roeProjVal = plMedio > 0 ? lucro / plMedio : 0;
        document.getElementById('sum-roej-val').textContent = formatPercent(roeProjVal);
        const sumRoejBadge = document.getElementById('sum-roej-status');
        sumRoejBadge.className = roeProjVal >= 0.15 ? 'badge success' : 'badge warning';
        sumRoejBadge.textContent = roeProjVal >= 0.15 ? 'Robusto' : 'Moderado';

        // 5. ROE Equivalente Summary
        const roeEq = pvp > 0 ? (roe / 100) / pvp : 0;
        document.getElementById('sum-roee-val').textContent = formatPercent(roeEq);
        const sumRoeeBadge = document.getElementById('sum-roee-status');
        sumRoeeBadge.className = roeEq >= 0.12 ? 'badge success' : 'badge info';
        sumRoeeBadge.textContent = roeEq >= 0.12 ? 'Excelente Retorno' : 'Acompanhar';
    }

    updateConsolidated();
}

/**
 * Módulo 1: Valuation Preço Teto de Bazin
 */
function initBazinModule() {
    setupTickerLookup('bazin-ticker', 'bazin-ticker-status', 'bazin-preco', calcBazin);

    const dpaListContainer = document.getElementById('bazin-dpa-list');
    const addDpaBtn = document.getElementById('bazin-add-dpa');
    const precoInput = document.getElementById('bazin-preco');
    const dySelect = document.getElementById('bazin-dy');

    addDpaInputField(1.80);
    addDpaInputField(2.10);
    addDpaInputField(2.50);

    addDpaBtn.addEventListener('click', () => {
        addDpaInputField();
        calcBazin();
    });

    precoInput.addEventListener('input', calcBazin);
    dySelect.addEventListener('change', calcBazin);

    function addDpaInputField(defaultValue = '') {
        const wrap = document.createElement('div');
        wrap.className = 'dpa-item-wrap';

        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.01';
        input.value = defaultValue;
        input.placeholder = 'R$ DPA';
        input.addEventListener('input', calcBazin);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-remove-dpa';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
            wrap.remove();
            calcBazin();
        });

        wrap.appendChild(input);
        wrap.appendChild(removeBtn);
        dpaListContainer.appendChild(wrap);
    }

    function calcBazin() {
        const dpaInputs = dpaListContainer.querySelectorAll('input');
        let somaDpa = 0;
        let countDpa = 0;

        dpaInputs.forEach(inp => {
            const val = parseNumber(inp.value);
            if (!isNaN(val)) {
                somaDpa += val;
                countDpa++;
            }
        });

        const dpaMedio = countDpa > 0 ? somaDpa / countDpa : 0;
        const dyMinimo = parseNumber(dySelect.value);
        const precoAtual = parseNumber(precoInput.value);
        const precoTeto = dyMinimo > 0 ? dpaMedio / dyMinimo : 0;

        let margemSeguranca = 0;
        if (precoTeto > 0) {
            margemSeguranca = ((precoTeto - precoAtual) / precoTeto) * 100;
        }

        document.getElementById('res-bazin-dpa-medio').textContent = formatBRL(dpaMedio);
        document.getElementById('res-bazin-preco-teto').textContent = formatBRL(precoTeto);
        document.getElementById('res-bazin-margem').textContent = margemSeguranca.toFixed(2).replace('.', ',') + '%';

        const statusBadge = document.getElementById('res-bazin-status');
        if (precoAtual <= 0 || precoTeto <= 0) {
            statusBadge.className = 'badge info';
            statusBadge.textContent = 'Insira cotação e DPAs válidos';
        } else if (precoAtual < precoTeto) {
            statusBadge.className = 'badge success';
            statusBadge.textContent = `Oportunidade! Cotação abaixo do Preço Teto (Margem: ${margemSeguranca.toFixed(1)}%)`;
        } else {
            statusBadge.className = 'badge danger';
            statusBadge.textContent = 'Ação Cara! Cotação acima do Preço Teto de Bazin';
        }
    }

    calcBazin();
}

/**
 * Módulo 2: Valuation com DY Projetivo
 */
function initDyProjetivoModule() {
    setupTickerLookup('dyp-ticker', 'dyp-ticker-status', 'dyp-preco', calcDyProjetivo);

    const precoInput = document.getElementById('dyp-preco');
    const payoutInput = document.getElementById('dyp-payout');
    const lucroInput = document.getElementById('dyp-lucro');
    const acoesInput = document.getElementById('dyp-acoes');
    const dyMinSelect = document.getElementById('dyp-dy-min');

    [precoInput, payoutInput, lucroInput, acoesInput, dyMinSelect].forEach(inp => {
        inp.addEventListener('input', calcDyProjetivo);
    });
    dyMinSelect.addEventListener('change', calcDyProjetivo);

    function calcDyProjetivo() {
        const preco = parseNumber(precoInput.value);
        const payout = parseNumber(payoutInput.value) / 100;
        const lucro = parseFinancialInput(lucroInput.value, true);
        const acoes = parseNumber(acoesInput.value);
        const dyMin = parseNumber(dyMinSelect.value);

        const lpa = acoes > 0 ? lucro / acoes : 0;
        const dpa = lpa * payout;
        const dyProjetado = preco > 0 ? (dpa / preco) : 0;
        const precoTeto = dyMin > 0 ? dpa / dyMin : 0;

        document.getElementById('res-dyp-lpa').textContent = formatBRL(lpa);
        document.getElementById('res-dyp-dpa').textContent = formatBRL(dpa);
        document.getElementById('res-dyp-dy').textContent = formatPercent(dyProjetado);
        document.getElementById('res-dyp-preco-teto').textContent = formatBRL(precoTeto);

        const badge = document.getElementById('res-dyp-status');
        if (preco <= 0 || precoTeto <= 0) {
            badge.className = 'badge info';
            badge.textContent = 'Preencha todos os campos corretamente';
        } else if (preco <= precoTeto) {
            badge.className = 'badge success';
            badge.textContent = 'Ação Atrativa pelo DY Projetivo';
        } else {
            badge.className = 'badge danger';
            badge.textContent = 'Ação Esticada em relação ao DY Projetado';
        }
    }

    calcDyProjetivo();
}

/**
 * Módulo 3: Análise de PEG Ratio
 */
function initPegModule() {
    const plInput = document.getElementById('peg-pl');
    const payoutInput = document.getElementById('peg-payout');
    const roeInput = document.getElementById('peg-roe');

    [plInput, payoutInput, roeInput].forEach(inp => inp.addEventListener('input', calcPegRatio));

    function calcPegRatio() {
        const pl = parseNumber(plInput.value);
        const payout = parseNumber(payoutInput.value) / 100;
        const roe = parseNumber(roeInput.value) / 100;

        let denominador = 1 - payout;
        if (denominador <= 0) denominador = 0.01;

        const peg = (pl / denominador) * roe;

        document.getElementById('res-peg-val').textContent = isNaN(peg) || !isFinite(peg) ? '0.00' : peg.toFixed(2).replace('.', ',');

        const classBadge = document.getElementById('res-peg-class');
        if (isNaN(peg) || !isFinite(peg)) {
            classBadge.className = 'badge info';
            classBadge.textContent = 'Aguardando dados...';
            return;
        }

        if (peg < 1) {
            classBadge.className = 'badge success';
            classBadge.textContent = 'Muito Barato (< 1) - Verde';
        } else if (peg >= 1 && peg <= 2) {
            classBadge.className = 'badge info';
            classBadge.textContent = 'Valor Bom (1 a 2) - Azul';
        } else if (peg > 2 && peg <= 3) {
            classBadge.className = 'badge warning';
            classBadge.textContent = 'Caro (2 a 3) - Laranja';
        } else {
            classBadge.className = 'badge danger';
            classBadge.textContent = 'Sobrevalorizado (> 3) - Vermelho';
        }
    }

    calcPegRatio();
}

/**
 * Módulo 4: ROE Projetivo
 */
function initRoeProjModule() {
    const lucroInput = document.getElementById('roej-lucro');
    const plInicialInput = document.getElementById('roej-pl-inicial');
    const divInput = document.getElementById('roej-div');

    [lucroInput, plInicialInput, divInput].forEach(inp => inp.addEventListener('input', calcRoeProjetivo));

    function calcRoeProjetivo() {
        const lucro = parseFinancialInput(lucroInput.value, true);
        const plInicial = parseFinancialInput(plInicialInput.value, true);
        const dividendos = parseFinancialInput(divInput.value, true);

        const plFinal = plInicial + lucro - dividendos;
        const plMedio = (plInicial + plFinal) / 2;
        const roeProjetivo = plMedio > 0 ? (lucro / plMedio) : 0;

        document.getElementById('res-roej-pl-final').textContent = formatBRL(plFinal);
        document.getElementById('res-roej-pl-medio').textContent = formatBRL(plMedio);
        document.getElementById('res-roej-val').textContent = formatPercent(roeProjetivo);

        const stepText = `Passo a Passo do Cálculo:
1. PL Final Projetado: PL Inicial (${formatBRL(plInicial)}) + Lucro Projetado (${formatBRL(lucro)}) - Dividendos (${formatBRL(dividendos)}) = ${formatBRL(plFinal)}
2. PL Médio Projetado: (PL Inicial + PL Final) / 2 = (${formatBRL(plInicial)} + ${formatBRL(plFinal)}) / 2 = ${formatBRL(plMedio)}
3. ROE Projetivo: (Lucro Projetado / PL Médio) × 100 = (${formatBRL(lucro)} / ${formatBRL(plMedio)}) × 100 = ${(roeProjetivo * 100).toFixed(2)}%`;

        document.getElementById('roej-step-by-step').textContent = stepText;
    }

    calcRoeProjetivo();
}

/**
 * Módulo 5: ROE Equivalente (15 anos)
 */
function initRoeEqModule() {
    const roeInput = document.getElementById('roee-roe');
    const pvpInput = document.getElementById('roee-pvp');
    const acoesInput = document.getElementById('roee-acoes');
    const lucroInput = document.getElementById('roee-lucro');
    const plInput = document.getElementById('roee-pl');
    const payoutInput = document.getElementById('roee-payout');

    [roeInput, pvpInput, acoesInput, lucroInput, plInput, payoutInput].forEach(inp => {
        inp.addEventListener('input', calcRoeEquivalente);
    });

    function calcRoeEquivalente() {
        const roe = parseNumber(roeInput.value) / 100;
        const pvp = parseNumber(pvpInput.value);
        const acoes = parseNumber(acoesInput.value);
        let lucro = parseFinancialInput(lucroInput.value, true);
        let pl = parseFinancialInput(plInput.value, true);
        const payout = parseNumber(payoutInput.value) / 100;

        const roeEq = pvp > 0 ? roe / pvp : 0;
        const retido = 1 - payout;
        const lpa = acoes > 0 ? lucro / acoes : 0;
        const dpa = lpa * payout;

        document.getElementById('res-roee-equivalente').textContent = formatPercent(roeEq);
        document.getElementById('res-roee-retido').textContent = formatPercent(retido);
        document.getElementById('res-roee-lpa').textContent = formatBRL(lpa);
        document.getElementById('res-roee-dpa').textContent = formatBRL(dpa);

        const tbody = document.querySelector('#roee-table tbody');
        tbody.innerHTML = '';

        let currentPL = pl;
        let currentLucro = lucro;
        let acumDiv = 0;

        if (currentPL <= 0 && currentLucro > 0) {
            currentPL = currentLucro * 5;
        }

        for (let ano = 1; ano <= 15; ano++) {
            if (ano > 1) {
                currentLucro = currentPL * roeEq;
            }

            const divAno = currentLucro * payout;
            const dpaAno = acoes > 0 ? divAno / acoes : 0;
            const lucroRetidoAno = currentLucro * retido;

            acumDiv += divAno;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>Ano ${ano}</td>
                <td>${formatBRL(currentPL)}</td>
                <td>${formatBRL(currentLucro)}</td>
                <td>${formatBRL(divAno)}</td>
                <td>${formatBRL(dpaAno)}</td>
                <td><strong>${formatBRL(acumDiv)}</strong></td>
            `;
            tbody.appendChild(tr);

            currentPL += lucroRetidoAno;
        }
    }

    calcRoeEquivalente();
}

/**
 * Módulo de Importação / Exportação (JSON e Excel/CSV)
 */
function initImportExport() {
    const btnExportJson = document.getElementById('btn-export-json');
    const btnExportExcel = document.getElementById('btn-export-excel');
    const fileImportJson = document.getElementById('file-import-json');

    btnExportJson.addEventListener('click', () => {
        const data = gatherCurrentState();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `valuation_${(data.ticker || 'acao').toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    btnExportExcel.addEventListener('click', () => {
        const data = gatherCurrentState();
        let csv = '\uFEFFMétrica;Valor\n';
        for (const [key, val] of Object.entries(data)) {
            csv += `${key};"${val}"\n`;
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `valuation_${(data.ticker || 'acao').toLowerCase()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });

    fileImportJson.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                applyState(imported);
                alert(`Dados da ação ${imported.ticker || ''} importados com sucesso! O sistema foi atualizado.`);
            } catch (err) {
                alert('Erro ao ler o arquivo JSON. Certifique-se de que é um formato válido.');
            }
        };
        reader.readAsText(file);
    });

    function gatherCurrentState() {
        return {
            ticker: document.getElementById('g-ticker').value,
            cotacao: document.getElementById('g-preco').value,
            lucroProjetivo: document.getElementById('g-lucro').value,
            patrimonioLiquido: document.getElementById('g-pl-atual').value,
            acoesCirculacao: document.getElementById('g-acoes').value,
            payout: document.getElementById('g-payout').value,
            roe: document.getElementById('g-roe').value,
            pl: document.getElementById('g-pl-multi').value,
            pvp: document.getElementById('g-pvp').value,
            dyMinimo: document.getElementById('g-dy-min').value
        };
    }

    function applyState(data) {
        if (data.ticker) document.getElementById('g-ticker').value = data.ticker;
        if (data.cotacao) document.getElementById('g-preco').value = data.cotacao;
        if (data.lucroProjetivo) document.getElementById('g-lucro').value = data.lucroProjetivo;
        if (data.patrimonioLiquido) document.getElementById('g-pl-atual').value = data.patrimonioLiquido;
        if (data.acoesCirculacao) document.getElementById('g-acoes').value = data.acoesCirculacao;
        if (data.payout) document.getElementById('g-payout').value = data.payout;
        if (data.roe) document.getElementById('g-roe').value = data.roe;
        if (data.pl) document.getElementById('g-pl-multi').value = data.pl;
        if (data.pvp) document.getElementById('g-pvp').value = data.pvp;
        if (data.dyMinimo) document.getElementById('g-dy-min').value = data.dyMinimo;

        // Disparar evento para recalcular
        document.getElementById('g-ticker').dispatchEvent(new Event('input'));
    }
}
