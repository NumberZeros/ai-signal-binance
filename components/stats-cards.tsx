// Stats cards component - Market overview stats

'use client';

import { motion } from 'framer-motion';
import type { CandleWithIndicators, Alert } from '@/lib/types';

interface StatsCardsProps {
  symbol: string;
  timeframe: string;
  candles: CandleWithIndicators[];
  alerts: Alert[];
}

export function StatsCards({ symbol, timeframe, candles, alerts }: StatsCardsProps) {
  if (candles.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 bg-surface/50 border border-border/30 rounded-xl animate-pulse">
            <div className="h-4 bg-surface2 rounded mb-2" />
            <div className="h-6 bg-surface2 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  const latest = candles[candles.length - 1];
  const first = candles[0];
  const priceChange = latest.close - first.open;
  const priceChangePercent = ((priceChange / first.open) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  const high24h = Math.max(...candles.map(c => c.high));
  const low24h = Math.min(...candles.map(c => c.low));
  const volume24h = candles.reduce((sum, c) => sum + c.volume, 0);
  
  const bullishAlerts = alerts.filter(a => 
    a.type.includes('BULLISH') || a.type.includes('OVERSOLD')
  ).length;
  
  const bearishAlerts = alerts.filter(a => 
    a.type.includes('BEARISH') || a.type.includes('OVERBOUGHT')
  ).length;

  const stats = [
    {
      label: 'Price',
      value: `$${latest.close.toLocaleString()}`,
      change: `${isPositive ? '+' : ''}${priceChangePercent}%`,
      isPositive,
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    },
    {
      label: '24h High/Low',
      value: `$${high24h.toLocaleString()}`,
      change: `$${low24h.toLocaleString()}`,
      isPositive: true,
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      label: 'Volume',
      value: volume24h > 1000000 
        ? `${(volume24h / 1000000).toFixed(2)}M` 
        : `${(volume24h / 1000).toFixed(2)}K`,
      change: `${candles.length} candles`,
      isPositive: true,
      icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
    },
    {
      label: 'Signals',
      value: `${alerts.length}`,
      change: `🟢 ${bullishAlerts} | 🔴 ${bearishAlerts}`,
      isPositive: bullishAlerts > bearishAlerts,
      icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative p-4 bg-surface/80 backdrop-blur-sm border border-border/50 rounded-xl hover:border-primary/30 transition-all duration-300 shadow-lg shadow-black/10">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
              <div className="text-muted-foreground/50 group-hover:text-primary/50 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
              <div className={`text-xs font-semibold ${
                stat.isPositive ? 'text-success' : 'text-danger'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
