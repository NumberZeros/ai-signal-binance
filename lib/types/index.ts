// Core types for the crypto analysis platform

export type Timeframe =
  | '1s'
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M';
export type Symbol = string; // Dynamic symbols fetched from Binance /api/v3/exchangeInfo

// Chart Types
export type ChartType = 'candlestick' | 'line' | 'area' | 'baseline' | 'bar';

// Binance Product Types
export type BinanceProductType = 'SPOT' | 'USD_M_FUTURES' | 'COIN_M_FUTURES' | 'OPTIONS';

// Binance Exchange Info Types
export interface BinanceSymbolInfo {
  symbol: string;
  status: string; // TRADING, HALT, BREAK
  baseAsset: string;
  quoteAsset: string;
  baseAssetPrecision: number;
  quotePrecision: number;
  orderTypes: string[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  permissions: string[]; // SPOT, MARGIN, etc.
}

export interface BinanceExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits: Array<{
    rateLimitType: string;
    interval: string;
    intervalNum: number;
    limit: number;
  }>;
  symbols: BinanceSymbolInfo[];
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface IndicatorValues {
  ema9?: number;
  ema21?: number;
  ema50?: number;
  sma20?: number;
  sma50?: number;
  rsi?: number;
  volumeMA?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bollingerUpper?: number;
  bollingerMiddle?: number;
  bollingerLower?: number;
  stochK?: number;
  stochD?: number;
}

export interface CandleWithIndicators extends Candle {
  indicators: IndicatorValues;
}

export type AlertType = 
  | 'EMA_CROSSOVER_BULLISH'
  | 'EMA_CROSSOVER_BEARISH'
  | 'BREAKOUT_HIGH'
  | 'BREAKOUT_LOW'
  | 'VOLUME_SPIKE'
  | 'RSI_OVERBOUGHT'
  | 'RSI_OVERSOLD'
  | 'MACD_CROSSOVER_BULLISH'
  | 'MACD_CROSSOVER_BEARISH'
  | 'BOLLINGER_BREAKOUT_UPPER'
  | 'BOLLINGER_BREAKOUT_LOWER'
  | 'STOCHASTIC_OVERBOUGHT'
  | 'STOCHASTIC_OVERSOLD';

export interface Alert {
  id: string;
  timestamp: number;
  type: AlertType;
  symbol: Symbol;
  timeframe: Timeframe;
  price: number;
  confidence: number; // 0-100
  metadata: {
    description: string;
    technicalReason: string;
    indicatorValues: Partial<IndicatorValues>;
  };
  aiExplanation?: string;
}

export interface MarketState {
  symbol: Symbol;
  timeframe: Timeframe;
  candles: CandleWithIndicators[];
  alerts: Alert[];
  lastUpdate: number;
  isLive: boolean;
}

export interface BinanceKlineData {
  t: number; // Kline start time
  T: number; // Kline close time
  s: string; // Symbol
  i: string; // Interval
  f: number; // First trade ID
  L: number; // Last trade ID
  o: string; // Open price
  c: string; // Close price
  h: string; // High price
  l: string; // Low price
  v: string; // Base asset volume
  n: number; // Number of trades
  x: boolean; // Is this kline closed?
  q: string; // Quote asset volume
  V: string; // Taker buy base asset volume
  Q: string; // Taker buy quote asset volume
}

export interface BinanceWebSocketMessage {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  k: BinanceKlineData;
}

export interface AIContext {
  symbol: Symbol;
  timeframe: Timeframe;
  currentPrice: number;
  recentAlerts: Alert[];
  indicators: IndicatorValues;
  marketCondition: 'bullish' | 'bearish' | 'neutral';
}

export interface ChartConfig {
  chartType: ChartType;
  showEMA9: boolean;
  showEMA21: boolean;
  showEMA50: boolean;
  showSMA20: boolean;
  showRSI: boolean;
  showVolume: boolean;
  showAlerts: boolean;
  showTooltip: boolean;
  showCrosshair: boolean;
  showGrid: boolean;
  showPriceScale: boolean;
  showTimeScale: boolean;
  showLegend: boolean;
}
