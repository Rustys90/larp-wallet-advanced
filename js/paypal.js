// PayPal skin – full functional simulation
const { $, $$, formatUSD, updateStatusTime } = window.Utils;

let state = null;

function showToast(msg, type = 'info') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl text-[14px] font-medium shadow-lg transition-all duration-300 opacity-0 pointer-events-none';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = type === 'success' ? '#0d7a4f' : type === 'error' ? '#d32f2f' : '#0070ba';
  t.style.color = '#fff';
  t.classList.remove('opacity-0');
  t.classList.add('opacity-100');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.classList.add('opacity-0');
    t.classList.remove('opacity-100');
  }, 2200);
}

function ensurePayPal() {
  if (!state.paypal) {
    state.paypal = {
      availableBalance: 12450.75,
      totalBalance: 15820.00,
      activity: []
    };
  }
  if (!Array.isArray(state.paypal.activity)) state.paypal.activity = [];
}

async function init() {
  state = window.Balances.loadState();
  ensurePayPal();
  updateStatusTime();
  setInterval(updateStatusTime, 20000);

  window.Skeletons.showPayPalHome($('#pp-activity-list'));
  // Short skeleton then render
  setTimeout(() => {
    render();
    bindEvents();
  }, 420);
}

function hideAll() {
  ['pp-home', 'pp-send-screen', 'pp-request-screen', 'pp-add-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

function showHome() {
  hideAll();
  $('#pp-home').classList.remove('hidden');
  render();
}

function render() {
  ensurePayPal();
  const pp = state.paypal;
  $('#pp-balance').textContent = formatUSD(pp.availableBalance);
  $('#pp-available').textContent = formatUSD(pp.availableBalance);
  $('#pp-total').textContent = formatUSD(pp.totalBalance);

  const list = $('#pp-activity-list');
  const acts = pp.activity || [];
  if (!acts.length) {
    list.innerHTML = `<p class="text-center text-[#6b7c93] py-10 text-[14px]">No recent activity</p>`;
    return;
  }
  list.innerHTML = acts.map(a => {
    const isIn = a.amount > 0 || a.type === 'received';
    const amt = Math.abs(a.amount);
    const color = isIn ? 'text-[#0d7a4f]' : 'text-[#001c64]';
    const sign = isIn ? '+' : '-';
    const initials = (a.title || 'PP').replace(/[^A-Za-z]/g, ' ').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'PP';
    const time = new Date(a.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="pp-activity-row" data-id="${a.id}">
        <div class="pp-avatar">${initials}</div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-[15px] text-[#001c64] truncate">${a.title}</p>
          <p class="text-[12px] text-[#6b7c93]">${time} · ${a.status || 'completed'}</p>
        </div>
        <div class="text-right font-semibold text-[15px] ${color}">${sign}${formatUSD(amt)}</div>
      </div>`;
  }).join('');
}

// SEND
function openSend() {
  hideAll();
  $('#pp-send-screen').classList.remove('hidden');
  $('#pp-send-to').value = '';
  $('#pp-send-amount').value = '';
  $('#pp-send-note').value = '';
  $('#pp-send-hint').textContent = `Available: ${formatUSD(state.paypal.availableBalance)}`;
}

function confirmSend() {
  const to = $('#pp-send-to').value.trim() || 'Someone';
  const amount = parseFloat($('#pp-send-amount').value) || 0;
  const note = $('#pp-send-note').value.trim();
  if (amount <= 0) return showToast('Enter an amount', 'error');
  if (amount > state.paypal.availableBalance) return showToast('Insufficient balance', 'error');
  state.paypal.availableBalance = +(state.paypal.availableBalance - amount).toFixed(2);
  state.paypal.totalBalance = +(state.paypal.totalBalance - amount).toFixed(2);
  state.paypal.activity.unshift({
    id: window.Balances.uid(),
    type: 'sent',
    title: `To ${to}`,
    amount: -amount,
    date: Date.now(),
    status: 'completed',
    note
  });
  window.Balances.saveState(state);
  showToast(`Sent ${formatUSD(amount)}`, 'success');
  setTimeout(showHome, 450);
}

// REQUEST (simulate incoming after "request")
function openRequest() {
  hideAll();
  $('#pp-request-screen').classList.remove('hidden');
  $('#pp-request-from').value = '';
  $('#pp-request-amount').value = '';
  $('#pp-request-note').value = '';
}

function confirmRequest() {
  const from = $('#pp-request-from').value.trim() || 'Someone';
  const amount = parseFloat($('#pp-request-amount').value) || 0;
  if (amount <= 0) return showToast('Enter an amount', 'error');
  // Simulate immediate fulfillment for demo
  state.paypal.availableBalance = +(state.paypal.availableBalance + amount).toFixed(2);
  state.paypal.totalBalance = +(state.paypal.totalBalance + amount).toFixed(2);
  state.paypal.activity.unshift({
    id: window.Balances.uid(),
    type: 'received',
    title: `Payment from ${from}`,
    amount: amount,
    date: Date.now(),
    status: 'completed'
  });
  window.Balances.saveState(state);
  showToast(`Received ${formatUSD(amount)}`, 'success');
  setTimeout(showHome, 450);
}

// ADD MONEY
function openAdd() {
  hideAll();
  $('#pp-add-screen').classList.remove('hidden');
  $('#pp-add-amount').value = '';
}

function confirmAdd() {
  const amount = parseFloat($('#pp-add-amount').value) || 0;
  if (amount < 1) return showToast('Enter an amount', 'error');
  state.paypal.availableBalance = +(state.paypal.availableBalance + amount).toFixed(2);
  state.paypal.totalBalance = +(state.paypal.totalBalance + amount).toFixed(2);
  state.paypal.activity.unshift({
    id: window.Balances.uid(),
    type: 'received',
    title: 'Added from bank/card',
    amount: amount,
    date: Date.now(),
    status: 'completed'
  });
  window.Balances.saveState(state);
  showToast(`Added ${formatUSD(amount)}`, 'success');
  setTimeout(showHome, 450);
}

// Edit balance
function openEditBalance() {
  $('#pp-edit-available').value = state.paypal.availableBalance;
  $('#pp-edit-total').value = state.paypal.totalBalance;
  $('#pp-modal-edit').classList.remove('hidden');
}

function saveBalance() {
  const avail = parseFloat($('#pp-edit-available').value) || 0;
  const total = parseFloat($('#pp-edit-total').value) || 0;
  state.paypal.availableBalance = +avail.toFixed(2);
  state.paypal.totalBalance = +total.toFixed(2);
  window.Balances.saveState(state);
  $('#pp-modal-edit').classList.add('hidden');
  render();
  showToast('Balances updated', 'success');
}

// Activity editor
function openActivityEditor() {
  renderActivityEditor();
  $('#pp-modal-activity').classList.remove('hidden');
}

function renderActivityEditor() {
  const list = $('#pp-activity-edit-list');
  const acts = state.paypal.activity || [];
  list.innerHTML = acts.map(a => `
    <div class="flex items-center justify-between py-2.5 border-b border-[#e5e9ef]" data-id="${a.id}">
      <div class="min-w-0 flex-1">
        <p class="text-[14px] font-medium truncate">${a.title}</p>
        <p class="text-[12px] text-[#6b7c93]">${formatUSD(Math.abs(a.amount))}</p>
      </div>
      <button class="pp-del-act text-[#d32f2f] text-[13px] font-medium px-2" data-id="${a.id}">Delete</button>
    </div>`).join('') || '<p class="text-center text-[#6b7c93] py-6 text-[14px]">No entries</p>';
  $$('.pp-del-act').forEach(btn => {
    btn.onclick = () => {
      state.paypal.activity = state.paypal.activity.filter(x => x.id !== btn.dataset.id);
      window.Balances.saveState(state);
      renderActivityEditor();
      render();
    };
  });
}

function addActivityEntry() {
  const type = $('#pp-hist-type').value;
  const title = $('#pp-hist-title').value.trim() || (type === 'received' ? 'Payment received' : 'Payment sent');
  let amount = parseFloat($('#pp-hist-amount').value) || 0;
  if (amount === 0) return showToast('Enter amount', 'error');
  if (type === 'sent' && amount > 0) amount = -amount;
  if (type === 'received' && amount < 0) amount = Math.abs(amount);
  state.paypal.activity.unshift({
    id: window.Balances.uid(),
    type,
    title,
    amount,
    date: Date.now(),
    status: 'completed'
  });
  window.Balances.saveState(state);
  $('#pp-hist-title').value = '';
  $('#pp-hist-amount').value = '';
  renderActivityEditor();
  render();
  showToast('Entry added', 'success');
}

function bindEvents() {
  $$('.pp-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.action;
      if (a === 'send') openSend();
      else if (a === 'request') openRequest();
      else if (a === 'add') openAdd();
      else if (a === 'more') showToast('More options – coming soon');
    });
  });

  $('#btn-pp-back-send')?.addEventListener('click', showHome);
  $('#btn-pp-confirm-send')?.addEventListener('click', confirmSend);

  $('#btn-pp-back-request')?.addEventListener('click', showHome);
  $('#btn-pp-confirm-request')?.addEventListener('click', confirmRequest);

  $('#btn-pp-back-add')?.addEventListener('click', showHome);
  $('#btn-pp-confirm-add')?.addEventListener('click', confirmAdd);
  $$('.pp-add-quick').forEach(btn => {
    btn.addEventListener('click', () => { $('#pp-add-amount').value = btn.dataset.usd; });
  });

  $('#btn-pp-edit-balance')?.addEventListener('click', openEditBalance);
  $('#btn-pp-close-edit')?.addEventListener('click', () => $('#pp-modal-edit').classList.add('hidden'));
  $('#pp-edit-backdrop')?.addEventListener('click', () => $('#pp-modal-edit').classList.add('hidden'));
  $('#btn-pp-save-balance')?.addEventListener('click', saveBalance);

  $('#btn-pp-edit-activity')?.addEventListener('click', openActivityEditor);
  $('#btn-pp-close-activity')?.addEventListener('click', () => $('#pp-modal-activity').classList.add('hidden'));
  $('#pp-activity-backdrop')?.addEventListener('click', () => $('#pp-modal-activity').classList.add('hidden'));
  $('#btn-pp-add-activity')?.addEventListener('click', addActivityEntry);

  $('#btn-pp-settings')?.addEventListener('click', () => $('#pp-modal-settings').classList.remove('hidden'));
  $('#btn-pp-profile')?.addEventListener('click', () => $('#pp-modal-settings').classList.remove('hidden'));
  $('#btn-pp-close-settings')?.addEventListener('click', () => $('#pp-modal-settings').classList.add('hidden'));
  $('#pp-settings-backdrop')?.addEventListener('click', () => $('#pp-modal-settings').classList.add('hidden'));

  $('#btn-pp-reset')?.addEventListener('click', () => {
    if (!confirm('Reset PayPal balances to demo?')) return;
    const def = window.Balances.getDefaultState();
    state.paypal = def.paypal;
    window.Balances.saveState(state);
    $('#pp-modal-settings').classList.add('hidden');
    showHome();
    showToast('Demo restored', 'success');
  });

  $$('.pp-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      $$('.pp-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      if (item.dataset.tab === 'home') showHome();
      else showToast(`${item.dataset.tab} – coming soon`);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
