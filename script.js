/**
 * Script Principal - Calculadora de Valuation & Múltiplos
 * Desenvolvido em Vanilla JavaScript (ES6+) com foco em clareza didática.
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initBazinModule();
    initDyProjetivoModule();
    initPegModule();
    initRoeProjModule();
    initRoeEqModule();
});

/**
 * Formata valores numéricos para moeda Real (BRL)
 */
function formatBRL(value) {
    if (isNaN(value) || !isFinite(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/**
 * Formata valores numéricos para porcentagem
 */
function formatPercent(value) {
    if (isNaN(value) || !isFinite(value)) return '0,00%';
    return (value * 100).toFixed(2).replace('.', ',') + '%';
}

/**
 * Converte strings (com vírgula ou ponto) em número float válido
 */
function parseNumber(value) {
    if (typeof value !== 'string') value = String(value || '0');
    const cleanVal = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanVal);
    return isNaN(num) ? 0 : num;
}

/**
 * Controla a navegação entre as abas da aplicação
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
            if (activeSection) {
                activeSection.classList.add('active');
            }
        });
    });
}

/**
 * Simula a busca automática de cotação ao digitar o Ticker
 */
function setupTickerLookup(tickerInputId, statusId, priceInputId) {
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

            if (statusMsg) statusMsg.textContent = `Cotação simulada carregada para ${ticker}!`;
            setTimeout(() => { if (statusMsg) statusMsg.textContent = ''; }, 3000);
        }, 800);
    });
}

/**
 * Módulo 1: Valuation Preço Teto de Bazin
 */
function initBazinModule() {
    setupTickerLookup('bazin-ticker', 'bazin-ticker-status', 'bazin-preco');

    const dpaListContainer = document.getElementById('bazin-dpa-list');
    const addDpaBtn = document.getElementById('bazin-add-dpa');
    const precoInput = document.getElementById('bazin-preco');
    const dySelect = document.getElementById('bazin-dy');

    // DPAs iniciais de exemplo
    addDpaInputField(1.50);
    addDpaInputField(1.80);
    addDpaInputField(2.10);

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
        removeBtn.title = 'Remover DPA';
        removeBtn.addEventListener('click', () => {
            wrap.remove();
            calcBazin();
        });

        wrap.appendChild(input);
        wrap.appendChild(removeBtn);
        dpaListContainer.appendChild(wrap);
        calcBazin();
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

        // DPA médio = soma(DPAs) / quantidade
        const dpaMedio = countDpa > 0 ? somaDpa / countDpa : 0;
        const dyMinimo = parseNumber(dySelect.value);
        const precoAtual = parseNumber(precoInput.value);

        // Preço Teto = DPA médio / DY mínimo escolhido
        const precoTeto = dyMinimo > 0 ? dpaMedio / dyMinimo : 0;

        // Margem de segurança = (Preço Teto - Cotação) / Preço Teto × 100
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
    setupTickerLookup('dyp-ticker', 'dyp-ticker-status', 'dyp-preco');

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
        const lucro = parseNumber(lucroInput.value);
        const acoes = parseNumber(acoesInput.value);
        const dyMin = parseNumber(dyMinSelect.value);

        // LPA = Lucro Líquido Projetivo / Nº de papéis
        const lpa = acoes > 0 ? lucro / acoes : 0;
        
        // DPA = LPA × Payout
        const dpa = lpa * payout;

        // DY (12m) = DPA / Cotação × 100
        const dyProjetado = preco > 0 ? (dpa / preco) : 0;

        // Preço Teto = DPA / DY mínimo
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

        // Fórmula: PEG = (P/L / (1 - Payout)) × ROE
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

        // Classificação semântica por cores
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
        const lucro = parseNumber(lucroInput.value);
        const plInicial = parseNumber(plInicialInput.value);
        const dividendos = parseNumber(divInput.value);

        // PL Final = PL Inicial + Lucro Projetado - Dividendos
        const plFinal = plInicial + lucro - dividendos;

        // PL Médio = (PL Inicial + PL Final) / 2
        const plMedio = (plInicial + plFinal) / 2;

        // ROE Projetivo = Lucro Projetado / PL Médio × 100
        const roeProjetivo = plMedio > 0 ? (lucro / plMedio) : 0;

        document.getElementById('res-roej-pl-final').textContent = formatBRL(plFinal);
        document.getElementById('res-roej-pl-medio').textContent = formatBRL(plMedio);
        document.getElementById('res-roej-val').textContent = formatPercent(roeProjetivo);

        // Passo a passo descritivo
        const stepText = `Passo a Passo do Cálculo:
1. PL Final: PL Inicial (${formatBRL(plInicial)}) + Lucro (${formatBRL(lucro)}) - Dividendos (${formatBRL(dividendos)}) = ${formatBRL(plFinal)}
2. PL Médio: (PL Inicial + PL Final) / 2 = (${formatBRL(plInicial)} + ${formatBRL(plFinal)}) / 2 = ${formatBRL(plMedio)}
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
        let lucro = parseNumber(lucroInput.value);
        let pl = parseNumber(plInput.value);
        const payout = parseNumber(payoutInput.value) / 100;

        // ROE Equivalente = ROE / P/VP
        const roeEq = pvp > 0 ? roe / pvp : 0;

        // Patrimônio Retido = 1 - Payout
        const retido = 1 - payout;

        // LPA = Lucro / Nº de papéis
        const lpa = acoes > 0 ? lucro / acoes : 0;

        // DPA = LPA × Payout
        const dpa = lpa * payout;

        document.getElementById('res-roee-equivalente').textContent = formatPercent(roeEq);
        document.getElementById('res-roee-retido').textContent = formatPercent(retido);
        document.getElementById('res-roee-lpa').textContent = formatBRL(lpa);
        document.getElementById('res-roee-dpa').textContent = formatBRL(dpa);

        // Renderizar Tabela de 15 Anos
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
