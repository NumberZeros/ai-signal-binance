// Market ticker component - scrolling top gainers/losers

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
}

export function MarketTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickers() {
      try {
        // Fetch multiple 24hr tickers for popular pairs
        const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT'];
        const promises = symbols.map(async (symbol) => {
          try {
            const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
            const data = await res.json();
            return {
              symbol: data.symbol,
              price: parseFloat(data.lastPrice).toFixed(2),
              change: parseFloat(data.priceChange).toFixed(2),
              changePercent: parseFloat(data.priceChangePercent).toFixed(2),
            };
          } catch {
            return null;
          }
        });
        
        const results = await Promise.all(promises);
        setTickers(results.filter(Boolean) as TickerItem[]);
      } catch (error) {
        console.error('Failed to fetch tickers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTickers();
    const interval = setInterval(fetchTickers, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-2 overflow-hidden">
        <div className="flex gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="h-3 w-16 bg-surface2 rounded" />
              <div className="h-3 w-12 bg-surface2 rounded" />
              <div className="h-3 w-10 bg-surface2 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden px-4 py-2">
      <motion.div
        className="flex gap-8"
        animate={{
          x: [0, -1000],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 30,
            ease: 'linear',
          },
        }}
      >
        {[...tickers, ...tickers].map((ticker, idx) => {
          const isPositive = parseFloat(ticker.changePercent) >= 0;
          return (
            <div key={`${ticker.symbol}-${idx}`} className="flex items-center gap-3 whitespace-nowrap">
              <span className="text-sm font-semibold text-foreground">{ticker.symbol.replace('USDT', '')}</span>
              <span className="text-sm font-mono text-muted-foreground">${ticker.price}</span>
              <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                isPositive 
                  ? 'text-success bg-success/10' 
                  : 'text-danger bg-danger/10'
              }`}>
                {isPositive ? '+' : ''}{ticker.changePercent}%
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
