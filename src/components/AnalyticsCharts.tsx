import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { InventoryItem } from '../types';
import { getStockStatus } from '../utils/inventoryUtils';

interface AnalyticsChartsProps {
  items: InventoryItem[];
  currency: string;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ items, currency }) => {
  // 1. Value by Category
  const categoryMap: Record<string, { name: string; costValue: number; count: number }> = {};
  items.forEach((item) => {
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = { name: item.category, costValue: 0, count: 0 };
    }
    categoryMap[item.category].costValue += item.quantity * item.unitCost;
    categoryMap[item.category].count += 1;
  });

  const categoryData = Object.values(categoryMap).map((cat) => ({
    ...cat,
    costValue: Math.round(cat.costValue * 100) / 100,
  }));

  // 2. Health Status Breakdown
  let healthyCount = 0;
  let lowCount = 0;
  let outCount = 0;
  let overCount = 0;

  items.forEach((item) => {
    const status = getStockStatus(item);
    if (status === 'out_of_stock') outCount++;
    else if (status === 'low') lowCount++;
    else if (status === 'overstocked') overCount++;
    else healthyCount++;
  });

  const statusData = [
    { name: 'Healthy Stock', value: healthyCount, color: '#10b981' },
    { name: 'Low Stock Alert', value: lowCount, color: '#f59e0b' },
    { name: 'Out of Stock', value: outCount, color: '#f43f5e' },
    { name: 'Overstocked', value: overCount, color: '#3b82f6' },
  ].filter((d) => d.value > 0);

  // 3. Top SKUs by Stock Value
  const topValuedItems = [...items]
    .map((item) => ({
      name: item.name.length > 20 ? item.name.substring(0, 18) + '...' : item.name,
      value: Math.round(item.quantity * item.unitCost * 100) / 100,
      quantity: item.quantity,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="space-y-6 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Value Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Inventory Capital Distribution by Category
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Wholesale capital tied up across product categories.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${currency}${val}`, 'Valuation']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="costValue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Status Ratio */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Real-Time Stock Health Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Proportion of healthy vs alert status SKUs.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} SKU(s)`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 6 Valued SKUs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Top SKUs by Capital Investment
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Highest total wholesale value items currently held in stock.
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={topValuedItems} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
              <Tooltip
                formatter={(val: any) => [`${currency}${val}`, 'Total Valuation']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
