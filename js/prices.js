// CoinGecko free price feed
const COINGECKO_IDS = {
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  solana: 'solana',
  'usd-coin': 'usd-coin',
  tether: 'tether',
  binancecoin: 'binancecoin',
  bonk: 'bonk',
  jupiter: 'jupiter-exchange-solana',
  dogwifcoin: 'dogwifcoin',
  raydium: 'raydium',
  orca: 'orca'
};

const FALLBACK_PRICES = {
  bitcoin: { usd: 98500, usd_24h_change: 1.2 },
  ethereum: { usd: 3450, usd_24h_change: 0.8 },
  solana: { usd: 178.5, usd_24h_change: 2.4 },
  'usd-coin': { usd: 1.0, usd_24h_change: 0.01 },
  tether: { usd: 1.0, usd_24h_change: 0.0 },
  binancecoin: { usd: 620, usd_24h_change: -0.5 },
  bonk: { usd: 0.000021, usd_24h_change: 5.2 },
  'jupiter-exchange-solana': { usd: 0.85, usd_24h_change: 3.1 },
  dogwifcoin: { usd: 2.15, usd_24h_change: -1.8 },
  raydium: { usd: 3.4, usd_24h_change: 1.5 },
  orca: { usd: 2.9, usd_24h_change: 0.9 }
};

let priceCache = { ...FALLBACK_PRICES };
let lastFetch = 0;
const CACHE_MS = 45000; // 45s

async function fetchPrices(ids = Object.keys(COINGECKO_IDS)) {
  const now = Date.now();
  if (now - lastFetch < CACHE_MS && Object.keys(priceCache).length > 5) {
    return priceCache;
  }

  const idList = ids.map(id => COINGECKO_IDS[id] || id).join(',');
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idList}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    // Normalize keys back to our internal ids
    const normalized = {};
    for (const [key, val] of Object.entries(data)) {
      // find our key
      const ourKey = Object.keys(COINGECKO_IDS).find(k => COINGECKO_IDS[k] === key) || key;
      normalized[ourKey] = val;
      // also keep coingecko key
      normalized[key] = val;
    }
    priceCache = { ...priceCache, ...normalized };
    lastFetch = now;
    return priceCache;
  } catch (e) {
    console.warn('Price fetch failed, using cache/fallback', e);
    return priceCache;
  }
}

function getPrice(id) {
  const p = priceCache[id] || priceCache[COINGECKO_IDS[id]] || FALLBACK_PRICES[id] || FALLBACK_PRICES[COINGECKO_IDS[id]];
  return p ? p.usd : 0;
}

function getChange(id) {
  const p = priceCache[id] || priceCache[COINGECKO_IDS[id]] || FALLBACK_PRICES[id] || FALLBACK_PRICES[COINGECKO_IDS[id]];
  return p ? (p.usd_24h_change || 0) : 0;
}

window.Prices = { fetchPrices, getPrice, getChange, priceCache, COINGECKO_IDS };
