// React Query hooks for data fetching

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Symbol, Timeframe, CandleWithIndicators, Alert, BinanceProductType } from '@/lib/types';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

// Fetch candle data
export function useCandles(symbol: Symbol, timeframe: Timeframe, productType: BinanceProductType) {
  return useQuery({
    queryKey: ['candles', symbol, timeframe, productType],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/candles`, {
        params: { symbol, timeframe, limit: 300, productType },
      });
      return response.data.data as {
        symbol: Symbol;
        timeframe: Timeframe;
        candles: CandleWithIndicators[];
        lastUpdate: number;
        candleCount: number;
      };
    },
    staleTime: 0, // Always consider data stale to allow updates from SSE
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Fetch alerts
export function useAlerts(symbol: Symbol, timeframe: Timeframe, productType: BinanceProductType) {
  return useQuery({
    queryKey: ['alerts', symbol, timeframe, productType],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/alerts`, {
        params: { symbol, timeframe, limit: 50, productType },
      });
      return response.data.data as {
        alerts: Alert[];
        count: number;
      };
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: false,
  });
}

// Explain alert with AI
export function useExplainAlert() {
  return useMutation({
    mutationFn: async ({
      alertId,
      symbol,
      timeframe,
    }: {
      alertId: string;
      symbol: Symbol;
      timeframe: Timeframe;
    }) => {
      const response = await axios.post(`${API_BASE}/ai/explain`, {
        alertId,
        symbol,
        timeframe,
      });
      return response.data.data as { explanation: string };
    },
  });
}

// Generate market summary with AI
export function useMarketSummary() {
  return useMutation({
    mutationFn: async ({
      symbol,
      timeframe,
    }: {
      symbol: Symbol;
      timeframe: Timeframe;
    }) => {
      const response = await axios.post(`${API_BASE}/ai/summary`, {
        symbol,
        timeframe,
      });
      return response.data.data as { summary: string };
    },
  });
}

// Query AI with natural language
export function useAIQuery() {
  return useMutation({
    mutationFn: async ({
      query,
      symbol,
      timeframe,
    }: {
      query: string;
      symbol: Symbol;
      timeframe: Timeframe;
    }) => {
      const response = await axios.post(`${API_BASE}/ai/query`, {
        query,
        symbol,
        timeframe,
      });
      return response.data.data as { answer: string };
    },
  });
}
