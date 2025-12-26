// API route to initialize and fetch candle data

import { NextRequest, NextResponse } from 'next/server';
import { binanceClient } from '@/lib/binance/rest-client';
import { stateManager } from '@/lib/state/manager';
import { Symbol, Timeframe, BinanceProductType } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = (searchParams.get('symbol') || 'BTCUSDT') as Symbol;
    const timeframe = (searchParams.get('timeframe') || '15m') as Timeframe;
    const productType = (searchParams.get('productType') || 'SPOT') as BinanceProductType;
    const limit = parseInt(searchParams.get('limit') || '300');
    const endTime = searchParams.get('endTime') ? parseInt(searchParams.get('endTime')!) : undefined;

    // Set product type on binance client
    binanceClient.setProductType(productType);

    logger.info(`API: Fetching candles for ${symbol} ${timeframe}${endTime ? ` (before ${endTime})` : ''}`);

    // If endTime is provided, fetch historical candles directly (for infinite scroll)
    if (endTime) {
      const candles = await binanceClient.getHistoricalCandles(
        symbol,
        timeframe,
        limit,
        endTime
      );

      return NextResponse.json({
        success: true,
        data: {
          symbol,
          timeframe,
          candles,
          lastUpdate: Date.now(),
          candleCount: candles.length,
        },
      });
    }

    // Check if state already exists (try Redis first)
    let state = await stateManager.getState(symbol, timeframe);

    if (state.candles.length === 0) {
      // Initialize state with historical data
      const candles = await binanceClient.getHistoricalCandles(
        symbol,
        timeframe,
        limit
      );

      state = await stateManager.initializeState(symbol, timeframe, candles);
    }

    return NextResponse.json({
      success: true,
      data: {
        symbol: state.symbol,
        timeframe: state.timeframe,
        candles: state.candles,
        lastUpdate: state.lastUpdate,
        candleCount: state.candles.length,
      },
    });
  } catch (error) {
    logger.error('API: Failed to fetch candles', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch candles',
      },
      { status: 500 }
    );
  }
}
