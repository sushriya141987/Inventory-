import React, { useState, useEffect } from 'react';
import { X, Package, Barcode, Sparkles, RefreshCw } from 'lucide-react';
import { InventoryItem } from '../types';
import { generateRandomBarcode } from '../utils/inventoryUtils';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id'> & { id?: string }) => void;
  initialItem?: InventoryItem | null;
  categories: string[];
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  categories,
}) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    customCategory: '',
    quantity: 10,
    reorderPoint: 5,
    idealStock: 25,
    unitCost: 10.00,
    retailPrice: 20.00,
    supplier: '',
    supplierEmail: '',
    leadTimeDays: 3,
    location: '',
    barcode: '',
    notes: '',
  });

  useEffect(() => {
    if (initialItem) {
      setFormData({
        sku: initialItem.sku,
        name: initialItem.name,
        category: categories.includes(initialItem.category) ? initialItem.category : 'NEW',
        customCategory: categories.includes(initialItem.category) ? '' : initialItem.category,
        quantity: initialItem.quantity,
        reorderPoint: initialItem.reorderPoint,
        idealStock: initialItem.idealStock,
        unitCost: initialItem.unitCost,
        retailPrice: initialItem.retailPrice,
        supplier: initialItem.supplier,
        supplierEmail: initialItem.supplierEmail || '',
        leadTimeDays: initialItem.leadTimeDays,
        location: initialItem.location,
        barcode: initialItem.barcode,
        notes: initialItem.notes || '',
      });
    } else {
      const generatedSKU = 'SKU-' + Math.floor(10000 + Math.random() * 90000);
      setFormData({
        sku: generatedSKU,
        name: '',
        category: categories[0] || 'General',
        customCategory: '',
        quantity: 10,
        reorderPoint: 5,
        idealStock: 25,
        unitCost: 5.00,
        retailPrice: 12.00,
        supplier: 'Main Wholesaler',
        supplierEmail: '',
        leadTimeDays: 3,
        location: 'Aisle 1',
        barcode: generateRandomBarcode(),
        notes: '',
      });
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory =
      formData.category === 'NEW' ? formData.customCategory.trim() : formData.category;

    if (!formData.name.trim() || !formData.sku.trim() || !finalCategory) {
      alert('Please fill in required fields (Name, SKU, Category).');
      return;
    }

    onSave({
      id: initialItem?.id,
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      category: finalCategory,
      quantity: Number(formData.quantity),
      reorderPoint: Number(formData.reorderPoint),
      idealStock: Number(formData.idealStock),
      unitCost: Number(formData.unitCost),
      retailPrice: Number(formData.retailPrice),
      supplier: formData.supplier.trim() || 'General Supplier',
      supplierEmail: formData.supplierEmail.trim(),
      leadTimeDays: Number(formData.leadTimeDays),
      location: formData.location.trim() || 'Unassigned',
      lastRestocked: initialItem?.lastRestocked || new Date().toISOString().split('T')[0],
      barcode: formData.barcode.trim() || generateRandomBarcode(),
      notes: formData.notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg text-emerald-700 dark:text-emerald-300">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialItem ? 'Edit Inventory Item' : 'Add New SKU / Product'}
              </h2>
              <p className="text-xs text-slate-500">
                Set stock levels, reorder threshold alerts, and pricing details.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Item Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Item / Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ethiopia Yirgacheffe Beans (1kg)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                SKU / Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. COF-ETH-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="NEW">+ Add New Category</option>
              </select>

              {formData.category === 'NEW' && (
                <input
                  type="text"
                  placeholder="Enter new category name..."
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                  className="w-full mt-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            {/* Current Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Quantity in Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Reorder Threshold Point */}
            <div>
              <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                Low-Stock Alert Threshold (Min) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.reorderPoint}
                onChange={(e) => setFormData({ ...formData, reorderPoint: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Triggers low-stock alert when stock ≤ this number.
              </span>
            </div>

            {/* Target Ideal Stock */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ideal Target Stock Level
              </label>
              <input
                type="number"
                min="1"
                value={formData.idealStock}
                onChange={(e) => setFormData({ ...formData, idealStock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unit Wholesale Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Retail Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Retail Selling Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.retailPrice}
                onChange={(e) => setFormData({ ...formData, retailPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Supplier Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Supplier / Vendor Name
              </label>
              <input
                type="text"
                placeholder="e.g. Highland Specialty Importers"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Supplier Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Supplier Email (for POs)
              </label>
              <input
                type="email"
                placeholder="e.g. orders@supplier.com"
                value={formData.supplierEmail}
                onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Lead Time Days */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lead Time (Days)
              </label>
              <input
                type="number"
                min="1"
                value={formData.leadTimeDays}
                onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Shelf Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Warehouse / Shelf Location
              </label>
              <input
                type="text"
                placeholder="e.g. Aisle 2 - Shelf B"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Barcode UPC */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Barcode / UPC Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 890123456001"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="flex-1 px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, barcode: generateRandomBarcode() })}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Generate
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Internal Notes / Specifications
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes or supplier details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Form Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              {initialItem ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
