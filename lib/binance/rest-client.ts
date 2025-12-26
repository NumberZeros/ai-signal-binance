/**
 * Binance REST API Client
 * Properly implements Binance API structure with rate limiting, error handling, and multi-product support
 */

import { 
  BINANCE_URLS, 
  BINANCE_PRODUCT_TYPE, 
  RATE_LIMIT_CONFIG,
  BINANCE_ERROR_CODES,
  INITIAL_CANDLES_LOAD,
} from '@/lib/config/constants';
import type { 
  BinanceProductType, 
  BinanceExchangeInfo, 
  Timeframe,
  Symbol,
} from '@/lib/types';
import { logger } from '@/lib/utils/logger';

interface BinanceKlineRaw {
  [index: number]: string | number;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteVolume: number;
  trades: number;
  takerBuyBaseVolume: number;
  takerBuyQuoteVolume: number;
}

interface RateLimitState {
  usedWeight: number;
  resetTime: number;
  lastWarningTime: number;
}

export class BinanceRestClient {
  private productType: BinanceProductType;
  private baseUrl: string;
  private fallbackUrls: string[];
  private currentUrlIndex: number = 0;
  private rateLimitState: RateLimitState = {
    usedWeight: 0,
    resetTime: Date.now() + 60000,
    lastWarningTime: 0,
  };

  constructor(productType: BinanceProductType = BINANCE_PRODUCT_TYPE) {
    this.productType = productType;
    const urlConfig = BINANCE_URLS[productType];
    this.baseUrl = urlConfig.REST;
    this.fallbackUrls = [...(urlConfig.REST_FALLBACKS || [])];
  }

  /**
   * Set product type and update URLs
   */
  setProductType(productType: BinanceProductType): void {
    this.productType = productType;
    const urlConfig = BINANCE_URLS[productType];
    this.baseUrl = urlConfig.REST;
    this.fallbackUrls = [...(urlConfig.REST_FALLBACKS || [])];
    this.currentUrlIndex = 0; // Reset to primary URL
  }

  /**
   * Get current REST URL (switches to fallback on failure)
   */
  private getCurrentUrl(): string {
    if (this.currentUrlIndex === 0) {
      return this.baseUrl;
    }
    const fallbackIndex = this.currentUrlIndex - 1;
    return this.fallbackUrls[fallbackIndex] || this.baseUrl;
  }

  /**
   * Switch to next fallback URL
   */
  private switchToFallback(): boolean {
    const maxIndex = 1 + this.fallbackUrls.length;
    if (this.currentUrlIndex < maxIndex - 1) {
      this.currentUrlIndex++;
      logger.warn(`Switching to fallback URL: ${this.getCurrentUrl()}`);
      return true;
    }
    return false;
  }

  /**
   * Reset to primary URL
   */
  private resetToPrimary(): void {
    if (this.currentUrlIndex !== 0) {
      logger.info(`Resetting to primary URL: ${this.baseUrl}`);
      this.currentUrlIndex = 0;
    }
  }

  /**
   * Update rate limit state from response headers
   */
  private updateRateLimitState(headers: Headers): void {
    const usedWeight = headers.get('X-MBX-USED-WEIGHT-1M');
    if (usedWeight) {
      this.rateLimitState.usedWeight = parseInt(usedWeight, 10);
      this.rateLimitState.resetTime = Date.now() + 60000;

      // Warn if approaching limit
      if (
        this.rateLimitState.usedWeight >= RATE_LIMIT_CONFIG.WARNING_THRESHOLD &&
        Date.now() - this.rateLimitState.lastWarningTime > 10000
      ) {
        logger.warn(
          `Rate limit warning: ${this.rateLimitState.usedWeight}/${RATE_LIMIT_CONFIG.MAX_WEIGHT_PER_MINUTE} weight used`
        );
        this.rateLimitState.lastWarningTime = Date.now();
      }
    }
  }

  /**
   * Handle Binance-specific errors
   */
  private handleBinanceError(error: any, statusCode?: number): Error {
    // HTTP status code errors
    if (statusCode === 418) {
      return new Error('IP has been auto-banned for continuing to send requests after receiving 429 codes');
    }
    if (statusCode === 429) {
      return new Error('Rate limit exceeded. Too many requests.');
    }

    // Binance API error codes
    if (error.code) {
      switch (error.code) {
        case BINANCE_ERROR_CODES.IP_BAN:
          return new Error('IP banned by Binance due to too many requests');
        case BINANCE_ERROR_CODES.TIMESTAMP_SYNC:
          return new Error('Timestamp for request was outside of the recvWindow. Please sync your system clock.');
        case BINANCE_ERROR_CODES.INVALID_SIGNATURE:
          return new Error('Invalid API signature');
        case BINANCE_ERROR_CODES.TOO_MANY_REQUESTS:
          return new Error('Breaking request rate limit');
        default:
          return new Error(`Binance API error [${error.code}]: ${error.msg || 'Unknown error'}`);
      }
    }

    return new Error(error.msg || error.message || 'Unknown Binance API error');
  }

  /**
   * Make a request with retry logic and rate limit handling
   */
  private async fetchWithRetry(
    endpoint: string,
    params: Record<string, string> = {},
    retryCount = 0
  ): Promise<any> {
    const url = new URL(endpoint, this.getCurrentUrl());
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Update rate limit state
      this.updateRateLimitState(response.headers);

      if (!response.ok) {
        // Rate limit hit
        if (response.status === 429) {
          if (retryCount < RATE_LIMIT_CONFIG.MAX_RETRIES) {
            const waitMs = RATE_LIMIT_CONFIG.RETRY_AFTER_429_MS * Math.pow(RATE_LIMIT_CONFIG.BACKOFF_MULTIPLIER, retryCount);
            logger.warn(`Rate limited. Retrying in ${waitMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitMs));
            return this.fetchWithRetry(endpoint, params, retryCount + 1);
          }
        }

        // IP ban
        if (response.status === 418) {
          throw this.handleBinanceError(null, 418);
        }

        // Try fallback URL on server errors
        if (response.status >= 500 && this.switchToFallback()) {
          logger.warn(`Server error (${response.status}), trying fallback...`);
          return this.fetchWithRetry(endpoint, params, retryCount);
        }

        const errorData = await response.json().catch(() => ({}));
        throw this.handleBinanceError(errorData, response.status);
      }

      // Reset to primary on success after using fallback
      if (this.currentUrlIndex > 0) {
        this.resetToPrimary();
      }

      return await response.json();
    } catch (error: any) {
      // Network errors - try fallback
      if (error.name === 'TypeError' && this.switchToFallback()) {
        logger.warn('Network error, trying fallback...');
        return this.fetchWithRetry(endpoint, params, retryCount);
      }

      throw error;
    }
  }

  /**
   * Fetch exchange information
   * GET /api/v3/exchangeInfo (Spot) or /fapi/v1/exchangeInfo (Futures)
   */
  async getExchangeInfo(): Promise<BinanceExchangeInfo> {
    const endpoint = this.productType === 'SPOT' 
      ? '/api/v3/exchangeInfo' 
      : this.productType === 'USD_M_FUTURES'
      ? '/fapi/v1/exchangeInfo'
      : '/dapi/v1/exchangeInfo';

    logger.info('Fetching exchange info');
    return this.fetchWithRetry(endpoint);
  }

  /**
   * Fetch kline/candlestick data
   * GET /api/v3/klines (Spot) or /fapi/v1/klines (Futures)
   */
  async getKlines(
    symbol: Symbol,
    interval: Timeframe,
    limit: number = 500,
    startTime?: number,
    endTime?: number
  ): Promise<Candle[]> {
    const endpoint = this.productType === 'SPOT'
      ? '/api/v3/klines'
      : this.productType === 'USD_M_FUTURES'
      ? '/fapi/v1/klines'
      : '/dapi/v1/klines';

    const params: Record<string, string> = {
      symbol: symbol.toUpperCase(),
      interval,
      limit: Math.min(limit, 1000).toString(), // Binance max is 1000
    };

    if (startTime) params.startTime = startTime.toString();
    if (endTime) params.endTime = endTime.toString();

    logger.info(`Fetching ${params.limit} candles for ${symbol} ${interval}`);

    const data = await this.fetchWithRetry(endpoint, params);
    const candles = data.map((kline: BinanceKlineRaw) => this.transformKline(kline));
    
    logger.info(`Successfully fetched ${candles.length} candles`);
    
    return candles;
  }

  /**
   * Fetch historical kline data (alias for backward compatibility)
   */
  async getHistoricalCandles(
    symbol: Symbol,
    timeframe: Timeframe,
    limit: number = INITIAL_CANDLES_LOAD,
    endTime?: number
  ): Promise<Candle[]> {
    return this.getKlines(symbol, timeframe, limit, undefined, endTime);
  }

  /**
   * Get current average price
   * GET /api/v3/avgPrice (Spot only)
   */
  async getAvgPrice(symbol: Symbol): Promise<{ price: string; mins: number }> {
    if (this.productType !== 'SPOT') {
      throw new Error('avgPrice endpoint only available for Spot');
    }
    return this.fetchWithRetry('/api/v3/avgPrice', { symbol: symbol.toUpperCase() });
  }

  /**
   * Get 24hr ticker price change statistics
   */
  async get24hrTicker(symbol: Symbol): Promise<any> {
    const endpoint = this.productType === 'SPOT'
      ? '/api/v3/ticker/24hr'
      : this.productType === 'USD_M_FUTURES'
      ? '/fapi/v1/ticker/24hr'
      : '/dapi/v1/ticker/24hr';

    return this.fetchWithRetry(endpoint, { symbol: symbol.toUpperCase() });
  }

  /**
   * Get current price for a symbol
   */
  async getPrice(symbol: Symbol): Promise<{ symbol: string; price: string }> {
    const endpoint = this.productType === 'SPOT'
      ? '/api/v3/ticker/price'
      : this.productType === 'USD_M_FUTURES'
      ? '/fapi/v1/ticker/price'
      : '/dapi/v1/ticker/price';

    return this.fetchWithRetry(endpoint, { symbol: symbol.toUpperCase() });
  }

  /**
   * Transform raw Binance kline array to Candle object
   */
  private transformKline(kline: BinanceKlineRaw): Candle {
    return {
      timestamp: kline[0] as number,
      open: parseFloat(kline[1] as string),
      high: parseFloat(kline[2] as string),
      low: parseFloat(kline[3] as string),
      close: parseFloat(kline[4] as string),
      volume: parseFloat(kline[5] as string),
      closeTime: kline[6] as number,
      quoteVolume: parseFloat(kline[7] as string),
      trades: kline[8] as number,
      takerBuyBaseVolume: parseFloat(kline[9] as string),
      takerBuyQuoteVolume: parseFloat(kline[10] as string),
    };
  }

  /**
   * Get current rate limit state
   */
  getRateLimitState(): RateLimitState {
    return { ...this.rateLimitState };
  }

  /**
   * Check if we're approaching rate limits
   */
  isApproachingRateLimit(): boolean {
    return this.rateLimitState.usedWeight >= RATE_LIMIT_CONFIG.WARNING_THRESHOLD;
  }
}

// Singleton instance
export const binanceClient = new BinanceRestClient();
