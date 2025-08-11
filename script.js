// Trocar telas
function mostrarTela(id) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    document.getElementById(id).classList.add('ativa');
}

// =======================
// Sistema 1: Simulador
// =======================
function simular() {
    let valorMensal = parseFloat(document.getElementById("valorMensal").value) || 0;
    let meses = parseInt(document.getElementById("meses").value);
    let modelo = document.getElementById("modelo").value;
    let parcelas = parseInt(document.getElementById("parcelas").value) || 1;
    let taxa = 0;

    if (modelo === "parcelado") taxa = 0.05;
    if (modelo === "antecipado12x4") taxa = 0.10;
    if (modelo === "roupasCalcados") taxa = 0.10;

    let recebimentos = [];
    for (let i = 1; i <= meses; i++) {
        recebimentos.push((valorMensal * (1 - taxa)).toFixed(2));
    }

    // Gerar gráfico
    let ctx = document.getElementById("grafico").getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: Array.from({ length: meses }, (_, i) => `Mês ${i+1}`),
            datasets: [{
                label: "Recebimento (R$)",
                data: recebimentos,
                borderColor: "#0055ff",
                fill: false
            }]
        }
    });

    // Gerar calendário
    let calendario = "<h3>Calendário de Pagamentos</h3><ul>";
    recebimentos.forEach((v, i) => {
        calendario += `<li>Mês ${i+1}: R$ ${v}</li>`;
    });
    calendario += "</ul>";
    document.getElementById("calendario").innerHTML = calendario;
}

// =======================
// Sistema 2: Projeção
// =======================
function projetar() {
    let valorInicial = parseFloat(document.getElementById("valorInicial").value) || 0;
    let meses = parseInt(document.getElementById("mesesProjecao").value);

    let valores = [];
    for (let i = 0; i < meses; i++) {
        valores.push(valorInicial * (1 + 0.05 * i));
    }

    let ctx = document.getElementById("graficoProjecao").getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: Array.from({ length: meses }, (_, i) => `Mês ${i+1}`),
            datasets: [{
                label: "Projeção de Vendas (R$)",
                data: valores,
                borderColor: "#00aa00",
                fill: false
            }]
        }
    });
}
