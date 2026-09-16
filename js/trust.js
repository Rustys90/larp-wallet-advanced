// Trust Wallet skin – Phase 2
const { $, $$, formatUSD, formatAmount, formatPercent, updateStatusTime } = window.Utils;

let state = null;

async function init() {
  state = window.Balances.loadState();
  updateStatusTime();
  setInterval(updateStatusTime, 20000);

  window.Skeletons.showTokenList($('#trust-token-list'), 5);
  await window.Prices.fetchPrices();
  render();
  bindEvents();

  setInterval(async () => {
    await window.Prices.fetchPrices();
    render();
  }, 60000);
}

function render() {
  const tokens = state.trust?.tokens || [];
  const total = window.Balances.calcTotalUSD(tokens);
  const changeUSD = window.Balances.calcTotalChangeUSD(tokens);

  $('#trust-total').textContent = formatUSD(total);
  const chEl = $('#trust-change');
  const isUp = changeUSD >= 0;
  chEl.className = `mt-1 text-[14px] ${isUp ? 'text-green-500' : 'text-red-500'}`;
  chEl.textContent = `${isUp ? '+' : ''}${formatUSD(Math.abs(changeUSD))}`;

  const list = $('#trust-token-list');
  list.innerHTML = tokens.map(t => {
    const usd = window.Balances.calcTokenUSD(t);
    const ch = window.Prices.getChange(t.id);
    return `
      <div class="trust-token-row" data-id="${t.id}">
        <img src="${t.logo}" class="w-10 h-10 rounded-full" alt="${t.symbol}"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%231c2030%22 width=%2240%22 height=%2240%22 rx=%2220%22/><text x=%2220%22 y=%2225%22 text-anchor=%22middle%22 fill=%22%238b92a8%22 font-size=%2214%22>${t.symbol[0]}</text></svg>'" />
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-[15px]">${t.symbol}</div>
          <div class="text-[12px] text-[#8b92a8]">${t.name}${t.network ? ' · ' + t.network : ''}</div>
        </div>
        <div class="text-right">
          <div class="font-semibold text-[15px]">${formatUSD(usd)}</div>
          <div class="text-[12px] ${ch >= 0 ? 'text-green-500' : 'text-red-500'}">${formatPercent(ch)}</div>
        </div>
      </div>`;
  }).join('');
}

function openEdit() {
  const list = $('#trust-edit-list');
  const tokens = state.trust?.tokens || [];
  list.innerHTML = tokens.map(t => `
    <div class="flex items-center gap-3 py-2" data-id="${t.id}">
      <img src="${t.logo}" class="w-9 h-9 rounded-full" alt="" />
      <div class="w-16 font-semibold text-[14px]">${t.symbol}</div>
      <input type="number" step="any" min="0" value="${t.amount}" class="flex-1 bg-[#1c2030] border border-[#2a2f42] rounded-xl px-3 py-2 text-[15px] outline-none" data-field="amount" />
    </div>`).join('');
  $('#trust-modal-edit').classList.remove('hidden');
}

function saveEdit() {
  $$('#trust-edit-list [data-id]').forEach(row => {
    const id = row.dataset.id;
    const input = row.querySelector('input');
    const token = state.trust.tokens.find(t => t.id === id);
    if (token && input) token.amount = parseFloat(input.value) || 0;
  });
  window.Balances.saveState(state);
  $('#trust-modal-edit').classList.add('hidden');
  render();
  showToast('Trust balances updated');
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl text-[14px] font-medium shadow-lg bg-[#4B8BFF] text-white transition-opacity duration-300 opacity-0';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.remove('opacity-0');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('opacity-0'), 2000);
}

function hideAllTrustScreens() {
  ['trust-main', 'trust-send-screen', 'trust-receive-screen', 'trust-swap-screen', 'trust-buy-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

function showHome() {
  hideAllTrustScreens();
  $('#trust-main').classList.remove('hidden');
  render();
}

// SEND
function openTrustSend() {
  hideAllTrustScreens();
  $('#trust-send-screen').classList.remove('hidden');
  const tokens = state.trust?.tokens || [];
  $('#trust-send-token').innerHTML = tokens.map(t =>
    `<option value="${t.symbol}">${t.symbol} · ${formatAmount(t.amount)}</option>`
  ).join('');
  $('#trust-send-amount').value = '';
  $('#trust-send-address').value = '';
  updateTrustSendHint();
}

function updateTrustSendHint() {
  const symbol = $('#trust-send-token')?.value;
  const t = window.Balances.findToken(state.trust.tokens, symbol);
  $('#trust-send-hint').textContent = `Available: ${formatAmount(t?.amount || 0)} ${symbol || ''}`;
}

function confirmTrustSend() {
  const symbol = $('#trust-send-token').value;
  const amount = parseFloat($('#trust-send-amount').value) || 0;
  const address = $('#trust-send-address').value.trim() || '0x7a2B...c9F1';
  if (amount <= 0) return showToast('Enter an amount');
  const token = window.Balances.findToken(state.trust.tokens, symbol);
  if (!token || token.amount < amount) return showToast('Insufficient balance');
  window.Balances.adjustBalance(state.trust.tokens, symbol, -amount);
  const usd = amount * window.Prices.getPrice(token.id);
  window.Balances.addHistory(state.trust, { type: 'sent', symbol, amount, usd, counterparty: address });
  window.Balances.saveState(state);
  showToast(`Sent ${formatAmount(amount)} ${symbol}`);
  setTimeout(showHome, 500);
}

// RECEIVE
function openTrustReceive() {
  hideAllTrustScreens();
  $('#trust-receive-screen').classList.remove('hidden');
  const tokens = state.trust?.tokens || [];
  $('#trust-receive-token').innerHTML = tokens.map(t =>
    `<option value="${t.symbol}">${t.symbol}</option>`
  ).join('');
  $('#trust-receive-amount').value = '';
  $('#trust-receive-address').textContent = '0x7a2Bc9F1dE3...A8f2';
}

function simulateTrustReceive() {
  const symbol = $('#trust-receive-token').value;
  const amount = parseFloat($('#trust-receive-amount').value) || 0;
  if (amount <= 0) return showToast('Enter amount to simulate');
  window.Balances.adjustBalance(state.trust.tokens, symbol, amount);
  const token = window.Balances.findToken(state.trust.tokens, symbol);
  const usd = amount * window.Prices.getPrice(token.id);
  window.Balances.addHistory(state.trust, {
    type: 'received', symbol, amount, usd,
    counterparty: '0x' + Math.random().toString(16).slice(2, 8) + '...' + Math.random().toString(16).slice(2, 6)
  });
  window.Balances.saveState(state);
  showToast(`Received ${formatAmount(amount)} ${symbol}`);
  setTimeout(showHome, 500);
}

// SWAP
function openTrustSwap() {
  hideAllTrustScreens();
  $('#trust-swap-screen').classList.remove('hidden');
  const opts = (state.trust?.tokens || []).map(t => `<option value="${t.symbol}">${t.symbol}</option>`).join('');
  $('#trust-swap-pay-token').innerHTML = opts;
  $('#trust-swap-recv-token').innerHTML = opts;
  if (state.trust.tokens[1]) $('#trust-swap-recv-token').value = state.trust.tokens[1].symbol;
  $('#trust-swap-pay-amount').value = '0';
  $('#trust-swap-recv-amount').value = '0';
}

function updateTrustSwapQuote() {
  const paySym = $('#trust-swap-pay-token').value;
  const recvSym = $('#trust-swap-recv-token').value;
  const amount = parseFloat($('#trust-swap-pay-amount').value) || 0;
  const payT = window.Balances.findToken(state.trust.tokens, paySym);
  const recvT = window.Balances.findToken(state.trust.tokens, recvSym);
  if (!payT || !recvT || amount <= 0) {
    $('#trust-swap-recv-amount').value = '0';
    return;
  }
  const payUsd = amount * window.Prices.getPrice(payT.id);
  const recvPrice = window.Prices.getPrice(recvT.id) || 1;
  $('#trust-swap-recv-amount').value = (payUsd / recvPrice).toFixed(6);
}

function confirmTrustSwap() {
  const paySym = $('#trust-swap-pay-token').value;
  const recvSym = $('#trust-swap-recv-token').value;
  const amount = parseFloat($('#trust-swap-pay-amount').value) || 0;
  const recvAmt = parseFloat($('#trust-swap-recv-amount').value) || 0;
  if (amount <= 0) return showToast('Enter amount');
  const payT = window.Balances.findToken(state.trust.tokens, paySym);
  if (!payT || payT.amount < amount) return showToast('Insufficient balance');
  window.Balances.adjustBalance(state.trust.tokens, paySym, -amount);
  window.Balances.adjustBalance(state.trust.tokens, recvSym, recvAmt);
  const usd = amount * window.Prices.getPrice(payT.id);
  window.Balances.addHistory(state.trust, {
    type: 'swap', symbol: paySym, amount, usd, counterparty: `${paySym} → ${recvSym}`
  });
  window.Balances.saveState(state);
  showToast(`Swapped ${formatAmount(amount)} ${paySym} → ${formatAmount(recvAmt)} ${recvSym}`);
  setTimeout(showHome, 500);
}

// BUY
function openTrustBuy() {
  hideAllTrustScreens();
  $('#trust-buy-screen').classList.remove('hidden');
  const tokens = state.trust?.tokens || [];
  $('#trust-buy-token').innerHTML = tokens.map(t =>
    `<option value="${t.symbol}">${t.symbol} · ${t.name}</option>`
  ).join('');
  $('#trust-buy-usd').value = '';
  updateTrustBuyPreview();
}

function updateTrustBuyPreview() {
  const symbol = $('#trust-buy-token')?.value;
  const usd = parseFloat($('#trust-buy-usd')?.value) || 0;
  const token = window.Balances.findToken(state.trust.tokens, symbol);
  const price = token ? window.Prices.getPrice(token.id) : 0;
  const amt = price > 0 ? usd / price : 0;
  $('#trust-buy-preview').textContent = `≈ ${formatAmount(amt)} ${symbol || ''}`;
}

function confirmTrustBuy() {
  const symbol = $('#trust-buy-token').value;
  const usd = parseFloat($('#trust-buy-usd').value) || 0;
  if (usd < 10) return showToast('Minimum $10');
  const token = window.Balances.findToken(state.trust.tokens, symbol);
  if (!token) return showToast('Select a token');
  const price = window.Prices.getPrice(token.id) || 1;
  const amount = usd / price;
  window.Balances.adjustBalance(state.trust.tokens, symbol, amount);
  window.Balances.addHistory(state.trust, {
    type: 'buy', symbol, amount, usd, counterparty: 'Card ••4242'
  });
  window.Balances.saveState(state);
  showToast(`Bought ${formatAmount(amount)} ${symbol} for $${usd.toFixed(2)}`);
  setTimeout(showHome, 500);
}

function bindEvents() {
  $('#btn-trust-edit')?.addEventListener('click', openEdit);
  $('#btn-trust-close-edit')?.addEventListener('click', () => $('#trust-modal-edit').classList.add('hidden'));
  $('#trust-edit-backdrop')?.addEventListener('click', () => $('#trust-modal-edit').classList.add('hidden'));
  $('#btn-trust-save')?.addEventListener('click', saveEdit);

  $('#btn-trust-settings')?.addEventListener('click', () => $('#trust-modal-settings').classList.remove('hidden'));
  $('#btn-trust-close-settings')?.addEventListener('click', () => $('#trust-modal-settings').classList.add('hidden'));
  $('#trust-settings-backdrop')?.addEventListener('click', () => $('#trust-modal-settings').classList.add('hidden'));

  $('#btn-trust-reset')?.addEventListener('click', () => {
    if (!confirm('Reset Trust balances to demo?')) return;
    const def = window.Balances.getDefaultState();
    state.trust = def.trust;
    window.Balances.saveState(state);
    $('#trust-modal-settings').classList.add('hidden');
    showHome();
    showToast('Trust demo restored');
  });

  $$('.trust-action-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.action;
      if (a === 'receive') openTrustReceive();
      else if (a === 'send') openTrustSend();
      else if (a === 'swap') openTrustSwap();
      else if (a === 'buy') openTrustBuy();
    });
  });

  // Send
  $('#btn-trust-back-send')?.addEventListener('click', showHome);
  $('#trust-send-token')?.addEventListener('change', updateTrustSendHint);
  $('#btn-trust-confirm-send')?.addEventListener('click', confirmTrustSend);

  // Receive
  $('#btn-trust-back-receive')?.addEventListener('click', showHome);
  $('#btn-trust-copy-addr')?.addEventListener('click', () => {
    navigator.clipboard?.writeText($('#trust-receive-address').textContent).then(() => showToast('Address copied'));
  });
  $('#btn-trust-simulate-receive')?.addEventListener('click', simulateTrustReceive);

  // Swap
  $('#btn-trust-back-swap')?.addEventListener('click', showHome);
  $('#trust-swap-pay-amount')?.addEventListener('input', updateTrustSwapQuote);
  $('#trust-swap-pay-token')?.addEventListener('change', updateTrustSwapQuote);
  $('#trust-swap-recv-token')?.addEventListener('change', updateTrustSwapQuote);
  $('#btn-trust-swap-flip')?.addEventListener('click', () => {
    const a = $('#trust-swap-pay-token').value;
    $('#trust-swap-pay-token').value = $('#trust-swap-recv-token').value;
    $('#trust-swap-recv-token').value = a;
    updateTrustSwapQuote();
  });
  $('#btn-trust-confirm-swap')?.addEventListener('click', confirmTrustSwap);

  // Buy
  $('#btn-trust-back-buy')?.addEventListener('click', showHome);
  $('#trust-buy-token')?.addEventListener('change', updateTrustBuyPreview);
  $('#trust-buy-usd')?.addEventListener('input', updateTrustBuyPreview);
  $$('.trust-buy-quick').forEach(btn => {
    btn.addEventListener('click', () => {
      $('#trust-buy-usd').value = btn.dataset.usd;
      updateTrustBuyPreview();
    });
  });
  $('#btn-trust-confirm-buy')?.addEventListener('click', confirmTrustBuy);

  $$('.trust-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      $$('.trust-nav-item').forEach(i => {
        i.classList.remove('active', 'text-[#4B8BFF]');
        i.classList.add('text-[#8b92a8]');
      });
      item.classList.add('active', 'text-[#4B8BFF]');
      item.classList.remove('text-[#8b92a8]');
      if (item.dataset.tab === 'home') showHome();
      else showToast(`${item.dataset.tab} – coming soon`);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
