// Professional Trading Terminal Dashboard

'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { useCandles, useAlerts } from '@/lib/hooks/use-api';
import { useStream } from '@/lib/hooks/use-stream';
import { TradingChart } from '@/components/trading-chart';
import { ControlPanel } from '@/components/control-panel';
import { AlertList } from '@/components/alert-list';
import { AIPanel } from '@/components/ai-panel';
import { MarketTicker } from '@/components/market-ticker';
import { StatsCards } from '@/components/stats-cards';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const {
    selectedSymbol,
    selectedTimeframe,
    productType,
    chartConfig,
    selectedAlertId,
    setSelectedAlertId,
    setIsStreaming,
  } = useAppStore();

  const [streamEnabled, setStreamEnabled] = useState(false);

  // Fetch initial data
  const { data: candleData, isLoading: candlesLoading, error: candlesError } = useCandles(
    selectedSymbol,
    selectedTimeframe,
    productType
  );

  const { data: alertData, isLoading: alertsLoading } = useAlerts(
    selectedSymbol,
    selectedTimeframe,
    productType
  );

  // Start streaming after initial data loads
  const { isConnected } = useStream(
    selectedSymbol,
    selectedTimeframe,
    streamEnabled,
    productType
  );

  useEffect(() => {
    if (candleData && !streamEnabled) {
      setStreamEnabled(true);
    }
  }, [candleData, streamEnabled]);

  useEffect(() => {
    setIsStreaming(isConnected);
  }, [isConnected, setIsStreaming]);

  // Reset stream when symbol/timeframe/productType changes
  useEffect(() => {
    setStreamEnabled(false);
    setSelectedAlertId(null);
  }, [selectedSymbol, selectedTimeframe, productType, setSelectedAlertId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface">
      {/* Top Bar with Logo and Market Ticker */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-surface/80 border-b border-border/50 shadow-lg shadow-black/10"
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-warning flex items-center justify-center shadow-lg shadow-primary/20">
                <svg className="w-5 h-5 text-background" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">AI Signal Terminal</h1>
                <p className="text-xs text-muted-foreground">Powered by Binance API</p>
              </div>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface2/50 border border-border/50">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-success animate-pulse shadow-lg shadow-success/50' : 'bg-muted-foreground/40'
            }`} />
            <span className="text-xs font-medium text-foreground">
              {isConnected ? 'LIVE' : 'CONNECTING'}
            </span>
          </div>
        </div>
        
        {/* Market Ticker */}
        <MarketTicker />
      </motion.div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatsCards 
            symbol={selectedSymbol}
            timeframe={selectedTimeframe}
            candles={candleData?.candles || []}
            alerts={alertData?.alerts || []}
          />
        </motion.div>

        {/* Main Content Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl blur-2xl" />
              <div className="relative p-5 bg-surface/90 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl shadow-black/20">
                {candlesLoading && (
                  <div className="flex items-center justify-center h-[520px]">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-primary/20" />
                      <div>
                        <p className="text-lg font-bold text-foreground mb-1">Loading Market Data</p>
                        <p className="text-sm text-muted-foreground">{selectedSymbol} • {selectedTimeframe}</p>
                      </div>
                      <div className="w-64 max-w-[80vw] space-y-2 mx-auto">
                        <div className="h-2 rounded-full bg-gradient-to-r from-surface2 via-primary/20 to-surface2 animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}

                {candlesError && (
                  <div className="flex items-center justify-center h-[520px]">
                    <div className="text-center space-y-3 p-8 bg-danger/10 border border-danger/30 rounded-xl max-w-md">
                      <div className="w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-danger mb-1">Failed to Load Data</p>
                        <p className="text-sm text-muted-foreground">
                          {candlesError instanceof Error ? candlesError.message : 'Unknown error occurred'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {candleData && (
                  <TradingChart
                    candles={candleData.candles}
                    alerts={alertData?.alerts || []}
                    config={chartConfig}
                    onAlertClick={setSelectedAlertId}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Alerts Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent rounded-2xl blur-2xl" />
              <div className="relative p-5 bg-surface/90 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl shadow-black/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-foreground">Signals</h2>
                  </div>
                  {alertData && (
                    <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                      <span className="text-sm font-bold text-primary">{alertData.count}</span>
                    </div>
                  )}
                </div>

                {alertsLoading && (
                  <div className="text-center py-12">
                    <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                )}

                {alertData && (
                  <AlertList
                    alerts={alertData.alerts}
                    onAlertClick={setSelectedAlertId}
                  />
                )}
              </div>
            </motion.div>

            {/* AI Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent rounded-2xl blur-2xl" />
              <div className="relative p-5 bg-surface/90 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl shadow-black/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-foreground">AI Insights</h2>
                </div>
                <AIPanel />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
