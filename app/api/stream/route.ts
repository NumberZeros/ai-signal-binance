// API route for Server-Sent Events to stream live data

import { NextRequest } from 'next/server';
import { BinanceWebSocketClient } from '@/lib/binance/websocket-client';
import { stateManager } from '@/lib/state/manager';
import { Symbol, Timeframe, BinanceProductType } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// Disable static optimization for streaming
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = (searchParams.get('symbol') || 'BTCUSDT') as Symbol;
  const timeframe = (searchParams.get('timeframe') || '15m') as Timeframe;
  const productType = (searchParams.get('productType') || 'SPOT') as BinanceProductType;

  logger.info(`API: Starting SSE stream for ${symbol} ${timeframe}`);

  // Ensure state is initialized (use sync version for SSE)
  const state = stateManager.getStateSync(symbol, timeframe);
  if (state.candles.length === 0) {
    return new Response('State not initialized. Call /api/candles first', {
      status: 400,
    });
  }

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const initMessage = `data: ${JSON.stringify({
        type: 'connected',
        symbol,
        timeframe,
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));

      // Create WebSocket client
      const wsClient = new BinanceWebSocketClient(
        symbol,
        timeframe,
        (candle, isClosed) => {
          try {
            const { state: updatedState, newAlerts } = stateManager.updateCandle(
              symbol,
              timeframe,
              candle,
              isClosed
            );

            // Send candle update
            const candleMessage = `data: ${JSON.stringify({
              type: 'candle',
              candle: updatedState.candles[updatedState.candles.length - 1],
              isClosed,
              timestamp: Date.now(),
            })}\n\n`;
            controller.enqueue(encoder.encode(candleMessage));

            // Send alerts if any
            if (newAlerts.length > 0) {
              const alertMessage = `data: ${JSON.stringify({
                type: 'alerts',
                alerts: newAlerts,
                timestamp: Date.now(),
              })}\n\n`;
              controller.enqueue(encoder.encode(alertMessage));
            }
          } catch (error) {
            logger.error('Error processing WebSocket message', error);
          }
        },
        (error) => {
          logger.error('WebSocket error', error);
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            error: error.message,
            timestamp: Date.now(),
          })}\n\n`;
          controller.enqueue(encoder.encode(errorMessage));
        },
        productType
      );

      // Connect WebSocket
      wsClient.connect();

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          const pingMessage = `data: ${JSON.stringify({
            type: 'ping',
            timestamp: Date.now(),
          })}\n\n`;
          controller.enqueue(encoder.encode(pingMessage));
        } catch (error) {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        logger.info(`API: SSE stream closed for ${symbol} ${timeframe}`);
        clearInterval(pingInterval);
        wsClient.disconnect();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
