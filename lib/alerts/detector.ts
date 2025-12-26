// Alert detection engine - detects trading signals based on technical indicators

import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertType, CandleWithIndicators, Symbol, Timeframe } from '@/lib/types';
import {
  RSI_OVERBOUGHT,
  RSI_OVERSOLD,
  VOLUME_SPIKE_MULTIPLIER,
  ALERT_DEDUPLICATION_WINDOW_MS,
} from '@/lib/config/constants';
import { logger } from '@/lib/utils/logger';

export class AlertDetector {
  private recentAlerts: Map<string, number> = new Map();

  /**
   * Detect alerts when a candle closes
   */
  detectAlerts(
    candles: CandleWithIndicators[],
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert[] {
    if (candles.length < 3) {
      return [];
    }

    const alerts: Alert[] = [];
    const current = candles[candles.length - 1];
    const previous = candles[candles.length - 2];

    // EMA Crossover Detection
    const emaCrossoverAlert = this.detectEMACrossover(current, previous, symbol, timeframe);
    if (emaCrossoverAlert) alerts.push(emaCrossoverAlert);

    // RSI Threshold Detection
    const rsiAlert = this.detectRSIThresholds(current, symbol, timeframe);
    if (rsiAlert) alerts.push(rsiAlert);

    // Volume Spike Detection
    const volumeAlert = this.detectVolumeSpike(current, symbol, timeframe);
    if (volumeAlert) alerts.push(volumeAlert);

    // Breakout Detection
    const breakoutAlert = this.detectBreakout(candles.slice(-20), current, symbol, timeframe);
    if (breakoutAlert) alerts.push(breakoutAlert);

    // Filter duplicates
    return alerts.filter(alert => !this.isDuplicate(alert));
  }

  /**
   * Detect EMA crossover (fast crossing slow)
   */
  private detectEMACrossover(
    current: CandleWithIndicators,
    previous: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert | null {
    const { ema9: currFast, ema21: currSlow } = current.indicators;
    const { ema9: prevFast, ema21: prevSlow } = previous.indicators;

    if (!currFast || !currSlow || !prevFast || !prevSlow) {
      return null;
    }

    // Bullish crossover: fast crosses above slow
    if (prevFast <= prevSlow && currFast > currSlow) {
      return this.createAlert(
        'EMA_CROSSOVER_BULLISH',
        current,
        symbol,
        timeframe,
        'EMA 9 crossed above EMA 21',
        85,
        { ema9: currFast, ema21: currSlow }
      );
    }

    // Bearish crossover: fast crosses below slow
    if (prevFast >= prevSlow && currFast < currSlow) {
      return this.createAlert(
        'EMA_CROSSOVER_BEARISH',
        current,
        symbol,
        timeframe,
        'EMA 9 crossed below EMA 21',
        85,
        { ema9: currFast, ema21: currSlow }
      );
    }

    return null;
  }

  /**
   * Detect RSI overbought/oversold conditions
   */
  private detectRSIThresholds(
    current: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert | null {
    const { rsi } = current.indicators;

    if (!rsi) return null;

    if (rsi >= RSI_OVERBOUGHT) {
      return this.createAlert(
        'RSI_OVERBOUGHT',
        current,
        symbol,
        timeframe,
        `RSI reached overbought level (${rsi.toFixed(2)})`,
        75,
        { rsi }
      );
    }

    if (rsi <= RSI_OVERSOLD) {
      return this.createAlert(
        'RSI_OVERSOLD',
        current,
        symbol,
        timeframe,
        `RSI reached oversold level (${rsi.toFixed(2)})`,
        75,
        { rsi }
      );
    }

    return null;
  }

  /**
   * Detect volume spikes
   */
  private detectVolumeSpike(
    current: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert | null {
    const { volumeMA } = current.indicators;

    if (!volumeMA) return null;

    const volumeRatio = current.volume / volumeMA;

    if (volumeRatio >= VOLUME_SPIKE_MULTIPLIER) {
      return this.createAlert(
        'VOLUME_SPIKE',
        current,
        symbol,
        timeframe,
        `Volume spike detected (${volumeRatio.toFixed(2)}x average)`,
        80,
        { volumeMA }
      );
    }

    return null;
  }

  /**
   * Detect price breakouts from recent high/low
   */
  private detectBreakout(
    recentCandles: CandleWithIndicators[],
    current: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert | null {
    if (recentCandles.length < 10) return null;

    const lookback = recentCandles.slice(0, -1); // Exclude current candle
    const recentHigh = Math.max(...lookback.map(c => c.high));
    const recentLow = Math.min(...lookback.map(c => c.low));

    // Breakout above recent high
    if (current.close > recentHigh) {
      return this.createAlert(
        'BREAKOUT_HIGH',
        current,
        symbol,
        timeframe,
        `Price broke above recent high (${recentHigh.toFixed(2)})`,
        70,
        {}
      );
    }

    // Breakdown below recent low
    if (current.close < recentLow) {
      return this.createAlert(
        'BREAKOUT_LOW',
        current,
        symbol,
        timeframe,
        `Price broke below recent low (${recentLow.toFixed(2)})`,
        70,
        {}
      );
    }

    return null;
  }

  /**
   * Create alert object
   */
  private createAlert(
    type: AlertType,
    candle: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe,
    description: string,
    confidence: number,
    indicatorValues: Partial<CandleWithIndicators['indicators']>
  ): Alert {
    return {
      id: uuidv4(),
      timestamp: candle.timestamp,
      type,
      symbol,
      timeframe,
      price: candle.close,
      confidence,
      metadata: {
        description,
        technicalReason: this.getTechnicalReason(type),
        indicatorValues,
      },
    };
  }

  /**
   * Get technical explanation for alert type
   */
  private getTechnicalReason(type: AlertType): string {
    const reasons: Record<AlertType, string> = {
      EMA_CROSSOVER_BULLISH: 'Short-term momentum is turning bullish as fast EMA crosses above slow EMA',
      EMA_CROSSOVER_BEARISH: 'Short-term momentum is turning bearish as fast EMA crosses below slow EMA',
      BREAKOUT_HIGH: 'Price has broken above recent resistance, indicating potential upward momentum',
      BREAKOUT_LOW: 'Price has broken below recent support, indicating potential downward pressure',
      VOLUME_SPIKE: 'Abnormally high trading volume suggests increased market interest',
      RSI_OVERBOUGHT: 'RSI indicates overbought conditions, potential for reversal or consolidation',
      RSI_OVERSOLD: 'RSI indicates oversold conditions, potential for bounce or reversal',
      MACD_CROSSOVER_BULLISH: 'MACD line crossed above signal line, indicating bullish momentum',
      MACD_CROSSOVER_BEARISH: 'MACD line crossed below signal line, indicating bearish momentum',
      BOLLINGER_BREAKOUT_UPPER: 'Price broke above upper Bollinger Band, indicating strong upward pressure',
      BOLLINGER_BREAKOUT_LOWER: 'Price broke below lower Bollinger Band, indicating strong downward pressure',
      STOCHASTIC_OVERBOUGHT: 'Stochastic oscillator shows overbought conditions',
      STOCHASTIC_OVERSOLD: 'Stochastic oscillator shows oversold conditions',
    };

    return reasons[type];
  }

  /**
   * Check if alert is duplicate (within deduplication window)
   */
  private isDuplicate(alert: Alert): boolean {
    const key = `${alert.type}_${alert.symbol}_${alert.timeframe}`;
    const lastAlertTime = this.recentAlerts.get(key);

    if (lastAlertTime && alert.timestamp - lastAlertTime < ALERT_DEDUPLICATION_WINDOW_MS) {
      logger.debug(`Duplicate alert filtered: ${alert.type}`);
      return true;
    }

    this.recentAlerts.set(key, alert.timestamp);
    return false;
  }

  /**
   * Clean up old alerts from deduplication cache
   */
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.recentAlerts.entries()) {
      if (now - timestamp > ALERT_DEDUPLICATION_WINDOW_MS) {
        this.recentAlerts.delete(key);
      }
    }
  }
}

// Singleton instance
export const alertDetector = new AlertDetector();
