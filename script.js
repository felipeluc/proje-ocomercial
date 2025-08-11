function mostrarSistema(id) {
  document.querySelectorAll(".sistema").forEach(div => div.classList.remove("ativo"));
  document.getElementById(id).classList.add("ativo");
}

// Sistema 1 - Simulador de Recebimento
function simularRecebimento() {
  const valor = parseFloat(document.getElementById("valorVendas").value) || 0;
  const meses = parseInt(document.getElementById("meses").value);
  
  const labels = [];
  const valores = [];

  for (let i = 1; i <= meses; i++) {
    labels.push(`Mês ${i}`);
    valores.push(valor);
  }

  new Chart(document.getElementById("grafico1"), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Recebimentos",
        data: valores,
        borderColor: "#007aff",
        fill: false
      }]
    }
  });

  document.getElementById("calendario1").innerHTML = "<p>Calendário de recebimentos aqui...</p>";
}

// Sistema 2 - Projeção de Vendas
function simularProjecao() {
  const valor = parseFloat(document.getElementById("valorMensalProj").value) || 0;
  const meses = parseInt(document.getElementById("mesesProj").value);
  
  const labels = [];
  const valores = [];

  for (let i = 1; i <= meses; i++) {
    labels.push(`Mês ${i}`);
    valores.push(valor * i); // crescimento acumulado
  }

  new Chart(document.getElementById("grafico2"), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Projeção de Vendas",
        data: valores,
        borderColor: "#007aff",
        fill: false
      }]
    }
  });

  document.getElementById("calendario2").innerHTML = "<p>Calendário de projeção aqui...</p>";
}
