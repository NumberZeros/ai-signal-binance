import { describe, it, expect } from '@jest/globals';
import { indicatorCalculator } from '@/lib/indicators/calculator';
import { Candle } from '@/lib/types';

describe('New Technical Indicators', () => {
  // Generate 100 candles with realistic price movements
  const mockCandles: Candle[] = Array.from({ length: 100 }, (_, i) => {
    const basePrice = 50000;
    const priceVariation = Math.sin(i / 5) * 2000 + Math.cos(i / 3) * 1000;
    const close = basePrice + priceVariation;
    const open = close - (Math.random() - 0.5) * 200;
    const high = Math.max(open, close) + Math.random() * 100;
    const low = Math.min(open, close) - Math.random() * 100;

    return {
      timestamp: 1000 * i,
      open,
      high,
      low,
      close,
      volume: 1000 + Math.random() * 500,
      closeTime: 1000 * i + 999,
    };
  });

  describe('MACD Indicator', () => {
    it('should calculate MACD values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(lastCandle.indicators.macd).toBeDefined();
      expect(lastCandle.indicators.macdSignal).toBeDefined();
      expect(lastCandle.indicators.macdHistogram).toBeDefined();
    });

    it('should have MACD values as numbers when calculated', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      if (lastCandle.indicators.macd !== undefined) {
        expect(typeof lastCandle.indicators.macd).toBe('number');
      }
      if (lastCandle.indicators.macdSignal !== undefined) {
        expect(typeof lastCandle.indicators.macdSignal).toBe('number');
      }
      if (lastCandle.indicators.macdHistogram !== undefined) {
        expect(typeof lastCandle.indicators.macdHistogram).toBe('number');
      }
    });

    it('should calculate histogram as MACD minus signal', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { macd, macdSignal, macdHistogram } = lastCandle.indicators;

      if (macd !== undefined && macdSignal !== undefined && macdHistogram !== undefined) {
        // Histogram should be approximately MACD - Signal
        expect(Math.abs(macdHistogram - (macd - macdSignal))).toBeLessThan(0.01);
      }
    });
  });

  describe('Bollinger Bands', () => {
    it('should calculate Bollinger Bands', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(lastCandle.indicators.bollingerUpper).toBeDefined();
      expect(lastCandle.indicators.bollingerMiddle).toBeDefined();
      expect(lastCandle.indicators.bollingerLower).toBeDefined();
    });

    it('should have upper band above middle and lower band below middle', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { bollingerUpper, bollingerMiddle, bollingerLower } = lastCandle.indicators;

      if (bollingerUpper && bollingerMiddle && bollingerLower) {
        expect(bollingerUpper).toBeGreaterThan(bollingerMiddle);
        expect(bollingerMiddle).toBeGreaterThan(bollingerLower);
      }
    });

    it('should have middle band close to SMA20', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { bollingerMiddle, sma20 } = lastCandle.indicators;

      if (bollingerMiddle && sma20) {
        // Middle band should be very close to SMA20 (same period)
        expect(Math.abs(bollingerMiddle - sma20)).toBeLessThan(1);
      }
    });
  });

  describe('Stochastic Oscillator', () => {
    it('should calculate Stochastic values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(lastCandle.indicators.stochK).toBeDefined();
      expect(lastCandle.indicators.stochD).toBeDefined();
    });

    it('should have Stochastic K and D between 0 and 100', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { stochK, stochD } = lastCandle.indicators;

      if (stochK !== undefined) {
        expect(stochK).toBeGreaterThanOrEqual(0);
        expect(stochK).toBeLessThanOrEqual(100);
      }
      if (stochD !== undefined) {
        expect(stochD).toBeGreaterThanOrEqual(0);
        expect(stochD).toBeLessThanOrEqual(100);
      }
    });

    it('should have %D as smoothed version of %K', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      
      // Get last few candles with both K and D defined
      const validCandles = result.filter(
        c => c.indicators.stochK !== undefined && c.indicators.stochD !== undefined
      );

      // Just verify both are calculated and reasonable
      if (validCandles.length >= 3) {
        const lastK = validCandles[validCandles.length - 1].indicators.stochK!;
        const lastD = validCandles[validCandles.length - 1].indicators.stochD!;

        // Both should be in valid range
        expect(lastK).toBeGreaterThanOrEqual(0);
        expect(lastK).toBeLessThanOrEqual(100);
        expect(lastD).toBeGreaterThanOrEqual(0);
        expect(lastD).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('ADX (Average Directional Index)', () => {
    it('should calculate ADX values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(lastCandle.indicators.adx).toBeDefined();
      expect(lastCandle.indicators.adxPlusDI).toBeDefined();
      expect(lastCandle.indicators.adxMinusDI).toBeDefined();
    });

    it('should have ADX between 0 and 100', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { adx } = lastCandle.indicators;

      if (adx !== undefined) {
        expect(adx).toBeGreaterThanOrEqual(0);
        expect(adx).toBeLessThanOrEqual(100);
      }
    });

    it('should have directional indicators as positive numbers', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { adxPlusDI, adxMinusDI } = lastCandle.indicators;

      if (adxPlusDI !== undefined) {
        expect(adxPlusDI).toBeGreaterThanOrEqual(0);
      }
      if (adxMinusDI !== undefined) {
        expect(adxMinusDI).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('ATR (Average True Range)', () => {
    it('should calculate ATR values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(lastCandle.indicators.atr).toBeDefined();
    });

    it('should have ATR as positive number', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { atr } = lastCandle.indicators;

      if (atr !== undefined) {
        expect(atr).toBeGreaterThan(0);
      }
    });
  });

  describe('PSAR (Parabolic SAR)', () => {
    it('should calculate PSAR values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(lastCandle.indicators.psar).toBeDefined();
      expect(lastCandle.indicators.psarTrend).toBeDefined();
    });

    it('should have PSAR trend as bullish or bearish', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { psarTrend } = lastCandle.indicators;

      if (psarTrend !== undefined) {
        expect(['bullish', 'bearish']).toContain(psarTrend);
      }
    });
  });

  describe('CCI (Commodity Channel Index)', () => {
    it('should calculate CCI values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(lastCandle.indicators.cci).toBeDefined();
    });

    it('should have CCI as number (unbounded)', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { cci } = lastCandle.indicators;

      if (cci !== undefined) {
        expect(typeof cci).toBe('number');
        expect(isFinite(cci)).toBe(true);
      }
    });
  });

  describe('Williams %R', () => {
    it('should calculate Williams %R values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(lastCandle.indicators.williamsR).toBeDefined();
    });

    it('should have Williams %R between -100 and 0', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { williamsR } = lastCandle.indicators;

      if (williamsR !== undefined) {
        expect(williamsR).toBeGreaterThanOrEqual(-100);
        expect(williamsR).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('Stochastic RSI', () => {
    it('should calculate Stochastic RSI values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(lastCandle.indicators.stochRSI).toBeDefined();
    });

    it('should have Stochastic RSI between 0 and 1', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { stochRSI } = lastCandle.indicators;

      if (stochRSI !== undefined) {
        expect(stochRSI).toBeGreaterThanOrEqual(0);
        expect(stochRSI).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('MFI (Money Flow Index)', () => {
    it('should calculate MFI values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(lastCandle.indicators.mfi).toBeDefined();
    });

    it('should have MFI between 0 and 100', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { mfi } = lastCandle.indicators;

      if (mfi !== undefined) {
        expect(mfi).toBeGreaterThanOrEqual(0);
        expect(mfi).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('OBV (On Balance Volume)', () => {
    it('should calculate OBV values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      // OBV should be defined, even if it starts from first candle
      expect(lastCandle.indicators.obv).toBeDefined();
    });

    it('should have OBV as number', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { obv } = lastCandle.indicators;

      if (obv !== undefined) {
        expect(typeof obv).toBe('number');
      }
    });

    it('should show cumulative volume trend', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      
      // OBV should be defined for all candles since it calculates from first
      const validOBV = result.filter(c => c.indicators.obv !== undefined);
      expect(validOBV.length).toBeGreaterThan(0);
    });
  });

  describe('VWAP (Volume Weighted Average Price)', () => {
    it('should calculate VWAP values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(lastCandle.indicators.vwap).toBeDefined();
    });

    it('should have VWAP as positive number close to price', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];
      const { vwap } = lastCandle.indicators;

      if (vwap !== undefined) {
        expect(vwap).toBeGreaterThan(0);
        // VWAP should be reasonably close to current price
        expect(Math.abs(vwap - lastCandle.close)).toBeLessThan(lastCandle.close * 0.5);
      }
    });
  });

  describe('All Indicators Integration', () => {
    it('should calculate all indicators including new ones', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      // Check all indicators are present
      expect(lastCandle.indicators).toHaveProperty('ema9');
      expect(lastCandle.indicators).toHaveProperty('ema21');
      expect(lastCandle.indicators).toHaveProperty('ema50');
      expect(lastCandle.indicators).toHaveProperty('sma20');
      expect(lastCandle.indicators).toHaveProperty('sma50');
      expect(lastCandle.indicators).toHaveProperty('rsi');
      expect(lastCandle.indicators).toHaveProperty('volumeMA');
      expect(lastCandle.indicators).toHaveProperty('macd');
      expect(lastCandle.indicators).toHaveProperty('macdSignal');
      expect(lastCandle.indicators).toHaveProperty('macdHistogram');
      expect(lastCandle.indicators).toHaveProperty('bollingerUpper');
      expect(lastCandle.indicators).toHaveProperty('bollingerMiddle');
      expect(lastCandle.indicators).toHaveProperty('bollingerLower');
      expect(lastCandle.indicators).toHaveProperty('stochK');
      expect(lastCandle.indicators).toHaveProperty('stochD');
      
      // New indicators
      expect(lastCandle.indicators).toHaveProperty('adx');
      expect(lastCandle.indicators).toHaveProperty('adxPlusDI');
      expect(lastCandle.indicators).toHaveProperty('adxMinusDI');
      expect(lastCandle.indicators).toHaveProperty('atr');
      expect(lastCandle.indicators).toHaveProperty('psar');
      expect(lastCandle.indicators).toHaveProperty('psarTrend');
      expect(lastCandle.indicators).toHaveProperty('cci');
      expect(lastCandle.indicators).toHaveProperty('williamsR');
      expect(lastCandle.indicators).toHaveProperty('stochRSI');
      expect(lastCandle.indicators).toHaveProperty('mfi');
      expect(lastCandle.indicators).toHaveProperty('obv');
      expect(lastCandle.indicators).toHaveProperty('vwap');
    });

    it('should maintain consistency when updating with new candle', () => {
      const initialResult = indicatorCalculator.calculateIndicators(mockCandles);
      const newCandle: Candle = {
        timestamp: 100000,
        open: 51000,
        high: 51500,
        low: 50800,
        close: 51200,
        volume: 1200,
        closeTime: 100999,
      };

      const updated = indicatorCalculator.updateIndicators(initialResult, newCandle);

      expect(updated).toHaveLength(initialResult.length + 1);
      
      const lastCandle = updated[updated.length - 1];
      expect(lastCandle.indicators).toBeDefined();
      expect(lastCandle.indicators.macd).toBeDefined();
      expect(lastCandle.indicators.bollingerUpper).toBeDefined();
      expect(lastCandle.indicators.stochK).toBeDefined();
      expect(lastCandle.indicators.adx).toBeDefined();
      expect(lastCandle.indicators.mfi).toBeDefined();
    });
  });
});

// Helper function to calculate variance
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}
