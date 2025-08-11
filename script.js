// script.js
// Simulador: regra resumida implementada:
// - "Parcelado": desconto 5%, recebe conforme nº parcelas (até 18).
// - "Antecipado 12/4": desconto 10%, cliente pode parcelar até 12 mas vendedor recebe em 4x.
// - "Roupas & Calçados antecipado": desconto 10%, recebe em 1 pagamento.
// Observação prática: primeira parcela é colocada no dia 10 do mês+2 (seguindo "40 dias após fechamento, sempre dia 10"),
// e as demais parcelas são dia 10 dos meses subsequentes (uma por mês).

// ---------- utilidades ----------
const $ = id => document.getElementById(id);

function currencyToNumber(ptBr) {
  if (!ptBr) return 0;
  // remove R$, spaces, replace comma with dot
  const cleaned = ptBr.replace(/\s/g,'').replace(/[R\$]/g,'').replace(/\./g,'').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
function numberToCurrencyBRL(n) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function addMonthsKeepDay(date, months) {
  // cria nova data com deslocamento de meses
  const d = new Date(date.getFullYear(), date.getMonth() + months, 1);
  // manter dia 10 se quiser, chamador define
  return d;
}
function formatDateBR(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ---------- DOM setup ----------
const selectMeses = $('selectMeses');
for (let m = 3; m <= 12; m++) {
  const opt = document.createElement('option'); opt.value = m; opt.textContent = `${m} meses`;
  selectMeses.appendChild(opt);
}
const selectParcelas = $('selectParcelas');
for (let p = 1; p <= 18; p++) {
  const opt = document.createElement('option'); opt.value = p; opt.textContent = `${p}x`;
  selectParcelas.appendChild(opt);
}

// elements
const inputValor = $('inputValor');
const selectModelo = $('selectModelo');
const parcelOptions = $('parcelOptions');
const btnSimular = $('btnSimular');
const btnReset = $('btnReset');
const calendarList = $('calendarList');
const resumoTexto = $('resumoTexto');
const totalBrutoEl = $('totalBruto');
const totalLiquidoEl = $('totalLiquido');
const primeiroPgtoEl = $('primeiroPgto');

// Chart setup
let chart = null;
const ctx = document.getElementById('chartRecebimentos').getContext('2d');

// show/hide parcelas select when needed
selectModelo.addEventListener('change', () => {
  if (selectModelo.value === 'parcelado') parcelOptions.classList.remove('hidden');
  else parcelOptions.classList.add('hidden');
});

// reset
btnReset.addEventListener('click', () => {
  inputValor.value = '10000,00';
  selectMeses.value = 3;
  selectModelo.value = 'parcelado';
  selectParcelas.value = 1;
  parcelOptions.classList.remove('hidden');
  calendarList.innerHTML = '';
  resumoTexto.textContent = 'Preencha os dados e clique em Simular.';
  totalBrutoEl.textContent = 'R$ 0,00';
  totalLiquidoEl.textContent = 'R$ 0,00';
  primeiroPgtoEl.textContent = '—';
  if (chart) {
    chart.destroy();
    chart = null;
  }
});

// main simulate
btnSimular.addEventListener('click', () => {
  // ler inputs
  const valor = currencyToNumber(inputValor.value);
  const meses = parseInt(selectMeses.value, 10);
  const modelo = selectModelo.value;
  const parcelasCliente = parseInt(selectParcelas.value, 10);

  if (valor <= 0 || isNaN(valor)) {
    alert('Informe um valor de venda válido.');
    return;
  }

  // regras por modelo
  let desconto = 0;
  let parcelasRecebimento = 1;
  let parcelasMaxCliente = 1;

  if (modelo === 'parcelado') {
    desconto = 0.05;
    parcelasRecebimento = parcelasCliente; // recebe conforme as parcelas do cliente
    parcelasMaxCliente = 18;
  } else if (modelo === 'antecipado124') {
    desconto = 0.10;
    parcelasRecebimento = 4; // recebe sempre em 4x
    parcelasMaxCliente = 12; // cliente pode parcelar até 12 (não usado no cálculo da empresa)
  } else if (modelo === 'roupas') {
    desconto = 0.10;
    parcelasRecebimento = 1;
    parcelasMaxCliente = 1;
  }

  // validade parcela cliente limite
  if (modelo === 'parcelado' && (parcelasCliente < 1 || parcelasCliente > 18)) {
    alert('Parcelado permite de 1 a 18 parcelas.');
    return;
  }

  // construir cronograma de vendas mensais e transformá-las em pagamentos
  const payments = []; // {date: Date, amount: number, label: string}

  const today = new Date();
  // começamos pela data corrente: o primeiro mês simulado será o mês atual
  const startYear = today.getFullYear();
  const startMonth = today.getMonth(); // 0-index

  let totalBruto = 0;
  let totalLiquido = 0;
  let primeiroPagamentoDate = null;

  for (let i = 0; i < meses; i++) {
    // cada mês simulado: monthIndex = startMonth + i
    const saleMonth = startMonth + i;
    const saleYear = startYear + Math.floor(saleMonth / 12);
    const saleMonthIndex = ((saleMonth % 12) + 12) % 12;

    // valor deste mês (aqui assumimos vendas constantes mensais; futuramente podemos aceitar variação)
    const valorBrutoMes = valor;
    totalBruto += valorBrutoMes;

    // valor líquido após desconto
    const liquidoMes = valorBrutoMes * (1 - desconto);
    totalLiquido += liquidoMes;

    // número de parcelas de recebimento (depende do modelo)
    const nReceb = parcelasRecebimento;

    // dividir o líquido em parcelas iguais
    const parcelaValor = Math.round((liquidoMes / nReceb) * 100) / 100; // arredonda 2 decimais
    // para ajustar centavos e somar uma pequena diferença no último recebimento:
    const parcelaValores = Array(nReceb).fill(parcelaValor);
    const somaParcelas = parcelaValor * nReceb;
    const diff = Math.round((liquidoMes - somaParcelas) * 100) / 100;
    if (Math.abs(diff) > 0.001) {
      // adicionar diferença ao último
      parcelaValores[nReceb - 1] = Math.round((parcelaValores[nReceb - 1] + diff) * 100) / 100;
    }

    // calcular datas: primeira parcela = dia 10 do mês + 2 + i? (fechamento do mês corrente -> +40 dias -> dia 10 do mês+2)
    // Para mês de venda base (saleYear, saleMonthIndex), primeira pagamento será no dia 10 do mês (saleMonthIndex + 2)
    for (let k = 0; k < nReceb; k++) {
      const parcelaIndexMonth = saleMonth + 2 + k; // startMonth + i + 2 + k
      const pYear = startYear + Math.floor(parcelaIndexMonth / 12);
      const pMonth = ((parcelaIndexMonth % 12) + 12) % 12;
      const payDate = new Date(pYear, pMonth, 10); // sempre dia 10
      const amount = parcelaValores[k];

      payments.push({
        date: payDate,
        amount,
        label: `Venda ${i + 1} / parcela ${k + 1}/${nReceb}`
      });

      if (!primeiroPagamentoDate || payDate < primeiroPagamentoDate) primeiroPagamentoDate = payDate;
    }
  }

  // agregar pagamentos por data (mesmo dia 10 pode ter multiplas vendas)
  const aggregated = {};
  payments.forEach(p => {
    const key = p.date.toISOString().slice(0,10);
    if (!aggregated[key]) aggregated[key] = { date: p.date, amount: 0, items: [] };
    aggregated[key].amount += p.amount;
    aggregated[key].items.push(p.label);
  });

  // transformar em array ordenado
  const aggArray = Object.values(aggregated).sort((a,b) => a.date - b.date);

  // preparar dados para gráfico: eixo x = datas (dia/mês), y = recebimentos acumulados
  const labels = [];
  const acum = [];
  let running = 0;
  for (const entry of aggArray) {
    running = Math.round((running + entry.amount) * 100) / 100;
    labels.push(formatDateBR(entry.date));
    acum.push(running);
  }

  // atualizar resumo
  totalBrutoEl.textContent = numberToCurrencyBRL(totalBruto);
  totalLiquidoEl.textContent = numberToCurrencyBRL(totalLiquido);
  primeiroPgtoEl.textContent = primeiroPagamentoDate ? formatDateBR(primeiroPagamentoDate) : '—';
  resumoTexto.textContent = `Simulação: ${meses} meses • Modelo: ${selectModelo.options[selectModelo.selectedIndex].text}`;

  // atualizar calendário (lista)
  calendarList.innerHTML = '';
  for (const entry of aggArray) {
    const item = document.createElement('div');
    item.className = 'calendar-item';
    const left = document.createElement('div');
    left.innerHTML = `<div class="date">${formatDateBR(entry.date)}</div><div class="muted" style="font-size:12px;color:#5b6b8a">${entry.items.join(' • ')}</div>`;
    const right = document.createElement('div');
    right.innerHTML = `<div class="amount">${numberToCurrencyBRL(Math.round(entry.amount*100)/100)}</div>`;
    item.appendChild(left); item.appendChild(right);
    calendarList.appendChild(item);
  }

  // chart: destruir se existir
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Recebimentos acumulados',
        data: acum,
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        backgroundColor: 'rgba(11,104,255,0.12)',
        borderColor: 'rgba(11,104,255,1)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => numberToCurrencyBRL(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: { ticks: { maxRotation: 0 } },
        y: {
          ticks: {
            callback: v => numberToCurrencyBRL(v)
          }
        }
      }
    }
  });
});
