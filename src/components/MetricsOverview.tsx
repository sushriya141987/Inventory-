import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart,
  CheckCircle2
} from 'lucide-react';
import { InventoryItem } from '../types';
import { calculateTotalCostValue, calculateTotalRetailValue, getStockStatus } from '../utils/inventoryUtils';

interface MetricsOverviewProps {
  items: InventoryItem[];
  currency: string;
  onFilterLowStock: () => void;
  onFilterOutOfStock: () => void;
  onShowAll: () => void;
  onOpenPO: () => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  items,
  currency,
  onFilterLowStock,
  onFilterOutOfStock,
  onShowAll,
  onOpenPO,
}) => {
  const totalSKUs = items.length;
  const totalCostValue = calculateTotalCostValue(items);
  const totalRetailValue = calculateTotalRetailValue(items);
  const totalMargin = totalRetailValue - totalCostValue;

  const lowStockItems = items.filter((i) => getStockStatus(i) === 'low');
  const outOfStockItems = items.filter((i) => getStockStatus(i) === 'out_of_stock');
  const healthyItems = items.filter((i) => getStockStatus(i) === 'healthy');

  const totalUrgent = lowStockItems.length + outOfStockItems.length;

  // Estimated cost required to restock all low and out-of-stock items to ideal level
  const totalRestockCost = items
    .filter((i) => i.quantity <= i.reorderPoint)
    .reduce((sum, item) => sum + (item.idealStock - item.quantity) * item.unitCost, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 mb-6">
      {/* 1. Total Stock Value */}
      <div 
        onClick={onShowAll}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Inventory Value</span>
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-slate-900 dark:text-white">
          {currency}{totalCostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
          <span>Retail: {currency}{totalRetailValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          <span className="text-emerald-600 font-medium">+{currency}{totalMargin.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* 2. Total SKUs */}
      <div 
        onClick={onShowAll}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Total SKUs</span>
          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
            <Package className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-slate-900 dark:text-white">
          {totalSKUs}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{healthyItems.length} Healthy In-Stock</span>
        </div>
      </div>

      {/* 3. Low Stock Alert Count */}
      <div 
        onClick={onFilterLowStock}
        className={`border rounded-xl p-4 shadow-2xs transition-all cursor-pointer ${
          lowStockItems.length > 0 
            ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800 hover:bg-amber-100/70' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Low Stock Alerts
          </span>
          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-amber-900 dark:text-amber-200">
            {lowStockItems.length}
          </span>
          {lowStockItems.length > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 animate-pulse">
              Reorder Soon
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
          At or below threshold level
        </div>
      </div>

      {/* 4. Out of Stock Count */}
      <div 
        onClick={onFilterOutOfStock}
        className={`border rounded-xl p-4 shadow-2xs transition-all cursor-pointer ${
          outOfStockItems.length > 0 
            ? 'bg-rose-50/80 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800 hover:bg-rose-100/80' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-400">
            Out of Stock
          </span>
          <div className="p-1.5 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-rose-700 dark:text-rose-300">
            <XCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-rose-900 dark:text-rose-200">
            {outOfStockItems.length}
          </span>
          {outOfStockItems.length > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200">
              Critical
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-rose-700 dark:text-rose-400">
          0 items available for sale
        </div>
      </div>

      {/* 5. Restock Budget / PO Quick Action */}
      <div 
        onClick={onOpenPO}
        className="col-span-2 md:col-span-4 lg:col-span-1 bg-slate-900 dark:bg-slate-800 text-white border border-slate-800 rounded-xl p-4 shadow-xs hover:bg-slate-800 dark:hover:bg-slate-750 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Restock Budget</span>
          <ShoppingCart className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="text-xl font-bold text-emerald-400">
          {currency}{totalRestockCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300">
          <span>{totalUrgent} SKU(s) to order</span>
          <span className="font-semibold underline text-white">Generate PO →</span>
        </div>
      </div>
    </div>
  );
};
