// API route to fetch alerts

import { NextRequest, NextResponse } from 'next/server';
import { stateManager } from '@/lib/state/manager';
import { Symbol, Timeframe } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = (searchParams.get('symbol') || 'BTCUSDT') as Symbol;
    const timeframe = (searchParams.get('timeframe') || '15m') as Timeframe;
    const limit = parseInt(searchParams.get('limit') || '50');

    logger.info(`API: Fetching alerts for ${symbol} ${timeframe}`);

    const state = await stateManager.getState(symbol, timeframe);
    const alerts = state.alerts.slice(-limit);

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
      },
    });
  } catch (error) {
    logger.error('API: Failed to fetch alerts', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch alerts',
      },
      { status: 500 }
    );
  }
}
