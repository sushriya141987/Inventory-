import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  ArrowRight,
  ShieldAlert,
  ShoppingCart
} from 'lucide-react';
import { InventoryItem, StockLog, AIInsightResponse } from '../types';

interface AIInsightsPanelProps {
  items: InventoryItem[];
  logs: StockLog[];
  businessName: string;
  currency: string;
  onQuickRestock: (item: InventoryItem) => void;
  onOpenPO: () => void;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  items,
  logs,
  businessName,
  currency,
  onQuickRestock,
  onOpenPO,
}) => {
  const [insightData, setInsightData] = useState<AIInsightResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/inventory/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, logs, businessName }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch AI insights');
      }

      const data: AIInsightResponse = await res.json();
      setInsightData(data);
    } catch (err: any) {
      console.error(err);
      setError('Unable to reach AI insight assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [items.length]); // Refetch when items dataset size changes

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-lg mb-6 border border-indigo-800/40">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-800/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300 flex items-center justify-center font-bold">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Gemini AI Executive Inventory Brief
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Supply Chain AI
              </span>
            </div>
            <p className="text-xs text-indigo-200/70 mt-0.5">
              Real-time automated risk assessment, fast-mover analysis & purchase order optimization for {businessName}.
            </p>
          </div>
        </div>

        <button
          onClick={fetchInsights}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Analyzing...' : 'Refresh AI Analysis'}</span>
        </button>
      </div>

      {/* Main Body */}
      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
          <div className="text-sm font-semibold text-indigo-200">
            Analyzing inventory levels, sales velocity, and lead times...
          </div>
          <p className="text-xs text-indigo-300/60">
            Evaluating stockout risk probabilities and supplier lead time buffers.
          </p>
        </div>
      ) : error ? (
        <div className="py-6 text-center text-xs text-rose-300">
          {error}
          <button onClick={fetchInsights} className="ml-2 underline font-bold">
            Retry
          </button>
        </div>
      ) : insightData ? (
        <div className="mt-5 space-y-6">
          {/* Executive Summary & Health Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 bg-indigo-950/50 border border-indigo-800/40 rounded-xl p-4">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                Executive Overview
              </div>
              <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                {insightData.executiveSummary}
              </p>
            </div>

            {/* Health Score Box */}
            <div className="bg-indigo-950/80 border border-indigo-800/60 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1">
                Health Score
              </div>
              <div className="text-3xl font-black text-white flex items-baseline gap-1">
                {insightData.healthScore}
                <span className="text-xs font-medium text-indigo-300">/ 100</span>
              </div>
              <span
                className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  insightData.healthScore >= 80
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : insightData.healthScore >= 50
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {insightData.healthScore >= 80
                  ? 'Optimal'
                  : insightData.healthScore >= 50
                  ? 'Attention Required'
                  : 'Critical Action Needed'}
              </span>
            </div>
          </div>

          {/* AI Recommended Orders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="h-4 w-4 text-emerald-400" />
                AI Recommended Reorder Schedule ({insightData.recommendations.length})
              </h3>

              <button
                onClick={onOpenPO}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Auto-Generate PO →
              </button>
            </div>

            {insightData.recommendations.length === 0 ? (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/30 text-xs text-indigo-200">
                ✅ No urgent reorders required. All inventory levels are above safety thresholds.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {insightData.recommendations.map((rec, idx) => {
                  const matchingItem = items.find((i) => i.sku === rec.sku);

                  return (
                    <div
                      key={idx}
                      className="bg-indigo-950/60 border border-indigo-800/50 rounded-xl p-3.5 flex flex-col justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-[10px] text-indigo-300 font-bold">
                            {rec.sku}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                              rec.priority === 'CRITICAL'
                                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {rec.priority}
                          </span>
                        </div>

                        <div className="font-bold text-white text-xs truncate">
                          {rec.itemName}
                        </div>

                        <p className="text-[11px] text-indigo-200/80 mt-1 leading-snug">
                          {rec.reason}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-indigo-800/50 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-indigo-300">
                            Reorder: <strong className="text-white">+{rec.suggestedReorderQty} units</strong>
                          </div>
                          <div className="text-[10px] text-emerald-300 font-bold">
                            Est: {currency}{rec.estimatedCost.toFixed(2)}
                          </div>
                        </div>

                        {matchingItem && (
                          <button
                            onClick={() => onQuickRestock(matchingItem)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                          >
                            Restock
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Strategic Observations */}
          {insightData.inventoryHealthObservations.length > 0 && (
            <div className="pt-3 border-t border-indigo-800/50">
              <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2">
                Supply Chain Insights & Observations
              </div>
              <ul className="space-y-1.5 text-xs text-indigo-200/90">
                {insightData.inventoryHealthObservations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
