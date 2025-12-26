// External toolbar for chart controls - no overlays blocking chart view

'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Symbol, Timeframe, ChartType, BinanceProductType } from '@/lib/types';
import { useAppStore } from '@/lib/store/app-store';

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
const PRODUCT_TYPES: { value: BinanceProductType; label: string; color: string }[] = [
  { value: 'SPOT', label: 'SPOT', color: 'success' },
  { value: 'USD_M_FUTURES', label: 'FUTURES', color: 'warning' },
];

interface ChartToolbarProps {
  isLiveMode: boolean;
  onToggleLiveMode: () => void;
  onGoLive: () => void;
}

export function ChartToolbar({ isLiveMode, onToggleLiveMode, onGoLive }: ChartToolbarProps) {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSymbols, setFilteredSymbols] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSymbols, setLoadingSymbols] = useState(true);
  const symbolPickerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const symbolInputRef = useRef<HTMLInputElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number; width: number } | null>(null);

  function updateDropdownPosition() {
    const el = symbolInputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      left: rect.left,
      top: rect.bottom + 6,
      width: rect.width,
    });
  }

  useEffect(() => {
    function onDocumentPointerDown(event: PointerEvent) {
      const root = symbolPickerRef.current;
      const dd = dropdownRef.current;
      if (!root) return;
      const target = event.target as Node | null;
      const clickedInside = !!(target && (root.contains(target) || (dd ? dd.contains(target) : false)));
      if (!clickedInside) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('pointerdown', onDocumentPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown);
    };
  }, []);

  useEffect(() => {
    if (!showDropdown) return;
    updateDropdownPosition();

    const onAnyScroll = () => updateDropdownPosition();
    window.addEventListener('resize', onAnyScroll);
    // capture=true so we track scroll in any ancestor
    window.addEventListener('scroll', onAnyScroll, true);
    return () => {
      window.removeEventListener('resize', onAnyScroll);
      window.removeEventListener('scroll', onAnyScroll, true);
    };
  }, [showDropdown]);

  // Fetch popular symbols on mount and product type change
  useEffect(() => {
    async function fetchPopularSymbols() {
      setLoadingSymbols(true);
      try {
        const response = await fetch(`/api/symbols?filter=popular&productType=${productType}`);
        const data = await response.json();
        const symbolList = Array.isArray(data.symbols) ? data.symbols : [];
        setSymbols(symbolList);
        setFilteredSymbols(symbolList);
      } catch (error) {
        console.error('Failed to fetch symbols:', error);
        const fallback = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];
        setSymbols(fallback);
        setFilteredSymbols(fallback);
      } finally {
        setLoadingSymbols(false);
      }
    }
    fetchPopularSymbols();
    setSearchQuery(''); // Reset search when changing product type
  }, [productType]);

  // Search symbols when query changes
  useEffect(() => {
    async function searchSymbols() {
      if (!searchQuery.trim()) {
        setFilteredSymbols(symbols);
        return;
      }

      try {
        const response = await fetch(
          `/api/symbols?search=${encodeURIComponent(searchQuery)}&productType=${productType}`
        );
        const data = await response.json();
        const symbolList = Array.isArray(data.symbols)
          ? data.symbols.map((s: any) => (typeof s === 'string' ? s : s.symbol))
          : [];
        setFilteredSymbols(symbolList);
      } catch (error) {
        console.error('Failed to search symbols:', error);
        setFilteredSymbols(symbols);
      }
    }

    const timeoutId = setTimeout(searchSymbols, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery, symbols, productType]);

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-surface2/95 backdrop-blur-md border border-border/50 rounded-lg">
      {/* Left: Product + Symbol */}
      <div className="flex items-center gap-2">
        {/* Product Type Toggle */}
        <div className="flex items-center gap-1 p-1 bg-surface/50 border border-border/50 rounded-lg">
          {PRODUCT_TYPES.map((product) => (
            <button
              key={product.value}
              onClick={() => setProductType(product.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all duration-200 ${
                productType === product.value
                  ? 'text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={
                productType === product.value
                  ? { backgroundColor: `var(--${product.color})` }
                  : undefined
              }
            >
              {product.label}
            </button>
          ))}
        </div>

        {/* Symbol Search with Autocomplete */}
        <div className="relative" ref={symbolPickerRef}>
          <div className="relative">
            <input
              ref={symbolInputRef}
              type="text"
              value={searchQuery || selectedSymbol}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setShowDropdown(true);
                updateDropdownPosition();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onWheel={(e) => {
                e.stopPropagation();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowDropdown(false);
                  return;
                }
                if (e.key === 'Enter') {
                  const first = filteredSymbols[0];
                  if (first) {
                    setSymbol(first as Symbol);
                    setSearchQuery('');
                    setShowDropdown(false);
                  }
                }
              }}
              placeholder={loadingSymbols ? 'Loading...' : `Search ${productType} pairs...`}
              disabled={loadingSymbols}
              className="w-[200px] px-3 py-2 text-sm font-bold bg-surface/50 border border-border/50 rounded-lg text-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:border-primary/30"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilteredSymbols(symbols);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Portal Dropdown (prevents chart overlay/clipping) */}
      {showDropdown && filteredSymbols.length > 0 && dropdownPos && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={dropdownRef}
              style={{ left: dropdownPos.left, top: dropdownPos.top, width: dropdownPos.width }}
              className="fixed max-h-[420px] overflow-y-auto bg-surface border border-border/50 rounded-lg shadow-xl z-[9999]"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                {filteredSymbols.slice(0, 50).map((symbol) => (
                  <button
                    key={symbol}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSymbol(symbol as Symbol);
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-surface2 transition-colors ${
                      selectedSymbol === symbol ? 'bg-primary/10 text-primary font-bold' : 'text-foreground'
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
                {filteredSymbols.length > 50 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t border-border/30">
                    +{filteredSymbols.length - 50} more results (type to filter)
                  </div>
                )}
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Center: Timeframes */}
      <div className="flex items-center gap-1.5 p-1.5 bg-surface/50 border border-border/50 rounded-lg">
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

      {/* Right: Chart Type + Live Controls */}
      <div className="flex items-center gap-2">
        {/* Chart Type */}
        <select
          value={chartConfig.chartType}
          onChange={(e) => updateChartConfig({ chartType: e.target.value as ChartType })}
          className="px-3 py-2 text-xs font-bold bg-surface/50 border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 hover:border-primary/30 cursor-pointer appearance-none"
          style={{ paddingRight: '2rem', minWidth: '120px' }}
        >
          <option value="candlestick">🕯 Candles</option>
          <option value="bar">📊 Bars</option>
          <option value="line">📈 Line</option>
          <option value="area">🌊 Area</option>
          <option value="baseline">📏 Baseline</option>
        </select>

        {/* Live Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
            isLiveMode
              ? 'bg-success/10 border border-success/30'
              : 'bg-surface/50 border border-border/50'
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isLiveMode ? 'bg-success animate-pulse' : 'bg-muted-foreground/40'
            }`}
          />
          <span
            className={`text-xs font-bold ${
              isLiveMode ? 'text-success' : 'text-muted-foreground'
            }`}
          >
            {isLiveMode ? 'LIVE' : 'PAUSE'}
          </span>
        </div>

        {/* Pause/Resume Button */}
        <button
          onClick={onToggleLiveMode}
          className="p-1.5 rounded-lg bg-surface/50 border border-border/50 hover:border-primary/50 hover:bg-surface2 transition-all duration-200 group"
          title={isLiveMode ? 'Pause Live Updates' : 'Resume Live Updates'}
        >
          {isLiveMode ? (
            <svg
              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-warning"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg
              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-success"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Go Live Button */}
        {!isLiveMode && (
          <button
            onClick={onGoLive}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-all duration-200 group"
          >
            <svg
              className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <span className="text-xs font-bold text-primary">Go Live</span>
          </button>
        )}
      </div>
    </div>
  );
}
