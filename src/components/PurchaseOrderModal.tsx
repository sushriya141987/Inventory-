import React, { useState } from 'react';
import { X, ShoppingCart, Copy, Check, Mail, Printer, FileText } from 'lucide-react';
import { InventoryItem, BusinessProfile } from '../types';
import { getStockStatus } from '../utils/inventoryUtils';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  currency: string;
  businessProfile: BusinessProfile;
  onConfirmAllRestock: (restockItems: { id: string; qty: number }[]) => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  businessProfile,
  onConfirmAllRestock,
}) => {
  const [copiedSupplier, setCopiedSupplier] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter items needing reorder (quantity <= reorderPoint)
  const alertItems = items.filter((i) => i.quantity <= i.reorderPoint);

  // Group items by supplier
  const supplierGroups: Record<string, InventoryItem[]> = {};
  alertItems.forEach((item) => {
    const key = item.supplier || 'Unassigned Supplier';
    if (!supplierGroups[key]) supplierGroups[key] = [];
    supplierGroups[key].push(item);
  });

  const totalPOCost = alertItems.reduce((acc, item) => {
    const qtyNeeded = Math.max(1, item.idealStock - item.quantity);
    return acc + qtyNeeded * item.unitCost;
  }, 0);

  const copyPOText = (supplier: string, groupItems: InventoryItem[]) => {
    const lines = [
      `PURCHASE ORDER - ${businessProfile.name}`,
      `Supplier: ${supplier}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `------------------------------------------`,
    ];

    groupItems.forEach((item) => {
      const qtyNeeded = Math.max(1, item.idealStock - item.quantity);
      const estCost = qtyNeeded * item.unitCost;
      lines.push(
        `${item.sku} | ${item.name} | Qty: ${qtyNeeded} | Unit Cost: ${currency}${item.unitCost.toFixed(2)} | Subtotal: ${currency}${estCost.toFixed(2)}`
      );
    });

    lines.push(`------------------------------------------`);
    const groupTotal = groupItems.reduce(
      (s, i) => s + Math.max(1, i.idealStock - i.quantity) * i.unitCost,
      0
    );
    lines.push(`Total PO Value: ${currency}${groupTotal.toFixed(2)}`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSupplier(supplier);
    setTimeout(() => setCopiedSupplier(null), 2500);
  };

  const handleRestockAllAlertItems = () => {
    const payload = alertItems.map((i) => ({
      id: i.id,
      qty: Math.max(1, i.idealStock - i.quantity),
    }));
    onConfirmAllRestock(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-900 text-emerald-400 rounded-lg">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Automated Purchase Order Generator
              </h2>
              <p className="text-xs text-slate-500">
                Generated PO drafts grouped by vendor for low-stock SKUs.
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

        {/* PO Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {alertItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              🎉 No items require purchase orders at this time. All stock levels are healthy!
            </div>
          ) : (
            Object.entries(supplierGroups).map(([supplierName, groupItems]) => {
              const supplierTotal = groupItems.reduce(
                (sum, i) => sum + Math.max(1, i.idealStock - i.quantity) * i.unitCost,
                0
              );
              const supplierEmail = groupItems[0]?.supplierEmail;

              return (
                <div
                  key={supplierName}
                  className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{supplierName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {groupItems.length} SKU(s)
                        </span>
                      </div>
                      {supplierEmail && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Email: {supplierEmail}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyPOText(supplierName, groupItems)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-100"
                      >
                        {copiedSupplier === supplierName ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Copied PO!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy PO Text</span>
                          </>
                        )}
                      </button>

                      {supplierEmail && (
                        <a
                          href={`mailto:${supplierEmail}?subject=Purchase Order - ${businessProfile.name}&body=Please accept the purchase order for ${groupItems.length} items.`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Email Order</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Table of items for this supplier */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2 px-1">SKU & Item</th>
                          <th className="py-2 px-1 text-center">Current</th>
                          <th className="py-2 px-1 text-center">Target</th>
                          <th className="py-2 px-1 text-center">Order Qty</th>
                          <th className="py-2 px-1 text-right">Unit Cost</th>
                          <th className="py-2 px-1 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800">
                        {groupItems.map((item) => {
                          const orderQty = Math.max(1, item.idealStock - item.quantity);
                          const subtotal = orderQty * item.unitCost;

                          return (
                            <tr key={item.id}>
                              <td className="py-2 px-1">
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {item.name}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  {item.sku}
                                </div>
                              </td>
                              <td className="py-2 px-1 text-center font-semibold text-rose-600">
                                {item.quantity}
                              </td>
                              <td className="py-2 px-1 text-center text-slate-500">
                                {item.idealStock}
                              </td>
                              <td className="py-2 px-1 text-center font-bold text-emerald-600">
                                +{orderQty}
                              </td>
                              <td className="py-2 px-1 text-right text-slate-600 dark:text-slate-400">
                                {currency}{item.unitCost.toFixed(2)}
                              </td>
                              <td className="py-2 px-1 text-right font-bold text-slate-900 dark:text-white">
                                {currency}{subtotal.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 text-right text-xs font-bold text-slate-900 dark:text-white">
                    Vendor Total: <span className="text-emerald-600">{currency}{supplierTotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500">Total Purchase Order Estimate:</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {currency}{totalPOCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Close
            </button>
            {alertItems.length > 0 && (
              <button
                onClick={handleRestockAllAlertItems}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                Simulate Receiving All ({alertItems.length}) POs
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
