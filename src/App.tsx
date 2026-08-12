/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, StockLog, BusinessProfile } from './types';
import { INITIAL_ITEMS, INITIAL_LOGS, BUSINESS_PROFILES } from './data/initialData';
import { getStockStatus, exportInventoryToCSV } from './utils/inventoryUtils';

import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { AlertsBanner } from './components/AlertsBanner';
import { InventoryTable } from './components/InventoryTable';
import { ItemModal } from './components/ItemModal';
import { QuickRestockModal } from './components/QuickRestockModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { AIInsightsPanel } from './components/AIInsightsPanel';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ActivityLogDrawer } from './components/ActivityLogDrawer';
import { PurchaseOrderModal } from './components/PurchaseOrderModal';

const STORAGE_ITEMS_KEY = 'inventory_brief_items_v2';
const STORAGE_LOGS_KEY = 'inventory_brief_logs_v2';

export default function App() {
  const [currentProfile, setCurrentProfile] = useState<BusinessProfile>(BUSINESS_PROFILES[0]);

  // Load state from localStorage or initialData
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_ITEMS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ITEMS;
  });

  const [logs, setLogs] = useState<StockLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_LOGS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_LOGS;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'inventory' | 'insights' | 'analytics'>('inventory');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [restockTargetItem, setRestockTargetItem] = useState<InventoryItem | null>(null);

  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isPOOpen, setIsPOOpen] = useState<boolean>(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState<boolean>(false);

  // Persist items
  useEffect(() => {
    localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  // Persist logs
  useEffect(() => {
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
  }, [logs]);

  // Simulated live customer sales traffic loop
  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => {
        setItems((prevItems) => {
          if (prevItems.length === 0) return prevItems;
          // Select a random in-stock item to decrement by 1
          const availableItems = prevItems.filter((i) => i.quantity > 0);
          if (availableItems.length === 0) return prevItems;

          const randomIndex = Math.floor(Math.random() * availableItems.length);
          const target = availableItems[randomIndex];

          const updatedQuantity = target.quantity - 1;

          // Record sales log
          const newLog: StockLog = {
            id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            itemId: target.id,
            itemName: target.name,
            sku: target.sku,
            changeAmount: -1,
            newQuantity: updatedQuantity,
            type: 'sale',
            timestamp: new Date().toISOString(),
            note: 'Simulated point-of-sale customer transaction',
          };

          setLogs((prevLogs) => [newLog, ...prevLogs]);

          return prevItems.map((item) =>
            item.id === target.id ? { ...item, quantity: updatedQuantity } : item
          );
        });
      }, 3500); // Trigger sales every 3.5 seconds
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Category list derived from items
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.category));
    return Array.from(set);
  }, [items]);

  // Alert counts
  const lowStockCount = items.filter((i) => getStockStatus(i) === 'low').length;
  const outOfStockCount = items.filter((i) => getStockStatus(i) === 'out_of_stock').length;

  // Handlers for Stock Updates
  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);

          const newLog: StockLog = {
            id: 'log-' + Date.now(),
            itemId: item.id,
            itemName: item.name,
            sku: item.sku,
            changeAmount: delta,
            newQuantity: newQty,
            type: delta > 0 ? 'restock' : 'sale',
            timestamp: new Date().toISOString(),
            note: 'Manual quick adjustment from table',
          };
          setLogs((prevLogs) => [newLog, ...prevLogs]);

          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleConfirmRestock = (itemId: string, restockQty: number, note?: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const newQty = item.quantity + restockQty;

          const newLog: StockLog = {
            id: 'log-' + Date.now(),
            itemId: item.id,
            itemName: item.name,
            sku: item.sku,
            changeAmount: restockQty,
            newQuantity: newQty,
            type: 'restock',
            timestamp: new Date().toISOString(),
            note: note || `Restocked +${restockQty} units`,
          };
          setLogs((prevLogs) => [newLog, ...prevLogs]);

          return {
            ...item,
            quantity: newQty,
            lastRestocked: new Date().toISOString().split('T')[0],
          };
        }
        return item;
      })
    );
  };

  const handleConfirmAllRestock = (restockList: { id: string; qty: number }[]) => {
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    setItems((prevItems) => {
      const map = new Map(restockList.map((r) => [r.id, r.qty]));

      return prevItems.map((item) => {
        if (map.has(item.id)) {
          const qtyToAdd = map.get(item.id)!;
          const newQty = item.quantity + qtyToAdd;

          const newLog: StockLog = {
            id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            itemId: item.id,
            itemName: item.name,
            sku: item.sku,
            changeAmount: qtyToAdd,
            newQuantity: newQty,
            type: 'reorder',
            timestamp: now,
            note: `Received supplier PO restock (+${qtyToAdd})`,
          };
          setLogs((prevLogs) => [newLog, ...prevLogs]);

          return {
            ...item,
            quantity: newQty,
            lastRestocked: today,
          };
        }
        return item;
      });
    });
  };

  // Add / Edit Item
  const handleSaveItem = (itemData: Omit<InventoryItem, 'id'> & { id?: string }) => {
    if (itemData.id) {
      // Edit existing
      setItems((prev) =>
        prev.map((i) => (i.id === itemData.id ? ({ ...itemData, id: itemData.id } as InventoryItem) : i))
      );
    } else {
      // Create new
      const newItem: InventoryItem = {
        ...itemData,
        id: 'item-' + Date.now(),
      };
      setItems((prev) => [newItem, ...prev]);

      const newLog: StockLog = {
        id: 'log-' + Date.now(),
        itemId: newItem.id,
        itemName: newItem.name,
        sku: newItem.sku,
        changeAmount: newItem.quantity,
        newQuantity: newItem.quantity,
        type: 'restock',
        timestamp: new Date().toISOString(),
        note: 'Initial SKU created in system',
      };
      setLogs((prev) => [newLog, ...prev]);
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleExportCSV = () => {
    exportInventoryToCSV(items, `${currentProfile.name.toLowerCase().replace(/\s+/g, '_')}_inventory.csv`);
  };

  const handleUpdateCurrency = (newCurrency: string) => {
    setCurrentProfile((prev) => ({ ...prev, currency: newCurrency }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Navbar Header */}
      <Header
        currentProfile={currentProfile}
        onSelectProfile={setCurrentProfile}
        onUpdateCurrency={handleUpdateCurrency}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        onOpenAddItem={() => {
          setEditingItem(null);
          setIsItemModalOpen(true);
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenPO={() => setIsPOOpen(true)}
        onOpenActivityLog={() => setIsActivityLogOpen(true)}
        onExportCSV={handleExportCSV}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Executive Metrics Overview */}
        <MetricsOverview
          items={items}
          currency={currentProfile.currency}
          onFilterLowStock={() => {
            setSelectedStatus('ALERT');
            setActiveTab('inventory');
          }}
          onFilterOutOfStock={() => {
            setSelectedStatus('ALERT');
            setActiveTab('inventory');
          }}
          onShowAll={() => {
            setSelectedStatus('ALL');
            setSelectedCategory('ALL');
            setActiveTab('inventory');
          }}
          onOpenPO={() => setIsPOOpen(true)}
        />

        {/* Real-Time Low Stock Alert Carousel */}
        <AlertsBanner
          items={items}
          currency={currentProfile.currency}
          onQuickRestock={(item) => {
            setRestockTargetItem(item);
            setIsRestockModalOpen(true);
          }}
          onOpenPO={() => setIsPOOpen(true)}
          onSelectCategoryFilter={(cat) => setSelectedCategory(cat)}
        />

        {/* Tab View Switching */}
        {activeTab === 'inventory' && (
          <InventoryTable
            items={items}
            categories={categories}
            currency={currentProfile.currency}
            onUpdateQuantity={handleUpdateQuantity}
            onQuickRestock={(item) => {
              setRestockTargetItem(item);
              setIsRestockModalOpen(true);
            }}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
            onOpenAddItem={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
          />
        )}

        {activeTab === 'insights' && (
          <AIInsightsPanel
            items={items}
            logs={logs}
            businessName={currentProfile.name}
            currency={currentProfile.currency}
            onQuickRestock={(item) => {
              setRestockTargetItem(item);
              setIsRestockModalOpen(true);
            }}
            onOpenPO={() => setIsPOOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsCharts items={items} currency={currentProfile.currency} />
        )}
      </main>

      {/* Modals & Slide-overs */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        initialItem={editingItem}
        categories={categories}
      />

      <QuickRestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        item={restockTargetItem}
        onConfirmRestock={handleConfirmRestock}
        currency={currentProfile.currency}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        items={items}
        onUpdateQuantity={handleUpdateQuantity}
        onQuickRestock={(item) => {
          setRestockTargetItem(item);
          setIsRestockModalOpen(true);
        }}
        currency={currentProfile.currency}
      />

      <PurchaseOrderModal
        isOpen={isPOOpen}
        onClose={() => setIsPOOpen(false)}
        items={items}
        currency={currentProfile.currency}
        businessProfile={currentProfile}
        onConfirmAllRestock={handleConfirmAllRestock}
      />

      <ActivityLogDrawer
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        logs={logs}
        onClearLogs={() => setLogs([])}
      />
    </div>
  );
}
