import { useEffect, useMemo } from 'react';
import AdminSidebar from '@/components/shared/AdminSidebar';
import MetricCard from '@/components/admin/MetricCard';
import { useAppStore } from '@/store/useAppStore';
import {
  Users, DollarSign, ShoppingCart, TrendingUp, HandPlatter, RefreshCw, Radio,
  Package, AlertTriangle, XCircle, BarChart3, LineChart, Activity, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart as ReLineChart, Line
} from 'recharts';
import { formatPercent, formatCurrency, formatDateTime, formatNumber, formatHour } from '@/utils/formatters';
import clsx from 'clsx';

function calcChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export default function AdminDashboard() {
  const metrics = useAppStore(s => s.realtimeMetrics);
  const comparisonData = useAppStore(s => s.comparisonData);
  const compareMode = useAppStore(s => s.compareMode);
  const compareScope = useAppStore(s => s.compareScope);
  const setCompareMode = useAppStore(s => s.setCompareMode);
  const setCompareScope = useAppStore(s => s.setCompareScope);
  const shelves = useAppStore(s => s.shelfMonitors);
  const behaviors = useAppStore(s => s.productBehaviors);
  const refresh = useAppStore(s => s.refreshMetrics);
  const getStockStats = useAppStore(s => s.getStockStats);
  const stockStats = getStockStats();

  useEffect(() => {
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, [refresh]);

  const comparisons = useMemo(() => {
    const cd = comparisonData;
    const scopeDay = compareScope === 'day';
    return {
      customers: {
        dayChange: calcChange(metrics.todayCustomers, cd.yesterdayCustomers),
        dayLabel: formatNumber(cd.yesterdayCustomers) + ' 人',
        weekChange: calcChange(metrics.todayCustomers, cd.lastWeekCustomers / 7),
        weekLabel: formatNumber(Math.round(cd.lastWeekCustomers / 7)) + ' 人/日'
      },
      revenue: {
        dayChange: calcChange(metrics.todayRevenue, cd.yesterdayRevenue),
        dayLabel: formatCurrency(cd.yesterdayRevenue),
        weekChange: calcChange(metrics.todayRevenue, cd.lastWeekRevenue / 7),
        weekLabel: formatCurrency(Math.round(cd.lastWeekRevenue / 7))
      },
      pickupRate: {
        dayChange: calcChange(metrics.overallPickupRate, cd.yesterdayPickupRate),
        dayLabel: formatPercent(cd.yesterdayPickupRate, 0),
        weekChange: calcChange(metrics.overallPickupRate, cd.lastWeekPickupRate),
        weekLabel: formatPercent(cd.lastWeekPickupRate, 0)
      },
      conversionRate: {
        dayChange: calcChange(metrics.overallConversionRate, cd.yesterdayConversionRate),
        dayLabel: formatPercent(cd.yesterdayConversionRate, 0),
        weekChange: calcChange(metrics.overallConversionRate, cd.lastWeekConversionRate),
        weekLabel: formatPercent(cd.lastWeekConversionRate, 0)
      },
      avgOrder: {
        dayChange: calcChange(metrics.avgOrderValue, cd.yesterdayAvgOrderValue),
        dayLabel: formatCurrency(cd.yesterdayAvgOrderValue),
        weekChange: calcChange(metrics.avgOrderValue, cd.lastWeekAvgOrderValue),
        weekLabel: formatCurrency(cd.lastWeekAvgOrderValue)
      }
    };
  }, [metrics, comparisonData, compareScope]);

  const prevShelves = compareScope === 'day'
    ? comparisonData.yesterdayShelves
    : comparisonData.lastWeekShelves;

  const shelfData = useMemo(() => {
    return shelves.map(s => {
      const name = s.shelfName.split(' · ')[0];
      const prev = prevShelves.find(ps => ps.shelfId === s.shelfId);
      return {
        name,
        pickups: s.totalPickups,
        purchases: s.totalPurchases,
        prevPickups: prev?.totalPickups ?? 0,
        prevPurchases: prev?.totalPurchases ?? 0,
        conversion: Number((s.conversionRate * 100).toFixed(1))
      };
    });
  }, [shelves, prevShelves]);

  const hourlyData = useMemo(() => {
    const today = comparisonData.todayHourlyData;
    const yesterday = comparisonData.yesterdayHourlyData;
    return today.map((t, i) => ({
      hour: t.hour,
      label: formatHour(t.hour),
      todayCustomers: t.customers,
      todayRevenue: t.revenue,
      yesterdayCustomers: yesterday[i]?.customers ?? 0,
      yesterdayRevenue: yesterday[i]?.revenue ?? 0
    }));
  }, [comparisonData]);

  const topPicks = [...behaviors]
    .sort((a, b) => b.pickupCount - a.pickupCount)
    .slice(0, 6)
    .map(b => ({
      name: b.product.name.length > 7 ? b.product.name.slice(0, 7) + '…' : b.product.name,
      value: b.pickupCount
    }));

  const PIE_COLORS = ['#38BDF8', '#818CF8', '#F472B6', '#A78BFA', '#34D399', '#FBBF24'];
  const prevLabel = compareScope === 'day' ? '昨日' : '上周同期';

  return (
    <div className="min-h-screen gradient-admin-bg flex">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-6 animate-fade-in">
        <header className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-sky-400/60 mb-1 tracking-[0.2em] uppercase">Monitor Center</div>
            <h1 className="text-2xl font-bold text-white admin-font-mono tracking-tight">
              实时监控仪表盘
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              最近更新：<span className="text-sky-300 admin-font-mono">{formatDateTime(metrics.lastUpdated)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="glass-admin rounded-xl p-1 flex items-center">
              <button
                onClick={() => setCompareMode('realtime')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  compareMode === 'realtime'
                    ? 'bg-sky-500/20 text-sky-300 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Activity className="w-3.5 h-3.5" />
                实时模式
              </button>
              <button
                onClick={() => setCompareMode('compare')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  compareMode === 'compare'
                    ? 'bg-violet-500/20 text-violet-300 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                对比模式
              </button>
            </div>

            {compareMode === 'compare' && (
              <div className="glass-admin rounded-xl p-1 flex items-center">
                <button
                  onClick={() => setCompareScope('day')}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    compareScope === 'day'
                      ? 'bg-emerald-500/20 text-emerald-300 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  今日 vs 昨日
                </button>
                <button
                  onClick={() => setCompareScope('week')}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    compareScope === 'week'
                      ? 'bg-amber-500/20 text-amber-300 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <LineChart className="w-3.5 h-3.5" />
                  本周 vs 上周
                </button>
              </div>
            )}

            <button
              onClick={refresh}
              className="btn-admin-ghost px-4 py-2 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              手动刷新数据
            </button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
          <MetricCard
            title="今日客流量"
            value={metrics.todayCustomers}
            icon={Users}
            trend={compareMode === 'realtime' ? 6.8 : undefined}
            accent="sky"
            subtitle="进店总人次"
            showCompare={compareMode === 'compare'}
            comparison={comparisons.customers}
          />
          <MetricCard
            title="今日销售额"
            value={metrics.todayRevenue}
            format="currency"
            icon={DollarSign}
            trend={compareMode === 'realtime' ? 12.3 : undefined}
            accent="emerald"
            subtitle="累计成交"
            showCompare={compareMode === 'compare'}
            comparison={comparisons.revenue}
          />
          <MetricCard
            title="商品拿取率"
            value={metrics.overallPickupRate}
            format="percent"
            icon={Radio}
            trend={compareMode === 'realtime' ? -1.2 : undefined}
            accent="violet"
            subtitle="进店→拿取"
            showCompare={compareMode === 'compare'}
            comparison={comparisons.pickupRate}
          />
          <MetricCard
            title="成交转化率"
            value={metrics.overallConversionRate}
            format="percent"
            icon={TrendingUp}
            trend={compareMode === 'realtime' ? 3.7 : undefined}
            accent="amber"
            subtitle="拿取→购买"
            showCompare={compareMode === 'compare'}
            comparison={comparisons.conversionRate}
          />
          <MetricCard
            title="平均客单价"
            value={metrics.avgOrderValue}
            format="currency"
            icon={ShoppingCart}
            trend={compareMode === 'realtime' ? 2.1 : undefined}
            accent="rose"
            subtitle="单笔消费"
            showCompare={compareMode === 'compare'}
            comparison={comparisons.avgOrder}
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

        <div className="lg:grid-cols-3 grid gap-6">
          <div className="glass-admin lg:col-span-2 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">货架拿取与成交对比</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {compareMode === 'compare'
                    ? `各区域货架拿取/购买对比（${prevLabel}半透明显示）`
                    : '各区域货架拿取次数、购买次数及转化率'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] flex-wrap">
                {compareMode === 'compare' && (
                  <>
                    <span className="flex items-center gap-1 text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-sky-400/30 border border-sky-400/40" /> {prevLabel}拿取
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/30 border border-emerald-400/40" /> {prevLabel}成交
                    </span>
                  </>
                )}
                <span className="flex items-center gap-1 text-sky-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" /> 拿取
                </span>
                <span className="flex items-center gap-1 text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> 成交
                </span>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shelfData} barCategoryGap={compareMode === 'compare' ? '15%' : '28%'}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', fontSize: '12px' }}
                    cursor={{ fill: 'rgba(14,165,233,0.05)' }}
                    formatter={(v: any, name: any) => {
                      const labelMap: Record<string, string> = {
                        pickups: '拿取次数',
                        purchases: '购买次数',
                        prevPickups: `${prevLabel}拿取`,
                        prevPurchases: `${prevLabel}购买`,
                        conversion: '转化率'
                      };
                      if (name === 'conversion') return [v + '%', labelMap[name]];
                      return [formatNumber(v), labelMap[name] || name];
                    }}
                  />
                  {compareMode === 'compare' && (
                    <>
                      <Bar dataKey="prevPickups" fill="rgba(56,189,248,0.25)" stroke="rgba(56,189,248,0.5)" strokeWidth={1} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="prevPurchases" fill="rgba(52,211,153,0.25)" stroke="rgba(52,211,153,0.5)" strokeWidth={1} radius={[4, 4, 0, 0]} />
                    </>
                  )}
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

        <div className="glass-admin rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">24小时客流 & 销售额趋势</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {compareMode === 'compare'
                  ? `今日（实线）vs 昨日（虚线）分时段对比`
                  : '今日分时段客流与销售额变化'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] flex-wrap">
              <span className="flex items-center gap-1 text-sky-300">
                <span className="w-5 h-0.5 bg-sky-400 rounded" />
                今日客流
              </span>
              <span className="flex items-center gap-1 text-emerald-300">
                <span className="w-5 h-0.5 bg-emerald-400 rounded" />
                今日销售额
              </span>
              {compareMode === 'compare' && (
                <>
                  <span className="flex items-center gap-1 text-sky-400/60">
                    <span className="w-5 h-0.5 border-t-2 border-dashed border-sky-400/60 rounded" />
                    昨日客流
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400/60">
                    <span className="w-5 h-0.5 border-t-2 border-dashed border-emerald-400/60 rounded" />
                    昨日销售额
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={1}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: '客流(人)', angle: -90, position: 'insideLeft', fill: '#38BDF8', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => '¥' + (v / 1000).toFixed(0) + 'k'}
                  label={{ value: '销售额', angle: 90, position: 'insideRight', fill: '#34D399', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: any, name: any) => {
                    const map: Record<string, string> = {
                      todayCustomers: '今日客流',
                      todayRevenue: '今日销售额',
                      yesterdayCustomers: '昨日客流',
                      yesterdayRevenue: '昨日销售额'
                    };
                    const isRevenue = name.includes('Revenue');
                    return [isRevenue ? formatCurrency(v) : `${v} 人`, map[name] || name];
                  }}
                />
                {compareMode === 'compare' && (
                  <>
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="yesterdayCustomers"
                      stroke="rgba(56,189,248,0.45)"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      dot={false}
                      name="yesterdayCustomers"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="yesterdayRevenue"
                      stroke="rgba(52,211,153,0.45)"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      dot={false}
                      name="yesterdayRevenue"
                    />
                  </>
                )}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="todayCustomers"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#38BDF8', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#38BDF8', stroke: '#fff', strokeWidth: 2 }}
                  name="todayCustomers"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="todayRevenue"
                  stroke="#34D399"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#34D399', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#34D399', stroke: '#fff', strokeWidth: 2 }}
                  name="todayRevenue"
                />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
