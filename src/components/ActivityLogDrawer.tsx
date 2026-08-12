import React from 'react';
import { X, History, TrendingDown, TrendingUp, RefreshCw, FileText } from 'lucide-react';
import { StockLog } from '../types';

interface ActivityLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: StockLog[];
  onClearLogs: () => void;
}

export const ActivityLogDrawer: React.FC<ActivityLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-900 text-emerald-400 rounded-lg">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Real-Time Movement Log
              </h2>
              <p className="text-[11px] text-slate-500">
                Live audit trail of sales, restocks, and manual stock updates.
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

        {/* Log List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No stock activity recorded yet.
            </div>
          ) : (
            logs.map((log) => {
              const isPositive = log.changeAmount > 0;
              const dateStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                      {log.sku}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {dateStr}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 dark:text-white">
                    {log.itemName}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span
                      className={`font-extrabold flex items-center gap-1 ${
                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />)}
                      {isPositive ? `+${log.changeAmount}` : log.changeAmount} units ({log.type.toUpperCase()})
                    </span>

                    <span className="text-slate-500">
                      New Stock: <strong className="text-slate-800 dark:text-slate-200">{log.newQuantity}</strong>
                    </span>
                  </div>

                  {log.note && (
                    <div className="text-[10px] text-slate-400 italic pt-0.5">
                      "{log.note}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">
            Total Records: {logs.length}
          </span>
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-rose-600 hover:text-rose-700 font-semibold"
            >
              Clear Log History
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
