// Hybrid state manager: in-memory + Redis for persistence

import {
  MarketState,
  Symbol,
  Timeframe,
  Candle,
  CandleWithIndicators,
  Alert,
} from '@/lib/types';
import { MAX_CANDLES_IN_MEMORY, MAX_ALERTS_IN_MEMORY } from '@/lib/config/constants';
import { indicatorCalculator } from '@/lib/indicators/calculator';
import { alertDetector } from '@/lib/alerts/detector';
import { logger } from '@/lib/utils/logger';
import { redisClient } from '@/lib/redis/client';

class StateManager {
  private states: Map<string, MarketState> = new Map();
  private readonly REDIS_PREFIX = 'market:';
  private readonly REDIS_TTL = 60 * 60 * 24; // 24 hours

  /**
   * Get or create state for a symbol/timeframe pair (async - Redis support)
   */
  async getState(symbol: Symbol, timeframe: Timeframe): Promise<MarketState> {
    const key = this.getStateKey(symbol, timeframe);
    
    // Check in-memory cache first (fastest)
    if (this.states.has(key)) {
      return this.states.get(key)!;
    }

    // Try loading from Redis
    if (redisClient.enabled) {
      const redisKey = this.getRedisKey(symbol, timeframe);
      const cachedState = await redisClient.get<MarketState>(redisKey);
      
      if (cachedState) {
        logger.info(`Loaded state from Redis: ${key}`);
        this.states.set(key, cachedState);
        return cachedState;
      }
    }

    // Create new empty state
    const newState = this.createEmptyState(symbol, timeframe);
    this.states.set(key, newState);
    return newState;
  }

  /**
   * Synchronous version for backward compatibility
   */
  getStateSync(symbol: Symbol, timeframe: Timeframe): MarketState {
    const key = this.getStateKey(symbol, timeframe);
    
    if (!this.states.has(key)) {
      this.states.set(key, this.createEmptyState(symbol, timeframe));
    }

    return this.states.get(key)!;
  }

  /**
   * Initialize state with historical candles (async - Redis support)
   */
  async initializeState(
    symbol: Symbol,
    timeframe: Timeframe,
    candles: Candle[]
  ): Promise<MarketState> {
    const key = this.getStateKey(symbol, timeframe);
    
    logger.info(`Initializing state for ${symbol} ${timeframe} with ${candles.length} candles`);

    // Calculate indicators for all candles
    const candlesWithIndicators = indicatorCalculator.calculateIndicators(candles);

    const state: MarketState = {
      symbol,
      timeframe,
      candles: this.limitCandles(candlesWithIndicators),
      alerts: [],
      lastUpdate: Date.now(),
      isLive: false,
    };

    // Save to in-memory
    this.states.set(key, state);

    // Persist to Redis
    await this.saveStateToRedis(symbol, timeframe, state);

    logger.info(`State initialized with ${state.candles.length} candles`);

    return state;
  }

  /**
   * Update state with a new candle (live or closed)
   */
  updateCandle(
    symbol: Symbol,
    timeframe: Timeframe,
    candle: Candle,
    isClosed: boolean
  ): { state: MarketState; newAlerts: Alert[] } {
    const state = this.getStateSync(symbol, timeframe);
    let newAlerts: Alert[] = [];

    if (state.candles.length === 0) {
      logger.warn('Cannot update candle: state not initialized');
      return { state, newAlerts };
    }

    const lastCandle = state.candles[state.candles.length - 1];

    if (isClosed) {
      // New candle has closed
      if (candle.timestamp > lastCandle.timestamp) {
        // This is a new candle, add it
        const updatedCandles = indicatorCalculator.updateIndicators(
          state.candles,
          candle
        );

        state.candles = this.limitCandles(updatedCandles);

        // Detect alerts on closed candle
        newAlerts = alertDetector.detectAlerts(state.candles, symbol, timeframe);
        
        if (newAlerts.length > 0) {
          state.alerts = this.limitAlerts([...state.alerts, ...newAlerts]);
          logger.info(`${newAlerts.length} new alerts detected`, {
            types: newAlerts.map(a => a.type),
          });
        }
      }
    } else {
      // Candle is still forming, update in place
      if (candle.timestamp === lastCandle.timestamp) {
        const updatedLastCandle: Candle = {
          ...lastCandle,
          high: Math.max(lastCandle.high, candle.high),
          low: Math.min(lastCandle.low, candle.low),
          close: candle.close,
          volume: candle.volume,
          closeTime: candle.closeTime,
        };

        const updatedCandles = indicatorCalculator.updateIndicators(
          state.candles.slice(0, -1),
          updatedLastCandle
        );

        state.candles = updatedCandles;
      }
    }

    state.lastUpdate = Date.now();
    state.isLive = true;

    // Persist to Redis asynchronously (fire and forget)
    this.saveStateToRedis(symbol, timeframe, state).catch(err => 
      logger.error('Failed to save state to Redis', err)
    );

    return { state, newAlerts };
  }

  /**
   * Add alert to state
   */
  addAlert(symbol: Symbol, timeframe: Timeframe, alert: Alert): void {
    const state = this.getStateSync(symbol, timeframe);
    state.alerts = this.limitAlerts([...state.alerts, alert]);
  }

  /**
   * Get all alerts for a symbol/timeframe
   */
  getAlerts(symbol: Symbol, timeframe: Timeframe): Alert[] {
    const state = this.getStateSync(symbol, timeframe);
    return state.alerts;
  }

  /**
   * Reset state for a symbol/timeframe
   */
  resetState(symbol: Symbol, timeframe: Timeframe): void {
    const key = this.getStateKey(symbol, timeframe);
    this.states.delete(key);
    
    // Delete from Redis asynchronously
    this.deleteStateFromRedis(symbol, timeframe).catch(err =>
      logger.error('Failed to delete state from Redis', err)
    );
    
    logger.info(`State reset for ${symbol} ${timeframe}`);
  }

  /**
   * Get all active states
   */
  getAllStates(): MarketState[] {
    return Array.from(this.states.values());
  }

  /**
   * Create empty state
   */
  private createEmptyState(symbol: Symbol, timeframe: Timeframe): MarketState {
    return {
      symbol,
      timeframe,
      candles: [],
      alerts: [],
      lastUpdate: Date.now(),
      isLive: false,
    };
  }

  /**
   * Generate state key
   */
  private getStateKey(symbol: Symbol, timeframe: Timeframe): string {
    return `${symbol}_${timeframe}`;
  }

  /**
   * Generate Redis key
   */
  private getRedisKey(symbol: Symbol, timeframe: Timeframe): string {
    return `${this.REDIS_PREFIX}${symbol}_${timeframe}`;
  }

  /**
   * Save state to Redis
   */
  private async saveStateToRedis(
    symbol: Symbol,
    timeframe: Timeframe,
    state: MarketState
  ): Promise<void> {
    if (!redisClient.enabled) return;

    try {
      const redisKey = this.getRedisKey(symbol, timeframe);
      await redisClient.set(redisKey, state, this.REDIS_TTL);
      logger.debug(`State saved to Redis: ${redisKey}`);
    } catch (error) {
      logger.error('Failed to save state to Redis', error);
    }
  }

  /**
   * Delete state from Redis
   */
  private async deleteStateFromRedis(
    symbol: Symbol,
    timeframe: Timeframe
  ): Promise<void> {
    if (!redisClient.enabled) return;

    try {
      const redisKey = this.getRedisKey(symbol, timeframe);
      await redisClient.delete(redisKey);
      logger.debug(`State deleted from Redis: ${redisKey}`);
    } catch (error) {
      logger.error('Failed to delete state from Redis', error);
    }
  }

  /**
   * Limit candles to max memory size
   */
  private limitCandles(candles: CandleWithIndicators[]): CandleWithIndicators[] {
    if (candles.length <= MAX_CANDLES_IN_MEMORY) {
      return candles;
    }

    return candles.slice(-MAX_CANDLES_IN_MEMORY);
  }

  /**
   * Limit alerts to max memory size
   */
  private limitAlerts(alerts: Alert[]): Alert[] {
    if (alerts.length <= MAX_ALERTS_IN_MEMORY) {
      return alerts;
    }

    // Keep most recent alerts
    return alerts.slice(-MAX_ALERTS_IN_MEMORY);
  }

  /**
   * Cleanup old data periodically
   */
  cleanup(): void {
    logger.info('Running state cleanup');
    
    for (const [key, state] of this.states.entries()) {
      // Remove stale states (not updated in 1 hour)
      if (Date.now() - state.lastUpdate > 60 * 60 * 1000) {
        this.states.delete(key);
        logger.info(`Removed stale state: ${key}`);
      }
    }

    // Cleanup alert detector cache
    alertDetector.cleanupCache();
  }
}

// Singleton instance
export const stateManager = new StateManager();

// Periodic cleanup (every 10 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    stateManager.cleanup();
  }, 10 * 60 * 1000);
}
