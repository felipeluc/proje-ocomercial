// Troca de telas
function mostrarTela(tela) {
    document.querySelectorAll('.tela').forEach(sec => sec.classList.remove('ativa'));
    document.getElementById(tela).classList.add('ativa');

    document.querySelectorAll('.menu button').forEach(btn => btn.classList.remove('ativo'));
    document.getElementById(`btn-${tela}`).classList.add('ativo');
}

// Preenche selects
document.addEventListener("DOMContentLoaded", () => {
    let mesesSelect = document.getElementById("mesesSimulacao");
    let mesesProjSelect = document.getElementById("mesesProjecao");
    for (let i = 1; i <= 12; i++) {
        let opt = new Option(i + " meses", i);
        let opt2 = new Option(i + " meses", i);
        mesesSelect.add(opt);
        mesesProjSelect.add(opt2);
    }

    let parcelasSelect = document.getElementById("qtdParcelas");
    for (let i = 1; i <= 18; i++) {
        parcelasSelect.add(new Option(i + "x", i));
    }

    document.getElementById("modeloRecebimento").addEventListener("change", (e) => {
        document.getElementById("parcelasContainer").style.display = e.target.value === "parcelado" ? "block" : "none";
    });

    document.getElementById("faturamentoProprio").addEventListener("change", (e) => {
        document.getElementById("faturamentoProprioContainer").style.display = e.target.value === "sim" ? "block" : "none";
    });
});

// Simulador de recebimento
function simularRecebimento() {
    const valorMensal = parseFloat(document.getElementById("valorMensal").value) || 0;
    const meses = parseInt(document.getElementById("mesesSimulacao").value);
    const modelo = document.getElementById("modeloRecebimento").value;
    const parcelas = parseInt(document.getElementById("qtdParcelas").value) || 1;
    const faturamentoProprio = document.getElementById("faturamentoProprio").value;
    const mediaFaturamento = parseFloat(document.getElementById("mediaFaturamento").value) || 0;

    let taxa = 0;
    let recebimentos = [];

    if (modelo === "parcelado") {
        taxa = 0.05;
        for (let m = 0; m < meses; m++) {
            for (let p = 0; p < parcelas; p++) {
                let data = new Date();
                data.setMonth(data.getMonth() + m + p + 1);
                recebimentos.push({ data: data.toLocaleDateString(), valor: (valorMensal * (1 - taxa)) / parcelas });
            }
        }
    } else if (modelo === "antecipado12x4") {
        taxa = 0.10;
        for (let m = 0; m < meses; m++) {
            let data = new Date();
            data.setMonth(data.getMonth() + m + 2);
            recebimentos.push({ data: data.toLocaleDateString(), valor: (valorMensal * (1 - taxa)) });
        }
    } else if (modelo === "roupasCalcados") {
        taxa = 0.10;
        for (let m = 0; m < meses; m++) {
            let data = new Date();
            data.setMonth(data.getMonth() + m + 2);
            recebimentos.push({ data: data.toLocaleDateString(), valor: (valorMensal * (1 - taxa)) });
        }
    }

    if (faturamentoProprio === "sim") {
        for (let m = 0; m < meses; m++) {
            let data = new Date();
            data.setMonth(data.getMonth() + m + 1);
            recebimentos.push({ data: data.toLocaleDateString(), valor: mediaFaturamento });
        }
    }

    gerarGrafico("graficoRecebimento", recebimentos);
    gerarCalendario(recebimentos);
}

function gerarCalendario(recebimentos) {
    let calDiv = document.getElementById("calendario");
    calDiv.innerHTML = "<h3>Calendário de Recebimentos</h3>";
    recebimentos.forEach(r => {
        calDiv.innerHTML += `<p>${r.data} - R$ ${r.valor.toFixed(2)}</p>`;
    });
}

// Projeção de vendas
function simularProjecao() {
    const valorMensal = parseFloat(document.getElementById("valorMensalProj").value) || 0;
    const meses = parseInt(document.getElementById("mesesProjecao").value);

    let dados = [];
    for (let i = 1; i <= meses; i++) {
        dados.push(valorMensal * i);
    }

    let labels = Array.from({ length: meses }, (_, i) => `Mês ${i + 1}`);

    new Chart(document.getElementById("graficoProjecao"), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Projeção de Vendas',
                data: dados,
                borderColor: '#007aff',
                backgroundColor: 'rgba(0,122,255,0.2)',
                fill: true
            }]
        }
    });
}

// Função genérica para gráficos
function gerarGrafico(canvasId, dados) {
    let labels = dados.map(d => d.data);
    let valores = dados.map(d => d.valor);

    new Chart(document.getElementById(canvasId), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Recebimentos',
                data: valores,
                borderColor: '#007aff',
                backgroundColor: 'rgba(0,122,255,0.2)',
                fill: true
            }]
        }
    });
}
