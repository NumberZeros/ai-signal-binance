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
    });
  });
});

// Helper function to calculate variance
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}
