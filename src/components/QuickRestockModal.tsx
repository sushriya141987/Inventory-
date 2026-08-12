import React, { useState } from 'react';
import { X, RefreshCw, Truck, DollarSign } from 'lucide-react';
import { InventoryItem } from '../types';

interface QuickRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onConfirmRestock: (itemId: string, restockQty: number, note?: string) => void;
  currency: string;
}

export const QuickRestockModal: React.FC<QuickRestockModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirmRestock,
  currency,
}) => {
  if (!isOpen || !item) return null;

  const suggestedQty = Math.max(1, item.idealStock - item.quantity);
  const [restockQty, setRestockQty] = useState(suggestedQty);
  const [invoiceNote, setInvoiceNote] = useState(`Restock PO from ${item.supplier}`);

  const totalCost = restockQty * item.unitCost;
  const newStock = item.quantity + restockQty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restockQty <= 0) return;
    onConfirmRestock(item.id, Number(restockQty), invoiceNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg text-emerald-700 dark:text-emerald-300">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Restock Inventory
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                SKU: {item.sku}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {item.name}
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Current Stock: <strong className="text-slate-900 dark:text-white">{item.quantity}</strong></span>
              <span>Reorder Min: <strong className="text-amber-600">{item.reorderPoint}</strong></span>
              <span>Target Ideal: <strong className="text-emerald-600">{item.idealStock}</strong></span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Quantity to Add / Received *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                required
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setRestockQty(suggestedQty)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Set Ideal ({suggestedQty})
              </button>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">New Total Stock: </span>
              <span className="font-extrabold text-emerald-900 dark:text-emerald-100 text-sm">{newStock}</span>
            </div>
            <div>
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">Estimated Invoice: </span>
              <span className="font-extrabold text-emerald-900 dark:text-emerald-100">{currency}{totalCost.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Restock Memo / Supplier PO Invoice #
            </label>
            <input
              type="text"
              value={invoiceNote}
              onChange={(e) => setInvoiceNote(e.target.value)}
              placeholder="e.g. Invoice #PO-99182"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              Confirm Restock (+{restockQty})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
