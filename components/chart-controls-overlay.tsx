// Compact trading controls overlay for chart

'use client';

import { useEffect, useState } from 'react';
import { Symbol, Timeframe, ChartType, BinanceProductType } from '@/lib/types';
import { useAppStore } from '@/lib/store/app-store';

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
const PRODUCT_TYPES: { value: BinanceProductType; label: string; color: string }[] = [
  { value: 'SPOT', label: 'SPOT', color: 'success' },
  { value: 'USD_M_FUTURES', label: 'FUTURES', color: 'warning' },
];

export function ChartControlsOverlay() {
  const {
    selectedSymbol,
    selectedTimeframe,
    productType,
    chartConfig,
    setSymbol,
    setTimeframe,
    setProductType,
    updateChartConfig,
  } = useAppStore();

  const [symbols, setSymbols] = useState<string[]>([]);
  const [loadingSymbols, setLoadingSymbols] = useState(true);

  useEffect(() => {
    async function fetchSymbols() {
      setLoadingSymbols(true);
      try {
        const response = await fetch(`/api/symbols?filter=popular&productType=${productType}`);
        const data = await response.json();
        setSymbols(data.symbols || []);
      } catch (error) {
        console.error('Failed to fetch symbols:', error);
        setSymbols(['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT']);
      } finally {
        setLoadingSymbols(false);
      }
    }
    fetchSymbols();
  }, [productType]);

  const currentProductConfig = PRODUCT_TYPES.find(p => p.value === productType) || PRODUCT_TYPES[0];

  return (
    <>
      {/* Top Left: Symbol + Timeframes */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        {/* Symbol Selection */}
        <select
          value={selectedSymbol}
          onChange={(e) => setSymbol(e.target.value as Symbol)}
          disabled={loadingSymbols}
          className="px-3 py-2 text-sm font-bold bg-surface2/95 backdrop-blur-md border border-border/50 rounded-lg text-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:border-primary/30 cursor-pointer shadow-lg appearance-none"
          style={{ minWidth: '140px' }}
        >
          {loadingSymbols ? (
            <option>Loading...</option>
          ) : (
            symbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))
          )}
        </select>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 bg-surface2/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all duration-200 ${
                selectedTimeframe === tf
                  ? 'bg-primary text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface2'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Top Right: Chart Type */}
      <div className="absolute top-3 right-3 z-20">
        <select
          value={chartConfig.chartType}
          onChange={(e) => updateChartConfig({ chartType: e.target.value as ChartType })}
          className="px-3 py-2 text-xs font-bold bg-surface2/95 backdrop-blur-md border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 hover:border-primary/30 cursor-pointer shadow-lg appearance-none"
          style={{ paddingRight: '2rem', minWidth: '130px' }}
        >
          <option value="candlestick">🕯 Candles</option>
          <option value="bar">📊 Bars</option>
          <option value="line">📈 Line</option>
          <option value="area">🌊 Area</option>
          <option value="baseline">📏 Baseline</option>
        </select>
      </div>

      {/* Bottom Left: Product Type Toggle */}
      <div className="absolute bottom-3 left-3 z-20">
        <div className="flex items-center gap-1 p-1 bg-surface2/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg">
          {PRODUCT_TYPES.map((product) => (
            <button
              key={product.value}
              onClick={() => setProductType(product.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all duration-200 ${
                productType === product.value
                  ? `bg-${product.color} text-background`
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={
                productType === product.value
                  ? {
                      backgroundColor: `var(--${product.color})`,
                    }
                  : undefined
              }
            >
              {product.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
