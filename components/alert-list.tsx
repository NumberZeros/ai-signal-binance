// Alert list component with AI explanation trigger

'use client';

import { Alert } from '@/lib/types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store/app-store';

interface AlertListProps {
  alerts: Alert[];
  onAlertClick: (alertId: string) => void;
}

export function AlertList({ alerts, onAlertClick }: AlertListProps) {
  const selectedAlertId = useAppStore((state) => state.selectedAlertId);

  const getAlertColor = (type: Alert['type']) => {
    if (type.includes('BULLISH') || type.includes('OVERSOLD') || type.includes('HIGH')) {
      return 'border-success/50 bg-success/10';
    }
    if (type.includes('BEARISH') || type.includes('OVERBOUGHT') || type.includes('LOW')) {
      return 'border-danger/50 bg-danger/10';
    }
    return 'border-warning/50 bg-warning/10';
  };

  const getAlertIcon = (type: Alert['type']) => {
    if (type.includes('CROSSOVER')) return '↗';
    if (type.includes('BREAKOUT')) return '⚡';
    if (type.includes('VOLUME')) return '📊';
    if (type.includes('RSI')) return '📈';
    return '•';
  };

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
      <AnimatePresence>
        {alerts.slice().reverse().map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            role="button"
            tabIndex={0}
            onClick={() => onAlertClick(alert.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onAlertClick(alert.id);
              }
            }}
            className={`p-3 border rounded-xl cursor-pointer shadow-sm shadow-black/10 transition-all hover:scale-[1.01] hover:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/50 ${getAlertColor(
              alert.type
            )} ${selectedAlertId === alert.id ? 'ring-2 ring-primary/50' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getAlertIcon(alert.type)}</span>
                  <span className="text-sm font-medium text-foreground truncate">
                    {alert.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-surface2 border border-border rounded-full text-muted-foreground">
                    {alert.confidence}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {alert.metadata.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{format(alert.timestamp, 'HH:mm:ss')}</span>
                  <span>${alert.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {alerts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No alerts yet. Waiting for signals...
        </div>
      )}
    </div>
  );
}
