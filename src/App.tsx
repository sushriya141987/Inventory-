/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, StockLog, BusinessProfile, AppUser, UserRole, ApprovalRequest, AuditTrailEvent, AuditCategory } from './types';
import { INITIAL_ITEMS, INITIAL_LOGS, BUSINESS_PROFILES, INITIAL_USERS, INITIAL_APPROVAL_REQUESTS, INITIAL_AUDIT_LOGS } from './data/initialData';
import { getStockStatus, exportInventoryToCSV, exportAuditTrailToCSV } from './utils/inventoryUtils';

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
import { UserManagementView } from './components/UserManagementView';
import { InventoryReportsView } from './components/InventoryReportsView';

const STORAGE_ITEMS_KEY = 'inventory_brief_items_v2';
const STORAGE_LOGS_KEY = 'inventory_brief_logs_v2';
const STORAGE_USERS_KEY = 'inventory_brief_users_v2';
const STORAGE_APPROVALS_KEY = 'inventory_brief_approvals_v2';
const STORAGE_AUDIT_LOGS_KEY = 'inventory_brief_audit_logs_v2';

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

  // Users state
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_USERS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => users[0] || INITIAL_USERS[0]);

  // Pending approval requests state
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_APPROVALS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_APPROVAL_REQUESTS;
  });

  // Audit trail state
  const [auditLogs, setAuditLogs] = useState<AuditTrailEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_AUDIT_LOGS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Save audit logs to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helper to record audit trail events
  const addAuditLog = (
    category: AuditCategory,
    action: string,
    targetEntity: string,
    details: string,
    actor?: AppUser
  ) => {
    const currentActor = actor || currentUser;
    const newLog: AuditTrailEvent = {
      id: 'adt-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      category,
      action,
      actorId: currentActor.id,
      actorName: currentActor.name,
      actorRole: currentActor.role,
      targetEntity,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.10',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Feedback notification toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // UI state
  const [activeTab, setActiveTab] = useState<'inventory' | 'insights' | 'analytics' | 'users' | 'reports'>('inventory');
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

  // Persist users
  useEffect(() => {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  }, [users]);

  // Persist approvals
  useEffect(() => {
    localStorage.setItem(STORAGE_APPROVALS_KEY, JSON.stringify(approvalRequests));
  }, [approvalRequests]);

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

          // Audit Log
          addAuditLog(
            'STOCK_UPDATE',
            delta > 0 ? 'Stock Restocked' : 'Stock Quantity Deducted',
            `SKU: ${item.sku} (${item.name})`,
            `Stock quantity adjusted by ${delta > 0 ? '+' : ''}${delta} units. Updated level: ${newQty} units.`
          );

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

          // Audit Log
          addAuditLog(
            'STOCK_UPDATE',
            'Stock Restocked',
            `SKU: ${item.sku} (${item.name})`,
            `Restocked +${restockQty} units. Updated stock level: ${newQty} units. Note: ${note || 'Quick Restock'}`
          );

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

    addAuditLog(
      'STOCK_UPDATE',
      'Batch Supplier Restock',
      `PO Order (${restockList.length} SKUs)`,
      `Processed supplier purchase order delivery restocking ${restockList.length} items.`
    );
  };

  // Add / Edit Item
  const handleSaveItem = (itemData: Omit<InventoryItem, 'id'> & { id?: string }) => {
    if (itemData.id) {
      // Edit existing
      setItems((prev) =>
        prev.map((i) => (i.id === itemData.id ? ({ ...itemData, id: itemData.id } as InventoryItem) : i))
      );
      addAuditLog(
        'ITEM_MANAGEMENT',
        'SKU Modified',
        `SKU: ${itemData.sku} (${itemData.name})`,
        `Updated SKU details (Cost: ${itemData.unitCost}, Price: ${itemData.retailPrice}, Location: ${itemData.location}).`
      );
      showToast(`Updated SKU ${itemData.sku}`);
    } else {
      // If Admin, create immediately. If Limited User, create an approval request.
      if (currentUser.role === 'ADMIN') {
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
          note: `SKU created by Admin (${currentUser.name})`,
        };
        setLogs((prev) => [newLog, ...prev]);

        addAuditLog(
          'ITEM_MANAGEMENT',
          'SKU Created',
          `SKU: ${newItem.sku} (${newItem.name})`,
          `Created new inventory SKU directly with initial stock of ${newItem.quantity} units.`
        );
        showToast(`Created new SKU ${newItem.sku}`);
      } else {
        // Staff user requires admin approval for addition
        const newReq: ApprovalRequest = {
          id: 'req-' + Date.now(),
          type: 'ADD_ITEM',
          requestedByUserId: currentUser.id,
          requestedByUserName: currentUser.name,
          itemData,
          timestamp: new Date().toISOString(),
          status: 'PENDING',
        };
        setApprovalRequests((prev) => [newReq, ...prev]);

        addAuditLog(
          'APPROVAL',
          'Addition Requested',
          `SKU: ${itemData.sku} (${itemData.name})`,
          `Staff user ${currentUser.name} requested SKU creation for ${itemData.quantity} units. Awaiting Admin final approval.`
        );
        showToast(`SKU addition request submitted to Admin for final approval.`);
      }
    }
  };

  const handleDeleteItem = (id: string) => {
    const targetItem = items.find((i) => i.id === id);
    if (!targetItem) return;

    if (currentUser.role === 'ADMIN') {
      setItems((prev) => prev.filter((i) => i.id !== id));
      const newLog: StockLog = {
        id: 'log-' + Date.now(),
        itemId: targetItem.id,
        itemName: targetItem.name,
        sku: targetItem.sku,
        changeAmount: -targetItem.quantity,
        newQuantity: 0,
        type: 'adjustment',
        timestamp: new Date().toISOString(),
        note: `SKU deleted by Admin (${currentUser.name})`,
      };
      setLogs((prev) => [newLog, ...prev]);

      addAuditLog(
        'ITEM_MANAGEMENT',
        'SKU Deleted',
        `SKU: ${targetItem.sku} (${targetItem.name})`,
        `Permanently removed SKU from active catalog by Admin (${currentUser.name}).`
      );
      showToast(`Deleted SKU ${targetItem.sku}`);
    } else {
      // Staff user requires admin approval for deletion
      const newReq: ApprovalRequest = {
        id: 'req-' + Date.now(),
        type: 'DELETE_ITEM',
        requestedByUserId: currentUser.id,
        requestedByUserName: currentUser.name,
        targetItemId: id,
        itemData: targetItem,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
      };
      setApprovalRequests((prev) => [newReq, ...prev]);

      addAuditLog(
        'APPROVAL',
        'Deletion Requested',
        `SKU: ${targetItem.sku} (${targetItem.name})`,
        `Staff user ${currentUser.name} requested SKU deletion. Awaiting Admin final approval.`
      );
      showToast(`Deletion request for SKU ${targetItem.sku} sent to Admin for approval.`);
    }
  };

  // User Management Handlers
  const handleAddUser = (userData: Omit<AppUser, 'id' | 'createdAt'>) => {
    const newUser: AppUser = {
      ...userData,
      id: 'usr-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, newUser]);

    addAuditLog(
      'USER_MANAGEMENT',
      'User Created',
      `User: ${newUser.name} (${newUser.email})`,
      `Created new user account with role ${newUser.role} in department ${newUser.department}.`
    );
    showToast(`Created new user ${newUser.name} (${newUser.role})`);
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, role: newRole }));
    }

    addAuditLog(
      'USER_MANAGEMENT',
      'User Role Modified',
      `User: ${targetUser ? targetUser.name : userId}`,
      `Updated user access role permissions to ${newRole}.`
    );
    showToast(`Updated user role to ${newRole}`);
  };

  const handleToggleUserStatus = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const newStatus = targetUser?.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
          : u
      )
    );

    addAuditLog(
      'USER_MANAGEMENT',
      'User Status Changed',
      `User: ${targetUser ? targetUser.name : userId}`,
      `Toggled user account status to ${newStatus}.`
    );
    showToast(`Toggled user status`);
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    addAuditLog(
      'USER_MANAGEMENT',
      'User Deleted',
      `User: ${targetUser ? targetUser.name : userId}`,
      `Permanently deleted user account from the system.`
    );
    showToast(`User deleted permanently`);
  };

  // Approval Handlers
  const handleApproveRequest = (requestId: string) => {
    const req = approvalRequests.find((r) => r.id === requestId);
    if (!req || req.status !== 'PENDING') return;

    if (req.type === 'ADD_ITEM') {
      const newItem: InventoryItem = {
        ...(req.itemData as InventoryItem),
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
        note: `Approved addition requested by ${req.requestedByUserName}`,
      };
      setLogs((prev) => [newLog, ...prev]);

      addAuditLog(
        'APPROVAL',
        'Request Approved',
        `SKU: ${newItem.sku} (${newItem.name})`,
        `Approved SKU addition request from ${req.requestedByUserName}. Item added to inventory with ${newItem.quantity} units.`
      );
    } else if (req.type === 'DELETE_ITEM' && req.targetItemId) {
      setItems((prev) => prev.filter((i) => i.id !== req.targetItemId));

      const newLog: StockLog = {
        id: 'log-' + Date.now(),
        itemId: req.targetItemId,
        itemName: req.itemData.name || 'Deleted Item',
        sku: req.itemData.sku || 'N/A',
        changeAmount: 0,
        newQuantity: 0,
        type: 'adjustment',
        timestamp: new Date().toISOString(),
        note: `Approved deletion requested by ${req.requestedByUserName}`,
      };
      setLogs((prev) => [newLog, ...prev]);

      addAuditLog(
        'APPROVAL',
        'Request Approved',
        `SKU: ${req.itemData.sku || 'N/A'} (${req.itemData.name || 'Item'})`,
        `Approved SKU deletion request from ${req.requestedByUserName}. Item permanently deleted.`
      );
    }

    setApprovalRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'APPROVED' } : r))
    );
    showToast(`Approved request from ${req.requestedByUserName}`);
  };

  const handleRejectRequest = (requestId: string, adminNote?: string) => {
    const req = approvalRequests.find((r) => r.id === requestId);

    setApprovalRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'REJECTED', adminNote } : r))
    );

    if (req) {
      addAuditLog(
        'APPROVAL',
        'Request Rejected',
        `SKU: ${req.itemData.sku || 'N/A'}`,
        `Rejected ${req.type === 'ADD_ITEM' ? 'addition' : 'deletion'} request from ${req.requestedByUserName}. Admin note: ${adminNote || 'None'}`
      );
    }
    showToast(`Request rejected.`);
  };

  const pendingApprovalsCount = approvalRequests.filter((r) => r.status === 'PENDING').length;

  const handleExportCSV = () => {
    exportInventoryToCSV(items, `${currentProfile.name.toLowerCase().replace(/\s+/g, '_')}_inventory.csv`);
  };

  const handleExportAuditCSV = () => {
    exportAuditTrailToCSV(auditLogs, `${currentProfile.name.toLowerCase().replace(/\s+/g, '_')}_audit_trail.csv`);
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
        currentUser={currentUser}
        users={users}
        onSwitchUser={setCurrentUser}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast Banner */}
        {toastMessage && (
          <div className="mb-4 p-3 bg-slate-900 text-white dark:bg-emerald-600 rounded-xl shadow-lg flex items-center justify-between text-xs font-bold animate-fadeIn">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="opacity-80 hover:opacity-100">✕</button>
          </div>
        )}

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

        {activeTab === 'reports' && (
          <InventoryReportsView
            items={items}
            logs={logs}
            currency={currentProfile.currency}
            currentProfile={currentProfile}
          />
        )}

        {activeTab === 'users' && (
          <UserManagementView
            users={users}
            currentUser={currentUser}
            approvalRequests={approvalRequests}
            auditLogs={auditLogs}
            onAddUser={handleAddUser}
            onUpdateUserRole={handleUpdateUserRole}
            onToggleUserStatus={handleToggleUserStatus}
            onDeleteUser={handleDeleteUser}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            inventoryItems={items}
            onExportAuditLogs={handleExportAuditCSV}
          />
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
