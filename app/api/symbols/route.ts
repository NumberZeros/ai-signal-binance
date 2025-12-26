/**
 * API Route: Get available trading symbols from Binance
 * GET /api/symbols - Get all or filtered symbols
 */

import { NextRequest, NextResponse } from 'next/server';
import { symbolManager } from '@/lib/binance/symbol-manager';
import { BinanceProductType } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'popular', 'usdt', 'btc', or search query
    const search = searchParams.get('search');
    const productType = (searchParams.get('productType') || 'SPOT') as BinanceProductType;

    let symbols;

    if (search) {
      // Search symbols
      symbols = await symbolManager.searchSymbols(search, productType);
    } else if (filter === 'popular') {
      // Get popular symbols
      const popularSymbols = await symbolManager.getPopularSymbols(productType);
      logger.info(`Returning ${popularSymbols.length} popular symbols for ${productType}: ${popularSymbols.slice(0, 5).join(', ')}`);
      symbols = popularSymbols;
    } else if (filter === 'usdt') {
      // Get USDT pairs
      symbols = await symbolManager.getUSDTPairs(productType);
    } else if (filter === 'btc') {
      // Get BTC pairs
      symbols = await symbolManager.getBTCPairs(productType);
    } else {
      // Get all symbols (default)
      symbols = await symbolManager.getAllSymbols(productType);
    }

    return NextResponse.json({
      symbols,
      count: Array.isArray(symbols) ? symbols.length : (typeof symbols === 'object' ? Object.keys(symbols).length : 0),
      filter: filter || 'all',
    });
  } catch (error: any) {
    logger.error('Failed to fetch symbols', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch symbols',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
