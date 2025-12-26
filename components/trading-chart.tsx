// TradingView Lightweight Charts component

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart, 
  IChartApi, 
  CandlestickData, 
  LineData,
  UTCTimestamp,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  AreaSeries,
  BaselineSeries,
} from 'lightweight-charts';
import type { ISeriesApi } from 'lightweight-charts';
import { CandleWithIndicators, Alert, ChartConfig } from '@/lib/types';
import { ChartToolbar } from './chart-toolbar';
import { useAppStore } from '@/lib/store/app-store';

interface ChartProps {
  candles: CandleWithIndicators[];
  alerts: Alert[];
  config: ChartConfig;
  onAlertClick?: (alertId: string) => void;
}

export function TradingChart({ candles, alerts, config, onAlertClick }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null); // For non-candlestick charts
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const datasetFirstTimestampRef = useRef<number | null>(null);
  const lastCandleCountRef = useRef(0);
  const lastIndicatorCandleCountRef = useRef(0);
  const lastIndicatorTimestampRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipData, setTooltipData] = useState<{
    time: string;
    open?: number;
    high?: number;
    low?: number;
    close: number;
    volume?: number;
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const hasMoreHistoryRef = useRef(true);
  
  const { selectedSymbol, selectedTimeframe } = useAppStore();

  // Load more historical candles
  const loadMoreHistory = async () => {
    if (!candles.length || !mainSeriesRef.current || !hasMoreHistoryRef.current || isLoadingHistory) return;
    
    setIsLoadingHistory(true);
    
    const oldestCandle = candles[0];
    const endTime = oldestCandle.timestamp - 1; // Get candles before the oldest one
    
    try {
      const response = await fetch(
        `/api/candles?symbol=${selectedSymbol}&timeframe=${selectedTimeframe}&limit=100&endTime=${endTime}`
      );
      
      if (!response.ok) {
        hasMoreHistoryRef.current = false;
        setIsLoadingHistory(false);
        return;
      }
      
      const data = await response.json();
      const newCandles = data.candles || [];
      
      if (newCandles.length === 0) {
        hasMoreHistoryRef.current = false;
        setIsLoadingHistory(false);
        return;
      }
      
      // Merge new historical candles with existing ones
      const updatedCandles = [...newCandles, ...candles];
      
      // Update chart with all candles
      const isCandlestickType = config.chartType === 'candlestick' || config.chartType === 'bar';
      
      if (isCandlestickType) {
        const candleData: CandlestickData[] = updatedCandles.map(toCandleData);
        mainSeriesRef.current.setData(candleData);
      } else {
        const lineData: LineData[] = updatedCandles.map(toLineData);
        mainSeriesRef.current.setData(lineData);
      }
      
      // Update volume
      const rootStyles = getComputedStyle(document.documentElement);
      const success = rootStyles.getPropertyValue('--success').trim() || '#22c55e';
      const danger = rootStyles.getPropertyValue('--danger').trim() || '#ef4444';
      const volumeData = updatedCandles.map((c: CandleWithIndicators) => toVolumeBar(c, success, danger));
      volumeSeriesRef.current?.setData(volumeData);
      
      // Update candles array for future loads
      candles.unshift(...newCandles);
      
      setIsLoadingHistory(false);
    } catch (error) {
      console.error('Failed to load more history:', error);
      hasMoreHistoryRef.current = false;
      setIsLoadingHistory(false);
    }
  };

  const withAlpha = (color: string, alpha: number) => {
    const raw = color.trim();
    if (!raw.startsWith('#')) return raw;
    const hex = raw.slice(1);
    const isShort = hex.length === 3;
    const isLong = hex.length === 6;
    if (!isShort && !isLong) return raw;

    const expanded = isShort
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;

    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return raw;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!mounted || !chartContainerRef.current) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const background = rootStyles.getPropertyValue('--background').trim() || '#0a0a0a';
    const foreground = rootStyles.getPropertyValue('--foreground').trim() || '#ededed';
    const border = rootStyles.getPropertyValue('--border').trim() || '#1e222d';
    const surface2 = rootStyles.getPropertyValue('--surface2').trim() || '#1e2329';
    const mutedForeground = rootStyles.getPropertyValue('--muted-foreground').trim() || '#9aa4b2';
    const success = rootStyles.getPropertyValue('--success').trim() || '#22c55e';
    const danger = rootStyles.getPropertyValue('--danger').trim() || '#ef4444';
    const primary = rootStyles.getPropertyValue('--primary').trim() || '#f0b90b';

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
        background: { color: background },
        textColor: foreground,
      },
      grid: {
        vertLines: { 
          color: withAlpha(border, 0.15),
          visible: config.showGrid,
        },
        horzLines: { 
          color: withAlpha(border, 0.15),
          visible: config.showGrid,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: 520,
      rightPriceScale: {
        borderColor: withAlpha(border, 0.8),
        visible: config.showPriceScale,
        scaleMargins: {
          top: 0.15,
          bottom: 0.15,
        },
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: withAlpha(border, 0.8),
        visible: config.showTimeScale,
        rightOffset: 2,
        barSpacing: 7,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
      },
      crosshair: {
        mode: config.showCrosshair ? 1 : 0, // 1 = Normal, 0 = Hidden
        vertLine: {
          color: withAlpha(mutedForeground, 0.35),
          width: 1,
          style: 3,
          labelBackgroundColor: surface2,
        },
        horzLine: {
          color: withAlpha(mutedForeground, 0.35),
          width: 1,
          style: 3,
          labelBackgroundColor: surface2,
        },
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
    });

    chartRef.current = chart;

    // Create main price series based on chart type
    if (config.chartType === 'candlestick' || config.chartType === 'bar') {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: success,
        downColor: danger,
        wickVisible: config.chartType === 'candlestick',
        borderVisible: true,
        borderUpColor: success,
        borderDownColor: danger,
        wickUpColor: success,
        wickDownColor: danger,
        priceLineVisible: true,
      });
      candlestickSeriesRef.current = series;
      mainSeriesRef.current = series;
    } else if (config.chartType === 'line') {
      const series = chart.addSeries(LineSeries, {
        color: primary,
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
      mainSeriesRef.current = series;
    } else if (config.chartType === 'area') {
      const series = chart.addSeries(AreaSeries, {
        topColor: withAlpha(primary, 0.4),
        bottomColor: withAlpha(primary, 0.0),
        lineColor: primary,
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
      mainSeriesRef.current = series;
    } else if (config.chartType === 'baseline') {
      // Baseline chart - price above/below a baseline (use first candle close price)
      const baselinePrice = candles.length > 0 ? candles[0].close : 0;
      const series = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: baselinePrice },
        topLineColor: success,
        topFillColor1: withAlpha(success, 0.28),
        topFillColor2: withAlpha(success, 0.05),
        bottomLineColor: danger,
        bottomFillColor1: withAlpha(danger, 0.05),
        bottomFillColor2: withAlpha(danger, 0.28),
        priceLineVisible: true,
        lastValueVisible: true,
      });
      mainSeriesRef.current = series;
    }

    // Add tooltip crosshair subscriber
    if (config.showTooltip && mainSeriesRef.current) {
      chart.subscribeCrosshairMove((param) => {
        if (!param.time || !param.seriesData || !mainSeriesRef.current) {
          setTooltipData(null);
          return;
        }

        const data = param.seriesData.get(mainSeriesRef.current) as any;
        if (data) {
          const time = new Date((param.time as number) * 1000).toLocaleString();
          
          if ('open' in data) {
            // Candlestick/Bar data
            setTooltipData({
              time,
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
              volume: candles.find(c => Math.floor(c.timestamp / 1000) === param.time)?.volume,
            });
          } else if ('value' in data) {
            // Line/Area/Baseline data
            setTooltipData({
              time,
              close: data.value,
              volume: candles.find(c => Math.floor(c.timestamp / 1000) === param.time)?.volume,
            });
          }
        }
      });
    }

    // Volume series - using v5 API
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: success,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // Reset dataset tracking for this chart instance
    datasetFirstTimestampRef.current = null;
    lastCandleCountRef.current = 0;
    lastIndicatorCandleCountRef.current = 0;
    lastIndicatorTimestampRef.current = null;
    hasMoreHistoryRef.current = true;

    // Subscribe to visible logical range changes for infinite scroll
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      const logicalRange = chart.timeScale().getVisibleLogicalRange();
      if (!logicalRange || isLoadingHistory || !hasMoreHistoryRef.current) return;
      
      // Check if user scrolled near the left edge (first ~20 candles visible)
      if (logicalRange.from < 20) {
        // Load more history
        loadMoreHistory();
      }
    });

    return () => {
      chart.remove();
    };
  }, [mounted, config.chartType, config.showGrid, config.showPriceScale, config.showTimeScale, config.showCrosshair, config.showTooltip]);

  // Keep volume visibility in sync (avoid wiping data)
  useEffect(() => {
    if (!mounted || !volumeSeriesRef.current) return;
    volumeSeriesRef.current.applyOptions({ visible: config.showVolume });
  }, [mounted, config.showVolume]);

  const toCandleData = (c: CandleWithIndicators): CandlestickData => ({
    time: Math.floor(c.timestamp / 1000) as UTCTimestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  });

  const toLineData = (c: CandleWithIndicators): LineData => ({
    time: Math.floor(c.timestamp / 1000) as UTCTimestamp,
    value: c.close,
  });

  const toVolumeBar = (c: CandleWithIndicators, success: string, danger: string) => ({
    time: Math.floor(c.timestamp / 1000) as UTCTimestamp,
    value: c.volume,
    color: c.close >= c.open ? withAlpha(success, 0.25) : withAlpha(danger, 0.25),
  });

  // Update candle data (incrementally for live streaming)
  useEffect(() => {
    if (!mounted || !mainSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) {
      return;
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const success = rootStyles.getPropertyValue('--success').trim() || '#22c55e';
    const danger = rootStyles.getPropertyValue('--danger').trim() || '#ef4444';

    const firstTimestamp = candles[0].timestamp;
    const isNewDataset = datasetFirstTimestampRef.current !== firstTimestamp;
    const prevCount = lastCandleCountRef.current;

    if (isNewDataset || prevCount === 0 || candles.length < prevCount) {
      // Initial load or symbol/timeframe change
      const isCandlestickType = config.chartType === 'candlestick' || config.chartType === 'bar';
      
      if (isCandlestickType) {
        const candleData: CandlestickData[] = candles.map(toCandleData);
        mainSeriesRef.current.setData(candleData);
      } else {
        // Line, Area, Baseline - use close price
        const lineData: LineData[] = candles.map(toLineData);
        mainSeriesRef.current.setData(lineData);
      }
      
      const volumeData = candles.map((c) => toVolumeBar(c, success, danger));
      volumeSeriesRef.current.setData(volumeData);
      chartRef.current?.timeScale().fitContent();

      datasetFirstTimestampRef.current = firstTimestamp;
      lastCandleCountRef.current = candles.length;
      
      // Update last price for live indicator
      setLastPrice(candles[candles.length - 1].close);
      return;
    }

    // Live updates: check if new candle or updating existing one
    const latest = candles[candles.length - 1];
    const isCandlestickType = config.chartType === 'candlestick' || config.chartType === 'bar';
    const hasNewCandle = candles.length > prevCount;
    
    if (hasNewCandle) {
      // New candle arrived - use setData to refresh entire dataset
      if (isCandlestickType) {
        const candleData: CandlestickData[] = candles.map(toCandleData);
        mainSeriesRef.current.setData(candleData);
      } else {
        const lineData: LineData[] = candles.map(toLineData);
        mainSeriesRef.current.setData(lineData);
      }
      const volumeData = candles.map((c) => toVolumeBar(c, success, danger));
      volumeSeriesRef.current.setData(volumeData);
    } else {
      // Same candle, just update values
      if (isCandlestickType) {
        mainSeriesRef.current.update(toCandleData(latest));
      } else {
        mainSeriesRef.current.update(toLineData(latest));
      }
      volumeSeriesRef.current.update(toVolumeBar(latest, success, danger));
    }
    
    // Update last price
    setLastPrice(latest.close);

    // Keep chart pinned to real-time while streaming (only in live mode)
    if (isLiveMode && chartRef.current) {
      // Scroll to the rightmost position (latest candle)
      chartRef.current.timeScale().scrollToPosition(3, false);
    }

    lastCandleCountRef.current = candles.length;
  }, [mounted, candles, isLiveMode, config.chartType]);

  // Create/remove indicator series only when toggles change (not on every tick)
  useEffect(() => {
    if (!mounted || !chartRef.current) return;

    const chart = chartRef.current;
    const seriesMap = indicatorSeriesRef.current;
    const rootStyles = getComputedStyle(document.documentElement);
    const primary = rootStyles.getPropertyValue('--primary').trim() || '#f0b90b';
    const warning = rootStyles.getPropertyValue('--warning').trim() || '#f59e0b';
    const mutedForeground = rootStyles.getPropertyValue('--muted-foreground').trim() || '#9aa4b2';
    const success = rootStyles.getPropertyValue('--success').trim() || '#22c55e';

    const ensure = (key: string, enabled: boolean, create: () => any) => {
      const existing = seriesMap.get(key);
      if (enabled && !existing) {
        seriesMap.set(key, create());
      }
      if (!enabled && existing) {
        chart.removeSeries(existing);
        seriesMap.delete(key);
      }
    };

    ensure('ema9', config.showEMA9, () =>
      chart.addSeries(LineSeries, { color: primary, lineWidth: 2 })
    );
    ensure('ema21', config.showEMA21, () =>
      chart.addSeries(LineSeries, { color: warning, lineWidth: 2 })
    );
    ensure('ema50', config.showEMA50, () =>
      chart.addSeries(LineSeries, { color: withAlpha(mutedForeground, 0.9), lineWidth: 2 })
    );
    ensure('sma20', config.showSMA20, () =>
      chart.addSeries(LineSeries, { color: withAlpha(success, 0.9), lineWidth: 2, lineStyle: 2 })
    );
  }, [mounted, config.showEMA9, config.showEMA21, config.showEMA50, config.showSMA20]);

  // Update indicator data efficiently for live streaming
  useEffect(() => {
    if (!mounted || !chartRef.current || candles.length === 0) return;

    const seriesMap = indicatorSeriesRef.current;
    if (seriesMap.size === 0) return;

    const firstTimestamp = candles[0].timestamp;
    const latestCandle = candles[candles.length - 1];
    const latestTimestamp = latestCandle.timestamp;
    const isNewDataset = datasetFirstTimestampRef.current !== firstTimestamp;
    
    // Use separate refs to avoid race condition with main candles useEffect
    const prevIndicatorCount = lastIndicatorCandleCountRef.current;
    const prevIndicatorTimestamp = lastIndicatorTimestampRef.current;
    const hasNewCandle = candles.length > prevIndicatorCount || 
                         (prevIndicatorTimestamp !== null && latestTimestamp > prevIndicatorTimestamp);

    const setFull = (key: string, selector: (c: CandleWithIndicators) => number | undefined) => {
      const series = seriesMap.get(key);
      if (!series) return;
      const data: LineData[] = candles
        .filter((c) => selector(c) !== undefined)
        .map((c) => ({
          time: Math.floor(c.timestamp / 1000) as UTCTimestamp,
          value: selector(c)!,
        }));
      series.setData(data);
    };

    // Always use setData for new datasets or new candles to avoid timestamp conflicts
    if (isNewDataset || hasNewCandle || prevIndicatorCount === 0) {
      setFull('ema9', (c) => c.indicators.ema9);
      setFull('ema21', (c) => c.indicators.ema21);
      setFull('ema50', (c) => c.indicators.ema50);
      setFull('sma20', (c) => c.indicators.sma20);
      
      // Update tracking refs
      lastIndicatorCandleCountRef.current = candles.length;
      lastIndicatorTimestampRef.current = latestTimestamp;
      return;
    }

    // Only use update when we're updating the same candle (same timestamp and count)
    if (latestTimestamp === prevIndicatorTimestamp) {
      const latestIndicators = latestCandle.indicators;
      
      // Use setData for each indicator to be safe
      setFull('ema9', (c) => c.indicators.ema9);
      setFull('ema21', (c) => c.indicators.ema21);
      setFull('ema50', (c) => c.indicators.ema50);
      setFull('sma20', (c) => c.indicators.sma20);
    }
    
    // Update tracking refs
    lastIndicatorCandleCountRef.current = candles.length;
    lastIndicatorTimestampRef.current = latestTimestamp;
  }, [mounted, candles]);

  // Add alert markers
  useEffect(() => {
    if (!mounted || !candlestickSeriesRef.current || !config.showAlerts || alerts.length === 0) {
      return;
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const success = rootStyles.getPropertyValue('--success').trim() || '#22c55e';
    const danger = rootStyles.getPropertyValue('--danger').trim() || '#ef4444';
    const warning = rootStyles.getPropertyValue('--warning').trim() || '#f59e0b';

    const markers = alerts.map((alert) => ({
      time: Math.floor(alert.timestamp / 1000) as UTCTimestamp,
      position: alert.type.includes('BULLISH') || alert.type.includes('OVERSOLD') || alert.type.includes('HIGH')
        ? ('belowBar' as const)
        : ('aboveBar' as const),
      color: alert.type.includes('BULLISH') || alert.type.includes('OVERSOLD')
        ? success
        : alert.type.includes('BEARISH') || alert.type.includes('OVERBOUGHT')
        ? danger
        : warning,
      shape: alert.type.includes('CROSSOVER')
        ? ('arrowUp' as const)
        : alert.type.includes('BREAKOUT')
        ? ('circle' as const)
        : ('square' as const),
      text: alert.metadata.description.substring(0, 20),
      size: 1,
    }));

    // Markers are not directly supported in v5, skip for now
    // candlestickSeriesRef.current.setMarkers(markers);
  }, [mounted, alerts, config.showAlerts]);

  // Don't render until mounted on client
  if (!mounted) {
    return (
      <div className="w-full h-full">
        <div className="w-full h-[520px] flex items-center justify-center bg-surface border border-border rounded-lg text-muted-foreground">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-sm">Loading chart...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col gap-3">
      {/* External Toolbar - All Controls */}
      <ChartToolbar 
        isLiveMode={isLiveMode}
        onToggleLiveMode={() => setIsLiveMode(!isLiveMode)}
        onGoLive={() => {
          chartRef.current?.timeScale().scrollToRealTime();
          setIsLiveMode(true);
        }}
      />

      {/* Chart Container - Clean, no overlays */}
      <div className="relative w-full flex-1">
        <div ref={chartContainerRef} className="w-full h-[520px]" />
      
        {/* Magnifier Tooltip */}
      {config.showTooltip && tooltipData && (
        <div
          ref={tooltipRef}
          className="absolute bottom-3 left-3 p-3 rounded-lg backdrop-blur-md bg-surface2/95 border border-border/50 shadow-2xl z-20 min-w-[240px]"
        >
          <div className="space-y-1.5">
            {/* Time */}
            <div className="text-xs font-semibold text-muted-foreground border-b border-border/30 pb-1.5">
              {tooltipData.time}
            </div>
            
            {/* OHLC Data */}
            {tooltipData.open !== undefined ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open:</span>
                  <span className="font-mono font-bold text-foreground">{tooltipData.open.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High:</span>
                  <span className="font-mono font-bold text-success">{tooltipData.high?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low:</span>
                  <span className="font-mono font-bold text-danger">{tooltipData.low?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Close:</span>
                  <span className="font-mono font-bold text-foreground">{tooltipData.close.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-mono font-bold text-primary">{tooltipData.close.toFixed(2)}</span>
              </div>
            )}
            
            {/* Volume */}
            {tooltipData.volume !== undefined && (
              <div className="flex justify-between text-xs pt-1.5 border-t border-border/30">
                <span className="text-muted-foreground">Volume:</span>
                <span className="font-mono font-bold text-foreground">
                  {tooltipData.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            
            {/* Change % */}
            {tooltipData.open !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Change:</span>
                <span className={`font-mono font-bold ${
                  tooltipData.close >= tooltipData.open ? 'text-success' : 'text-danger'
                }`}>
                  {((tooltipData.close - tooltipData.open) / tooltipData.open * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Loading History Indicator */}
      {isLoadingHistory && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-lg backdrop-blur-md bg-surface2/95 border border-border/50 shadow-lg flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs font-medium text-muted-foreground">Loading history...</span>
        </div>
      )}
      </div>
    </div>
  );
}
