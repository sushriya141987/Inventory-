import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  QrCode, 
  FileSpreadsheet, 
  Sparkles, 
  Play, 
  History, 
  ShoppingCart,
  Store
} from 'lucide-react';
import { BusinessProfile } from '../types';
import { BUSINESS_PROFILES } from '../data/initialData';

interface HeaderProps {
  currentProfile: BusinessProfile;
  onSelectProfile: (profile: BusinessProfile) => void;
  onUpdateCurrency: (currency: string) => void;
  lowStockCount: number;
  outOfStockCount: number;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onOpenAddItem: () => void;
  onOpenScanner: () => void;
  onOpenPO: () => void;
  onOpenActivityLog: () => void;
  onExportCSV: () => void;
  activeTab: 'inventory' | 'analytics' | 'insights';
  onChangeTab: (tab: 'inventory' | 'analytics' | 'insights') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProfile,
  onSelectProfile,
  onUpdateCurrency,
  lowStockCount,
  outOfStockCount,
  isSimulating,
  onToggleSimulation,
  onOpenAddItem,
  onOpenScanner,
  onOpenPO,
  onOpenActivityLog,
  onExportCSV,
  activeTab,
  onChangeTab,
}) => {
  const totalAlerts = lowStockCount + outOfStockCount;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Store Selector */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Package className="h-5 w-5 text-emerald-400 dark:text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                  Inventory Brief
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Real-time
                </span>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <Store className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={currentProfile.id}
                    onChange={(e) => {
                      const found = BUSINESS_PROFILES.find((p) => p.id === e.target.value);
                      if (found) onSelectProfile(found);
                    }}
                    className="text-xs font-medium bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-2 hover:text-slate-900"
                  >
                    {BUSINESS_PROFILES.map((profile) => (
                      <option key={profile.id} value={profile.id} className="dark:bg-slate-800">
                        {profile.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Currency Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <select
                    value={currentProfile.currency}
                    onChange={(e) => onUpdateCurrency(e.target.value)}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                    title="Change Currency Symbol"
                  >
                    <option value="₹">₹ (INR)</option>
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="£">£ (GBP)</option>
                    <option value="A$">A$ (AUD)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => onChangeTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              Stock Table
              {totalAlerts > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {totalAlerts}
                </span>
              )}
            </button>

            <button
              onClick={() => onChangeTab('insights')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'insights'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              AI Brief
            </button>

            <button
              onClick={() => onChangeTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Analytics
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Live Traffic Simulation Switch */}
            <button
              onClick={onToggleSimulation}
              title={isSimulating ? "Pause live sales simulation" : "Start live sales traffic simulation"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isSimulating
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                  : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Play className={`h-3.5 w-3.5 ${isSimulating ? 'fill-rose-600' : ''}`} />
              <span className="hidden sm:inline">
                {isSimulating ? 'Simulating Sales...' : 'Simulate Sales'}
              </span>
            </button>

            {/* Scan Barcode */}
            <button
              onClick={onOpenScanner}
              title="Scan item barcode or SKU"
              className="p-2 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <QrCode className="h-4 w-4" />
            </button>

            {/* Recent Activity Log */}
            <button
              onClick={onOpenActivityLog}
              title="View real-time stock movement logs"
              className="p-2 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <History className="h-4 w-4" />
            </button>

            {/* Purchase Order Generator */}
            <button
              onClick={onOpenPO}
              className="relative p-2 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Generate Purchase Order for low stock items"
            >
              <ShoppingCart className="h-4 w-4" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
                  {totalAlerts}
                </span>
              )}
            </button>

            {/* CSV Export */}
            <button
              onClick={onExportCSV}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors"
              title="Export current stock to CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export
            </button>

            {/* Add Item Button */}
            <button
              onClick={onOpenAddItem}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add SKU</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => onChangeTab('inventory')}
            className={`px-3 py-1 text-xs font-semibold rounded-md ${
              activeTab === 'inventory' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Inventory ({totalAlerts ? `! ${totalAlerts}` : 'OK'})
          </button>
          <button
            onClick={() => onChangeTab('insights')}
            className={`px-3 py-1 text-xs font-semibold rounded-md ${
              activeTab === 'insights' ? 'bg-indigo-600 text-white' : 'text-slate-600'
            }`}
          >
            AI Brief
          </button>
          <button
            onClick={() => onChangeTab('analytics')}
            className={`px-3 py-1 text-xs font-semibold rounded-md ${
              activeTab === 'analytics' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>
    </header>
  );
};
