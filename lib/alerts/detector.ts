// Alert detection engine - detects trading signals based on technical indicators

import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertType, CandleWithIndicators, Symbol, Timeframe } from '@/lib/types';
import {
  RSI_OVERBOUGHT,
  RSI_OVERSOLD,
  VOLUME_SPIKE_MULTIPLIER,
  ALERT_DEDUPLICATION_WINDOW_MS,
  CCI_OVERBOUGHT,
  CCI_OVERSOLD,
  WILLIAMS_R_OVERBOUGHT,
  WILLIAMS_R_OVERSOLD,
  MFI_OVERBOUGHT,
  MFI_OVERSOLD,
  ADX_STRONG_TREND,
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

    // MACD Crossover Detection
    const macdAlert = this.detectMACDCrossover(current, previous, symbol, timeframe);
    if (macdAlert) alerts.push(macdAlert);

    // Bollinger Bands Breakout Detection
    const bollingerAlert = this.detectBollingerBreakout(current, symbol, timeframe);
    if (bollingerAlert) alerts.push(bollingerAlert);

    // Stochastic Overbought/Oversold Detection
    const stochasticAlert = this.detectStochasticThresholds(current, symbol, timeframe);
    if (stochasticAlert) alerts.push(stochasticAlert);

    // ADX Trend Strength Detection
    const adxAlert = this.detectADXTrend(current, previous, symbol, timeframe);
    if (adxAlert) alerts.push(adxAlert);

    // CCI Overbought/Oversold Detection
    const cciAlert = this.detectCCIThresholds(current, symbol, timeframe);
    if (cciAlert) alerts.push(cciAlert);

    // Williams %R Overbought/Oversold Detection
    const williamsRAlert = this.detectWilliamsRThresholds(current, symbol, timeframe);
    if (williamsRAlert) alerts.push(williamsRAlert);

    // MFI Overbought/Oversold Detection
    const mfiAlert = this.detectMFIThresholds(current, symbol, timeframe);
    if (mfiAlert) alerts.push(mfiAlert);

    // PSAR Reversal Detection
    const psarAlert = this.detectPSARReversal(current, previous, symbol, timeframe);
    if (psarAlert) alerts.push(psarAlert);

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
   * Detect MACD crossover signals
   */
  private detectMACDCrossover(
    current: CandleWithIndicators,
    previous: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert | null {
    const { macd: currMACD, macdSignal: currSignal } = current.indicators;
    const { macd: prevMACD, macdSignal: prevSignal } = previous.indicators;

    if (!currMACD || !currSignal || !prevMACD || !prevSignal) {
      return null;
    }

    // Bullish crossover: MACD crosses above signal
    if (prevMACD <= prevSignal && currMACD > currSignal) {
      return this.createAlert(
        'MACD_CROSSOVER_BULLISH',
        current,
        symbol,
        timeframe,
        'MACD crossed above signal line',
        80,
        { macd: currMACD, macdSignal: currSignal }
      );
    }

    // Bearish crossover: MACD crosses below signal
    if (prevMACD >= prevSignal && currMACD < currSignal) {
      return this.createAlert(
        'MACD_CROSSOVER_BEARISH',
        current,
        symbol,
        timeframe,
        'MACD crossed below signal line',
        80,
        { macd: currMACD, macdSignal: currSignal }
      );
    }

    return null;
  }

  /**
   * Detect Bollinger Bands breakouts
   */
  private detectBollingerBreakout(
    current: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert | null {
    const { bollingerUpper, bollingerLower, bollingerMiddle } = current.indicators;

    if (!bollingerUpper || !bollingerLower || !bollingerMiddle) {
      return null;
    }

    // Breakout above upper band
    if (current.close > bollingerUpper) {
      return this.createAlert(
        'BOLLINGER_BREAKOUT_UPPER',
        current,
        symbol,
        timeframe,
        `Price broke above upper Bollinger Band (${bollingerUpper.toFixed(2)})`,
        75,
        { bollingerUpper, bollingerMiddle, bollingerLower }
      );
    }

    // Breakout below lower band
    if (current.close < bollingerLower) {
      return this.createAlert(
        'BOLLINGER_BREAKOUT_LOWER',
        current,
        symbol,
        timeframe,
        `Price broke below lower Bollinger Band (${bollingerLower.toFixed(2)})`,
        75,
        { bollingerUpper, bollingerMiddle, bollingerLower }
      );
    }

    return null;
  }

  /**
   * Detect Stochastic overbought/oversold conditions
   */
  private detectStochasticThresholds(
    current: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert | null {
    const { stochK, stochD } = current.indicators;

    if (!stochK || !stochD) {
      return null;
    }

    // Import thresholds from constants
    const STOCHASTIC_OVERBOUGHT = 80;
    const STOCHASTIC_OVERSOLD = 20;

    if (stochK >= STOCHASTIC_OVERBOUGHT && stochD >= STOCHASTIC_OVERBOUGHT) {
      return this.createAlert(
        'STOCHASTIC_OVERBOUGHT',
        current,
        symbol,
        timeframe,
        `Stochastic reached overbought level (%K: ${stochK.toFixed(2)}, %D: ${stochD.toFixed(2)})`,
        70,
        { stochK, stochD }
      );
    }

    if (stochK <= STOCHASTIC_OVERSOLD && stochD <= STOCHASTIC_OVERSOLD) {
      return this.createAlert(
        'STOCHASTIC_OVERSOLD',
        current,
        symbol,
        timeframe,
        `Stochastic reached oversold level (%K: ${stochK.toFixed(2)}, %D: ${stochD.toFixed(2)})`,
        70,
        { stochK, stochD }
      );
    }

    return null;
  }

  /**
   * Detect ADX trend strength changes
   */
  private detectADXTrend(
    current: CandleWithIndicators,
    previous: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert | null {
    const { adx: currADX, adxPlusDI, adxMinusDI } = current.indicators;
    const { adx: prevADX } = previous.indicators;

    if (!currADX || !prevADX || !adxPlusDI || !adxMinusDI) {
      return null;
    }

    // Strong trend emerging
    if (prevADX < ADX_STRONG_TREND && currADX >= ADX_STRONG_TREND) {
      return this.createAlert(
        'ADX_STRONG_TREND',
        current,
        symbol,
        timeframe,
        `Strong trend detected (ADX: ${currADX.toFixed(2)}, +DI: ${adxPlusDI.toFixed(2)}, -DI: ${adxMinusDI.toFixed(2)})`,
        75,
        { adx: currADX, adxPlusDI, adxMinusDI }
      );
    }

    // Weak trend / consolidation
    if (prevADX >= ADX_STRONG_TREND && currADX < ADX_STRONG_TREND) {
      return this.createAlert(
        'ADX_WEAK_TREND',
        current,
        symbol,
        timeframe,
        `Trend weakening, possible consolidation (ADX: ${currADX.toFixed(2)})`,
        65,
        { adx: currADX, adxPlusDI, adxMinusDI }
      );
    }

    return null;
  }

  /**
   * Detect CCI overbought/oversold conditions
   */
  private detectCCIThresholds(
    current: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert | null {
    const { cci } = current.indicators;

    if (!cci) return null;

    if (cci >= CCI_OVERBOUGHT) {
      return this.createAlert(
        'CCI_OVERBOUGHT',
        current,
        symbol,
        timeframe,
        `CCI reached overbought level (${cci.toFixed(2)})`,
        70,
        { cci }
      );
    }

    if (cci <= CCI_OVERSOLD) {
      return this.createAlert(
        'CCI_OVERSOLD',
        current,
        symbol,
        timeframe,
        `CCI reached oversold level (${cci.toFixed(2)})`,
        70,
        { cci }
      );
    }

    return null;
  }

  /**
   * Detect Williams %R overbought/oversold conditions
   */
  private detectWilliamsRThresholds(
    current: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert | null {
    const { williamsR } = current.indicators;

    if (!williamsR) return null;

    if (williamsR >= WILLIAMS_R_OVERBOUGHT) {
      return this.createAlert(
        'WILLIAMS_R_OVERBOUGHT',
        current,
        symbol,
        timeframe,
        `Williams %R reached overbought level (${williamsR.toFixed(2)})`,
        70,
        { williamsR }
      );
    }

    if (williamsR <= WILLIAMS_R_OVERSOLD) {
      return this.createAlert(
        'WILLIAMS_R_OVERSOLD',
        current,
        symbol,
        timeframe,
        `Williams %R reached oversold level (${williamsR.toFixed(2)})`,
        70,
        { williamsR }
      );
    }

    return null;
  }

  /**
   * Detect MFI (Money Flow Index) overbought/oversold conditions
   */
  private detectMFIThresholds(
    current: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert | null {
    const { mfi } = current.indicators;

    if (!mfi) return null;

    if (mfi >= MFI_OVERBOUGHT) {
      return this.createAlert(
        'MFI_OVERBOUGHT',
        current,
        symbol,
        timeframe,
        `Money Flow Index reached overbought level (${mfi.toFixed(2)})`,
        75,
        { mfi }
      );
    }

    if (mfi <= MFI_OVERSOLD) {
      return this.createAlert(
        'MFI_OVERSOLD',
        current,
        symbol,
        timeframe,
        `Money Flow Index reached oversold level (${mfi.toFixed(2)})`,
        75,
        { mfi }
      );
    }

    return null;
  }

  /**
   * Detect PSAR trend reversals
   */
  private detectPSARReversal(
    current: CandleWithIndicators,
    previous: CandleWithIndicators,
    symbol: Symbol,
    timeframe: Timeframe
  ): Alert | null {
    const { psarTrend: currTrend, psar: currPSAR } = current.indicators;
    const { psarTrend: prevTrend } = previous.indicators;

    if (!currTrend || !prevTrend || !currPSAR) {
      return null;
    }

    // Bullish reversal
    if (prevTrend === 'bearish' && currTrend === 'bullish') {
      return this.createAlert(
        'PSAR_REVERSAL_BULLISH',
        current,
        symbol,
        timeframe,
        'Parabolic SAR indicates bullish reversal',
        70,
        { psar: currPSAR, psarTrend: currTrend }
      );
    }

    // Bearish reversal
    if (prevTrend === 'bullish' && currTrend === 'bearish') {
      return this.createAlert(
        'PSAR_REVERSAL_BEARISH',
        current,
        symbol,
        timeframe,
        'Parabolic SAR indicates bearish reversal',
        70,
        { psar: currPSAR, psarTrend: currTrend }
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
      ADX_STRONG_TREND: 'ADX indicates a strong trending market is emerging',
      ADX_WEAK_TREND: 'ADX indicates trend is weakening, possible consolidation ahead',
      CCI_OVERBOUGHT: 'Commodity Channel Index shows overbought conditions, possible reversal',
      CCI_OVERSOLD: 'Commodity Channel Index shows oversold conditions, possible bounce',
      WILLIAMS_R_OVERBOUGHT: 'Williams %R indicates overbought market conditions',
      WILLIAMS_R_OVERSOLD: 'Williams %R indicates oversold market conditions',
      MFI_OVERBOUGHT: 'Money Flow Index shows strong buying pressure, market may be overbought',
      MFI_OVERSOLD: 'Money Flow Index shows strong selling pressure, market may be oversold',
      PSAR_REVERSAL_BULLISH: 'Parabolic SAR flipped to bullish, potential uptrend starting',
      PSAR_REVERSAL_BEARISH: 'Parabolic SAR flipped to bearish, potential downtrend starting',
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
