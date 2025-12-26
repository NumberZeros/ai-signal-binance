// API route for AI natural language queries

import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';
import { stateManager } from '@/lib/state/manager';
import { Symbol, Timeframe, AIContext } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, symbol, timeframe } = body;

    if (!query || !symbol || !timeframe) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    logger.info(`API: Answering query for ${symbol} ${timeframe}`);

    const state = stateManager.getStateSync(symbol as Symbol, timeframe as Timeframe);

    if (state.candles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No market data available' },
        { status: 400 }
      );
    }

    const latestCandle = state.candles[state.candles.length - 1];

    // Build AI context
    const context: AIContext = {
      symbol: state.symbol,
      timeframe: state.timeframe,
      currentPrice: latestCandle.close,
      recentAlerts: state.alerts.slice(-5),
      indicators: latestCandle.indicators,
      marketCondition: aiService.determineMarketCondition({
        symbol: state.symbol,
        timeframe: state.timeframe,
        currentPrice: latestCandle.close,
        recentAlerts: state.alerts,
        indicators: latestCandle.indicators,
        marketCondition: 'neutral',
      }),
    };

    const answer = await aiService.answerQuery(query, context);

    return NextResponse.json({
      success: true,
      data: { answer },
    });
  } catch (error) {
    logger.error('API: Failed to answer query', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to answer query',
      },
      { status: 500 }
    );
  }
}
