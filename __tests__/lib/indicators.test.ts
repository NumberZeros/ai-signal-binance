// Unit tests for indicator calculator

import { describe, it, expect } from '@jest/globals';
import { indicatorCalculator } from '@/lib/indicators/calculator';
import { Candle } from '@/lib/types';

describe('IndicatorCalculator', () => {
  // Create more candles for better indicator calculation (need at least 50 for SMA50, EMA50)
  const mockCandles: Candle[] = Array.from({ length: 100 }, (_, i) => ({
    timestamp: (i + 1) * 60000,
    open: 100 + i * 0.5 + Math.sin(i / 10) * 10,
    high: 105 + i * 0.5 + Math.sin(i / 10) * 10,
    low: 95 + i * 0.5 + Math.sin(i / 10) * 10,
    close: 100 + i * 0.5 + Math.sin(i / 10) * 10,
    volume: 1000 + i * 10 + Math.random() * 100,
    closeTime: (i + 1) * 60000 + 59999,
  }));

  describe('calculateIndicators', () => {
    it('should calculate indicators for all candles', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);

      expect(result).toHaveLength(mockCandles.length);
      expect(result[0]).toHaveProperty('indicators');
    });

    it('should calculate EMA values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      // Check that indicators exist and are numbers
      expect(typeof lastCandle.indicators.ema9).toBe('number');
      expect(typeof lastCandle.indicators.ema21).toBe('number');
      expect(typeof lastCandle.indicators.ema50).toBe('number');
      
      // For sufficient data, all should be calculated
      if (mockCandles.length >= 50) {
        expect(lastCandle.indicators.ema9).toBeGreaterThan(0);
        expect(lastCandle.indicators.ema21).toBeGreaterThan(0);
        expect(lastCandle.indicators.ema50).toBeGreaterThan(0);
      }
    });

    it('should calculate SMA values', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(typeof lastCandle.indicators.sma20).toBe('number');
      expect(typeof lastCandle.indicators.sma50).toBe('number');
      
      // For sufficient data, all should be calculated
      if (mockCandles.length >= 50) {
        expect(lastCandle.indicators.sma20).toBeGreaterThan(0);
        expect(lastCandle.indicators.sma50).toBeGreaterThan(0);
      }
    });

    it('should calculate RSI values between 0 and 100', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(typeof lastCandle.indicators.rsi).toBe('number');
      
      // RSI should be calculated if we have enough data (at least 14 periods for RSI)
      const rsi = lastCandle.indicators.rsi;
      if (mockCandles.length >= 20 && rsi !== undefined && !isNaN(rsi)) {
        expect(rsi).toBeGreaterThanOrEqual(0);
        expect(rsi).toBeLessThanOrEqual(100);
      }
    });

    it('should calculate Volume MA', () => {
      const result = indicatorCalculator.calculateIndicators(mockCandles);
      const lastCandle = result[result.length - 1];

      expect(typeof lastCandle.indicators.volumeMA).toBe('number');
      
      // For sufficient data, should be calculated
      if (mockCandles.length >= 20) {
        expect(lastCandle.indicators.volumeMA).toBeGreaterThan(0);
      }
    });
  });

  describe('updateIndicators', () => {
    it('should update indicators with new candle', () => {
      const initialResult = indicatorCalculator.calculateIndicators(mockCandles);
      const newCandle: Candle = {
        timestamp: 11000,
        open: 150,
        high: 160,
        low: 145,
        close: 155,
        volume: 2000,
        closeTime: 11999,
      };

      const updated = indicatorCalculator.updateIndicators(initialResult, newCandle);

      expect(updated).toHaveLength(initialResult.length + 1);
      expect(updated[updated.length - 1].close).toBe(155);
      expect(updated[updated.length - 1].indicators).toBeDefined();
    });

    it('should maintain indicator continuity', () => {
      const initialResult = indicatorCalculator.calculateIndicators(mockCandles);
      const lastEMA9 = initialResult[initialResult.length - 1].indicators.ema9;

      const newCandle: Candle = {
        timestamp: 11000,
        open: 150,
        high: 160,
        low: 145,
        close: 155,
        volume: 2000,
        closeTime: 11999,
      };

      const updated = indicatorCalculator.updateIndicators(initialResult, newCandle);
      const newEMA9 = updated[updated.length - 1].indicators.ema9;

      // New EMA should be different but in reasonable range
      if (lastEMA9 !== undefined && newEMA9 !== undefined) {
        expect(newEMA9).not.toBe(lastEMA9);
        expect(Math.abs(newEMA9 - lastEMA9)).toBeLessThan(10);
      }
    });
  });
});
