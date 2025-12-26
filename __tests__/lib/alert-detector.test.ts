import { describe, it, expect, beforeEach } from '@jest/globals';
import { AlertDetector } from '@/lib/alerts/detector';
import { CandleWithIndicators, Symbol, Timeframe } from '@/lib/types';

describe('AlertDetector - New Indicators', () => {
  let detector: AlertDetector;
  const symbol: Symbol = 'BTCUSDT';
  const timeframe: Timeframe = '15m';

  beforeEach(() => {
    detector = new AlertDetector();
  });

  const createMockCandle = (
    price: number,
    indicators: Partial<CandleWithIndicators['indicators']> = {}
  ): CandleWithIndicators => ({
    timestamp: Date.now(),
    open: price,
    high: price + 10,
    low: price - 10,
    close: price,
    volume: 1000,
    closeTime: Date.now() + 1000,
    indicators: {
      ema9: price,
      ema21: price,
      rsi: 50,
      volumeMA: 1000,
      ...indicators,
    },
  });

  describe('MACD Crossover Detection', () => {
    it('should detect bullish MACD crossover', () => {
      const candles = [
        createMockCandle(49900, { macd: -10, macdSignal: -5 }),
        createMockCandle(50000, { macd: -10, macdSignal: -5 }),
        createMockCandle(50100, { macd: 5, macdSignal: 3 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const macdAlert = alerts.find(a => a.type === 'MACD_CROSSOVER_BULLISH');

      expect(macdAlert).toBeDefined();
      expect(macdAlert?.confidence).toBe(80);
    });

    it('should detect bearish MACD crossover', () => {
      const candles = [
        createMockCandle(50100, { macd: 10, macdSignal: 5 }),
        createMockCandle(50000, { macd: 10, macdSignal: 5 }),
        createMockCandle(49900, { macd: -5, macdSignal: -3 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const macdAlert = alerts.find(a => a.type === 'MACD_CROSSOVER_BEARISH');

      expect(macdAlert).toBeDefined();
      expect(macdAlert?.confidence).toBe(80);
    });
  });

  describe('Bollinger Bands Breakout Detection', () => {
    it('should detect upper Bollinger Band breakout', () => {
      const candles = [
        createMockCandle(50000, { bollingerUpper: 51000, bollingerMiddle: 50000, bollingerLower: 49000 }),
        createMockCandle(50500, { bollingerUpper: 51000, bollingerMiddle: 50000, bollingerLower: 49000 }),
        createMockCandle(51100, { bollingerUpper: 51000, bollingerMiddle: 50000, bollingerLower: 49000 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const bbAlert = alerts.find(a => a.type === 'BOLLINGER_BREAKOUT_UPPER');

      expect(bbAlert).toBeDefined();
      expect(bbAlert?.confidence).toBe(75);
    });

    it('should detect lower Bollinger Band breakout', () => {
      const candles = [
        createMockCandle(50000, { bollingerUpper: 51000, bollingerMiddle: 50000, bollingerLower: 49000 }),
        createMockCandle(49500, { bollingerUpper: 51000, bollingerMiddle: 50000, bollingerLower: 49000 }),
        createMockCandle(48900, { bollingerUpper: 51000, bollingerMiddle: 50000, bollingerLower: 49000 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const bbAlert = alerts.find(a => a.type === 'BOLLINGER_BREAKOUT_LOWER');

      expect(bbAlert).toBeDefined();
      expect(bbAlert?.confidence).toBe(75);
    });
  });

  describe('Stochastic Overbought/Oversold Detection', () => {
    it('should detect overbought condition', () => {
      const candles = [
        createMockCandle(49900, { stochK: 85, stochD: 82 }),
        createMockCandle(50000, { stochK: 85, stochD: 82 }),
        createMockCandle(50100, { stochK: 85, stochD: 83 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const stochAlert = alerts.find(a => a.type === 'STOCHASTIC_OVERBOUGHT');

      expect(stochAlert).toBeDefined();
      expect(stochAlert?.confidence).toBe(70);
    });

    it('should detect oversold condition', () => {
      const candles = [
        createMockCandle(50100, { stochK: 15, stochD: 18 }),
        createMockCandle(50000, { stochK: 15, stochD: 18 }),
        createMockCandle(49900, { stochK: 15, stochD: 17 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const stochAlert = alerts.find(a => a.type === 'STOCHASTIC_OVERSOLD');

      expect(stochAlert).toBeDefined();
      expect(stochAlert?.confidence).toBe(70);
    });
  });

  describe('ADX Trend Detection', () => {
    it('should detect strong trend emerging', () => {
      const candles = [
        createMockCandle(49900, { adx: 24, adxPlusDI: 30, adxMinusDI: 20 }),
        createMockCandle(50000, { adx: 24, adxPlusDI: 30, adxMinusDI: 20 }),
        createMockCandle(50100, { adx: 26, adxPlusDI: 32, adxMinusDI: 18 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const adxAlert = alerts.find(a => a.type === 'ADX_STRONG_TREND');

      expect(adxAlert).toBeDefined();
      expect(adxAlert?.confidence).toBe(75);
    });

    it('should detect trend weakening', () => {
      const candles = [
        createMockCandle(49900, { adx: 26, adxPlusDI: 30, adxMinusDI: 20 }),
        createMockCandle(50000, { adx: 26, adxPlusDI: 30, adxMinusDI: 20 }),
        createMockCandle(50100, { adx: 24, adxPlusDI: 28, adxMinusDI: 22 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const adxAlert = alerts.find(a => a.type === 'ADX_WEAK_TREND');

      expect(adxAlert).toBeDefined();
      expect(adxAlert?.confidence).toBe(65);
    });
  });

  describe('CCI Overbought/Oversold Detection', () => {
    it('should detect CCI overbought', () => {
      const candles = [
        createMockCandle(49900, { cci: 90 }),
        createMockCandle(50000, { cci: 90 }),
        createMockCandle(50100, { cci: 110 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const cciAlert = alerts.find(a => a.type === 'CCI_OVERBOUGHT');

      expect(cciAlert).toBeDefined();
      expect(cciAlert?.confidence).toBe(70);
    });

    it('should detect CCI oversold', () => {
      const candles = [
        createMockCandle(50100, { cci: -90 }),
        createMockCandle(50000, { cci: -90 }),
        createMockCandle(49900, { cci: -110 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const cciAlert = alerts.find(a => a.type === 'CCI_OVERSOLD');

      expect(cciAlert).toBeDefined();
      expect(cciAlert?.confidence).toBe(70);
    });
  });

  describe('Williams %R Detection', () => {
    it('should detect Williams %R overbought', () => {
      const candles = [
        createMockCandle(49900, { williamsR: -15 }),
        createMockCandle(50000, { williamsR: -15 }),
        createMockCandle(50100, { williamsR: -10 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const wrAlert = alerts.find(a => a.type === 'WILLIAMS_R_OVERBOUGHT');

      expect(wrAlert).toBeDefined();
      expect(wrAlert?.confidence).toBe(70);
    });

    it('should detect Williams %R oversold', () => {
      const candles = [
        createMockCandle(50100, { williamsR: -85 }),
        createMockCandle(50000, { williamsR: -85 }),
        createMockCandle(49900, { williamsR: -90 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const wrAlert = alerts.find(a => a.type === 'WILLIAMS_R_OVERSOLD');

      expect(wrAlert).toBeDefined();
      expect(wrAlert?.confidence).toBe(70);
    });
  });

  describe('MFI Detection', () => {
    it('should detect MFI overbought', () => {
      const candles = [
        createMockCandle(49900, { mfi: 75 }),
        createMockCandle(50000, { mfi: 75 }),
        createMockCandle(50100, { mfi: 85 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const mfiAlert = alerts.find(a => a.type === 'MFI_OVERBOUGHT');

      expect(mfiAlert).toBeDefined();
      expect(mfiAlert?.confidence).toBe(75);
    });

    it('should detect MFI oversold', () => {
      const candles = [
        createMockCandle(50100, { mfi: 25 }),
        createMockCandle(50000, { mfi: 25 }),
        createMockCandle(49900, { mfi: 15 }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const mfiAlert = alerts.find(a => a.type === 'MFI_OVERSOLD');

      expect(mfiAlert).toBeDefined();
      expect(mfiAlert?.confidence).toBe(75);
    });
  });

  describe('PSAR Reversal Detection', () => {
    it('should detect bullish PSAR reversal', () => {
      const candles = [
        createMockCandle(49900, { psar: 50500, psarTrend: 'bearish' }),
        createMockCandle(50000, { psar: 50500, psarTrend: 'bearish' }),
        createMockCandle(50100, { psar: 49900, psarTrend: 'bullish' }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const psarAlert = alerts.find(a => a.type === 'PSAR_REVERSAL_BULLISH');

      expect(psarAlert).toBeDefined();
      expect(psarAlert?.confidence).toBe(70);
    });

    it('should detect bearish PSAR reversal', () => {
      const candles = [
        createMockCandle(50100, { psar: 49500, psarTrend: 'bullish' }),
        createMockCandle(50000, { psar: 49500, psarTrend: 'bullish' }),
        createMockCandle(49900, { psar: 50100, psarTrend: 'bearish' }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);
      const psarAlert = alerts.find(a => a.type === 'PSAR_REVERSAL_BEARISH');

      expect(psarAlert).toBeDefined();
      expect(psarAlert?.confidence).toBe(70);
    });
  });

  describe('Multiple Alerts', () => {
    it('should detect multiple alerts simultaneously', () => {
      const candles = [
        createMockCandle(50100, {
          rsi: 32,
          macd: -10,
          macdSignal: -5,
          stochK: 18,
          stochD: 19,
        }),
        createMockCandle(50000, {
          rsi: 32,
          macd: -10,
          macdSignal: -5,
          stochK: 18,
          stochD: 19,
        }),
        createMockCandle(50100, {
          rsi: 28,
          macd: 5,
          macdSignal: 3,
          stochK: 16,
          stochD: 17,
        }),
      ];

      const alerts = detector.detectAlerts(candles, symbol, timeframe);

      // Should detect RSI oversold, MACD crossover, and Stochastic oversold
      expect(alerts.length).toBeGreaterThanOrEqual(3);
      expect(alerts.some(a => a.type === 'RSI_OVERSOLD')).toBe(true);
      expect(alerts.some(a => a.type === 'MACD_CROSSOVER_BULLISH')).toBe(true);
      expect(alerts.some(a => a.type === 'STOCHASTIC_OVERSOLD')).toBe(true);
    });
  });

  describe('Alert Deduplication', () => {
    it('should prevent duplicate alerts within deduplication window', () => {
      const baseTime = Date.now();
      const candles = [
        { ...createMockCandle(50000, { rsi: 75 }), timestamp: baseTime },
        { ...createMockCandle(50050, { rsi: 75 }), timestamp: baseTime + 500 },
        { ...createMockCandle(50100, { rsi: 75 }), timestamp: baseTime + 1000 },
      ];

      const alerts1 = detector.detectAlerts(candles.slice(0, 3), symbol, timeframe);
      const alerts2 = detector.detectAlerts([...candles, { ...createMockCandle(50150, { rsi: 75 }), timestamp: baseTime + 2000 }], symbol, timeframe);

      // First alert should trigger
      const rsiAlerts1 = alerts1.filter(a => a.type === 'RSI_OVERBOUGHT');
      const rsiAlerts2 = alerts2.filter(a => a.type === 'RSI_OVERBOUGHT');

      expect(rsiAlerts1.length).toBe(1);
      expect(rsiAlerts2.length).toBe(0); // Deduplicated
    });
  });
});
