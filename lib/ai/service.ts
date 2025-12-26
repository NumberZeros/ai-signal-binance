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
    const modelName = AI_CONFIG.MODEL;
    
    // Some models (like gpt-4o-mini, gpt-5-mini) don't support custom temperature
    const supportsTemperature = !modelName.includes('mini');
    
    this.model = new ChatOpenAI({
      modelName,
      ...(supportsTemperature ? { temperature: AI_CONFIG.TEMPERATURE } : {}),
      maxTokens: AI_CONFIG.MAX_TOKENS,
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    logger.info(`AI Service initialized with model: ${modelName} (temperature: ${supportsTemperature ? AI_CONFIG.TEMPERATURE : 'default'})`);
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
- MACD: {macd}
- ADX: {adx}
- ATR: {atr}
- MFI: {mfi}

Provide a clear, educational explanation focusing on:
1. What this alert means technically
2. What traders typically watch for in this situation
3. How other indicators confirm or contradict this signal

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
        macd: context.indicators.macd?.toFixed(4) || 'N/A',
        adx: context.indicators.adx?.toFixed(2) || 'N/A',
        atr: context.indicators.atr?.toFixed(4) || 'N/A',
        mfi: context.indicators.mfi?.toFixed(2) || 'N/A',
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
      ['EMA_CROSSOVER_BULLISH', 'BREAKOUT_HIGH', 'RSI_OVERSOLD', 'MACD_CROSSOVER_BULLISH', 
       'BOLLINGER_BREAKOUT_LOWER', 'STOCHASTIC_OVERSOLD', 'CCI_OVERSOLD', 'MFI_OVERSOLD',
       'PSAR_REVERSAL_BULLISH'].includes(a.type)
    ).length;

    const bearishAlerts = context.recentAlerts.filter(a =>
      ['EMA_CROSSOVER_BEARISH', 'BREAKOUT_LOW', 'RSI_OVERBOUGHT', 'MACD_CROSSOVER_BEARISH',
       'BOLLINGER_BREAKOUT_UPPER', 'STOCHASTIC_OVERBOUGHT', 'CCI_OVERBOUGHT', 'MFI_OVERBOUGHT',
       'PSAR_REVERSAL_BEARISH'].includes(a.type)
    ).length;

    const prompt = PromptTemplate.fromTemplate(`
You are an expert cryptocurrency technical analyst. Analyze {symbol} on {timeframe} timeframe and provide a concise, professional market summary.

**Market Data:**
Price: ${context.currentPrice} | Condition: {marketCondition}
Bullish Signals: {bullishAlerts} | Bearish Signals: {bearishAlerts}

**Technical Indicators:**
• RSI: {rsi} | EMA9: {ema9} | EMA21: {ema21}
• MACD: {macd} | ADX: {adx} | ATR: {atr}
• MFI: {mfi} | Stochastic K: {stochK}

**Instructions:**
Provide a structured 3-paragraph analysis:

1. **Trend Analysis**: Describe the current price trend using EMA positioning and ADX strength. State if bullish, bearish, or ranging.

2. **Momentum & Volume**: Analyze RSI, MACD, Stochastic, and MFI. Identify overbought/oversold conditions and momentum direction.

3. **Market Outlook**: Synthesize the signals to determine overall market bias (bullish/bearish/neutral) and key levels to watch.

Write in a professional, direct tone. Use specific indicator values in your analysis. Keep it concise but insightful.
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
        macd: context.indicators.macd?.toFixed(4) || 'N/A',
        adx: context.indicators.adx?.toFixed(2) || 'N/A',
        atr: context.indicators.atr?.toFixed(4) || 'N/A',
        mfi: context.indicators.mfi?.toFixed(2) || 'N/A',
        stochK: context.indicators.stochK?.toFixed(2) || 'N/A',
      });

      logger.info('AI market summary generated', { responseLength: response?.length || 0 });
      
      // Check if response is empty
      if (!response || response.trim().length === 0) {
        logger.warn('AI returned empty response, generating fallback summary');
        return this.generateFallbackSummary(context, bullishAlerts, bearishAlerts);
      }
      
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
- MACD: {macd}
- ADX: {adx}
- Stochastic %K: {stochK}
- MFI: {mfi}
- ATR: {atr}
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
        macd: context.indicators.macd?.toFixed(4) || 'N/A',
        adx: context.indicators.adx?.toFixed(2) || 'N/A',
        stochK: context.indicators.stochK?.toFixed(2) || 'N/A',
        mfi: context.indicators.mfi?.toFixed(2) || 'N/A',
        atr: context.indicators.atr?.toFixed(4) || 'N/A',
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
   * Determine market condition from indicators using multi-indicator confluence
   */
  determineMarketCondition(context: AIContext): 'bullish' | 'bearish' | 'neutral' {
    const { 
      ema9, ema21, rsi, macd, macdSignal, adx, 
      stochK, mfi, adxPlusDI, adxMinusDI 
    } = context.indicators;

    let bullishScore = 0;
    let bearishScore = 0;

    // Trend indicators
    if (ema9 && ema21) {
      if (ema9 > ema21) bullishScore += 2;
      else if (ema9 < ema21) bearishScore += 2;
    }

    // Momentum indicators
    if (rsi) {
      if (rsi < 40) bullishScore += 1; // Oversold = potential reversal up
      else if (rsi > 60) bearishScore += 1; // Overbought = potential reversal down
    }

    if (macd && macdSignal) {
      if (macd > macdSignal) bullishScore += 1;
      else if (macd < macdSignal) bearishScore += 1;
    }

    if (stochK) {
      if (stochK < 30) bullishScore += 1;
      else if (stochK > 70) bearishScore += 1;
    }

    // Volume/Money Flow
    if (mfi) {
      if (mfi < 30) bullishScore += 1;
      else if (mfi > 70) bearishScore += 1;
    }

    // Trend strength confirmation (ADX with directional indicators)
    if (adx && adx > 25) {
      // Strong trend - use directional indicators
      if (adxPlusDI && adxMinusDI) {
        if (adxPlusDI > adxMinusDI) bullishScore += 2;
        else if (adxMinusDI > adxPlusDI) bearishScore += 2;
      }
    }

    // Determine bias based on score
    const scoreDifference = bullishScore - bearishScore;
    
    if (scoreDifference >= 3) return 'bullish';
    if (scoreDifference <= -3) return 'bearish';
    return 'neutral';
  }

  /**
   * Generate fallback summary when AI fails
   */
  private generateFallbackSummary(
    context: AIContext, 
    bullishAlerts: number, 
    bearishAlerts: number
  ): string {
    const { symbol, timeframe, currentPrice, indicators, marketCondition } = context;
    
    // Trend Analysis
    let trendText = '';
    if (indicators.ema9 && indicators.ema21) {
      if (indicators.ema9 > indicators.ema21) {
        trendText = `**Trend Analysis**: ${symbol} on ${timeframe} shows a bullish trend with EMA9 (${indicators.ema9.toFixed(2)}) above EMA21 (${indicators.ema21.toFixed(2)}).`;
      } else {
        trendText = `**Trend Analysis**: ${symbol} on ${timeframe} shows a bearish trend with EMA9 (${indicators.ema9.toFixed(2)}) below EMA21 (${indicators.ema21.toFixed(2)}).`;
      }
    } else {
      trendText = `**Trend Analysis**: ${symbol} is trading at ${currentPrice} on ${timeframe} timeframe.`;
    }
    
    if (indicators.adx) {
      const strength = indicators.adx > 25 ? 'strong' : indicators.adx > 20 ? 'moderate' : 'weak';
      trendText += ` ADX at ${indicators.adx.toFixed(2)} indicates ${strength} trend strength.`;
    }
    
    // Momentum Analysis
    let momentumText = '**Momentum & Volume**: ';
    const momentumParts = [];
    
    if (indicators.rsi) {
      if (indicators.rsi > 70) {
        momentumParts.push(`RSI at ${indicators.rsi.toFixed(2)} signals overbought conditions`);
      } else if (indicators.rsi < 30) {
        momentumParts.push(`RSI at ${indicators.rsi.toFixed(2)} signals oversold conditions`);
      } else {
        momentumParts.push(`RSI at ${indicators.rsi.toFixed(2)} is in neutral territory`);
      }
    }
    
    if (indicators.mfi) {
      if (indicators.mfi > 80) {
        momentumParts.push(`MFI at ${indicators.mfi.toFixed(2)} shows strong buying pressure`);
      } else if (indicators.mfi < 20) {
        momentumParts.push(`MFI at ${indicators.mfi.toFixed(2)} shows strong selling pressure`);
      }
    }
    
    if (indicators.stochK) {
      if (indicators.stochK > 80) {
        momentumParts.push(`Stochastic at ${indicators.stochK.toFixed(2)} indicates overbought`);
      } else if (indicators.stochK < 20) {
        momentumParts.push(`Stochastic at ${indicators.stochK.toFixed(2)} indicates oversold`);
      }
    }
    
    momentumText += momentumParts.length > 0 ? momentumParts.join('. ') + '.' : 'Momentum indicators are in neutral range.';
    
    // Market Outlook
    let outlookText = '**Market Outlook**: ';
    const netSignals = bullishAlerts - bearishAlerts;
    
    if (netSignals > 2) {
      outlookText += `Overall market bias is BULLISH with ${bullishAlerts} bullish signals vs ${bearishAlerts} bearish signals. `;
    } else if (netSignals < -2) {
      outlookText += `Overall market bias is BEARISH with ${bearishAlerts} bearish signals vs ${bullishAlerts} bullish signals. `;
    } else {
      outlookText += `Market shows NEUTRAL bias with balanced signals (${bullishAlerts} bullish, ${bearishAlerts} bearish). `;
    }
    
    outlookText += `Market condition: ${marketCondition.toUpperCase()}.`;
    
    return `${trendText}\n\n${momentumText}\n\n${outlookText}`;
  }
}

// Singleton instance
export const aiService = new AIService();
