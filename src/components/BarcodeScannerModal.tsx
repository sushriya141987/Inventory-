import React, { useState } from 'react';
import { X, QrCode, Search, CheckCircle2, AlertTriangle, Plus, Minus } from 'lucide-react';
import { InventoryItem } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onQuickRestock: (item: InventoryItem) => void;
  currency: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onQuickRestock,
  currency,
}) => {
  const [scannedInput, setScannedInput] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);

  if (!isOpen) return null;

  const handleSearch = (code: string) => {
    setScannedInput(code);
    const found = items.find(
      (i) =>
        i.barcode.toLowerCase() === code.trim().toLowerCase() ||
        i.sku.toLowerCase() === code.trim().toLowerCase()
    );
    setScannedItem(found || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-900 text-emerald-400 rounded-lg">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Barcode & SKU Scanner
              </h2>
              <p className="text-[11px] text-slate-500">
                Scan UPC code or enter SKU to inspect stock instantly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Simulated Scanner Viewport */}
          <div className="relative bg-slate-950 rounded-2xl p-6 text-center text-white overflow-hidden border border-slate-800">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse" />
            <QrCode className="h-12 w-12 text-slate-600 mx-auto mb-2 opacity-60" />
            <div className="text-xs font-semibold text-slate-300">
              Ready to scan barcode...
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Type UPC or click a sample barcode below to simulate a live physical scan
            </p>
          </div>

          {/* Input field */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Enter UPC Barcode or SKU (e.g. 890123456001)..."
              value={scannedInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quick Select Buttons */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Simulate Barcode Scan:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.slice(0, 5).map((i) => (
                <button
                  key={i.id}
                  onClick={() => handleSearch(i.barcode)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {i.sku}
                </button>
              ))}
            </div>
          </div>

          {/* Scanned Result Card */}
          {scannedItem ? (
            <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  MATCH FOUND: {scannedItem.sku}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                  UPC: {scannedItem.barcode}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {scannedItem.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Category: {scannedItem.category} | Location: {scannedItem.location}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-emerald-200 dark:border-emerald-800">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">In Stock</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {scannedItem.quantity}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      (Reorder Min: {scannedItem.reorderPoint})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUpdateQuantity(scannedItem.id, -1)}
                    disabled={scannedItem.quantity <= 0}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 shadow-2xs"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onUpdateQuantity(scannedItem.id, 1)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 shadow-2xs"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      onQuickRestock(scannedItem);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    Restock
                  </button>
                </div>
              </div>
            </div>
          ) : scannedInput ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 text-center rounded-2xl text-xs text-slate-500">
              No matching SKU or Barcode found for "{scannedInput}".
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
