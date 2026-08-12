export type StockStatus = 'healthy' | 'low' | 'out_of_stock' | 'overstocked';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorderPoint: number;
  idealStock: number;
  unitCost: number;
  retailPrice: number;
  supplier: string;
  supplierEmail?: string;
  leadTimeDays: number;
  location: string;
  lastRestocked: string;
  barcode: string;
  notes?: string;
}

export interface StockLog {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  changeAmount: number;
  newQuantity: number;
  type: 'sale' | 'restock' | 'adjustment' | 'reorder';
  timestamp: string;
  note?: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  type: 'cafe' | 'boutique' | 'craft_brewery' | 'hardware';
  currency: string;
}

export interface AIRecommendation {
  sku: string;
  itemName: string;
  reason: string;
  suggestedReorderQty: number;
  estimatedCost: number;
  priority: 'CRITICAL' | 'MEDIUM' | 'LOW';
}

export interface AIInsightResponse {
  executiveSummary: string;
  urgentActionRequired: boolean;
  healthScore: number; // 0 to 100
  recommendations: AIRecommendation[];
  inventoryHealthObservations: string[];
}
