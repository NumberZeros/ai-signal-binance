// Technical indicator calculation engine

import { 
  SMA, EMA, RSI, MACD, BollingerBands, Stochastic,
  ADX, ATR, PSAR, CCI, WilliamsR, StochasticRSI, MFI, OBV, VWAP
} from 'technicalindicators';
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

    // Calculate Moving Averages
    const ema9Values = this.calculateEMA(closes, INDICATOR_PERIODS.EMA_FAST);
    const ema21Values = this.calculateEMA(closes, INDICATOR_PERIODS.EMA_MID);
    const ema50Values = this.calculateEMA(closes, INDICATOR_PERIODS.EMA_SLOW);
    const sma20Values = this.calculateSMA(closes, INDICATOR_PERIODS.SMA_SHORT);
    const sma50Values = this.calculateSMA(closes, INDICATOR_PERIODS.SMA_LONG);
    
    // Calculate Momentum Indicators
    const rsiValues = this.calculateRSI(closes, INDICATOR_PERIODS.RSI);
    const macdData = this.calculateMACD(closes);
    const stochasticData = this.calculateStochastic(highs, lows, closes);
    const cciValues = this.calculateCCI(highs, lows, closes);
    const williamsRValues = this.calculateWilliamsR(highs, lows, closes);
    const stochRSIValues = this.calculateStochRSI(closes);
    
    // Calculate Trend Indicators
    const adxData = this.calculateADX(highs, lows, closes);
    const psarData = this.calculatePSAR(highs, lows);
    
    // Calculate Volatility Indicators
    const atrValues = this.calculateATR(highs, lows, closes);
    const bollingerData = this.calculateBollingerBands(closes);
    
    // Calculate Volume Indicators
    const volumeMAValues = this.calculateSMA(volumes, INDICATOR_PERIODS.VOLUME_MA);
    const mfiValues = this.calculateMFI(highs, lows, closes, volumes);
    const obvValues = this.calculateOBV(closes, volumes);
    const vwapValues = this.calculateVWAP(candles);

    // Merge indicators with candles
    return candles.map((candle, index) => ({
      ...candle,
      indicators: {
        // Moving Averages
        ema9: ema9Values[index],
        ema21: ema21Values[index],
        ema50: ema50Values[index],
        sma20: sma20Values[index],
        sma50: sma50Values[index],
        
        // Momentum Indicators
        rsi: rsiValues[index],
        macd: macdData.macd[index],
        macdSignal: macdData.signal[index],
        macdHistogram: macdData.histogram[index],
        stochK: stochasticData.k[index],
        stochD: stochasticData.d[index],
        cci: cciValues[index],
        williamsR: williamsRValues[index],
        stochRSI: stochRSIValues[index],
        
        // Trend Indicators
        adx: adxData.adx[index],
        adxPlusDI: adxData.pdi[index],
        adxMinusDI: adxData.mdi[index],
        psar: psarData.psar[index],
        psarTrend: psarData.trend[index],
        
        // Volatility Indicators
        atr: atrValues[index],
        bollingerUpper: bollingerData.upper[index],
        bollingerMiddle: bollingerData.middle[index],
        bollingerLower: bollingerData.lower[index],
        
        // Volume Indicators
        volumeMA: volumeMAValues[index],
        mfi: mfiValues[index],
        obv: obvValues[index],
        vwap: vwapValues[index],
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
   * Calculate CCI (Commodity Channel Index)
   */
  private calculateCCI(
    highs: number[],
    lows: number[],
    closes: number[]
  ): (number | undefined)[] {
    try {
      const cciInput = {
        high: highs,
        low: lows,
        close: closes,
        period: INDICATOR_PERIODS.CCI,
      };
      
      const result = CCI.calculate(cciInput);
      
      const paddingLength = highs.length - result.length;
      const padding = new Array(paddingLength).fill(undefined);
      
      return [...padding, ...result];
    } catch (error) {
      logger.error('Failed to calculate CCI', error);
      return new Array(highs.length).fill(undefined);
    }
  }

  /**
   * Calculate Williams %R
   */
  private calculateWilliamsR(
    highs: number[],
    lows: number[],
    closes: number[]
  ): (number | undefined)[] {
    try {
      const williamsInput = {
        high: highs,
        low: lows,
        close: closes,
        period: INDICATOR_PERIODS.WILLIAMS_R,
      };
      
      const result = WilliamsR.calculate(williamsInput);
      
      const paddingLength = highs.length - result.length;
      const padding = new Array(paddingLength).fill(undefined);
      
      return [...padding, ...result];
    } catch (error) {
      logger.error('Failed to calculate Williams %R', error);
      return new Array(highs.length).fill(undefined);
    }
  }

  /**
   * Calculate Stochastic RSI
   */
  private calculateStochRSI(closes: number[]): (number | undefined)[] {
    try {
      const stochRSIInput = {
        values: closes,
        rsiPeriod: INDICATOR_PERIODS.STOCH_RSI,
        stochasticPeriod: INDICATOR_PERIODS.STOCH_RSI_K,
        kPeriod: INDICATOR_PERIODS.STOCH_RSI_K,
        dPeriod: INDICATOR_PERIODS.STOCH_RSI_D,
      };
      
      const result = StochasticRSI.calculate(stochRSIInput);
      
      const paddingLength = closes.length - result.length;
      const padding = new Array(paddingLength).fill(undefined);
      
      // Return %K value (main line)
      return [...padding, ...result.map(r => r.stochRSI)];
    } catch (error) {
      logger.error('Failed to calculate Stochastic RSI', error);
      return new Array(closes.length).fill(undefined);
    }
  }

  /**
   * Calculate ADX (Average Directional Index)
   */
  private calculateADX(
    highs: number[],
    lows: number[],
    closes: number[]
  ): {
    adx: (number | undefined)[];
    pdi: (number | undefined)[];
    mdi: (number | undefined)[];
  } {
    try {
      const adxInput = {
        high: highs,
        low: lows,
        close: closes,
        period: INDICATOR_PERIODS.ADX,
      };
      
      const result = ADX.calculate(adxInput);
      
      const paddingLength = highs.length - result.length;
      const padding = new Array(paddingLength).fill(undefined);
      
      return {
        adx: [...padding, ...result.map(r => r.adx)],
        pdi: [...padding, ...result.map(r => r.pdi)],
        mdi: [...padding, ...result.map(r => r.mdi)],
      };
    } catch (error) {
      logger.error('Failed to calculate ADX', error);
      const empty = new Array(highs.length).fill(undefined);
      return { adx: empty, pdi: empty, mdi: empty };
    }
  }

  /**
   * Calculate ATR (Average True Range)
   */
  private calculateATR(
    highs: number[],
    lows: number[],
    closes: number[]
  ): (number | undefined)[] {
    try {
      const atrInput = {
        high: highs,
        low: lows,
        close: closes,
        period: INDICATOR_PERIODS.ATR,
      };
      
      const result = ATR.calculate(atrInput);
      
      const paddingLength = highs.length - result.length;
      const padding = new Array(paddingLength).fill(undefined);
      
      return [...padding, ...result];
    } catch (error) {
      logger.error('Failed to calculate ATR', error);
      return new Array(highs.length).fill(undefined);
    }
  }

  /**
   * Calculate PSAR (Parabolic SAR)
   */
  private calculatePSAR(
    highs: number[],
    lows: number[]
  ): {
    psar: (number | undefined)[];
    trend: ('bullish' | 'bearish' | undefined)[];
  } {
    try {
      const psarInput = {
        high: highs,
        low: lows,
        step: INDICATOR_PERIODS.PSAR_STEP,
        max: INDICATOR_PERIODS.PSAR_MAX,
      };
      
      const result = PSAR.calculate(psarInput);
      
      const paddingLength = highs.length - result.length;
      const padding = new Array(paddingLength).fill(undefined);
      
      // Determine trend based on PSAR position relative to price
      const trends: ('bullish' | 'bearish' | undefined)[] = result.map((psar, index) => {
        const actualIndex = index + paddingLength;
        const high = highs[actualIndex];
        const low = lows[actualIndex];
        
        // PSAR below price = bullish, above price = bearish
        if (psar < low) return 'bullish';
        if (psar > high) return 'bearish';
        return undefined;
      });
      
      return {
        psar: [...padding, ...result],
        trend: [...new Array(paddingLength).fill(undefined), ...trends],
      };
    } catch (error) {
      logger.error('Failed to calculate PSAR', error);
      const empty = new Array(highs.length).fill(undefined);
      return { psar: empty, trend: empty };
    }
  }

  /**
   * Calculate MFI (Money Flow Index)
   */
  private calculateMFI(
    highs: number[],
    lows: number[],
    closes: number[],
    volumes: number[]
  ): (number | undefined)[] {
    try {
      const mfiInput = {
        high: highs,
        low: lows,
        close: closes,
        volume: volumes,
        period: INDICATOR_PERIODS.MFI,
      };
      
      const result = MFI.calculate(mfiInput);
      
      const paddingLength = highs.length - result.length;
      const padding = new Array(paddingLength).fill(undefined);
      
      return [...padding, ...result];
    } catch (error) {
      logger.error('Failed to calculate MFI', error);
      return new Array(highs.length).fill(undefined);
    }
  }

  /**
   * Calculate OBV (On Balance Volume)
   */
  private calculateOBV(closes: number[], volumes: number[]): (number | undefined)[] {
    try {
      const obvInput = {
        close: closes,
        volume: volumes,
      };
      
      const result = OBV.calculate(obvInput);
      
      // OBV calculates from first data point, but may need padding if library doesn't return full array
      if (result.length < closes.length) {
        const paddingLength = closes.length - result.length;
        const padding = new Array(paddingLength).fill(undefined);
        return [...padding, ...result];
      }
      
      return result;
    } catch (error) {
      logger.error('Failed to calculate OBV', error);
      return new Array(closes.length).fill(undefined);
    }
  }

  /**
   * Calculate VWAP (Volume Weighted Average Price)
   */
  private calculateVWAP(candles: Candle[]): (number | undefined)[] {
    try {
      const vwapInput = {
        high: candles.map(c => c.high),
        low: candles.map(c => c.low),
        close: candles.map(c => c.close),
        volume: candles.map(c => c.volume),
      };
      
      const result = VWAP.calculate(vwapInput);
      
      // VWAP may need padding
      if (result.length < candles.length) {
        const paddingLength = candles.length - result.length;
        const padding = new Array(paddingLength).fill(undefined);
        return [...padding, ...result];
      }
      
      return result;
    } catch (error) {
      logger.error('Failed to calculate VWAP', error);
      return new Array(candles.length).fill(undefined);
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
      INDICATOR_PERIODS.STOCHASTIC_K,
      INDICATOR_PERIODS.ADX,
      INDICATOR_PERIODS.ATR,
      INDICATOR_PERIODS.CCI,
      INDICATOR_PERIODS.WILLIAMS_R,
      INDICATOR_PERIODS.STOCH_RSI,
      INDICATOR_PERIODS.MFI
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
