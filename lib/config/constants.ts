// Application constants

// Binance Product Configuration
export const BINANCE_PRODUCT_TYPE = 'SPOT' as const; // Current implementation: Spot only

// Binance API URLs by product type
export const BINANCE_URLS = {
  SPOT: {
    REST: 'https://api.binance.com',
    WS: 'wss://stream.binance.com:9443/ws',
    // Alternative URLs for redundancy
    REST_FALLBACKS: [
      'https://api1.binance.com',
      'https://api2.binance.com',
      'https://api3.binance.com',
    ],
    // Market data only (reduced load)
    REST_DATA: 'https://data-api.binance.vision',
    WS_DATA: 'wss://data-stream.binance.vision',
  },
  USD_M_FUTURES: {
    REST: 'https://fapi.binance.com',
    WS: 'wss://fstream.binance.com/ws',
    REST_FALLBACKS: [
      'https://fapi1.binance.com',
      'https://fapi2.binance.com',
    ],
  },
  COIN_M_FUTURES: {
    REST: 'https://dapi.binance.com',
    WS: 'wss://dstream.binance.com/ws',
    REST_FALLBACKS: [
      'https://dapi1.binance.com',
    ],
  },
  OPTIONS: {
    REST: 'https://eapi.binance.com',
    WS: 'wss://nbstream.binance.com/eoptions/ws',
    REST_FALLBACKS: [],
  },
  TESTNET: {
    REST: 'https://testnet.binance.vision',
    WS: 'wss://testnet.binance.vision/ws',
    REST_FALLBACKS: [],
  },
} as const;

// Active URLs based on product type
export const BINANCE_REST_URL = BINANCE_URLS[BINANCE_PRODUCT_TYPE].REST;
export const BINANCE_WS_URL = BINANCE_URLS[BINANCE_PRODUCT_TYPE].WS;

export const DEFAULT_SYMBOL = 'BTCUSDT';
export const DEFAULT_TIMEFRAME = '15m';

// Popular symbols (fallback if exchangeInfo unavailable)
export const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT', 'DOTUSDT',
  'LTCUSDT', 'UNIUSDT', 'LINKUSDT', 'ATOMUSDT', 'ETCUSDT',
] as const;

// Candle limits for memory management
export const MAX_CANDLES_IN_MEMORY = 500;
export const INITIAL_CANDLES_LOAD = 300;

// Alert configuration
export const MAX_ALERTS_IN_MEMORY = 100;
export const ALERT_DEDUPLICATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Indicator periods
export const INDICATOR_PERIODS = {
  EMA_FAST: 9,
  EMA_MID: 21,
  EMA_SLOW: 50,
  SMA_SHORT: 20,
  SMA_LONG: 50,
  RSI: 14,
  VOLUME_MA: 20,
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,
  BOLLINGER_PERIOD: 20,
  BOLLINGER_STD_DEV: 2,
  STOCHASTIC_K: 14,
  STOCHASTIC_D: 3,
} as const;

// RSI thresholds
export const RSI_OVERBOUGHT = 70;
export const RSI_OVERSOLD = 30;

// Volume spike threshold (multiple of average)
export const VOLUME_SPIKE_MULTIPLIER = 2.0;

// Stochastic thresholds
export const STOCHASTIC_OVERBOUGHT = 80;
export const STOCHASTIC_OVERSOLD = 20;

// Timeframe to milliseconds mapping
export const TIMEFRAME_MS: Record<string, number> = {
  '1s': 1 * 1000,
  '1m': 60 * 1000,
  '3m': 3 * 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '8h': 8 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000, // Approximate (28-31 days)
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  // Binance Spot rate limits (weight-based system)
  MAX_WEIGHT_PER_MINUTE: 6000,
  WARNING_THRESHOLD: 4800, // 80% of max
  RETRY_AFTER_429_MS: 60000, // Wait 1 minute after rate limit hit
  MAX_RETRIES: 3,
  BACKOFF_MULTIPLIER: 2,
} as const;

// Binance error codes
export const BINANCE_ERROR_CODES = {
  IP_BAN: -1003,
  TIMESTAMP_SYNC: -1021,
  INVALID_SIGNATURE: -1022,
  TOO_MANY_REQUESTS: -1003,
  UNKNOWN_ORDER: -2013,
  API_KEY_INVALID: -2015,
} as const;

// AI Configuration
export const AI_CONFIG = {
  MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  MAX_TOKENS: 500,
  TEMPERATURE: 0.7,
  RATE_LIMIT_PER_MINUTE: 10,
} as const;

// Chart configuration defaults
export const DEFAULT_CHART_CONFIG = {
  chartType: 'candlestick' as const,
  showEMA9: true,
  showEMA21: true,
  showEMA50: false,
  showSMA20: false,
  showRSI: true,
  showVolume: true,
  showAlerts: true,
  showTooltip: true,
  showCrosshair: true,
  showGrid: false,
  showPriceScale: true,
  showTimeScale: true,
  showLegend: true,
  showMACD: false,
  showBollinger: false,
  showStochastic: false,
};
