// Hook for Server-Sent Events stream

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Symbol, Timeframe, CandleWithIndicators, Alert, BinanceProductType } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

interface StreamMessage {
  type: 'connected' | 'candle' | 'alerts' | 'ping' | 'error';
  candle?: CandleWithIndicators;
  isClosed?: boolean;
  alerts?: Alert[];
  error?: string;
  timestamp: number;
}

export function useStream(
  symbol: Symbol,
  timeframe: Timeframe,
  enabled: boolean,
  productType: BinanceProductType
) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    const url = `${API_BASE}/stream?symbol=${symbol}&timeframe=${timeframe}&productType=${productType}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log('SSE connected');
      reconnectAttemptsRef.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const message: StreamMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'candle':
            // Update candles cache
            queryClient.setQueryData(
              ['candles', symbol, timeframe, productType],
              (old: any) => {
                if (!old) return old;
                
                const candles = [...old.candles];
                const lastCandle = candles[candles.length - 1];

                if (message.isClosed && message.candle) {
                  // New candle closed, add to array
                  if (message.candle.timestamp > lastCandle.timestamp) {
                    candles.push(message.candle);
                  }
                } else if (message.candle) {
                  // Update current candle
                  if (message.candle.timestamp === lastCandle.timestamp) {
                    candles[candles.length - 1] = message.candle;
                  }
                }

                return {
                  ...old,
                  candles,
                  lastUpdate: message.timestamp,
                };
              }
            );
            break;

          case 'alerts':
            // Add new alerts to cache
            if (message.alerts && message.alerts.length > 0) {
              queryClient.setQueryData(
                ['alerts', symbol, timeframe, productType],
                (old: any) => {
                  if (!old) return { alerts: message.alerts, count: message.alerts!.length };
                  
                  return {
                    alerts: [...old.alerts, ...message.alerts!],
                    count: old.count + message.alerts!.length,
                  };
                }
              );
            }
            break;

          case 'error':
            console.error('Stream error:', message.error);
            break;

          case 'ping':
            // Keep-alive message
            break;
        }
      } catch (error) {
        console.error('Failed to parse stream message:', error);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
      eventSource.close();
      
      // Attempt reconnect with exponential backoff
      if (reconnectAttemptsRef.current < 5) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        console.log(`Reconnecting in ${delay}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };

    eventSourceRef.current = eventSource;
  }, [symbol, timeframe, enabled, productType, queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected: typeof window !== 'undefined' 
      ? eventSourceRef.current?.readyState === EventSource.OPEN 
      : false,
    disconnect,
    reconnect: connect,
  };
}
