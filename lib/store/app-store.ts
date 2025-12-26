// Zustand store for app state management

import { create } from 'zustand';
import { Symbol, Timeframe, ChartConfig, BinanceProductType } from '@/lib/types';
import { DEFAULT_CHART_CONFIG } from '@/lib/config/constants';

interface AppState {
  // Market selection
  selectedSymbol: Symbol;
  selectedTimeframe: Timeframe;
  productType: BinanceProductType;
  
  // Chart configuration
  chartConfig: ChartConfig;
  
  // UI state
  isStreaming: boolean;
  selectedAlertId: string | null;
  showAIPanel: boolean;
  
  // Actions
  setSymbol: (symbol: Symbol) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  setProductType: (productType: BinanceProductType) => void;
  updateChartConfig: (config: Partial<ChartConfig>) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setSelectedAlertId: (alertId: string | null) => void;
  setShowAIPanel: (show: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  selectedSymbol: 'BTCUSDT',
  selectedTimeframe: '15m',
  productType: 'SPOT',
  chartConfig: DEFAULT_CHART_CONFIG,
  isStreaming: false,
  selectedAlertId: null,
  showAIPanel: false,

  // Actions
  setSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),
  setProductType: (productType) => set({ productType }),
  updateChartConfig: (config) =>
    set((state) => ({
      chartConfig: { ...state.chartConfig, ...config },
    })),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setSelectedAlertId: (alertId) => set({ selectedAlertId: alertId }),
  setShowAIPanel: (show) => set({ showAIPanel: show }),
  reset: () =>
    set({
      selectedSymbol: 'BTCUSDT',
      selectedTimeframe: '15m',
      productType: 'SPOT',
      chartConfig: DEFAULT_CHART_CONFIG,
      isStreaming: false,
      selectedAlertId: null,
      showAIPanel: false,
    }),
}));
