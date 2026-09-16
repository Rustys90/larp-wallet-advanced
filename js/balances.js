// Balance + History management + LocalStorage (shared across skins)
const STORAGE_KEY = 'larp-wallet-v2';

const DEFAULT_TOKENS = [
  { id: 'solana', symbol: 'SOL', name: 'Solana', amount: 128.45, logo: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', amount: 0.482, logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', amount: 4.21, logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', amount: 12450.00, logo: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', amount: 3200.00, logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  { id: 'bonk', symbol: 'BONK', name: 'Bonk', amount: 45000000, logo: 'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg' },
  { id: 'jupiter-exchange-solana', symbol: 'JUP', name: 'Jupiter', amount: 2450, logo: 'https://assets.coingecko.com/coins/images/34188/small/jup.png' },
  { id: 'dogwifcoin', symbol: 'WIF', name: 'dogwifhat', amount: 890, logo: 'https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg' }
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.phantom && Array.isArray(data.phantom.tokens)) return data;
    }
  } catch (e) {}
  return getDefaultState();
}

function getDefaultState() {
  return {
    currentSkin: 'phantom',
    phantom: {
      tokens: JSON.parse(JSON.stringify(DEFAULT_TOKENS)),
      history: [
        { id: uid(), type: 'received', symbol: 'SOL', amount: 12.5, usd: 2231.25, counterparty: '7xKXg...9mPq2', date: Date.now() - 3600000, status: 'confirmed', note: 'From friend' },
        { id: uid(), type: 'swap', symbol: 'USDC', amount: 500, usd: 500, counterparty: 'JUP → SOL', date: Date.now() - 86400000, status: 'confirmed', note: '' },
        { id: uid(), type: 'sent', symbol: 'ETH', amount: 0.15, usd: 517.5, counterparty: '0xAbC...3f21', date: Date.now() - 172800000, status: 'confirmed', note: 'Payment' },
        { id: uid(), type: 'received', symbol: 'BONK', amount: 5000000, usd: 105, counterparty: 'Airdrop', date: Date.now() - 259200000, status: 'confirmed', note: 'Community airdrop' },
        { id: uid(), type: 'buy', symbol: 'SOL', amount: 25, usd: 4462.5, counterparty: 'Card ••4242', date: Date.now() - 432000000, status: 'confirmed', note: '' }
      ]
    },
    trust: {
      tokens: [
        { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', amount: 2.85, network: 'ETH', logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
        { id: 'binancecoin', symbol: 'BNB', name: 'BNB', amount: 12.4, network: 'BSC', logo: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
        { id: 'solana', symbol: 'SOL', name: 'Solana', amount: 45.2, network: 'SOL', logo: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
        { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', amount: 8500, network: 'ETH', logo: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
        { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', amount: 0.15, network: 'BTC', logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' }
      ],
      history: []
    },
    paypal: {
      availableBalance: 12450.75,
      totalBalance: 15820.00,
      activity: [
        { id: uid(), type: 'received', title: 'Payment from Alex M.', amount: 250.00, date: Date.now() - 7200000, status: 'completed' },
        { id: uid(), type: 'sent', title: 'To Sarah K.', amount: -89.50, date: Date.now() - 86400000, status: 'completed' },
        { id: uid(), type: 'received', title: 'Refund – Amazon', amount: 34.99, date: Date.now() - 172800000, status: 'completed' }
      ]
    },
    settings: { darkMode: true, currency: 'USD', accountName: 'Main Wallet' }
  };
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Save failed', e);
  }
}

function calcTokenUSD(token) {
  const price = window.Prices.getPrice(token.id);
  return (token.amount || 0) * price;
}

function calcTotalUSD(tokens) {
  return tokens.reduce((sum, t) => sum + calcTokenUSD(t), 0);
}

function calcTotalChangeUSD(tokens) {
  return tokens.reduce((sum, t) => {
    const price = window.Prices.getPrice(t.id);
    const change = window.Prices.getChange(t.id) / 100;
    return sum + (t.amount || 0) * price * change;
  }, 0);
}

function findToken(tokens, idOrSymbol) {
  return tokens.find(t => t.id === idOrSymbol || t.symbol === idOrSymbol);
}

function adjustBalance(tokens, symbol, delta) {
  const t = findToken(tokens, symbol);
  if (t) {
    t.amount = Math.max(0, +(t.amount + delta).toFixed(8));
    return true;
  }
  return false;
}

function addHistory(skinData, entry) {
  if (!skinData.history) skinData.history = [];
  skinData.history.unshift({
    id: uid(),
    date: Date.now(),
    status: 'confirmed',
    ...entry
  });
}

window.Balances = {
  loadState,
  saveState,
  getDefaultState,
  calcTokenUSD,
  calcTotalUSD,
  calcTotalChangeUSD,
  findToken,
  adjustBalance,
  addHistory,
  DEFAULT_TOKENS,
  uid
};
