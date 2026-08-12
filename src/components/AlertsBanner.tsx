import React from 'react';
import { AlertTriangle, XCircle, ArrowRight, ShoppingCart, RefreshCw } from 'lucide-react';
import { InventoryItem } from '../types';
import { getStockStatus } from '../utils/inventoryUtils';

interface AlertsBannerProps {
  items: InventoryItem[];
  currency: string;
  onQuickRestock: (item: InventoryItem) => void;
  onOpenPO: () => void;
  onSelectCategoryFilter: (category: string) => void;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({
  items,
  currency,
  onQuickRestock,
  onOpenPO,
}) => {
  const lowOrOutItems = items.filter((item) => {
    const status = getStockStatus(item);
    return status === 'low' || status === 'out_of_stock';
  });

  if (lowOrOutItems.length === 0) {
    return (
      <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 flex items-center justify-between text-emerald-800 dark:text-emerald-200 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">All inventory levels healthy. No urgent low-stock alerts.</span>
        </div>
        <span className="text-emerald-700 dark:text-emerald-300 font-medium">Auto-monitoring active</span>
      </div>
    );
  }

  const outCount = lowOrOutItems.filter((i) => i.quantity === 0).length;
  const lowCount = lowOrOutItems.length - outCount;

  return (
    <div className="mb-6 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-amber-800/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs animate-bounce">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Low-Stock & Reorder Alerts Active
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                {lowOrOutItems.length} SKU{lowOrOutItems.length > 1 ? 's' : ''} Need Action
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {outCount > 0 && <span className="font-semibold text-rose-600 dark:text-rose-400">{outCount} item(s) out of stock. </span>}
              {lowCount > 0 && <span>{lowCount} item(s) at or below minimum threshold.</span>}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenPO}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs shadow-xs hover:bg-slate-800 dark:hover:bg-white transition-colors shrink-0"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Generate PO for All ({lowOrOutItems.length})</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </button>
      </div>

      {/* Item Carousel Cards */}
      <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
        {lowOrOutItems.map((item) => {
          const isOut = item.quantity === 0;
          const reorderQty = Math.max(1, item.idealStock - item.quantity);
          const estimatedCost = reorderQty * item.unitCost;

          return (
            <div
              key={item.id}
              className={`flex-shrink-0 w-72 rounded-xl p-3 border text-xs flex flex-col justify-between bg-white dark:bg-slate-900 transition-all ${
                isOut
                  ? 'border-rose-300 dark:border-rose-800 shadow-xs'
                  : 'border-amber-300 dark:border-amber-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-[10px] text-slate-500 font-semibold truncate">
                    {item.sku}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isOut
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {isOut ? 'OUT OF STOCK' : `LOW (${item.quantity}/${item.reorderPoint})`}
                  </span>
                </div>

                <div className="font-bold text-slate-900 dark:text-white truncate" title={item.name}>
                  {item.name}
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mt-1 text-[11px]">
                  <span>Supplier: {item.supplier}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Est: {currency}{estimatedCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Lead time: {item.leadTimeDays}d
                </span>
                <button
                  onClick={() => onQuickRestock(item)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 font-semibold text-[11px] transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Restock</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
