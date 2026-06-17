import { useMemo, useState } from 'react';
import AdminSidebar from '@/components/shared/AdminSidebar';
import { useAppStore } from '@/store/useAppStore';
import {
  ArrowDownToLine, Trophy, AlertTriangle, Filter, TrendingDown, TrendingUp, Tag
} from 'lucide-react';
import clsx from 'clsx';
import { formatPercent, formatCurrency, formatNumber } from '@/utils/formatters';

type Tab = 'low' | 'high';

export default function AdminAnalytics() {
  const behaviors = useAppStore(s => s.productBehaviors);
  const [tab, setTab] = useState<Tab>('low');
  const [threshold, setThreshold] = useState(35);

  const lowConv = useMemo(() =>
    behaviors
      .filter(b => b.conversionRate * 100 < threshold && b.pickupCount >= 20)
      .sort((a, b) => (a.conversionRate) - (b.conversionRate))
      .slice(0, 15)
  , [behaviors, threshold]);

  const highConv = useMemo(() =>
    behaviors
      .filter(b => b.conversionRate * 100 >= 65)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 15)
  , [behaviors]);

  const tableData = tab === 'low' ? lowConv : highConv;

  return (
    <div className="min-h-screen gradient-admin-bg flex">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-6 animate-fade-in">
        <header className="flex items-end justify-between">
          <div>
            <div className="text-xs text-sky-400/60 mb-1 tracking-[0.2em] uppercase">Behavior Analytics</div>
            <h1 className="text-2xl font-bold text-white admin-font-mono tracking-tight">
              商品行为分析
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              分析商品的拿取、浏览与购买转化，识别高潜与滞销商品
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">低转化阈值</span>
            <input
              type="range"
              min={15}
              max={55}
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-32 accent-sky-500"
            />
            <span className="text-sky-300 admin-font-mono w-12">{'<'}{threshold}%</span>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass-admin rounded-xl p-5 border-r-4 border-rose-400/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-rose-300/80">高拿起低购买</div>
              <AlertTriangle className="w-4 h-4 text-rose-300" />
            </div>
            <div className="text-2xl font-bold text-white admin-font-mono mb-1">
              {lowConv.length}
            </div>
            <div className="text-[11px] text-slate-400">
              转化率不足{threshold}%的 <span className="text-rose-300">{lowConv.reduce((s, b) => s + b.pickupCount, 0)}</span> 次试触
            </div>
          </div>
          <div className="glass-admin rounded-xl p-5 border-r-4 border-emerald-400/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-emerald-300/80">高转化率</div>
              <Trophy className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-2xl font-bold text-white admin-font-mono mb-1">
              {highConv.length}
            </div>
            <div className="text-[11px] text-slate-400">
              拿起即买≥65%，共贡献 <span className="text-emerald-300">{formatNumber(highConv.reduce((s, b) => s + b.purchaseCount * b.product.price, 0))}</span> 销售额
            </div>
          </div>
          <div className="glass-admin rounded-xl p-5 border-r-4 border-sky-400/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-sky-300/80">整体平均转化</div>
              <ArrowDownToLine className="w-4 h-4 text-sky-300" />
            </div>
            <div className="text-2xl font-bold text-white admin-font-mono mb-1">
              {formatPercent(
                behaviors.reduce((s, b) => s + b.conversionRate, 0) / behaviors.length,
                1
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              总拿取 <span className="text-sky-300 admin-font-mono">{formatNumber(behaviors.reduce((s, b) => s + b.pickupCount, 0))}</span>
              / 总购买 <span className="text-emerald-300 admin-font-mono">{formatNumber(behaviors.reduce((s, b) => s + b.purchaseCount, 0))}</span>
            </div>
          </div>
        </div>

        <div className="glass-admin rounded-xl overflow-hidden">
          <div className="px-5 pt-4 pb-2 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
              <button
                onClick={() => setTab('low')}
                className={clsx(
                  'px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                  tab === 'low'
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                高拿起低购买 ({lowConv.length})
              </button>
              <button
                onClick={() => setTab('high')}
                className={clsx(
                  'px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                  tab === 'high'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                高转化率排行 ({highConv.length})
              </button>
            </div>
            <div className="text-[11px] text-slate-500">
              {tab === 'low' ? `拿起≥20次且转化率 < ${threshold}%` : '转化率 ≥ 65%'}
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-800/40">
                  <th className="px-5 py-3 font-medium w-12">排名</th>
                  <th className="px-5 py-3 font-medium">商品信息</th>
                  <th className="px-5 py-3 font-medium w-28 text-right">单价</th>
                  <th className="px-5 py-3 font-medium w-24 text-right">拿起</th>
                  <th className="px-5 py-3 font-medium w-24 text-right">购买</th>
                  <th className="px-5 py-3 font-medium w-20 text-right">差值</th>
                  <th className="px-5 py-3 font-medium w-56">转化率</th>
                  <th className="px-5 py-3 font-medium w-28 text-right">标签</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-slate-500">
                      暂无符合条件的数据
                    </td>
                  </tr>
                ) : tableData.map((b, idx) => {
                  const diff = b.pickupCount - b.purchaseCount;
                  const diffRatio = (diff / b.pickupCount) * 100;
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                  return (
                    <tr
                      key={b.productId}
                      className="border-t border-slate-800/60 hover:bg-sky-500/5 transition-colors"
                    >
                      <td className="px-5 py-3 admin-font-mono text-slate-400">
                        {medal ?? `#${idx + 1}`}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-900">
                            <img
                              src={b.product.image}
                              alt=""
                              className="w-full h-full object-cover opacity-40"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-slate-100 font-medium truncate">{b.product.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {b.product.sku} · {b.product.category} · {b.product.shelfId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right admin-font-mono text-slate-300">
                        {formatCurrency(b.product.price)}
                      </td>
                      <td className="px-5 py-3 text-right admin-font-mono text-violet-300">
                        {formatNumber(b.pickupCount)}
                      </td>
                      <td className="px-5 py-3 text-right admin-font-mono text-emerald-300">
                        {formatNumber(b.purchaseCount)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={clsx(
                          'admin-font-mono',
                          tab === 'low' ? 'text-rose-300' : 'text-slate-400'
                        )}>
                          {diffRatio.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full transition-all',
                                tab === 'low'
                                  ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                                  : 'bg-gradient-to-r from-emerald-500 to-sky-400'
                              )}
                              style={{ width: `${Math.min(b.conversionRate * 100, 100)}%` }}
                            />
                          </div>
                          <span className={clsx(
                            'admin-font-mono text-xs font-semibold w-14 text-right',
                            tab === 'low' ? 'text-rose-300' : 'text-emerald-300'
                          )}>
                            {formatPercent(b.conversionRate, 0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {b.product.tags.slice(0, 2).map(t => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] text-sky-300/80 bg-sky-500/10 border border-sky-400/20"
                            >
                              <Tag className="w-2.5 h-2.5" />{t}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
