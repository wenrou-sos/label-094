import { useEffect } from 'react';
import AdminSidebar from '@/components/shared/AdminSidebar';
import MetricCard from '@/components/admin/MetricCard';
import { useAppStore } from '@/store/useAppStore';
import {
  Users, DollarSign, ShoppingCart, TrendingUp, HandPlatter, RefreshCw, Radio,
  Package, AlertTriangle, XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatPercent, formatCurrency, formatDateTime, formatNumber } from '@/utils/formatters';
import clsx from 'clsx';

export default function AdminDashboard() {
  const metrics = useAppStore(s => s.realtimeMetrics);
  const shelves = useAppStore(s => s.shelfMonitors);
  const behaviors = useAppStore(s => s.productBehaviors);
  const refresh = useAppStore(s => s.refreshMetrics);
  const getStockStats = useAppStore(s => s.getStockStats);
  const stockStats = getStockStats();

  useEffect(() => {
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, [refresh]);

  const shelfData = shelves.map(s => ({
    name: s.shelfName.split(' · ')[0],
    pickups: s.totalPickups,
    purchases: s.totalPurchases,
    conversion: Number((s.conversionRate * 100).toFixed(1))
  }));

  const topPicks = [...behaviors]
    .sort((a, b) => b.pickupCount - a.pickupCount)
    .slice(0, 6)
    .map(b => ({
      name: b.product.name.length > 7 ? b.product.name.slice(0, 7) + '…' : b.product.name,
      value: b.pickupCount
    }));

  const PIE_COLORS = ['#38BDF8', '#818CF8', '#F472B6', '#A78BFA', '#34D399', '#FBBF24'];

  return (
    <div className="min-h-screen gradient-admin-bg flex">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-6 animate-fade-in">
        <header className="flex items-end justify-between">
          <div>
            <div className="text-xs text-sky-400/60 mb-1 tracking-[0.2em] uppercase">Monitor Center</div>
            <h1 className="text-2xl font-bold text-white admin-font-mono tracking-tight">
              实时监控仪表盘
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              最近更新：<span className="text-sky-300 admin-font-mono">{formatDateTime(metrics.lastUpdated)}</span>
            </p>
          </div>
          <button
            onClick={refresh}
            className="btn-admin-ghost px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            手动刷新数据
          </button>
        </header>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
          <MetricCard
            title="今日客流量"
            value={metrics.todayCustomers}
            icon={Users}
            trend={6.8}
            accent="sky"
            subtitle="进店总人次"
          />
          <MetricCard
            title="今日销售额"
            value={metrics.todayRevenue}
            format="currency"
            icon={DollarSign}
            trend={12.3}
            accent="emerald"
            subtitle="累计成交"
          />
          <MetricCard
            title="商品拿取率"
            value={metrics.overallPickupRate}
            format="percent"
            icon={Radio}
            trend={-1.2}
            accent="violet"
            subtitle="进店→拿取"
          />
          <MetricCard
            title="成交转化率"
            value={metrics.overallConversionRate}
            format="percent"
            icon={TrendingUp}
            trend={3.7}
            accent="amber"
            subtitle="拿取→购买"
          />
          <MetricCard
            title="平均客单价"
            value={metrics.avgOrderValue}
            format="currency"
            icon={ShoppingCart}
            trend={2.1}
            accent="rose"
            subtitle="单笔消费"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass-admin rounded-xl p-5 border-r-4 border-emerald-400/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-emerald-300/80">库存充足</div>
              <Package className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-2xl font-bold text-white admin-font-mono mb-1">
              {stockStats.inStock}
            </div>
            <div className="text-[11px] text-slate-400">
              库存大于警戒线，销售正常
            </div>
          </div>
          <div className={clsx(
            'glass-admin rounded-xl p-5 border-r-4 transition-all',
            stockStats.lowStock > 0 ? 'border-amber-400/50 animate-pulse-slow' : 'border-slate-600/50'
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className={clsx(
                'text-xs',
                stockStats.lowStock > 0 ? 'text-amber-300/80' : 'text-slate-400'
              )}>库存偏低</div>
              <AlertTriangle className={clsx(
                'w-4 h-4',
                stockStats.lowStock > 0 ? 'text-amber-300' : 'text-slate-500'
              )} />
            </div>
            <div className={clsx(
              'text-2xl font-bold admin-font-mono mb-1',
              stockStats.lowStock > 0 ? 'text-amber-300' : 'text-slate-400'
            )}>
              {stockStats.lowStock}
            </div>
            <div className="text-[11px] text-slate-400">
              库存≤警戒线，建议补货
            </div>
          </div>
          <div className={clsx(
            'glass-admin rounded-xl p-5 border-r-4 transition-all',
            stockStats.outOfStock > 0 ? 'border-rose-500/50 animate-pulse-slow' : 'border-slate-600/50'
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className={clsx(
                'text-xs',
                stockStats.outOfStock > 0 ? 'text-rose-300/80' : 'text-slate-400'
              )}>暂时缺货</div>
              <XCircle className={clsx(
                'w-4 h-4',
                stockStats.outOfStock > 0 ? 'text-rose-400' : 'text-slate-500'
              )} />
            </div>
            <div className={clsx(
              'text-2xl font-bold admin-font-mono mb-1',
              stockStats.outOfStock > 0 ? 'text-rose-400' : 'text-slate-400'
            )}>
              {stockStats.outOfStock}
            </div>
            <div className="text-[11px] text-slate-400">
              库存为0，无法销售
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-admin rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">货架拿取与成交对比</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">各区域货架拿取次数、购买次数及转化率</p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-sky-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" /> 拿取
                </span>
                <span className="flex items-center gap-1 text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> 成交
                </span>
                <span className="flex items-center gap-1 text-violet-300">
                  <span className="w-2.5 h-2.5 rounded-full border border-violet-400" /> 转化率
                </span>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shelfData} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', fontSize: '12px' }}
                    cursor={{ fill: 'rgba(14,165,233,0.05)' }}
                    formatter={(v: any, name: any) => {
                      if (name === 'conversion') return [v + '%', '转化率'];
                      return [formatNumber(v), name === 'pickups' ? '拿取次数' : '购买次数'];
                    }}
                  />
                  <Bar dataKey="pickups" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" fill="#34D399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-3 pt-2">
              {shelves.map(s => (
                <div key={s.shelfId} className="glass-admin rounded-lg p-3">
                  <div className="text-[10px] text-slate-400 mb-1">{s.shelfName.split(' · ')[1]}</div>
                  <div className="text-lg font-bold text-sky-300 admin-font-mono mb-1">
                    {formatPercent(s.conversionRate, 0)}
                  </div>
                  <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                      style={{ width: `${s.conversionRate * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-admin rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">热门拿取TOP6</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">按拿取次数排序</p>
              </div>
              <HandPlatter className="w-4 h-4 text-violet-300" />
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topPicks}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {topPicks.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: any) => [`${v} 次`, '拿取次数']}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
