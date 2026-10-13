const ids = ['purchaseCost', 'domesticShipping', 'internationalShipping', 'acquisitionCost', 'returnsReserve', 'commissionRate', 'exchangeRate'];
const examples = { purchaseCost:20, domesticShipping:6, internationalShipping:67, acquisitionCost:0, returnsReserve:10, commissionRate:5, exchangeRate:6.7, profitRate:35 };
const $ = (id) => document.getElementById(id);
const number = (id) => Math.max(0, Number($(id).value) || 0);
const clean = (value, digits = 2) => Number(value.toFixed(digits)).toString();
const money = (value, symbol = '¥') => `${symbol}${Number(value).toFixed(1)}`;
const percent = (value) => `${clean(value, 1)}%`;

function getData() {
  const purchase = number('purchaseCost');
  const domestic = number('domesticShipping');
  const international = number('internationalShipping');
  const acquisition = number('acquisitionCost');
  const reserve = number('returnsReserve');
  const commission = number('commissionRate') / 100;
  const exchange = Math.max(.01, number('exchangeRate'));
  const profit = Math.max(0, Number($('profitRateInput').value) || 0) / 100;
  return { purchase, domestic, international, acquisition, reserve, commission, exchange, profit, fixed: purchase + domestic + international + acquisition + reserve };
}

function calculate(data, profit = data.profit) {
  const denominator = 1 - data.commission - profit;
  if (denominator <= 0) return null;
  const price = data.fixed / denominator;
  return { price, profit: price * profit, usd: price / data.exchange, profitUsd: price * profit / data.exchange, grossMargin: (price - data.purchase) / price, denominator };
}

function updateTable(data) {
  const rates = [15,20,25,30,35,40,45,50,55,60,65,70,75,80,85];
  const active = Number($('profitRateInput').value);
  $('rateTableBody').innerHTML = rates.map(rate => {
    const result = calculate(data, rate / 100);
    if (!result) return `<tr class="unavailable"><td>${rate}%</td><td colspan="4">费率过高，无法计算</td></tr>`;
    return `<tr data-rate="${rate}" class="${Math.abs(active - rate) < .01 ? 'active' : ''}"><td>${rate}%</td><td class="price-cny">${money(result.price)}</td><td class="price-usd">${money(result.usd, '$')}</td><td class="profit-col">${money(result.profit)}</td><td class="profit-col">${money(result.profitUsd, '$')}</td></tr>`;
  }).join('');
}

function update() {
  const data = getData();
  const result = calculate(data);
  $('headerExchange').textContent = clean(data.exchange);
  const totalRate = (data.commission + data.profit) * 100;
  const badge = $('statusBadge');
  const invalid = !result;
  $('invalidState').hidden = !invalid;
  $('resultContent').hidden = invalid;
  badge.className = `status-badge ${invalid ? 'error' : totalRate > 70 ? 'warning' : ''}`;
  badge.textContent = invalid ? '无法计算' : totalRate > 70 ? '费率偏高' : '计算正常';
  if (result) {
    $('priceCny').textContent = money(result.price);
    $('priceUsd').textContent = money(result.usd, '$');
    $('profitCny').textContent = money(result.profit);
    $('profitUsd').textContent = money(result.profitUsd, '$');
    $('fixedCost').textContent = money(data.fixed);
    $('grossMargin').textContent = percent(result.grossMargin * 100);
    const c = clean(data.commission, 3), p = clean(data.profit, 3), d = clean(result.denominator, 3);
    $('formulaValues').textContent = `单品售价 = ${clean(data.purchase)} + ${clean(data.domestic)} + ${clean(data.international)} + 单品售价 × ${c} + ${clean(data.acquisition)} + ${clean(data.reserve)} + 单品售价 × ${p}`;
    $('formulaFixed').textContent = `单品售价 = ${clean(data.fixed)} + 单品售价 × ${c} + 单品售价 × ${p}`;
    $('formulaRearrange').textContent = `单品售价 = ${clean(data.fixed)} ÷ (1 − ${c} − ${p})`;
    $('formulaFinal').textContent = `单品售价 = ${clean(data.fixed)} ÷ ${d} = ${money(result.price)} = ${money(result.usd, '$')}（利润百分比 ${percent(data.profit * 100)}）`;
  }
  updateTable(data);
}

ids.forEach(id => $(id).addEventListener('input', update));
$('profitRateSlider').addEventListener('input', (e) => { $('profitRateInput').value = e.target.value; update(); });
$('profitRateInput').addEventListener('input', (e) => { const value = Math.max(0, Math.min(94, Number(e.target.value) || 0)); $('profitRateSlider').value = Math.min(90, value); update(); });
$('resetButton').addEventListener('click', () => { ids.forEach(id => $(id).value = examples[id]); $('profitRateInput').value = examples.profitRate; $('profitRateSlider').value = examples.profitRate; update(); });
$('rateTableBody').addEventListener('click', (event) => { const row = event.target.closest('tr[data-rate]'); if (!row) return; $('profitRateInput').value = row.dataset.rate; $('profitRateSlider').value = row.dataset.rate; update(); });
update();
