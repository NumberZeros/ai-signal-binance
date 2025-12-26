// Professional trading control panel with advanced UI

'use client';

import { useEffect, useState } from 'react';
import { Symbol, Timeframe } from '@/lib/types';
import { useAppStore } from '@/lib/store/app-store';
import { motion } from 'framer-motion';

const TIMEFRAMES: Timeframe[] = [
  '1s', '1m', '3m', '5m', '15m', '30m',
  '1h', '2h', '4h', '6h', '8h', '12h',
  '1d', '3d', '1w', '1M',
];

export function ControlPanel() {
  const {
    selectedSymbol,
    selectedTimeframe,
    chartConfig,
    isStreaming,
    setSymbol,
    setTimeframe,
    updateChartConfig,
  } = useAppStore();

  const [symbols, setSymbols] = useState<string[]>([]);
  const [loadingSymbols, setLoadingSymbols] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    async function fetchSymbols() {
      try {
        const response = await fetch('/api/symbols?filter=popular');
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
  }, []);

  const quickTimeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-warning/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
      
      <div className="relative p-6 bg-surface/90 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl shadow-black/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-primary to-warning rounded-full shadow-lg shadow-primary/30" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Trading Controls</h2>
              <p className="text-xs text-muted-foreground">Configure your analysis parameters</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface2/50 text-muted-foreground hover:bg-surface2 hover:text-foreground border border-border/30 transition-all duration-200"
          >
            {showAdvanced ? 'Basic' : 'Advanced'}
          </button>
        </div>

        {/* Main Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Chart Type Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Chart Type
            </label>
            <div className="relative">
              <select
                value={chartConfig.chartType}
                onChange={(e) => updateChartConfig({ chartType: e.target.value as any })}
                className="w-full px-4 py-3 pl-10 bg-gradient-to-r from-surface2/80 to-surface2/60 backdrop-blur-sm border border-border/50 rounded-xl text-sm font-bold text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-primary/30 appearance-none cursor-pointer shadow-inner"
              >
                <option value="candlestick">Candlestick</option>
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="area">Area</option>
                <option value="baseline">Baseline</option>
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-success to-primary flex items-center justify-center text-xs">
                  📊
                </div>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Symbol Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Trading Pair
            </label>
            <div className="relative">
              <select
                value={selectedSymbol}
                onChange={(e) => setSymbol(e.target.value as Symbol)}
                disabled={loadingSymbols}
                className="w-full px-4 py-3 pl-10 bg-gradient-to-r from-surface2/80 to-surface2/60 backdrop-blur-sm border border-border/50 rounded-xl text-sm font-bold text-foreground disabled:opacity-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-primary/30 appearance-none cursor-pointer shadow-inner"
              >
                {loadingSymbols ? (
                  <option>Loading symbols...</option>
                ) : (
                  symbols.map((symbol) => (
                    <option key={symbol} value={symbol}>
                      {symbol}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-warning flex items-center justify-center text-xs font-bold text-background">
                  $
                </div>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Timeframe Dropdown */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timeframe
            </label>
            <div className="relative">
              <select
                value={selectedTimeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className="w-full px-4 py-3 pl-10 bg-gradient-to-r from-surface2/80 to-surface2/60 backdrop-blur-sm border border-border/50 rounded-xl text-sm font-bold text-foreground disabled:opacity-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-primary/30 appearance-none cursor-pointer shadow-inner"
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-success to-warning flex items-center justify-center text-[10px] font-bold text-background">
                  ⏱
                </div>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Timeframe Selector */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Quick Select
          </label>
          <div className="flex flex-wrap gap-2">
            {quickTimeframes.map((tf) => (
              <motion.button
                key={tf}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeframe(tf as Timeframe)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 shadow-md ${
                  selectedTimeframe === tf
                    ? 'bg-gradient-to-r from-primary to-warning text-background shadow-lg shadow-primary/30 ring-2 ring-primary/50'
                    : 'bg-surface2/50 text-muted-foreground hover:bg-surface2 hover:text-foreground hover:shadow-lg border border-border/30 hover:border-primary/30'
                }`}
              >
                {tf}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Indicators Panel */}
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-6 border-t border-border/30"
          >
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Technical Indicators
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'showEMA9', label: 'EMA 9', color: 'from-blue-500 to-blue-600' },
                { key: 'showEMA21', label: 'EMA 21', color: 'from-purple-500 to-purple-600' },
                { key: 'showEMA50', label: 'EMA 50', color: 'from-pink-500 to-pink-600' },
                { key: 'showSMA20', label: 'SMA 20', color: 'from-green-500 to-green-600' },
                { key: 'showRSI', label: 'RSI', color: 'from-orange-500 to-orange-600' },
                { key: 'showVolume', label: 'Volume', color: 'from-cyan-500 to-cyan-600' },
                { key: 'showMACD', label: 'MACD', color: 'from-yellow-500 to-yellow-600' },
                { key: 'showBollinger', label: 'Bollinger', color: 'from-red-500 to-red-600' },
                { key: 'showAlerts', label: 'Alerts', color: 'from-primary to-warning' },
              ].map((indicator) => (
                <label
                  key={indicator.key}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface2/30 border border-border/30 hover:bg-surface2/50 hover:border-primary/20 transition-all duration-200 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={chartConfig[indicator.key as keyof typeof chartConfig] as boolean}
                    onChange={(e) =>
                      updateChartConfig({ [indicator.key]: e.target.checked })
                    }
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${indicator.color} shadow-md`} />
                    <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground">
                      {indicator.label}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {/* Chart Display Options */}
            <div className="mt-6 pt-6 border-t border-border/30">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                Display Options
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'showTooltip', label: 'Tooltip', icon: '🔍' },
                  { key: 'showCrosshair', label: 'Crosshair', icon: '➕' },
                  { key: 'showGrid', label: 'Grid', icon: '#️⃣' },
                  { key: 'showPriceScale', label: 'Price Scale', icon: '💰' },
                  { key: 'showTimeScale', label: 'Time Scale', icon: '⏰' },
                  { key: 'showLegend', label: 'Legend', icon: '📋' },
                ].map((option) => (
                  <label
                    key={option.key}
                    className="flex items-center gap-3 p-3 rounded-lg bg-surface2/30 border border-border/30 hover:bg-surface2/50 hover:border-primary/20 transition-all duration-200 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={chartConfig[option.key as keyof typeof chartConfig] as boolean}
                      onChange={(e) =>
                        updateChartConfig({ [option.key]: e.target.checked })
                      }
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-base">{option.icon}</span>
                      <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground">
                        {option.label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
