// Advanced Larp Wallet – Phantom (video-matched) + shared state
const { $, $$, formatUSD, formatAmount, formatPercent, updateStatusTime, downloadJSON, fakeAddress } = window.Utils;

let state = null;
let currentToken = null;
let currentView = 'home';
let fabOpen = false;

async function init() {
  state = window.Balances.loadState();
  updateStatusTime();
  setInterval(updateStatusTime, 20000);
  setInterval(() => {
    const bat = document.querySelector('.battery-fill');
    if (bat) bat.style.width = (65 + Math.random() * 12) + '%';
  }, 8000);

  // Skeleton while prices load
  window.Skeletons.showTokenList($('#token-list'), 6);
  await window.Prices.fetchPrices();
  render();
  bindEvents();

  setInterval(async () => {
    await window.Prices.fetchPrices();
    if (currentView === 'home') renderHome();
  }, 55000);
}

function hideAllScreens() {
  ['main-content', 'activity-screen', 'send-screen', 'receive-screen', 'trade-screen', 'buy-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  closeFab();
}

function render() {
  if (currentView === 'home') renderHome();
  else if (currentView === 'activity') renderActivity();
  else if (currentView === 'trade') openTrade();
}

function renderHome() {
  currentView = 'home';
  hideAllScreens();
  $('#main-content').classList.remove('hidden');
  setTopTab('home');

  const tokens = state.phantom.tokens;
  const total = window.Balances.calcTotalUSD(tokens);
  const changeUSD = window.Balances.calcTotalChangeUSD(tokens);
  const changePct = total > 0 ? (changeUSD / Math.max(total - changeUSD, 1)) * 100 : 0;

  $('#total-balance').textContent = formatUSD(total);
  const changeEl = $('#total-change');
  const isUp = changeUSD >= 0;
  changeEl.className = `mt-2 inline-flex items-center gap-1 text-[14px] font-medium ${isUp ? 'text-phantom-green' : 'text-phantom-red'}`;
  changeEl.innerHTML = `<span>${isUp ? '+' : ''}${formatUSD(Math.abs(changeUSD))} (${formatPercent(changePct)})</span>`;

  const list = $('#token-list');
  list.innerHTML = tokens.map(t => {
    const usd = window.Balances.calcTokenUSD(t);
    const ch = window.Prices.getChange(t.id);
    const chClass = ch >= 0 ? 'positive' : 'negative';
    return `
      <div class="token-row" data-id="${t.id}">
        <img class="token-logo" src="${t.logo}" alt="${t.symbol}" loading="lazy"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%232a2a30%22 width=%2240%22 height=%2240%22 rx=%2220%22/><text x=%2220%22 y=%2225%22 text-anchor=%22middle%22 fill=%22%238b8b9a%22 font-size=%2214%22>${t.symbol[0]}</text></svg>'" />
        <div class="token-info">
          <div class="token-symbol">${t.symbol}</div>
          <div class="token-name">${t.name}</div>
        </div>
        <div class="token-values">
          <div class="token-usd">${formatUSD(usd)}</div>
          <div class="token-change ${chClass}">${formatPercent(ch)}</div>
        </div>
      </div>`;
  }).join('');

  $$('.token-row').forEach(row => row.onclick = () => openTokenDetail(row.dataset.id));
}

function renderActivity() {
  currentView = 'activity';
  hideAllScreens();
  $('#activity-screen').classList.remove('hidden');
  window.Skeletons.showActivity($('#activity-list'), 4);
  setTimeout(() => {
    const hist = state.phantom.history || [];
    const list = $('#activity-list');
    if (!hist.length) {
      list.innerHTML = `<p class="text-center text-phantom-muted py-12">No activity yet</p>`;
    } else {
      list.innerHTML = hist.map(tx => {
        const isIn = ['received', 'buy', 'airdrop'].includes(tx.type);
        const icon = isIn ? '↓' : (tx.type === 'swap' ? '⇄' : '↑');
        const color = isIn ? 'text-phantom-green' : (tx.type === 'swap' ? 'text-phantom-purple' : 'text-phantom-red');
        const time = new Date(tx.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `
          <div class="activity-row flex items-center gap-3 py-3.5 border-b border-phantom-border/60" data-id="${tx.id}">
            <div class="w-10 h-10 rounded-full bg-phantom-card flex items-center justify-center text-lg ${color}">${icon}</div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-[15px] capitalize">${tx.type} ${tx.symbol || ''}</div>
              <div class="text-[12px] text-phantom-muted truncate">${tx.counterparty || ''} · ${time}</div>
            </div>
            <div class="text-right">
              <div class="font-semibold text-[15px] ${isIn ? 'text-phantom-green' : ''}">${isIn ? '+' : '-'}${formatAmount(tx.amount)} ${tx.symbol || ''}</div>
              <div class="text-[12px] text-phantom-muted">${formatUSD(tx.usd || 0)}</div>
            </div>
          </div>`;
      }).join('');
    }
  }, 350);
}

function setTopTab(tab) {
  $$('.top-tab').forEach(t => {
    const active = t.dataset.tab === tab;
    t.classList.toggle('active', active);
    t.classList.toggle('bg-phantom-purple', active);
    t.classList.toggle('text-phantom-bg', active);
    t.classList.toggle('font-semibold', active);
    t.classList.toggle('text-phantom-muted', !active);
    t.classList.toggle('font-medium', !active);
  });
}

function openTokenDetail(id) {
  const token = state.phantom.tokens.find(t => t.id === id);
  if (!token) return;
  currentToken = token;
  const usd = window.Balances.calcTokenUSD(token);
  const ch = window.Prices.getChange(token.id);
  $('#token-detail-name').textContent = token.symbol;
  $('#token-detail-logo').src = token.logo;
  $('#token-detail-amount').textContent = `${formatAmount(token.amount)} ${token.symbol}`;
  $('#token-detail-usd').textContent = formatUSD(usd);
  const chEl = $('#token-detail-change');
  chEl.textContent = formatPercent(ch);
  chEl.className = `mt-2 text-[14px] font-medium ${ch >= 0 ? 'text-phantom-green' : 'text-phantom-red'}`;
  $('#modal-token').classList.remove('hidden');
  window.Charts.renderTokenChart('token-chart', ch);
}

function closeTokenDetail() {
  $('#modal-token').classList.add('hidden');
  currentToken = null;
}

// SEND
function openSend(prefill = null) {
  currentView = 'send';
  hideAllScreens();
  $('#send-screen').classList.remove('hidden');
  const select = $('#send-token-select');
  select.innerHTML = state.phantom.tokens.map(t =>
    `<option value="${t.symbol}" ${prefill === t.symbol ? 'selected' : ''}>${t.symbol} · ${formatAmount(t.amount)}</option>`
  ).join('');
  $('#send-amount').value = '';
  $('#send-address').value = '';
  $('#send-note').value = '';
  updateSendPreview();
}

function updateSendPreview() {
  const symbol = $('#send-token-select')?.value;
  const amount = parseFloat($('#send-amount')?.value) || 0;
  const token = window.Balances.findToken(state.phantom.tokens, symbol);
  const price = token ? window.Prices.getPrice(token.id) : 0;
  $('#send-usd-preview').textContent = formatUSD(amount * price);
  $('#send-max-hint').textContent = `Available: ${formatAmount(token?.amount || 0)} ${symbol || ''}`;
}

function confirmSend() {
  const symbol = $('#send-token-select').value;
  const amount = parseFloat($('#send-amount').value) || 0;
  const address = $('#send-address').value.trim() || (fakeAddress().slice(0, 6) + '...' + fakeAddress().slice(-4));
  const note = $('#send-note').value.trim();
  if (amount <= 0) return showToast('Enter an amount', 'error');
  const token = window.Balances.findToken(state.phantom.tokens, symbol);
  if (!token || token.amount < amount) return showToast('Insufficient balance', 'error');
  window.Balances.adjustBalance(state.phantom.tokens, symbol, -amount);
  const usd = amount * window.Prices.getPrice(token.id);
  window.Balances.addHistory(state.phantom, { type: 'sent', symbol, amount, usd, counterparty: address, note });
  window.Balances.saveState(state);
  showToast(`Sent ${formatAmount(amount)} ${symbol}`, 'success');
  setTimeout(renderHome, 500);
}

// RECEIVE
function openReceive(prefill = null) {
  currentView = 'receive';
  hideAllScreens();
  $('#receive-screen').classList.remove('hidden');
  const select = $('#receive-token-select');
  select.innerHTML = state.phantom.tokens.map(t =>
    `<option value="${t.symbol}" ${prefill === t.symbol ? 'selected' : ''}>${t.symbol}</option>`
  ).join('');
  $('#receive-address').textContent = '5t54YTgK...mudSwY7x';
  $('#receive-amount').value = '';
  showRecvTab('tokens');
}

function showRecvTab(tab) {
  const tokens = tab === 'tokens';
  $('#receive-tokens-panel').classList.toggle('hidden', !tokens);
  $('#receive-cash-panel').classList.toggle('hidden', tokens);
  $('#recv-tab-tokens').className = `flex-1 py-2 rounded-full text-[14px] ${tokens ? 'font-semibold bg-phantom-border text-white' : 'font-medium text-phantom-muted'}`;
  $('#recv-tab-cash').className = `flex-1 py-2 rounded-full text-[14px] ${!tokens ? 'font-semibold bg-phantom-border text-white' : 'font-medium text-phantom-muted'}`;
}

function simulateReceive() {
  const symbol = $('#receive-token-select').value;
  const amount = parseFloat($('#receive-amount').value) || 0;
  if (amount <= 0) return showToast('Enter amount to simulate', 'error');
  window.Balances.adjustBalance(state.phantom.tokens, symbol, amount);
  const token = window.Balances.findToken(state.phantom.tokens, symbol);
  const usd = amount * window.Prices.getPrice(token.id);
  window.Balances.addHistory(state.phantom, {
    type: 'received', symbol, amount, usd,
    counterparty: fakeAddress().slice(0, 6) + '...' + fakeAddress().slice(-4),
    note: 'Simulated receive'
  });
  window.Balances.saveState(state);
  showToast(`Received ${formatAmount(amount)} ${symbol}`, 'success');
  setTimeout(renderHome, 500);
}

function copyAddress() {
  navigator.clipboard?.writeText($('#receive-address').textContent).then(() => showToast('Address copied', 'success'));
}

// TRADE
function openTrade() {
  currentView = 'trade';
  hideAllScreens();
  $('#trade-screen').classList.remove('hidden');
  setTopTab('trade');
  const opts = state.phantom.tokens.map(t => `<option value="${t.symbol}">${t.symbol}</option>`).join('');
  $('#trade-pay-token').innerHTML = opts;
  $('#trade-recv-token').innerHTML = opts;
  if (state.phantom.tokens[1]) $('#trade-recv-token').value = state.phantom.tokens[1].symbol;
  $('#trade-pay-amount').value = '0';
  $('#trade-recv-amount').value = '0';
  $('#trade-status').textContent = '';
}

function updateTradeQuote() {
  const paySym = $('#trade-pay-token').value;
  const recvSym = $('#trade-recv-token').value;
  const amount = parseFloat($('#trade-pay-amount').value) || 0;
  const payT = window.Balances.findToken(state.phantom.tokens, paySym);
  const recvT = window.Balances.findToken(state.phantom.tokens, recvSym);
  if (!payT || !recvT || amount <= 0) {
    $('#trade-recv-amount').value = '0';
    return;
  }
  const payUsd = amount * window.Prices.getPrice(payT.id);
  const recvPrice = window.Prices.getPrice(recvT.id) || 1;
  const recvAmt = payUsd / recvPrice;
  $('#trade-recv-amount').value = recvAmt.toFixed(6);
}

function confirmTrade() {
  const paySym = $('#trade-pay-token').value;
  const recvSym = $('#trade-recv-token').value;
  const amount = parseFloat($('#trade-pay-amount').value) || 0;
  const recvAmt = parseFloat($('#trade-recv-amount').value) || 0;
  if (amount <= 0) return showToast('Enter amount', 'error');
  const payT = window.Balances.findToken(state.phantom.tokens, paySym);
  if (!payT || payT.amount < amount) {
    $('#trade-status').textContent = 'Insufficient Funds';
    $('#trade-status').className = 'text-center text-[13px] text-phantom-red mt-3';
    return showToast('Insufficient balance', 'error');
  }
  window.Balances.adjustBalance(state.phantom.tokens, paySym, -amount);
  window.Balances.adjustBalance(state.phantom.tokens, recvSym, recvAmt);
  const usd = amount * window.Prices.getPrice(payT.id);
  window.Balances.addHistory(state.phantom, {
    type: 'swap', symbol: paySym, amount, usd,
    counterparty: `${paySym} → ${recvSym}`, note: ''
  });
  window.Balances.saveState(state);
  showToast(`Swapped ${formatAmount(amount)} ${paySym} → ${formatAmount(recvAmt)} ${recvSym}`, 'success');
  setTimeout(renderHome, 600);
}

// BUY
function openBuy(prefill = null) {
  currentView = 'buy';
  hideAllScreens();
  $('#buy-screen').classList.remove('hidden');
  const select = $('#buy-token-select');
  select.innerHTML = state.phantom.tokens.map(t =>
    `<option value="${t.symbol}" ${prefill === t.symbol ? 'selected' : ''}>${t.symbol} · ${t.name}</option>`
  ).join('');
  $('#buy-usd-amount').value = '';
  updateBuyPreview();
}

function updateBuyPreview() {
  const symbol = $('#buy-token-select')?.value;
  const usd = parseFloat($('#buy-usd-amount')?.value) || 0;
  const token = window.Balances.findToken(state.phantom.tokens, symbol);
  const price = token ? window.Prices.getPrice(token.id) : 0;
  const amt = price > 0 ? usd / price : 0;
  $('#buy-token-preview').textContent = `≈ ${formatAmount(amt)} ${symbol || ''}`;
}

function confirmBuy() {
  const symbol = $('#buy-token-select').value;
  const usd = parseFloat($('#buy-usd-amount').value) || 0;
  if (usd < 10) return showToast('Minimum $10', 'error');
  const token = window.Balances.findToken(state.phantom.tokens, symbol);
  if (!token) return showToast('Select a token', 'error');
  const price = window.Prices.getPrice(token.id) || 1;
  const amount = usd / price;
  window.Balances.adjustBalance(state.phantom.tokens, symbol, amount);
  window.Balances.addHistory(state.phantom, {
    type: 'buy', symbol, amount, usd,
    counterparty: 'Card ••4242', note: 'Simulated card purchase'
  });
  window.Balances.saveState(state);
  showToast(`Bought ${formatAmount(amount)} ${symbol} for ${formatUSD(usd)}`, 'success');
  setTimeout(renderHome, 600);
}

// EDIT / HISTORY / SETTINGS
function openEditModal() {
  const list = $('#edit-token-list');
  list.innerHTML = state.phantom.tokens.map(t => `
    <div class="edit-row" data-id="${t.id}">
      <img class="token-logo" src="${t.logo}" style="width:36px;height:36px" alt="" />
      <div style="width:70px;font-weight:600;font-size:14px">${t.symbol}</div>
      <input class="edit-input" type="number" step="any" min="0" value="${t.amount}" data-field="amount" />
    </div>`).join('');
  $('#modal-edit').classList.remove('hidden');
}
function closeEditModal() { $('#modal-edit').classList.add('hidden'); }
function saveBalances() {
  $$('#edit-token-list .edit-row').forEach(row => {
    const id = row.dataset.id;
    const input = row.querySelector('input');
    const token = state.phantom.tokens.find(t => t.id === id);
    if (token && input) token.amount = parseFloat(input.value) || 0;
  });
  window.Balances.saveState(state);
  closeEditModal();
  renderHome();
  showToast('Balances updated', 'success');
}

function openHistoryEditor() {
  $('#modal-history-edit').classList.remove('hidden');
  renderHistoryEditorList();
}
function renderHistoryEditorList() {
  const list = $('#history-edit-list');
  const hist = state.phantom.history || [];
  list.innerHTML = hist.map(tx => `
    <div class="flex items-center gap-2 py-2 border-b border-phantom-border/50" data-id="${tx.id}">
      <div class="flex-1 text-[13px]">
        <span class="capitalize font-medium">${tx.type}</span> ${tx.amount} ${tx.symbol}
        <div class="text-[11px] text-phantom-muted">${tx.counterparty}</div>
      </div>
      <button class="text-phantom-red text-[12px] px-2 py-1" data-del="${tx.id}">Delete</button>
    </div>`).join('') || '<p class="text-phantom-muted text-sm py-4">No entries</p>';
  list.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => {
      state.phantom.history = state.phantom.history.filter(h => h.id !== btn.dataset.del);
      window.Balances.saveState(state);
      renderHistoryEditorList();
      if (currentView === 'activity') renderActivity();
    };
  });
}
function addHistoryEntry() {
  const type = $('#hist-type').value;
  const symbol = $('#hist-symbol').value.toUpperCase();
  const amount = parseFloat($('#hist-amount').value) || 0;
  const counterparty = $('#hist-counterparty').value || fakeAddress().slice(0, 8) + '...';
  if (!symbol || amount <= 0) return showToast('Fill type, symbol & amount', 'error');
  const token = window.Balances.findToken(state.phantom.tokens, symbol);
  const usd = token ? amount * window.Prices.getPrice(token.id) : amount;
  window.Balances.addHistory(state.phantom, { type, symbol, amount, usd, counterparty });
  window.Balances.saveState(state);
  renderHistoryEditorList();
  showToast('Entry added', 'success');
  $('#hist-amount').value = '';
  $('#hist-counterparty').value = '';
}

function openSettings() {
  $('#modal-settings').classList.remove('hidden');
  $('#settings-account-name').value = state.settings?.accountName || 'Main Wallet';
}
function closeSettings() { $('#modal-settings').classList.add('hidden'); }
function saveSettings() {
  state.settings.accountName = $('#settings-account-name').value || 'Main Wallet';
  window.Balances.saveState(state);
  closeSettings();
  showToast('Settings saved', 'success');
}
function resetDemo() {
  if (!confirm('Reset to rich demo portfolio?')) return;
  state = window.Balances.getDefaultState();
  window.Balances.saveState(state);
  closeSettings();
  renderHome();
  showToast('Demo portfolio restored', 'success');
}
function exportJSON() {
  downloadJSON(state, 'larp-wallet-portfolio.json');
  showToast('Exported', 'success');
}

function toggleFab() {
  fabOpen = !fabOpen;
  $('#fab-menu').classList.toggle('hidden', !fabOpen);
}
function closeFab() {
  fabOpen = false;
  $('#fab-menu')?.classList.add('hidden');
}

function showToast(msg, type = 'info') {
  let t = $('#toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl text-[14px] font-medium shadow-lg transition-all duration-300 opacity-0 pointer-events-none';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#AB9FF2';
  t.style.color = type === 'success' || type === 'error' ? '#fff' : '#0d0d0f';
  t.classList.remove('opacity-0');
  t.classList.add('opacity-100');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.classList.add('opacity-0'); t.classList.remove('opacity-100'); }, 2200);
}

function bindEvents() {
  $('#btn-edit-balances')?.addEventListener('click', openEditModal);
  $('#btn-close-edit')?.addEventListener('click', closeEditModal);
  $('#modal-edit-backdrop')?.addEventListener('click', closeEditModal);
  $('#btn-save-balances')?.addEventListener('click', saveBalances);

  $('#btn-back-token')?.addEventListener('click', closeTokenDetail);
  $('#btn-token-send')?.addEventListener('click', () => { closeTokenDetail(); openSend(currentToken?.symbol); });
  $('#btn-token-receive')?.addEventListener('click', () => { closeTokenDetail(); openReceive(currentToken?.symbol); });

  $$('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.action;
      if (a === 'send') openSend();
      else if (a === 'receive') openReceive();
      else if (a === 'swap') openTrade();
      else if (a === 'buy') openBuy();
    });
  });

  $$('.top-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const t = tab.dataset.tab;
      if (t === 'home') renderHome();
      else if (t === 'trade') openTrade();
      else showToast(`${t} – coming in next polish`, 'info');
    });
  });

  $('#btn-back-send')?.addEventListener('click', renderHome);
  $('#send-token-select')?.addEventListener('change', updateSendPreview);
  $('#send-amount')?.addEventListener('input', updateSendPreview);
  $('#btn-send-max')?.addEventListener('click', () => {
    const symbol = $('#send-token-select').value;
    const t = window.Balances.findToken(state.phantom.tokens, symbol);
    if (t) { $('#send-amount').value = t.amount; updateSendPreview(); }
  });
  $('#btn-confirm-send')?.addEventListener('click', confirmSend);

  $('#btn-back-receive')?.addEventListener('click', renderHome);
  $('#btn-copy-address')?.addEventListener('click', copyAddress);
  $('#btn-simulate-receive')?.addEventListener('click', simulateReceive);
  $('#recv-tab-tokens')?.addEventListener('click', () => showRecvTab('tokens'));
  $('#recv-tab-cash')?.addEventListener('click', () => showRecvTab('cash'));
  $('#btn-change-network')?.addEventListener('click', () => $('#modal-network').classList.remove('hidden'));
  $('#btn-close-network')?.addEventListener('click', () => $('#modal-network').classList.add('hidden'));
  $('#modal-network-backdrop')?.addEventListener('click', () => $('#modal-network').classList.add('hidden'));
  $$('.network-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      $('#recv-network-label').textContent = btn.dataset.net;
      $('#modal-network').classList.add('hidden');
    });
  });

  $('#btn-back-trade')?.addEventListener('click', renderHome);
  $('#trade-pay-amount')?.addEventListener('input', updateTradeQuote);
  $('#trade-pay-token')?.addEventListener('change', updateTradeQuote);
  $('#trade-recv-token')?.addEventListener('change', updateTradeQuote);
  $('#btn-trade-flip')?.addEventListener('click', () => {
    const a = $('#trade-pay-token').value;
    $('#trade-pay-token').value = $('#trade-recv-token').value;
    $('#trade-recv-token').value = a;
    updateTradeQuote();
  });
  $$('.trade-pct').forEach(btn => {
    btn.addEventListener('click', () => {
      const pct = parseInt(btn.dataset.pct, 10);
      const symbol = $('#trade-pay-token').value;
      const t = window.Balances.findToken(state.phantom.tokens, symbol);
      if (t) {
        $('#trade-pay-amount').value = ((t.amount * pct) / 100).toFixed(6);
        updateTradeQuote();
      }
    });
  });
  $('#btn-confirm-trade')?.addEventListener('click', confirmTrade);

  // BUY
  $('#btn-back-buy')?.addEventListener('click', renderHome);
  $('#buy-token-select')?.addEventListener('change', updateBuyPreview);
  $('#buy-usd-amount')?.addEventListener('input', updateBuyPreview);
  $$('.buy-quick').forEach(btn => {
    btn.addEventListener('click', () => {
      $('#buy-usd-amount').value = btn.dataset.usd;
      updateBuyPreview();
    });
  });
  $('#btn-confirm-buy')?.addEventListener('click', confirmBuy);

  $('#btn-settings')?.addEventListener('click', openSettings);
  $('#btn-close-settings')?.addEventListener('click', closeSettings);
  $('#modal-settings-backdrop')?.addEventListener('click', closeSettings);
  $('#btn-save-settings')?.addEventListener('click', saveSettings);
  $('#btn-reset-demo')?.addEventListener('click', resetDemo);
  $('#btn-export-json')?.addEventListener('click', exportJSON);
  $('#btn-open-history-editor')?.addEventListener('click', () => { closeSettings(); openHistoryEditor(); });
  $('#btn-edit-history-from-activity')?.addEventListener('click', openHistoryEditor);
  $('#btn-close-history-edit')?.addEventListener('click', () => {
    $('#modal-history-edit').classList.add('hidden');
    if (currentView === 'activity') renderActivity();
  });
  $('#btn-add-history')?.addEventListener('click', addHistoryEntry);

  $('#btn-fab')?.addEventListener('click', toggleFab);
  $$('.fab-action').forEach(btn => {
    btn.addEventListener('click', () => {
      closeFab();
      const a = btn.dataset.action;
      if (a === 'send') openSend();
      else if (a === 'receive') openReceive();
      else if (a === 'swap') openTrade();
      else if (a === 'buy') openBuy();
    });
  });

  $('#btn-add-token')?.addEventListener('click', () => {
    const symbol = prompt('Token symbol (e.g. RAY):');
    if (!symbol) return;
    const amount = parseFloat(prompt('Amount:', '100') || '0');
    const name = prompt('Name:', symbol) || symbol;
    state.phantom.tokens.push({
      id: symbol.toLowerCase().replace(/\s+/g, '-'),
      symbol: symbol.toUpperCase(),
      name,
      amount,
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(symbol)}&background=2a2a30&color=AB9FF2&size=128`
    });
    window.Balances.saveState(state);
    renderHome();
    showToast(`${symbol.toUpperCase()} added`, 'success');
  });

  $('#btn-profile')?.addEventListener('click', openSettings);
}

document.addEventListener('DOMContentLoaded', init);
