// AI panel for explanations, summaries, and queries

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';import { useAppStore } from '@/lib/store/app-store';
import { useExplainAlert, useMarketSummary, useAIQuery } from '@/lib/hooks/use-api';

interface AIPanelProps {
  alertId?: string | null;
}

export function AIPanel({ alertId }: AIPanelProps) {
  const { selectedSymbol, selectedTimeframe } = useAppStore();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'explanation' | 'summary' | 'query'>('explanation');

  const explainMutation = useExplainAlert();
  const summaryMutation = useMarketSummary();
  const queryMutation = useAIQuery();

  const handleExplainAlert = () => {
    if (!alertId) return;
    explainMutation.mutate({
      alertId,
      symbol: selectedSymbol,
      timeframe: selectedTimeframe,
    });
  };

  const handleGenerateSummary = () => {
    summaryMutation.mutate({
      symbol: selectedSymbol,
      timeframe: selectedTimeframe,
    });
  };

  const handleSubmitQuery = () => {
    if (!query.trim()) return;
    queryMutation.mutate({
      query: query.trim(),
      symbol: selectedSymbol,
      timeframe: selectedTimeframe,
    });
  };

  return (
    <div className="p-4 bg-surface border border-border/80 rounded-xl shadow-lg shadow-black/20 space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('explanation')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            activeTab === 'explanation'
              ? 'bg-primary/15 text-primary border border-primary/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface2/60'
          }`}
        >
          Explain Alert
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            activeTab === 'summary'
              ? 'bg-primary/15 text-primary border border-primary/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface2/60'
          }`}
        >
          Market Summary
        </button>
        <button
          onClick={() => setActiveTab('query')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            activeTab === 'query'
              ? 'bg-primary/15 text-primary border border-primary/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface2/60'
          }`}
        >
          Ask AI
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'explanation' && (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <button
              onClick={handleExplainAlert}
              disabled={!alertId || explainMutation.isPending}
              className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] disabled:bg-surface2 disabled:text-muted-foreground rounded text-sm font-semibold transition-colors"
            >
              {explainMutation.isPending ? 'Analyzing...' : 'Explain Selected Alert'}
            </button>

            {explainMutation.isPending && (
              <div className="p-4 bg-surface2/60 rounded border border-border animate-pulse space-y-2">
                <div className="h-3 rounded bg-surface2" />
                <div className="h-3 w-5/6 rounded bg-surface2" />
                <div className="h-3 w-4/6 rounded bg-surface2" />
              </div>
            )}

            {explainMutation.data && (
              <div className="p-4 bg-surface2/60 rounded border border-border">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {explainMutation.data.explanation}
                </p>
              </div>
            )}

            {explainMutation.isError && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-sm text-danger">
                {explainMutation.error instanceof Error
                  ? explainMutation.error.message
                  : 'Failed to generate explanation'}
              </div>
            )}

            {!alertId && !explainMutation.data && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Select an alert to get AI explanation
              </p>
            )}
          </motion.div>
        )}

        {activeTab === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <button
              onClick={handleGenerateSummary}
              disabled={summaryMutation.isPending}
              className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] disabled:bg-surface2 disabled:text-muted-foreground rounded text-sm font-semibold transition-colors"
            >
              {summaryMutation.isPending ? 'Generating...' : 'Generate Market Summary'}
            </button>

            {summaryMutation.isPending && (
              <div className="p-4 bg-surface2/60 rounded border border-border animate-pulse space-y-2">
                <div className="h-3 rounded bg-surface2" />
                <div className="h-3 w-5/6 rounded bg-surface2" />
                <div className="h-3 w-4/6 rounded bg-surface2" />
              </div>
            )}

            {summaryMutation.data && (
              <div className="p-4 bg-surface2/60 rounded border border-border prose prose-sm prose-invert max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="text-sm text-foreground/90 leading-relaxed mb-3 last:mb-0">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-primary font-semibold">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1 text-sm text-foreground/90">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-foreground/90">{children}</li>
                    ),
                  }}
                >
                  {summaryMutation.data.summary}
                </ReactMarkdown>
              </div>
            )}

            {summaryMutation.isError && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-sm text-danger">
                {summaryMutation.error instanceof Error
                  ? summaryMutation.error.message
                  : 'Failed to generate summary'}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'query' && (
          <motion.div
            key="query"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitQuery()}
                placeholder="Ask about current market conditions..."
                className="flex-1 px-3 py-2 bg-surface2 border border-border/80 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 transition-colors hover:border-primary/50"
              />
              <button
                onClick={handleSubmitQuery}
                disabled={!query.trim() || queryMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] disabled:bg-surface2 disabled:text-muted-foreground rounded text-sm font-semibold transition-colors"
              >
                Ask
              </button>
            </div>

            {queryMutation.isPending && (
              <div className="p-4 bg-surface2/60 rounded border border-border animate-pulse space-y-2">
                <div className="h-3 rounded bg-surface2" />
                <div className="h-3 w-5/6 rounded bg-surface2" />
                <div className="h-3 w-4/6 rounded bg-surface2" />
              </div>
            )}

            {queryMutation.data && (
              <div className="p-4 bg-surface2/60 rounded border border-border prose prose-sm prose-invert max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="text-sm text-foreground/90 leading-relaxed mb-3 last:mb-0">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-primary font-semibold">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1 text-sm text-foreground/90">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-foreground/90">{children}</li>
                    ),
                  }}
                >
                  {queryMutation.data.answer}
                </ReactMarkdown>
              </div>
            )}

            {queryMutation.isError && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-sm text-danger">
                {queryMutation.error instanceof Error
                  ? queryMutation.error.message
                  : 'Failed to answer query'}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              💡 Examples: "What does RSI indicate?", "Explain the EMA crossover", "Is volume high?"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground italic text-center">
          AI responses are educational only and not financial advice
        </p>
      </div>
    </div>
  );
}
