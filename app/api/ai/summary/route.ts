// API route for AI market summary

import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';
import { stateManager } from '@/lib/state/manager';
import { Symbol, Timeframe, AIContext } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, timeframe } = body;

    if (!symbol || !timeframe) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    logger.info(`API: Generating market summary for ${symbol} ${timeframe}`);

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
      recentAlerts: state.alerts.slice(-10),
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

    const summary = await aiService.generateMarketSummary(context);

    return NextResponse.json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    logger.error('API: Failed to generate market summary', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate summary',
      },
      { status: 500 }
    );
  }
}
