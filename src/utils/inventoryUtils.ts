import { InventoryItem, StockStatus } from '../types';

export function getStockStatus(item: InventoryItem): StockStatus {
  if (!item) return 'out_of_stock';
  const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
  const reorderPoint = typeof item.reorderPoint === 'number' && !isNaN(item.reorderPoint) ? item.reorderPoint : 0;
  const idealStock = typeof item.idealStock === 'number' && !isNaN(item.idealStock) ? item.idealStock : 0;

  if (qty <= 0) return 'out_of_stock';
  if (qty <= reorderPoint) return 'low';
  if (qty >= Math.max(idealStock * 1.25, reorderPoint * 3)) return 'overstocked';
  return 'healthy';
}

export function getStatusBadgeInfo(status: StockStatus) {
  switch (status) {
    case 'out_of_stock':
      return {
        label: 'Out of Stock',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
        dotBg: 'bg-rose-500 animate-pulse',
      };
    case 'low':
      return {
        label: 'Low Stock',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
        dotBg: 'bg-amber-500 animate-ping',
      };
    case 'overstocked':
      return {
        label: 'Overstocked',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        dotBg: 'bg-blue-500',
      };
    case 'healthy':
    default:
      return {
        label: 'In Stock',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
        dotBg: 'bg-emerald-500',
      };
  }
}

export function calculateTotalCostValue(items: InventoryItem[]): number {
  return items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
}

export function calculateTotalRetailValue(items: InventoryItem[]): number {
  return items.reduce((acc, item) => acc + item.quantity * item.retailPrice, 0);
}

export function exportInventoryToCSV(items: InventoryItem[], filename = 'inventory_export.csv') {
  const headers = [
    'SKU',
    'Name',
    'Category',
    'Quantity',
    'ReorderPoint',
    'IdealStock',
    'UnitCost',
    'RetailPrice',
    'Supplier',
    'SupplierEmail',
    'LeadTimeDays',
    'Location',
    'Barcode',
    'Status'
  ];

  const rows = items.map(item => [
    `"${item.sku.replace(/"/g, '""')}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.category.replace(/"/g, '""')}"`,
    item.quantity,
    item.reorderPoint,
    item.idealStock,
    item.unitCost,
    item.retailPrice,
    `"${item.supplier.replace(/"/g, '""')}"`,
    `"${(item.supplierEmail || '').replace(/"/g, '""')}"`,
    item.leadTimeDays,
    `"${item.location.replace(/"/g, '""')}"`,
    `"${item.barcode.replace(/"/g, '""')}"`,
    getStockStatus(item)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAuditTrailToCSV(auditLogs: any[], filename = 'audit_trail_export.csv') {
  const headers = [
    'Log ID',
    'Category',
    'Action',
    'Performed By (Name)',
    'Performed By (Role)',
    'Target Entity',
    'Details',
    'Timestamp',
    'IP Address'
  ];

  const rows = auditLogs.map(log => [
    `"${log.id}"`,
    `"${log.category}"`,
    `"${log.action.replace(/"/g, '""')}"`,
    `"${log.actorName.replace(/"/g, '""')}"`,
    `"${log.actorRole}"`,
    `"${log.targetEntity.replace(/"/g, '""')}"`,
    `"${log.details.replace(/"/g, '""')}"`,
    `"${log.timestamp}"`,
    `"${log.ipAddress || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateRandomBarcode(): string {
  const prefix = '890';
  const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
  return prefix + random8;
}
