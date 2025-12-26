/**
 * Symbol manager - fetches and caches Binance exchange symbols dynamically
 */

import { binanceClient } from './rest-client';
import type { BinanceExchangeInfo, BinanceSymbolInfo, Symbol, BinanceProductType } from '@/lib/types';
import { POPULAR_SYMBOLS } from '@/lib/config/constants';
import { logger } from '@/lib/utils/logger';

interface SymbolCache {
  symbols: BinanceSymbolInfo[];
  popularSymbols: string[];
  lastUpdated: number;
  ttl: number; // Time to live in milliseconds
  productType: BinanceProductType;
}

class SymbolManager {
  private caches: Map<BinanceProductType, SymbolCache> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private fetchPromise: Promise<BinanceExchangeInfo> | null = null;

  /**
   * Get all available symbols from Binance (with caching)
   */
  async getAllSymbols(productType: BinanceProductType = 'SPOT'): Promise<BinanceSymbolInfo[]> {
    const cache = this.caches.get(productType);
    if (cache && this.isCacheValid(cache)) {
      return cache.symbols;
    }

    try {
      // Set product type on client before fetching
      binanceClient.setProductType(productType);
      const exchangeInfo = await this.fetchExchangeInfo();
      
      // Filter to only TRADING symbols
      const tradingSymbols = exchangeInfo.symbols.filter(
        (s) => s.status === 'TRADING'
      );

      const newCache: SymbolCache = {
        symbols: tradingSymbols,
        popularSymbols: this.extractPopularSymbols(tradingSymbols),
        lastUpdated: Date.now(),
        ttl: this.CACHE_TTL,
        productType,
      };
      
      this.caches.set(productType, newCache);

      logger.info(`Cached ${tradingSymbols.length} trading symbols for ${productType}`);
      
      return tradingSymbols;
    } catch (error) {
      logger.error('Failed to fetch symbols from Binance', error);
      
      // Return popular symbols as fallback
      return this.getFallbackSymbols();
    }
  }

  /**
   * Get popular symbols (top traded pairs)
   */
  async getPopularSymbols(productType: BinanceProductType = 'SPOT'): Promise<string[]> {
    const cache = this.caches.get(productType);
    if (cache && this.isCacheValid(cache)) {
      return cache.popularSymbols;
    }

    await this.getAllSymbols(productType);
    const updatedCache = this.caches.get(productType);
    return updatedCache?.popularSymbols || Array.from(POPULAR_SYMBOLS);
  }

  /**
   * Search symbols by query (symbol, base asset, or quote asset)
   */
  async searchSymbols(query: string, productType: BinanceProductType = 'SPOT'): Promise<BinanceSymbolInfo[]> {
    const allSymbols = await this.getAllSymbols(productType);
    const upperQuery = query.toUpperCase();

    return allSymbols.filter(
      (s) =>
        s.symbol.includes(upperQuery) ||
        s.baseAsset.includes(upperQuery) ||
        s.quoteAsset.includes(upperQuery)
    );
  }

  /**
   * Get symbol info by exact symbol name
   */
  async getSymbolInfo(symbol: Symbol, productType: BinanceProductType = 'SPOT'): Promise<BinanceSymbolInfo | null> {
    const allSymbols = await this.getAllSymbols(productType);
    return allSymbols.find((s) => s.symbol === symbol.toUpperCase()) || null;
  }

  /**
   * Validate if a symbol exists
   */
  async isValidSymbol(symbol: Symbol, productType: BinanceProductType = 'SPOT'): Promise<boolean> {
    const info = await this.getSymbolInfo(symbol, productType);
    return info !== null && info.status === 'TRADING';
  }

  /**
   * Get USDT pairs only
   */
  async getUSDTPairs(productType: BinanceProductType = 'SPOT'): Promise<BinanceSymbolInfo[]> {
    const allSymbols = await this.getAllSymbols(productType);
    return allSymbols.filter((s) => s.quoteAsset === 'USDT');
  }

  /**
   * Get BTC pairs only
   */
  async getBTCPairs(productType: BinanceProductType = 'SPOT'): Promise<BinanceSymbolInfo[]> {
    const allSymbols = await this.getAllSymbols(productType);
    return allSymbols.filter((s) => s.quoteAsset === 'BTC');
  }

  /**
   * Force refresh the cache
   */
  async refresh(productType?: BinanceProductType): Promise<void> {
    if (productType) {
      this.caches.delete(productType);
      await this.getAllSymbols(productType);
    } else {
      this.caches.clear();
      this.fetchPromise = null;
      await this.getAllSymbols('SPOT');
    }
  }

  /**
   * Clear the cache
   */
  clearCache(productType?: BinanceProductType): void {
    if (productType) {
      this.caches.delete(productType);
      logger.info(`Symbol cache cleared for ${productType}`);
    } else {
      this.caches.clear();
      this.fetchPromise = null;
      logger.info('All symbol caches cleared');
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(cache: SymbolCache): boolean {
    return Date.now() - cache.lastUpdated < cache.ttl;
  }

  /**
   * Fetch exchange info with deduplication
   */
  private async fetchExchangeInfo(): Promise<BinanceExchangeInfo> {
    // Deduplicate concurrent requests
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = binanceClient.getExchangeInfo();
    
    try {
      const result = await this.fetchPromise;
      return result;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Extract popular symbols based on criteria
   */
  private extractPopularSymbols(symbols: BinanceSymbolInfo[]): string[] {
    // Prioritize USDT pairs from POPULAR_SYMBOLS constant
    const popularSet = new Set(POPULAR_SYMBOLS);
    
    const popular = symbols
      .filter((s) => popularSet.has(s.symbol as any))
      .map((s) => s.symbol);

    // If we found less than expected, add top USDT pairs
    if (popular.length < 15) {
      const usdtPairs = symbols
        .filter((s) => s.quoteAsset === 'USDT' && !popularSet.has(s.symbol as any))
        .slice(0, 15 - popular.length)
        .map((s) => s.symbol);
      
      popular.push(...usdtPairs);
    }

    return popular;
  }

  /**
   * Get fallback symbols when API is unavailable
   */
  private getFallbackSymbols(): BinanceSymbolInfo[] {
    logger.warn('Using fallback symbols list');
    
    return Array.from(POPULAR_SYMBOLS).map((symbol) => ({
      symbol,
      status: 'TRADING',
      baseAsset: symbol.replace('USDT', ''),
      quoteAsset: 'USDT',
      baseAssetPrecision: 8,
      quotePrecision: 8,
      orderTypes: [],
      icebergAllowed: false,
      ocoAllowed: false,
      isSpotTradingAllowed: true,
      isMarginTradingAllowed: false,
      permissions: ['SPOT'],
    }));
  }
}

// Singleton instance
export const symbolManager = new SymbolManager();
