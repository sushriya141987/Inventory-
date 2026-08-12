import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Barcode, 
  Filter, 
  Grid, 
  List, 
  ArrowUpDown, 
  Copy, 
  ExternalLink 
} from 'lucide-react';
import { InventoryItem, StockStatus } from '../types';
import { getStockStatus, getStatusBadgeInfo } from '../utils/inventoryUtils';

interface InventoryTableProps {
  items: InventoryItem[];
  categories: string[];
  currency: string;
  onUpdateQuantity: (id: string, delta: number) => void;
  onQuickRestock: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onOpenAddItem: () => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  categories,
  currency,
  onUpdateQuantity,
  onQuickRestock,
  onEditItem,
  onDeleteItem,
  onOpenAddItem,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'status' | 'category' | 'value'>('status');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.includes(searchQuery);

    const matchesCategory =
      selectedCategory === 'ALL' || item.category === selectedCategory;

    const status = getStockStatus(item);
    let matchesStatus = true;
    if (selectedStatus === 'ALERT') {
      matchesStatus = status === 'low' || status === 'out_of_stock';
    } else if (selectedStatus === 'HEALTHY') {
      matchesStatus = status === 'healthy';
    } else if (selectedStatus === 'OVERSTOCKED') {
      matchesStatus = status === 'overstocked';
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'quantity') {
      comparison = a.quantity - b.quantity;
    } else if (sortField === 'category') {
      comparison = a.category.localeCompare(b.category);
    } else if (sortField === 'value') {
      comparison = a.quantity * a.unitCost - b.quantity * b.unitCost;
    } else if (sortField === 'status') {
      // Prioritize out_of_stock, then low, then healthy, then overstocked
      const orderMap: Record<StockStatus, number> = {
        out_of_stock: 1,
        low: 2,
        healthy: 3,
        overstocked: 4,
      };
      comparison = orderMap[getStockStatus(a)] - orderMap[getStockStatus(b)];
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'name' | 'quantity' | 'status' | 'category' | 'value') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU, item name, supplier, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters and View mode */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => onSelectStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ALERT">🚨 Needs Attention (Low/Out)</option>
            <option value="HEALTHY">✅ Healthy In-Stock</option>
            <option value="OVERSTOCKED">📦 Overstocked</option>
          </select>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid cards view"
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Category:
        </span>
        <button
          onClick={() => onSelectCategory('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => {
          const count = items.filter((i) => i.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Main Stock Content View */}
      {sortedItems.length === 0 ? (
        <div className="p-12 text-center">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No matching inventory items found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search criteria, clear category filters, or add a new SKU.
          </p>
          <button
            onClick={onOpenAddItem}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New Item
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th 
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>SKU & Product Name</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('category')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('quantity')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>In Stock / Threshold</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('value')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Cost / Retail</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Location & Supplier</th>
                <th className="py-3 px-4 text-right">Quick Stock & Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {sortedItems.map((item) => {
                const status = getStockStatus(item);
                const badge = getStatusBadgeInfo(status);
                const isAlert = status === 'low' || status === 'out_of_stock';
                const totalVal = item.quantity * item.unitCost;

                // Stock bar calculation ratio
                const stockPercent = Math.min(100, Math.round((item.quantity / Math.max(item.idealStock, 1)) * 100));

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isAlert ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    {/* SKU & Product Name */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {item.sku}
                          </span>
                          <button
                            onClick={() => copyToClipboard(item.sku)}
                            title="Copy SKU"
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white mt-1">
                          {item.name}
                        </span>
                        {item.barcode && (
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            UPC: {item.barcode}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.badgeBg}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dotBg}`} />
                        {badge.label}
                      </span>
                    </td>

                    {/* Quantity & Level Bar */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-sm font-bold ${
                              item.quantity <= 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : item.quantity <= item.reorderPoint
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.quantity}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            / min {item.reorderPoint}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full transition-all rounded-full ${
                              item.quantity <= 0
                                ? 'bg-rose-500'
                                : item.quantity <= item.reorderPoint
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Cost & Retail Price */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {currency}{item.unitCost.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Retail: {currency}{item.retailPrice.toFixed(2)}
                        </span>
                      </div>
                    </td>

                    {/* Location & Supplier */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col text-[11px]">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {item.location || 'Unassigned'}
                        </span>
                        <span className="text-slate-400 mt-0.5">
                          Supplier: {item.supplier} ({item.leadTimeDays}d lead)
                        </span>
                      </div>
                    </td>

                    {/* Quick Stock Controls & Action Menu */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Minus / Plus Quick Buttons */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            disabled={item.quantity <= 0}
                            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Decrease quantity by 1"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-2 font-bold text-xs text-slate-900 dark:text-white min-w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Increase quantity by 1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Quick Restock Button */}
                        <button
                          onClick={() => onQuickRestock(item)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800 transition-colors"
                          title="Restock batch"
                        >
                          Restock
                        </button>

                        {/* Edit Item */}
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit SKU details"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Item */}
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                              onDeleteItem(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedItems.map((item) => {
            const status = getStockStatus(item);
            const badge = getStatusBadgeInfo(status);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {item.sku}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeBg}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${badge.dotBg}`} />
                      {badge.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    {item.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span>•</span>
                    <span>Loc: {item.location || 'General'}</span>
                  </div>

                  {/* Quantity Display */}
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">In Stock</div>
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {item.quantity}{' '}
                        <span className="text-xs font-normal text-slate-400">
                          (Min: {item.reorderPoint})
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Cost / Price</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {currency}{item.unitCost.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Retail: {currency}{item.retailPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      disabled={item.quantity <= 0}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onQuickRestock(item)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                    >
                      Restock
                    </button>
                    <button
                      onClick={() => onEditItem(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
