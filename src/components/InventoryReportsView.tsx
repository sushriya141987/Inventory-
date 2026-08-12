import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Boxes, 
  PieChart as PieIcon, 
  RefreshCw, 
  Building, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  Layers,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { InventoryItem, BusinessProfile, StockLog } from '../types';
import { getStockStatus } from '../utils/inventoryUtils';

interface InventoryReportsViewProps {
  items: InventoryItem[];
  logs: StockLog[];
  currency: string;
  currentProfile: BusinessProfile;
}

export type ReportType = 
  | 'EXECUTIVE'
  | 'STOCK_VALUATION'
  | 'REPLENISHMENT'
  | 'CATEGORY_SUMMARY'
  | 'DEADSTOCK_RISK';

export const InventoryReportsView: React.FC<InventoryReportsViewProps> = ({
  items,
  logs,
  currency,
  currentProfile,
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('EXECUTIVE');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const safeItems = items || [];
  const profileName = currentProfile?.name || 'Business';

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(safeItems.map((i) => i.category || 'Uncategorized'));
    return ['ALL', ...Array.from(set)];
  }, [safeItems]);

  // Overall Financial & Count Metrics
  const summaryMetrics = useMemo(() => {
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let healthyCount = 0;
    let lowCount = 0;
    let outCount = 0;
    let overstockedCount = 0;
    let reorderCostRequired = 0;

    safeItems.forEach((item) => {
      const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
      const cost = typeof item.unitCost === 'number' && !isNaN(item.unitCost) ? item.unitCost : 0;
      const retail = typeof item.retailPrice === 'number' && !isNaN(item.retailPrice) ? item.retailPrice : 0;
      const ideal = typeof item.idealStock === 'number' && !isNaN(item.idealStock) ? item.idealStock : 0;

      const status = getStockStatus(item);
      totalCostValuation += qty * cost;
      totalRetailValuation += qty * retail;

      if (status === 'healthy') healthyCount++;
      if (status === 'low') {
        lowCount++;
        const gap = Math.max(0, ideal - qty);
        reorderCostRequired += gap * cost;
      }
      if (status === 'out_of_stock') {
        outCount++;
        reorderCostRequired += ideal * cost;
      }
      if (status === 'overstocked') overstockedCount++;
    });

    const potentialGrossProfit = totalRetailValuation - totalCostValuation;
    const marginPercent = totalRetailValuation > 0 
      ? ((potentialGrossProfit / totalRetailValuation) * 100).toFixed(1)
      : '0.0';

    return {
      totalCostValuation,
      totalRetailValuation,
      potentialGrossProfit,
      marginPercent,
      healthyCount,
      lowCount,
      outCount,
      overstockedCount,
      totalSkus: safeItems.length,
      reorderCostRequired,
    };
  }, [safeItems]);

  // Filtered items based on criteria
  const filteredItems = useMemo(() => {
    return safeItems.filter((item) => {
      const cat = item.category || 'Uncategorized';
      const matchesCategory = selectedCategory === 'ALL' || cat === selectedCategory;
      const status = getStockStatus(item);
      const matchesStatus = selectedStatus === 'ALL' || status === selectedStatus;
      const query = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !query ||
        (item.name || '').toLowerCase().includes(query) ||
        (item.sku || '').toLowerCase().includes(query) ||
        (item.supplier || '').toLowerCase().includes(query) ||
        (item.location || '').toLowerCase().includes(query);

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [safeItems, selectedCategory, selectedStatus, searchQuery]);

  // Category Breakdown Aggregations
  const categoryBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        category: string;
        itemCount: number;
        totalUnits: number;
        costValuation: number;
        retailValuation: number;
        potentialProfit: number;
        reorderItemsCount: number;
      }
    >();

    safeItems.forEach((item) => {
      const catKey = item.category || 'Uncategorized';
      const existing = map.get(catKey) || {
        category: catKey,
        itemCount: 0,
        totalUnits: 0,
        costValuation: 0,
        retailValuation: 0,
        potentialProfit: 0,
        reorderItemsCount: 0,
      };

      const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
      const cost = typeof item.unitCost === 'number' && !isNaN(item.unitCost) ? item.unitCost : 0;
      const retail = typeof item.retailPrice === 'number' && !isNaN(item.retailPrice) ? item.retailPrice : 0;

      const totalCost = qty * cost;
      const totalRetail = qty * retail;
      const status = getStockStatus(item);

      map.set(catKey, {
        category: catKey,
        itemCount: existing.itemCount + 1,
        totalUnits: existing.totalUnits + qty,
        costValuation: existing.costValuation + totalCost,
        retailValuation: existing.retailValuation + totalRetail,
        potentialProfit: existing.potentialProfit + (totalRetail - totalCost),
        reorderItemsCount: existing.reorderItemsCount + (status === 'low' || status === 'out_of_stock' ? 1 : 0),
      });
    });

    return Array.from(map.values()).sort((a, b) => b.costValuation - a.costValuation);
  }, [safeItems]);

  // Replenishment items (low or out of stock)
  const replenishmentItems = useMemo(() => {
    return safeItems.filter((i) => {
      const status = getStockStatus(i);
      return status === 'low' || status === 'out_of_stock';
    }).sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
  }, [safeItems]);

  // Deadstock / Overstocked items
  const overstockedItems = useMemo(() => {
    return safeItems.filter((i) => {
      const status = getStockStatus(i);
      return status === 'overstocked';
    }).sort((a, b) => ((b.quantity || 0) - (b.idealStock || 0)) * (b.unitCost || 0) - ((a.quantity || 0) - (a.idealStock || 0)) * (a.unitCost || 0));
  }, [safeItems]);

  // Export Active Report to CSV
  const handleExportReportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `${profileName.toLowerCase().replace(/\s+/g, '_')}_${activeReport.toLowerCase()}_report.csv`;

    if (activeReport === 'EXECUTIVE' || activeReport === 'STOCK_VALUATION') {
      headers = [
        'SKU',
        'Item Name',
        'Category',
        'Quantity In Stock',
        'Stock Status',
        'Unit Cost',
        'Total Cost Asset Value',
        'Retail Price',
        'Total Retail Revenue Value',
        'Potential Profit',
        'Supplier',
        'Storage Location'
      ];

      rows = filteredItems.map((item) => {
        const qty = item.quantity || 0;
        const uCost = item.unitCost || 0;
        const rPrice = item.retailPrice || 0;
        const costVal = qty * uCost;
        const retailVal = qty * rPrice;
        const status = getStockStatus(item);
        return [
          `"${item.sku || ''}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${item.category || ''}"`,
          `"${qty}"`,
          `"${status}"`,
          `"${currency}${uCost.toFixed(2)}"`,
          `"${currency}${costVal.toFixed(2)}"`,
          `"${currency}${rPrice.toFixed(2)}"`,
          `"${currency}${retailVal.toFixed(2)}"`,
          `"${currency}${(retailVal - costVal).toFixed(2)}"`,
          `"${(item.supplier || '').replace(/"/g, '""')}"`,
          `"${item.location || ''}"`
        ];
      });
    } else if (activeReport === 'REPLENISHMENT') {
      headers = [
        'SKU',
        'Item Name',
        'Category',
        'Current Stock',
        'Reorder Point',
        'Ideal Stock',
        'Suggested Order Qty',
        'Unit Cost',
        'Est Order Cost',
        'Supplier Name',
        'Lead Time (Days)'
      ];

      rows = replenishmentItems.map((item) => {
        const suggested = Math.max(0, item.idealStock - item.quantity);
        const estCost = suggested * item.unitCost;
        return [
          `"${item.sku}"`,
          `"${item.name.replace(/"/g, '""')}"`,
          `"${item.category}"`,
          `"${item.quantity}"`,
          `"${item.reorderPoint}"`,
          `"${item.idealStock}"`,
          `"${suggested}"`,
          `"${currency}${item.unitCost.toFixed(2)}"`,
          `"${currency}${estCost.toFixed(2)}"`,
          `"${item.supplier.replace(/"/g, '""')}"`,
          `"${item.leadTimeDays}"`
        ];
      });
    } else if (activeReport === 'CATEGORY_SUMMARY') {
      headers = [
        'Category Name',
        'Total Unique SKUs',
        'Total Physical Units',
        'Total Cost Asset Valuation',
        'Total Retail Valuation',
        'Potential Gross Profit',
        'Items Needing Reorder'
      ];

      rows = categoryBreakdown.map((cat) => [
        `"${cat.category}"`,
        `"${cat.itemCount}"`,
        `"${cat.totalUnits}"`,
        `"${currency}${cat.costValuation.toFixed(2)}"`,
        `"${currency}${cat.retailValuation.toFixed(2)}"`,
        `"${currency}${cat.potentialProfit.toFixed(2)}"`,
        `"${cat.reorderItemsCount}"`
      ]);
    } else if (activeReport === 'DEADSTOCK_RISK') {
      headers = [
        'SKU',
        'Item Name',
        'Category',
        'Current Stock',
        'Ideal Stock',
        'Excess Units',
        'Tied-up Capital Cost',
        'Storage Location'
      ];

      rows = overstockedItems.map((item) => {
        const excess = Math.max(0, item.quantity - item.idealStock);
        const tiedUp = excess * item.unitCost;
        return [
          `"${item.sku}"`,
          `"${item.name.replace(/"/g, '""')}"`,
          `"${item.category}"`,
          `"${item.quantity}"`,
          `"${item.idealStock}"`,
          `"${excess}"`,
          `"${currency}${tiedUp.toFixed(2)}"`,
          `"${item.location}"`
        ];
      });
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print View
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 print:p-0 print:m-0">
      {/* Report Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-3xl shadow-xl border border-slate-800 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 print:text-slate-800 text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="h-4 w-4" />
            <span>Inventory Operations & Financial Reporting</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white print:text-black">
            {currentProfile.name} — Official Inventory Report
          </h2>
          <p className="text-xs text-slate-400 print:text-slate-600 mt-1 flex items-center gap-3">
            <span>Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</span>
            <span>•</span>
            <span>Total Catalog SKUs: {items.length}</span>
            <span>•</span>
            <span>Currency: {currency}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 print:hidden">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
          >
            <Printer className="h-4 w-4 text-slate-300" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportReportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>TOTAL ASSET COST</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {currency}{summaryMetrics.totalCostValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Inventory balance at cost price
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>RETAIL VALUE</span>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {currency}{summaryMetrics.totalRetailValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            +{currency}{summaryMetrics.potentialGrossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} profit ({summaryMetrics.marginPercent}% margin)
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>STOCK HEALTH</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-1.5">
            <span>{summaryMetrics.healthyCount} Healthy</span>
            <span className="text-xs text-rose-500 font-bold">({summaryMetrics.lowCount + summaryMetrics.outCount} low)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summaryMetrics.outCount} Out of Stock • {summaryMetrics.overstockedCount} Overstocked
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>REORDER CAPITAL REQ.</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {currency}{summaryMetrics.reorderCostRequired.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Required to restock low/out SKUs
          </div>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveReport('EXECUTIVE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeReport === 'EXECUTIVE'
                ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Executive Overview</span>
          </button>

          <button
            onClick={() => setActiveReport('STOCK_VALUATION')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeReport === 'STOCK_VALUATION'
                ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Stock Valuation Report ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveReport('REPLENISHMENT')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeReport === 'REPLENISHMENT'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Replenishment Report ({replenishmentItems.length})</span>
          </button>

          <button
            onClick={() => setActiveReport('CATEGORY_SUMMARY')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeReport === 'CATEGORY_SUMMARY'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Category Performance ({categoryBreakdown.length})</span>
          </button>

          <button
            onClick={() => setActiveReport('DEADSTOCK_RISK')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeReport === 'DEADSTOCK_RISK'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Overstock & Capital Risk ({overstockedItems.length})</span>
          </button>
        </div>
      </div>

      {/* Report Filter Control Toolbar */}
      {(activeReport === 'STOCK_VALUATION' || activeReport === 'EXECUTIVE') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <Filter className="h-3.5 w-3.5" /> Filter Category:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <span className="text-xs font-bold text-slate-500 ml-2 shrink-0">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="healthy">Healthy Stock</option>
              <option value="low">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstocked">Overstocked</option>
            </select>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search SKU, item name, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* REPORT CONTENT VIEW 1: EXECUTIVE OVERVIEW */}
      {activeReport === 'EXECUTIVE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Most Valuable SKUs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Top Inventory Capital Allocations
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">By Cost Valuation</span>
              </div>

              <div className="space-y-3">
                {items
                  .slice()
                  .sort((a, b) => b.quantity * b.unitCost - a.quantity * a.unitCost)
                  .slice(0, 5)
                  .map((item, idx) => {
                    const costVal = item.quantity * item.unitCost;
                    const share = ((costVal / summaryMetrics.totalCostValuation) * 100).toFixed(1);
                    return (
                      <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="h-6 w-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</div>
                            <div className="text-[10px] text-slate-400">SKU: {item.sku} • {item.category}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            {currency}{costVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {share}% of total inventory
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Critical Replenishment Items */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Urgent Replenishment Priority
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Stock Out Risk</span>
              </div>

              <div className="space-y-3">
                {replenishmentItems.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ All SKUs are healthy! No immediate restocking required.
                  </div>
                ) : (
                  replenishmentItems.slice(0, 5).map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                              status === 'out_of_stock'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {status === 'out_of_stock' ? 'OUT OF STOCK' : 'LOW STOCK'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Current: <strong className="text-slate-700 dark:text-slate-200">{item.quantity}</strong> / Reorder Point: {item.reorderPoint} • Lead time: {item.leadTimeDays}d
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Supplier: {item.supplier}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Need +{Math.max(0, item.idealStock - item.quantity)} units
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT VIEW 2: FULL STOCK VALUATION REPORT TABLE */}
      {(activeReport === 'STOCK_VALUATION' || activeReport === 'EXECUTIVE') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="h-4 w-4 text-emerald-500" />
              Itemized Stock Valuation & Margin Register ({filteredItems.length} SKUs)
            </h3>
            <span className="text-xs font-bold text-slate-400">
              Showing filtered results
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Stock Status</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Retail Price</th>
                  <th className="py-3 px-4 text-right">Total Cost Asset</th>
                  <th className="py-3 px-4 text-right">Total Retail Revenue</th>
                  <th className="py-3 px-4 text-right">Gross Profit</th>
                  <th className="py-3 px-4">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredItems.map((item) => {
                  const status = getStockStatus(item);
                  const costAsset = item.quantity * item.unitCost;
                  const retailAsset = item.quantity * item.retailPrice;
                  const profit = retailAsset - costAsset;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-semibold">{item.category}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          status === 'healthy'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : status === 'low'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : status === 'out_of_stock'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}>
                          {status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                        {currency}{item.unitCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                        {currency}{item.retailPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        {currency}{costAsset.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-indigo-600 dark:text-indigo-400 font-bold">
                        {currency}{retailAsset.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        +{currency}{profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {item.supplier}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT VIEW 3: REPLENISHMENT REPORT */}
      {activeReport === 'REPLENISHMENT' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-600" />
                Inventory Replenishment & Reorder Procurement Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All SKUs operating below minimum safety threshold (Reorder Point).
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
                Total Order Budget Required: {currency}{summaryMetrics.reorderCostRequired.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU / Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Reorder Threshold</th>
                  <th className="py-3 px-4 text-center">Ideal Level</th>
                  <th className="py-3 px-4 text-center">Order Qty Needed</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Est. Reorder Cost</th>
                  <th className="py-3 px-4">Supplier & Lead Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {replenishmentItems.map((item) => {
                  const needed = Math.max(0, item.idealStock - item.quantity);
                  const cost = needed * item.unitCost;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-semibold">{item.category}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                          item.quantity === 0
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {item.quantity} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-600 dark:text-slate-300">{item.reorderPoint}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-600 dark:text-slate-300">{item.idealStock}</td>
                      <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400">
                        +{needed} units
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                        {currency}{item.unitCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        {currency}{cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{item.supplier}</div>
                        <div className="text-[10px] text-slate-400">Lead time: {item.leadTimeDays} business days</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT VIEW 4: CATEGORY SUMMARY */}
      {activeReport === 'CATEGORY_SUMMARY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBreakdown.map((cat) => {
              const share = ((cat.costValuation / summaryMetrics.totalCostValuation) * 100).toFixed(1);
              return (
                <div key={cat.category} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:border-indigo-300 transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{cat.category}</h4>
                      <div className="text-xs text-slate-400">{cat.itemCount} SKUs • {cat.totalUnits} Units in stock</div>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg text-xs font-black">
                      {share}% share
                    </span>
                  </div>

                  <div className="pt-3 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Cost Valuation:</span>
                      <strong className="text-slate-900 dark:text-white">{currency}{cat.costValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Retail Valuation:</span>
                      <strong className="text-indigo-600 dark:text-indigo-400">{currency}{cat.retailValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Potential Profit:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">+{currency}{cat.potentialProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>

                    {cat.reorderItemsCount > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold">
                        <span>Reorder Needed:</span>
                        <span>{cat.reorderItemsCount} SKUs below threshold</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REPORT CONTENT VIEW 5: DEADSTOCK & OVERSTOCK RISK REPORT */}
      {activeReport === 'DEADSTOCK_RISK' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                Overstocked Inventory & Excess Capital Risk Register
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                SKUs with physical stock exceeding target maximum ideal level.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU / Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Target Ideal Level</th>
                  <th className="py-3 px-4 text-center">Excess Units</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Tied-Up Capital</th>
                  <th className="py-3 px-4">Storage Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {overstockedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs font-bold text-slate-400">
                      ✓ No overstocked items detected. Capital allocation is optimized!
                    </td>
                  </tr>
                ) : (
                  overstockedItems.map((item) => {
                    const excess = Math.max(0, item.quantity - item.idealStock);
                    const tiedUp = excess * item.unitCost;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-semibold">{item.category}</td>
                        <td className="py-3 px-4 text-center font-bold text-purple-600 dark:text-purple-400">{item.quantity} units</td>
                        <td className="py-3 px-4 text-center text-slate-500">{item.idealStock} units</td>
                        <td className="py-3 px-4 text-center font-black text-rose-600 dark:text-rose-400">+{excess} excess</td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">{currency}{item.unitCost.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                          {currency}{tiedUp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{item.location}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Formal Footer for Print / Audit Compliance */}
      <div className="hidden print:block pt-8 mt-8 border-t border-slate-300 text-xs text-slate-600">
        <div className="flex justify-between items-end">
          <div>
            <div className="font-bold text-slate-900">{currentProfile.name} Operations Department</div>
            <div>Report Certified By: ___________________________</div>
            <div>Date: ___________________________</div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            Inventory Brief Application Report System • Page 1 of 1
          </div>
        </div>
      </div>
    </div>
  );
};
