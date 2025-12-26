// AI service using LangChain.js with OpenAI

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Alert, AIContext, Symbol, Timeframe } from '@/lib/types';
import { AI_CONFIG } from '@/lib/config/constants';
import { logger } from '@/lib/utils/logger';

class AIService {
  private model: ChatOpenAI;
  private rateLimiter: Map<string, number[]> = new Map();

  constructor() {
    this.model = new ChatOpenAI({
      modelName: AI_CONFIG.MODEL,
      temperature: AI_CONFIG.TEMPERATURE,
      maxTokens: AI_CONFIG.MAX_TOKENS,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate AI explanation for an alert
   */
  async explainAlert(alert: Alert, context: AIContext): Promise<string> {
    if (!this.checkRateLimit('explain')) {
      throw new Error('Rate limit exceeded. Please try again in a minute.');
    }

    const prompt = PromptTemplate.fromTemplate(`
You are a professional cryptocurrency technical analyst. Explain the following trading alert in 2-3 concise sentences.

Alert Details:
- Type: {alertType}
- Symbol: {symbol}
- Price: ${context.currentPrice}
- Description: {description}
- Technical Reason: {technicalReason}

Current Market Indicators:
- RSI: {rsi}
- EMA 9: {ema9}
- EMA 21: {ema21}

Provide a clear, educational explanation focusing on:
1. What this alert means technically
2. What traders typically watch for in this situation

Important: Do NOT provide buy/sell recommendations. Do NOT predict future prices. Focus only on technical analysis education.
    `);

    try {
      const chain = prompt.pipe(this.model).pipe(new StringOutputParser());

      const response = await chain.invoke({
        alertType: alert.type.replace(/_/g, ' '),
        symbol: alert.symbol,
        description: alert.metadata.description,
        technicalReason: alert.metadata.technicalReason,
        rsi: context.indicators.rsi?.toFixed(2) || 'N/A',
        ema9: context.indicators.ema9?.toFixed(2) || 'N/A',
        ema21: context.indicators.ema21?.toFixed(2) || 'N/A',
      });

      logger.info('AI alert explanation generated');
      return response;
    } catch (error) {
      logger.error('Failed to generate AI explanation', error);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Generate market summary
   */
  async generateMarketSummary(context: AIContext): Promise<string> {
    if (!this.checkRateLimit('summary')) {
      throw new Error('Rate limit exceeded. Please try again in a minute.');
    }

    const bullishAlerts = context.recentAlerts.filter(a =>
      ['EMA_CROSSOVER_BULLISH', 'BREAKOUT_HIGH', 'RSI_OVERSOLD'].includes(a.type)
    ).length;

    const bearishAlerts = context.recentAlerts.filter(a =>
      ['EMA_CROSSOVER_BEARISH', 'BREAKOUT_LOW', 'RSI_OVERBOUGHT'].includes(a.type)
    ).length;

    const prompt = PromptTemplate.fromTemplate(`
You are a professional cryptocurrency market analyst. Provide a brief market summary for {symbol} on {timeframe} timeframe.

Current Market Data:
- Price: ${context.currentPrice}
- Market Condition: {marketCondition}
- Recent Bullish Alerts: {bullishAlerts}
- Recent Bearish Alerts: {bearishAlerts}

Current Indicators:
- RSI: {rsi}
- EMA 9: {ema9}
- EMA 21: {ema21}

Provide a 3-4 sentence market summary covering:
1. Current technical setup
2. Key indicator signals
3. Overall market bias based on technicals

Important: This is educational analysis only. Do NOT provide trading advice or price predictions.
Add disclaimer: "This is technical analysis for educational purposes only, not financial advice."
    `);

    try {
      const chain = prompt.pipe(this.model).pipe(new StringOutputParser());

      const response = await chain.invoke({
        symbol: context.symbol,
        timeframe: context.timeframe,
        marketCondition: context.marketCondition,
        bullishAlerts,
        bearishAlerts,
        rsi: context.indicators.rsi?.toFixed(2) || 'N/A',
        ema9: context.indicators.ema9?.toFixed(2) || 'N/A',
        ema21: context.indicators.ema21?.toFixed(2) || 'N/A',
      });

      logger.info('AI market summary generated');
      return response;
    } catch (error) {
      logger.error('Failed to generate market summary', error);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Answer natural language query about market
   */
  async answerQuery(query: string, context: AIContext): Promise<string> {
    if (!this.checkRateLimit('query')) {
      throw new Error('Rate limit exceeded. Please try again in a minute.');
    }

    const prompt = PromptTemplate.fromTemplate(`
You are a helpful cryptocurrency technical analysis assistant. Answer the user's question based on current market data.

Market Context:
- Symbol: {symbol}
- Timeframe: {timeframe}
- Current Price: ${context.currentPrice}
- RSI: {rsi}
- EMA 9: {ema9}
- EMA 21: {ema21}
- Recent Alerts: {alertCount}

User Question: {query}

Provide a clear, concise answer focusing on technical analysis and market data. 
If the question asks for trading advice or price predictions, politely decline and explain you can only provide technical analysis education.

Important: Do NOT provide buy/sell recommendations. Do NOT predict future prices.
    `);

    try {
      const chain = prompt.pipe(this.model).pipe(new StringOutputParser());

      const response = await chain.invoke({
        symbol: context.symbol,
        timeframe: context.timeframe,
        rsi: context.indicators.rsi?.toFixed(2) || 'N/A',
        ema9: context.indicators.ema9?.toFixed(2) || 'N/A',
        ema21: context.indicators.ema21?.toFixed(2) || 'N/A',
        alertCount: context.recentAlerts.length,
        query,
      });

      logger.info('AI query answered');
      return response;
    } catch (error) {
      logger.error('Failed to answer query', error);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Simple rate limiter
   */
  private checkRateLimit(operation: string): boolean {
    const now = Date.now();
    const key = operation;
    const requests = this.rateLimiter.get(key) || [];

    // Remove requests older than 1 minute
    const recentRequests = requests.filter(time => now - time < 60000);

    if (recentRequests.length >= AI_CONFIG.RATE_LIMIT_PER_MINUTE) {
      logger.warn(`Rate limit exceeded for operation: ${operation}`);
      return false;
    }

    recentRequests.push(now);
    this.rateLimiter.set(key, recentRequests);
    return true;
  }

  /**
   * Determine market condition from indicators
   */
  determineMarketCondition(context: AIContext): 'bullish' | 'bearish' | 'neutral' {
    const { ema9, ema21, rsi } = context.indicators;

    if (!ema9 || !ema21) return 'neutral';

    const bullishSignals = [
      ema9 > ema21, // Fast EMA above slow
      rsi && rsi < 50, // RSI not overbought
    ].filter(Boolean).length;

    const bearishSignals = [
      ema9 < ema21, // Fast EMA below slow
      rsi && rsi > 50, // RSI elevated
    ].filter(Boolean).length;

    if (bullishSignals > bearishSignals) return 'bullish';
    if (bearishSignals > bullishSignals) return 'bearish';
    return 'neutral';
  }
}

// Singleton instance
export const aiService = new AIService();
