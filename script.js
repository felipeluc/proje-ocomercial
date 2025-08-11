const $ = id => document.getElementById(id);

function currencyToNumber(ptBr) {
  if (!ptBr) return 0;
  const cleaned = ptBr.replace(/\s/g,'').replace(/[R\$]/g,'').replace(/\./g,'').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
function numberToCurrencyBRL(n) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatarMoedaCampo(input) {
  input.addEventListener('input', () => {
    let valor = input.value.replace(/\D/g, '');
    valor = (parseInt(valor || '0', 10) / 100).toFixed(2) + '';
    valor = valor.replace('.', ',');
    valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    input.value = valor;
  });
}
function formatDateBR(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// preencher selects
const selectMeses = $('selectMeses');
for (let m = 3; m <= 12; m++) {
  const opt = document.createElement('option');
  opt.value = m;
  opt.textContent = `${m} meses`;
  selectMeses.appendChild(opt);
}
const selectParcelas = $('selectParcelas');
for (let p = 1; p <= 18; p++) {
  const opt = document.createElement('option');
  opt.value = p;
  opt.textContent = `${p}x`;
  selectParcelas.appendChild(opt);
}

// refs
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
const selectFaturamentoProprio = $('selectFaturamentoProprio');
const faturamentoProprioCampo = $('faturamentoProprioCampo');
const inputFaturamentoProprio = $('inputFaturamentoProprio');

// formata campos moeda
formatarMoedaCampo(inputValor);
formatarMoedaCampo(inputFaturamentoProprio);

// toggle parcelas
selectModelo.addEventListener('change', () => {
  if (selectModelo.value === 'parcelado') parcelOptions.classList.remove('hidden');
  else parcelOptions.classList.add('hidden');
});

// toggle faturamento próprio
selectFaturamentoProprio.addEventListener('change', () => {
  if (selectFaturamentoProprio.value === 'sim') faturamentoProprioCampo.classList.remove('hidden');
  else faturamentoProprioCampo.classList.add('hidden');
});

// chart
let chart = null;
const ctx = document.getElementById('chartRecebimentos').getContext('2d');

btnReset.addEventListener('click', () => {
  inputValor.value = '10000,00';
  selectMeses.value = 3;
  selectModelo.value = 'parcelado';
  selectParcelas.value = 1;
  selectFaturamentoProprio.value = 'nao';
  faturamentoProprioCampo.classList.add('hidden');
  calendarList.innerHTML = '';
  resumoTexto.textContent = 'Preencha os dados e clique em Simular.';
  totalBrutoEl.textContent = 'R$ 0,00';
  totalLiquidoEl.textContent = 'R$ 0,00';
  primeiroPgtoEl.textContent = '—';
  if (chart) { chart.destroy(); chart = null; }
});

btnSimular.addEventListener('click', () => {
  const valor = currencyToNumber(inputValor.value);
  const meses = parseInt(selectMeses.value, 10);
  const modelo = selectModelo.value;
  const parcelasCliente = parseInt(selectParcelas.value, 10);

  const incluirFaturamentoProprio = selectFaturamentoProprio.value === 'sim';
  const valorFaturamentoProprio = incluirFaturamentoProprio ? currencyToNumber(inputFaturamentoProprio.value) : 0;

  if (valor <= 0 || isNaN(valor)) {
    alert('Informe um valor de venda válido.');
    return;
  }

  let desconto = 0;
  let parcelasRecebimento = 1;

  if (modelo === 'parcelado') {
    desconto = 0.05;
    parcelasRecebimento = parcelasCliente;
  } else if (modelo === 'antecipado124') {
    desconto = 0.10;
    parcelasRecebimento = 4;
  } else if (modelo === 'roupas') {
    desconto = 0.10;
    parcelasRecebimento = 1;
  }

  const payments = [];
  const today = new Date();
  const startYear = today.getFullYear();
  const startMonth = today.getMonth();

  let totalBruto = 0;
  let totalLiquido = 0;
  let primeiroPagamentoDate = null;

  for (let i = 0; i < meses; i++) {
    const valorBrutoMes = valor;
    totalBruto += valorBrutoMes;
    const liquidoMes = valorBrutoMes * (1 - desconto);
    totalLiquido += liquidoMes;

    const nReceb = parcelasRecebimento;
    const parcelaValor = Math.round((liquidoMes / nReceb) * 100) / 100;
    const parcelaValores = Array(nReceb).fill(parcelaValor);
    const diff = Math.round((liquidoMes - parcelaValor * nReceb) * 100) / 100;
    if (Math.abs(diff) > 0.001) parcelaValores[nReceb - 1] += diff;

    for (let k = 0; k < nReceb; k++) {
      const parcelaIndexMonth = startMonth + i + 2 + k;
      const pYear = startYear + Math.floor(parcelaIndexMonth / 12);
      const pMonth = ((parcelaIndexMonth % 12) + 12) % 12;
      const payDate = new Date(pYear, pMonth, 10);
      const amount = parcelaValores[k];
      payments.push({ date: payDate, amount, label: `Venda ${i + 1} / parcela ${k + 1}/${nReceb}` });
      if (!primeiroPagamentoDate || payDate < primeiroPagamentoDate) primeiroPagamentoDate = payDate;
    }

    if (incluirFaturamentoProprio && valorFaturamentoProprio > 0) {
      totalBruto += valorFaturamentoProprio;
      totalLiquido += valorFaturamentoProprio;
      const payDateExtra = new Date(startYear, startMonth + i + 2, 10);
      payments.push({
        date: payDateExtra,
        amount: valorFaturamentoProprio,
        label: `Faturamento próprio ${i + 1}`
      });
      if (!primeiroPagamentoDate || payDateExtra < primeiroPagamentoDate) primeiroPagamentoDate = payDateExtra;
    }
  }

  const aggregated = {};
  payments.forEach(p => {
    const key = p.date.toISOString().slice(0,10);
    if (!aggregated[key]) aggregated[key] = { date: p.date, amount: 0, items: [] };
    aggregated[key].amount += p.amount;
    aggregated[key].items.push(p.label);
  });
  const aggArray = Object.values(aggregated).sort((a,b) => a.date - b.date);

  const labels = [];
  const acum = [];
  let running = 0;
  for (const entry of aggArray) {
    running = Math.round((running + entry.amount) * 100) / 100;
    labels.push(formatDateBR(entry.date));
    acum.push(running);
  }

  totalBrutoEl.textContent = numberToCurrencyBRL(totalBruto);
  totalLiquidoEl.textContent = numberToCurrencyBRL(totalLiquido);
  primeiroPgtoEl.textContent = primeiroPagamentoDate ? formatDateBR(primeiroPagamentoDate) : '—';
  resumoTexto.textContent = `Simulação: ${meses} meses • Modelo: ${selectModelo.options[selectModelo.selectedIndex].text}`;

  calendarList.innerHTML = '';
  for (const entry of aggArray) {
    const item = document.createElement('div');
    item.className = 'calendar-item';
    const left = document.createElement('div');
    left.innerHTML = `<div class="date">${formatDateBR(entry.date)}</div>
                      <div style="font-size:12px;color:#5b6b8a">${entry.items.join(' • ')}</div>`;
    const right = document.createElement('div');
    right.innerHTML = `<div class="amount">${numberToCurrencyBRL(entry.amount)}</div>`;
    item.appendChild(left);
    item.appendChild(right);
    calendarList.appendChild(item);
  }

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
        tooltip: { callbacks: { label: ctx => numberToCurrencyBRL(ctx.parsed.y) } }
      },
      scales: {
        y: { ticks: { callback: v => numberToCurrencyBRL(v) } }
      }
    }
  });
});
