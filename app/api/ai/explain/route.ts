// API route for AI alert explanation

import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';
import { stateManager } from '@/lib/state/manager';
import { Symbol, Timeframe, AIContext } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, symbol, timeframe } = body;

    if (!alertId || !symbol || !timeframe) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    logger.info(`API: Explaining alert ${alertId}`);

    const state = stateManager.getStateSync(symbol as Symbol, timeframe as Timeframe);
    const alert = state.alerts.find(a => a.id === alertId);

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      );
    }

    if (alert.aiExplanation) {
      // Return cached explanation
      return NextResponse.json({
        success: true,
        data: { explanation: alert.aiExplanation },
      });
    }

    // Build AI context
    const latestCandle = state.candles[state.candles.length - 1];
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

    // Generate explanation
    const explanation = await aiService.explainAlert(alert, context);

    // Cache explanation
    alert.aiExplanation = explanation;

    return NextResponse.json({
      success: true,
      data: { explanation },
    });
  } catch (error) {
    logger.error('API: Failed to explain alert', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate explanation',
      },
      { status: 500 }
    );
  }
}
