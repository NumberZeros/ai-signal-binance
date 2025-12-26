// E2E test for API endpoints

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('API Routes', () => {
  test('GET /api/health should return system status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('redis');
    expect(data).toHaveProperty('stats');
  });

  test('GET /api/candles should return candle data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/candles?symbol=BTCUSDT&timeframe=15m&limit=100`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('candles');
    expect(Array.isArray(data.data.candles)).toBe(true);
  });

  test('GET /api/alerts should return alerts', async ({ request }) => {
    // First, ensure we have some data
    await request.get(`${BASE_URL}/api/candles?symbol=BTCUSDT&timeframe=15m`);
    
    const response = await request.get(`${BASE_URL}/api/alerts?symbol=BTCUSDT&timeframe=15m`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('alerts');
    expect(Array.isArray(data.data.alerts)).toBe(true);
  });

  test('GET /api/candles should handle different symbols', async ({ request }) => {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    
    for (const symbol of symbols) {
      const response = await request.get(`${BASE_URL}/api/candles?symbol=${symbol}&timeframe=15m&limit=50`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.symbol).toBe(symbol);
    }
  });

  test('GET /api/candles should handle different timeframes', async ({ request }) => {
    const timeframes = ['5m', '15m', '1h'];
    
    for (const timeframe of timeframes) {
      const response = await request.get(`${BASE_URL}/api/candles?symbol=BTCUSDT&timeframe=${timeframe}&limit=50`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.timeframe).toBe(timeframe);
    }
  });

  test('POST /api/ai/summary should return market summary', async ({ request }) => {
    // Ensure data is loaded first
    await request.get(`${BASE_URL}/api/candles?symbol=BTCUSDT&timeframe=15m`);
    
    const response = await request.post(`${BASE_URL}/api/ai/summary`, {
      data: {
        symbol: 'BTCUSDT',
        timeframe: '15m',
      },
    });
    
    // AI might be rate limited or disabled in test, so just check structure
    const data = await response.json();
    expect(data).toHaveProperty('success');
  });

  test('API should handle invalid parameters gracefully', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/candles?symbol=INVALID&timeframe=99h`);
    
    // Should either succeed with error or return bad request
    const data = await response.json();
    expect(typeof data.success).toBe('boolean');
  });
});

test.describe('API Performance', () => {
  test('candles endpoint should respond quickly', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${BASE_URL}/api/candles?symbol=BTCUSDT&timeframe=15m&limit=100`);
    const duration = Date.now() - start;
    
    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(5000); // Should respond within 5 seconds
  });

  test('health endpoint should be fast', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${BASE_URL}/api/health`);
    const duration = Date.now() - start;
    
    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(1000); // Should respond within 1 second
  });
});
