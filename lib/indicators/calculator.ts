// Technical indicator calculation engine

import { SMA, EMA, RSI, MACD, BollingerBands, Stochastic } from 'technicalindicators';
import { Candle, IndicatorValues, CandleWithIndicators } from '@/lib/types';
import { INDICATOR_PERIODS } from '@/lib/config/constants';
import { logger } from '@/lib/utils/logger';

export class IndicatorCalculator {
  /**
   * Calculate all indicators for an array of candles
   */
  calculateIndicators(candles: Candle[]): CandleWithIndicators[] {
    if (candles.length === 0) {
      return [];
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    // Calculate all indicator arrays
    const ema9Values = this.calculateEMA(closes, INDICATOR_PERIODS.EMA_FAST);
    const ema21Values = this.calculateEMA(closes, INDICATOR_PERIODS.EMA_MID);
    const ema50Values = this.calculateEMA(closes, INDICATOR_PERIODS.EMA_SLOW);
    const sma20Values = this.calculateSMA(closes, INDICATOR_PERIODS.SMA_SHORT);
    const sma50Values = this.calculateSMA(closes, INDICATOR_PERIODS.SMA_LONG);
    const rsiValues = this.calculateRSI(closes, INDICATOR_PERIODS.RSI);
    const volumeMAValues = this.calculateSMA(volumes, INDICATOR_PERIODS.VOLUME_MA);
    const macdData = this.calculateMACD(closes);
    const bollingerData = this.calculateBollingerBands(closes);
    const stochasticData = this.calculateStochastic(highs, lows, closes);

    // Merge indicators with candles
    return candles.map((candle, index) => ({
      ...candle,
      indicators: {
        ema9: ema9Values[index],
        ema21: ema21Values[index],
        ema50: ema50Values[index],
        sma20: sma20Values[index],
        sma50: sma50Values[index],
        rsi: rsiValues[index],
        volumeMA: volumeMAValues[index],
        macd: macdData.macd[index],
        macdSignal: macdData.signal[index],
        macdHistogram: macdData.histogram[index],
        bollingerUpper: bollingerData.upper[index],
        bollingerMiddle: bollingerData.middle[index],
        bollingerLower: bollingerData.lower[index],
        stochK: stochasticData.k[index],
        stochD: stochasticData.d[index],
      },
    }));
  }

  /**
   * Calculate EMA for given period
   */
  private calculateEMA(values: number[], period: number): (number | undefined)[] {
    try {
      const emaInput = {
        values,
        period,
      };
      
      const result = EMA.calculate(emaInput);
      
      // Pad the beginning with undefined to match array length
      const padding = new Array(values.length - result.length).fill(undefined);
      return [...padding, ...result];
    } catch (error) {
      logger.error(`Failed to calculate EMA ${period}`, error);
      return new Array(values.length).fill(undefined);
    }
  }

  /**
   * Calculate SMA for given period
   */
  private calculateSMA(values: number[], period: number): (number | undefined)[] {
    try {
      const smaInput = {
        values,
        period,
      };
      
      const result = SMA.calculate(smaInput);
      
      const padding = new Array(values.length - result.length).fill(undefined);
      return [...padding, ...result];
    } catch (error) {
      logger.error(`Failed to calculate SMA ${period}`, error);
      return new Array(values.length).fill(undefined);
    }
  }

  /**
   * Calculate RSI for given period
   */
  private calculateRSI(values: number[], period: number): (number | undefined)[] {
    try {
      const rsiInput = {
        values,
        period,
      };
      
      const result = RSI.calculate(rsiInput);
      
      const padding = new Array(values.length - result.length).fill(undefined);
      return [...padding, ...result];
    } catch (error) {
      logger.error(`Failed to calculate RSI ${period}`, error);
      return new Array(values.length).fill(undefined);
    }
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(values: number[]): {
    macd: (number | undefined)[];
    signal: (number | undefined)[];
    histogram: (number | undefined)[];
  } {
    try {
      const macdInput = {
        values,
        fastPeriod: INDICATOR_PERIODS.MACD_FAST,
        slowPeriod: INDICATOR_PERIODS.MACD_SLOW,
        signalPeriod: INDICATOR_PERIODS.MACD_SIGNAL,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      };
      
      const result = MACD.calculate(macdInput);
      
      const paddingLength = values.length - result.length;
      const padding = new Array(paddingLength).fill(undefined);
      
      return {
        macd: [...padding, ...result.map(r => r.MACD)],
        signal: [...padding, ...result.map(r => r.signal)],
        histogram: [...padding, ...result.map(r => r.histogram)],
      };
    } catch (error) {
      logger.error('Failed to calculate MACD', error);
      const empty = new Array(values.length).fill(undefined);
      return { macd: empty, signal: empty, histogram: empty };
    }
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(values: number[]): {
    upper: (number | undefined)[];
    middle: (number | undefined)[];
    lower: (number | undefined)[];
  } {
    try {
      const bollingerInput = {
        values,
        period: INDICATOR_PERIODS.BOLLINGER_PERIOD,
        stdDev: INDICATOR_PERIODS.BOLLINGER_STD_DEV,
      };
      
      const result = BollingerBands.calculate(bollingerInput);
      
      const paddingLength = values.length - result.length;
      const padding = new Array(paddingLength).fill(undefined);
      
      return {
        upper: [...padding, ...result.map(r => r.upper)],
        middle: [...padding, ...result.map(r => r.middle)],
        lower: [...padding, ...result.map(r => r.lower)],
      };
    } catch (error) {
      logger.error('Failed to calculate Bollinger Bands', error);
      const empty = new Array(values.length).fill(undefined);
      return { upper: empty, middle: empty, lower: empty };
    }
  }

  /**
   * Calculate Stochastic Oscillator
   */
  private calculateStochastic(
    highs: number[],
    lows: number[],
    closes: number[]
  ): {
    k: (number | undefined)[];
    d: (number | undefined)[];
  } {
    try {
      const stochasticInput = {
        high: highs,
        low: lows,
        close: closes,
        period: INDICATOR_PERIODS.STOCHASTIC_K,
        signalPeriod: INDICATOR_PERIODS.STOCHASTIC_D,
      };
      
      const result = Stochastic.calculate(stochasticInput);
      
      const paddingLength = highs.length - result.length;
      const padding = new Array(paddingLength).fill(undefined);
      
      return {
        k: [...padding, ...result.map(r => r.k)],
        d: [...padding, ...result.map(r => r.d)],
      };
    } catch (error) {
      logger.error('Failed to calculate Stochastic', error);
      const empty = new Array(highs.length).fill(undefined);
      return { k: empty, d: empty };
    }
  }

  /**
   * Update indicators incrementally when a new candle arrives
   * For now, recalculate from recent window for accuracy
   */
  updateIndicators(
    existingCandles: CandleWithIndicators[],
    newCandle: Candle
  ): CandleWithIndicators[] {
    // For MVP, recalculate from last N candles to ensure accuracy
    const windowSize = Math.max(
      INDICATOR_PERIODS.EMA_SLOW,
      INDICATOR_PERIODS.RSI,
      INDICATOR_PERIODS.VOLUME_MA,
      INDICATOR_PERIODS.MACD_SLOW,
      INDICATOR_PERIODS.BOLLINGER_PERIOD,
      INDICATOR_PERIODS.STOCHASTIC_K
    ) + 50; // Extra buffer for warm-up

    const recentCandles = existingCandles.slice(-windowSize);
    const allCandles = [...recentCandles.map(c => ({
      timestamp: c.timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      closeTime: c.closeTime,
    })), newCandle];

    const recalculated = this.calculateIndicators(allCandles);
    
    // Return only the last calculated candle with indicators
    return [...existingCandles.slice(0, -recentCandles.length), ...recalculated];
  }

  /**
   * Get current indicator snapshot from latest candle
   */
  getLatestIndicators(candles: CandleWithIndicators[]): IndicatorValues {
    if (candles.length === 0) {
      return {};
    }

    return candles[candles.length - 1].indicators;
  }
}

// Singleton instance
export const indicatorCalculator = new IndicatorCalculator();
