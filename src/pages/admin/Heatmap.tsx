import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/shared/AdminSidebar';
import HeatmapGrid from '@/components/admin/HeatmapGrid';
import { useAppStore } from '@/store/useAppStore';
import type { HeatmapDimension, HeatmapType } from '@/types';
import { Calendar, Users, DollarSign, RefreshCw, BarChart3 } from 'lucide-react';
import clsx from 'clsx';
import { formatCurrency, formatNumber, formatHour } from '@/utils/formatters';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const dimensions: { key: HeatmapDimension; label: string }[] = [
  { key: 'day', label: '今日(24H)' },
  { key: 'week', label: '近7天' },
  { key: 'month', label: '近30天' },
];

export default function AdminHeatmap() {
  const data = useAppStore(s => s.heatmapData);
  const refresh = useAppStore(s => s.refreshHeatmap);

  const [dim, setDim] = useState<HeatmapDimension>('week');
  const [type, setType] = useState<HeatmapType>('customers');

  useEffect(() => {
    refresh(dim);
  }, [dim, refresh]);

  const lineData = data.map(day => ({
    name: dim === 'day' ? formatHour(0).slice(0, 2) : `${day.weekday}\n${day.date.slice(5)}`,
    客流量: day.hourlyData.reduce((s, h) => s + h.customers, 0),
    销售额: day.hourlyData.reduce((s, h) => s + h.revenue, 0)
  }));

  const totalCustomers = data.reduce((s, d) => s + d.hourlyData.reduce((a, h) => a + h.customers, 0), 0);
  const totalRevenue = data.reduce((s, d) => s + d.hourlyData.reduce((a, h) => a + h.revenue, 0), 0);
  const peakHour = (() => {
    let best: { hour: number; day: string; value: number } | null = null;
    data.forEach(d => {
      d.hourlyData.forEach(h => {
        const v = type === 'customers' ? h.customers : h.revenue;
        if (!best || v > best.value) best = { hour: h.hour, day: d.date, value: v };
      });
    });
    return best;
  })();

  return (
    <div className="min-h-screen gradient-admin-bg flex">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-6 animate-fade-in">
        <header className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-sky-400/60 mb-1 tracking-[0.2em] uppercase">Data Visualization</div>
            <h1 className="text-2xl font-bold text-white admin-font-mono tracking-tight">
              24小时营业热力图
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              分时段客流量与销售额可视化，识别业务高峰与低谷时段
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
              {dimensions.map(d => (
                <button
                  key={d.key}
                  onClick={() => setDim(d.key)}
                  className={clsx(
                    'px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                    dim === d.key
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {d.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => refresh(dim)}
              className="btn-admin-ghost px-4 py-1.5 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重新生成
            </button>
          </div>
        </header>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="glass-admin rounded-xl p-5">
            <div className="flex items-center gap-2 text-xs text-sky-400/70 mb-2">
              <Users className="w-3.5 h-3.5" />
              {dim === 'day' ? '今日客流量' : dim === 'week' ? '本周客流量' : '本月客流量'}
            </div>
            <div className="text-2xl font-bold text-sky-300 admin-font-mono">
              {formatNumber(totalCustomers)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              日均 {formatNumber(Math.round(totalCustomers / data.length))}
            </div>
          </div>
          <div className="glass-admin rounded-xl p-5">
            <div className="flex items-center gap-2 text-xs text-emerald-400/70 mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              {dim === 'day' ? '今日销售额' : dim === 'week' ? '本周销售额' : '本月销售额'}
            </div>
            <div className="text-2xl font-bold text-emerald-300 admin-font-mono">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              日均 {formatCurrency(totalRevenue / data.length)}
            </div>
          </div>
          <div className="glass-admin rounded-xl p-5">
            <div className="flex items-center gap-2 text-xs text-amber-400/70 mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              客单价
            </div>
            <div className="text-2xl font-bold text-amber-300 admin-font-mono">
              {formatCurrency(totalCustomers > 0 ? totalRevenue / totalCustomers : 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              时段平均消费
            </div>
          </div>
          <div className="glass-admin rounded-xl p-5">
            <div className="flex items-center gap-2 text-xs text-violet-400/70 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              {type === 'customers' ? '客流高峰' : '销售高峰'}
            </div>
            <div className="text-xl font-bold text-violet-300 admin-font-mono">
              {peakHour ? `${peakHour.day?.slice(5) || '今日'} ${formatHour(peakHour.hour)}` : '-'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {peakHour
                ? (type === 'customers' ? `${peakHour.value} 人` : formatCurrency(peakHour.value))
                : '-'}
            </div>
          </div>
        </div>

        <div className="glass-admin rounded-xl p-4">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
              <button
                onClick={() => setType('customers')}
                className={clsx(
                  'px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                  type === 'customers'
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Users className="w-3.5 h-3.5" /> 客流量热力图
              </button>
              <button
                onClick={() => setType('revenue')}
                className={clsx(
                  'px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                  type === 'revenue'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <DollarSign className="w-3.5 h-3.5" /> 销售额热力图
              </button>
            </div>
            <div className="text-[11px] text-slate-500">
              悬停色块可查看精确数值
            </div>
          </div>

          <HeatmapGrid data={data} type={type} />
        </div>

        <div className="glass-admin rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-300" />
            趋势折线图
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <defs>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
                <Line
                  type="monotone"
                  yAxisId="left"
                  dataKey="客流量"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#38BDF8' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  yAxisId="right"
                  dataKey="销售额"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10B981' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
