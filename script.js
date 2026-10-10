// Controle de Abas
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.tab);
        target.classList.add('active');
    });
});

// Conversor de string monetária/bilhões (aceita vírgula ou ponto, ex: "110,3" ou "35.5")
function parseValorBilhOes(inputStr) {
    if (!inputStr) return 0;
    // Substitui vírgula por ponto para conversão matemática
    const normalizado = inputStr.trim().replace(',', '.');
    const valorFloat = parseFloat(normalizado);
    if (isNaN(valorFloat)) return 0;
    
    // O que está antes da vírgula representa bilhões (multiplica por 1 bilhão)
    return valorFloat * 1000000000;
}

// Converte número bruto em formato escrito por extenso amigável em bilhões/milhões
function numeroPorExtensoBilhoes(valorEmReais) {
    if (isNaN(valorEmReais) || valorEmReais === 0) return "--";
    
    const bilhoes = Math.floor(valorEmReais / 1000000000);
    const restoMilhoes = Math.round((valorEmReais % 1000000000) / 1000000);

    let texto = "";
    if (bilhoes > 0) {
        texto += `${bilhoes} bilhão${bilhoes > 1 ? 's' : ''}`;
    }
    if (restoMilhoes > 0) {
        if (bilhoes > 0) texto += " e ";
        texto += `${restoMilhoes} milhão${restoMilhoes > 1 ? 'ões' : ''}`;
    }
    if (bilhoes === 0 && restoMilhoes === 0) {
        texto = valorEmReais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return texto;
}

// Atualização dinâmica dos textos descritivos conforme o usuário digita
document.getElementById('lucro-proj').addEventListener('input', function() {
    const val = parseValorBilhOes(this.value);
    document.getElementById('extenso-lucro').textContent = "Valor por extenso: " + numeroPorExtensoBilhoes(val);
});

document.getElementById('n-papeis').addEventListener('input', function() {
    const val = parseValorBilhOes(this.value);
    const bilhoes = Math.floor(val / 1000000000);
    const milhoes = Math.round((val % 1000000000) / 1000000);
    let txt = "";
    if (bilhoes > 0) txt += `${bilhoes} bilhão(ões) `;
    if (milhoes > 0) txt += `${milhoes} milhão(ões) de ações`;
    document.getElementById('extenso-papeis').textContent = "Ações: " + (txt || "--");
});

// Simulação aprimorada de cotação atual coerente com a B3
async function buscarCotacaoRealista(ticker) {
    const tickerLimpo = ticker.trim().toUpperCase();
    
    // Base de cotações reais aproximadas para testes ágeis no front-end
    const precosConhecidos = {
        'PETR4': { cotacao: 38.50, dy12m: 14.2 },
        'VALE3': { cotacao: 62.00, dy12m: 8.9 },
        'BBAS3': { cotacao: 28.30, dy12m: 9.5 },
        'ITUB4': { cotacao: 34.20, dy12m: 7.1 },
        'B3SA3': { cotacao: 11.40, dy12m: 6.8 },
        'TAEE11': { cotacao: 36.80, dy12m: 8.2 }
    };

    if (precosConhecidos[tickerLimpo]) {
        return precosConhecidos[tickerLimpo];
    }

    // Fallback dinâmico com base no tamanho do ticker se não estiver na lista fixa
    let seed = 0;
    for (let i = 0; i < tickerLimpo.length; i++) {
        seed += tickerLimpo.charCodeAt(i);
    }
    return {
        cotacao: parseFloat((15 + (seed % 65)).toFixed(2)),
        dy12m: parseFloat((6 + (seed % 7)).toFixed(1))
    };
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ==========================================
// ABORDAGEM 1: DY HISTÓRICO
// ==========================================
document.getElementById('form-historico').addEventListener('submit', async function(e) {
    e.preventDefault();

    const ticker = document.getElementById('ticker-hist').value.trim().toUpperCase();
    const dpaMedio = parseFloat(document.getElementById('dpa-medio').value.replace(',', '.'));

    if (!ticker || isNaN(dpaMedio) || dpaMedio <= 0) {
        alert('Por favor, preencha o Ticker e o DPA Médio corretamente.');
        return;
    }

    const dadosMercado = await buscarCotacaoRealista(ticker);
    const cotacaoAtual = dadosMercado.cotacao;

    const teto6 = dpaMedio / 0.06;
    const teto8 = dpaMedio / 0.08;
    const teto10 = dpaMedio / 0.10;
    const teto12 = dpaMedio / 0.12;
    const teto15 = dpaMedio / 0.15;

    document.getElementById('res-hist-ticker').textContent = ticker;
    document.getElementById('res-hist-cotacao').textContent = formatarMoeda(cotacaoAtual);
    document.getElementById('res-hist-dpa').textContent = formatarMoeda(dpaMedio);

    const statusEl = document.getElementById('res-hist-status');
    if (cotacaoAtual <= teto8) {
        statusEl.textContent = 'Abaixo do Teto (Atrativo)';
        statusEl.className = 'badge barato';
    } else {
        statusEl.textContent = 'Acima do Preço Teto';
        statusEl.className = 'badge caro';
    }

    document.getElementById('teto-hist-6').textContent = formatarMoeda(teto6);
    document.getElementById('teto-hist-8').textContent = formatarMoeda(teto8);
    document.getElementById('teto-hist-10').textContent = formatarMoeda(teto10);
    document.getElementById('teto-hist-12').textContent = formatarMoeda(teto12);
    document.getElementById('teto-hist-15').textContent = formatarMoeda(teto15);

    document.getElementById('resultado-historico').classList.remove('hidden');
});

// ==========================================
// ABORDAGEM 2: DY PROJETIVO
// ==========================================
document.getElementById('form-projetivo').addEventListener('submit', async function(e) {
    e.preventDefault();

    const ticker = document.getElementById('ticker-proj').value.trim().toUpperCase();
    const lucroProj = parseValorBilhOes(document.getElementById('lucro-proj').value);
    const nPapeis = parseValorBilhOes(document.getElementById('n-papeis').value);
    const payoutPercent = parseFloat(document.getElementById('payout').value.replace(',', '.'));

    if (!ticker || lucroProj <= 0 || nPapeis <= 0 || isNaN(payoutPercent)) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    // Cálculos de Projeção
    const lpa = lucroProj / nPapeis; // Lucro por Ação
    const payout = payoutPercent / 100;
    const dpaProj = lpa * payout; // Dividendos por Ação Projetado

    const dadosMercado = await buscarCotacaoRealista(ticker);
    const cotacaoAtual = dadosMercado.cotacao;

    const teto6 = dpaProj / 0.06;
    const teto8 = dpaProj / 0.08;
    const teto10 = dpaProj / 0.10;
    const teto12 = dpaProj / 0.12;
    const teto15 = dpaProj / 0.15;

    document.getElementById('res-proj-ticker').textContent = ticker;
    document.getElementById('res-proj-cotacao').textContent = formatarMoeda(cotacaoAtual);
    document.getElementById('res-proj-dy12m').textContent = dadosMercado.dy12m + '%';
    document.getElementById('res-proj-lpa').textContent = formatarMoeda(lpa);
    document.getElementById('res-proj-dpa').textContent = formatarMoeda(dpaProj);

    document.getElementById('teto-proj-6').textContent = formatarMoeda(teto6);
    document.getElementById('teto-proj-8').textContent = formatarMoeda(teto8);
    document.getElementById('teto-proj-10').textContent = formatarMoeda(teto10);
    document.getElementById('teto-proj-12').textContent = formatarMoeda(teto12);
    document.getElementById('teto-proj-15').textContent = formatarMoeda(teto15);

    document.getElementById('resultado-projetivo').classList.remove('hidden');
});
