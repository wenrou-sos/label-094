import { useMemo, useState } from 'react';
import AdminSidebar from '@/components/shared/AdminSidebar';
import { useAppStore } from '@/store/useAppStore';
import {
  ArrowDownToLine, Trophy, AlertTriangle, Filter, TrendingDown, TrendingUp, Tag,
  Package, RefreshCw, X, Check, Loader2, XCircle
} from 'lucide-react';
import clsx from 'clsx';
import { formatPercent, formatCurrency, formatNumber, formatDateTime } from '@/utils/formatters';

type Tab = 'low' | 'high';

interface RestockConfirmState {
  productId: string;
  productName: string;
  currentStock: number;
  maxStock: number;
}

export default function AdminAnalytics() {
  const behaviors = useAppStore(s => s.productBehaviors);
  const products = useAppStore(s => s.products);
  const restockLogs = useAppStore(s => s.restockLogs);
  const restockProduct = useAppStore(s => s.restockProduct);
  const [tab, setTab] = useState<Tab>('low');
  const [threshold, setThreshold] = useState(35);
  const [restockConfirm, setRestockConfirm] = useState<RestockConfirmState | null>(null);
  const [restockingId, setRestockingId] = useState<string | null>(null);

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
                  <th className="px-5 py-3 font-medium w-24 text-right">单价</th>
                  <th className="px-5 py-3 font-medium w-20 text-right">库存</th>
                  <th className="px-5 py-3 font-medium w-24 text-right">拿起</th>
                  <th className="px-5 py-3 font-medium w-24 text-right">购买</th>
                  <th className="px-5 py-3 font-medium w-20 text-right">差值</th>
                  <th className="px-5 py-3 font-medium w-56">转化率</th>
                  <th className="px-5 py-3 font-medium w-28 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center text-slate-500">
                      暂无符合条件的数据
                    </td>
                  </tr>
                ) : tableData.map((b, idx) => {
                  const diff = b.pickupCount - b.purchaseCount;
                  const diffRatio = (diff / b.pickupCount) * 100;
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                  const product = products.find(p => p.id === b.productId);
                  const stock = product?.stock ?? 0;
                  const minStock = product?.minStock ?? 10;
                  const maxStock = product?.maxStock ?? 50;
                  const isOutOfStock = stock === 0;
                  const isLowStock = stock > 0 && stock <= minStock;
                  const isRestocking = restockingId === b.productId;

                  const handleRestockClick = () => {
                    if (!product || isRestocking) return;
                    setRestockConfirm({
                      productId: product.id,
                      productName: product.name,
                      currentStock: product.stock,
                      maxStock: product.maxStock
                    });
                  };

                  const stockColor = isOutOfStock
                    ? 'text-rose-400'
                    : isLowStock
                    ? 'text-amber-400'
                    : 'text-emerald-300';

                  return (
                    <tr
                      key={b.productId}
                      className={clsx(
                        'border-t border-slate-800/60 hover:bg-sky-500/5 transition-colors',
                        isOutOfStock && 'bg-rose-500/5',
                        isLowStock && 'bg-amber-500/5'
                      )}
                    >
                      <td className="px-5 py-3 admin-font-mono text-slate-400">
                        {medal ?? `#${idx + 1}`}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            'w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-900 relative',
                            isOutOfStock && 'ring-2 ring-rose-500/40',
                            isLowStock && 'ring-2 ring-amber-500/40'
                          )}>
                            <img
                              src={b.product.image}
                              alt=""
                              className={clsx(
                                'w-full h-full object-cover',
                                isOutOfStock ? 'opacity-20 grayscale' : 'opacity-40'
                              )}
                              loading="lazy"
                            />
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-rose-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className={clsx(
                              'font-medium truncate',
                              isOutOfStock ? 'text-rose-300' : isLowStock ? 'text-amber-300' : 'text-slate-100'
                            )}>
                              {b.product.name}
                              {isOutOfStock && <span className="ml-2 text-[10px] text-rose-400">(缺货)</span>}
                              {isLowStock && <span className="ml-2 text-[10px] text-amber-400">(库存低)</span>}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {b.product.sku} · {b.product.category} · {b.product.shelfId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right admin-font-mono text-slate-300">
                        {formatCurrency(b.product.price)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Package className={clsx('w-3.5 h-3.5', stockColor)} />
                          <span className={clsx('admin-font-mono font-semibold', stockColor)}>
                            {stock}
                          </span>
                          <span className="text-slate-600 text-[10px]">/{maxStock}</span>
                        </div>
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
                        {(isOutOfStock || isLowStock) && (
                          <button
                            onClick={handleRestockClick}
                            disabled={isRestocking || stock >= maxStock}
                            className={clsx(
                              'inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all',
                              stock >= maxStock
                                ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                                : isOutOfStock
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                            )}
                          >
                            {isRestocking ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                补货中...
                              </>
                            ) : stock >= maxStock ? (
                              '库存已满'
                            ) : (
                              <>
                                <RefreshCw className="w-3.5 h-3.5" />
                                建议补货
                              </>
                            )}
                          </button>
                        )}
                        {!isOutOfStock && !isLowStock && stock < maxStock && (
                          <span className="text-[10px] text-slate-500">库存正常</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {restockLogs.length > 0 && (
          <div className="glass-admin rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-sky-400" />
                  补货操作日志
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">最近 {restockLogs.length} 条补货记录</p>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
              {restockLogs.slice(0, 10).map(log => (
                <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-200">{log.productName}</div>
                      <div className="text-[10px] text-slate-500 admin-font-mono">
                        库存 {log.previousStock} → {log.newStock} (+{log.restockAmount})
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 admin-font-mono">
                    {formatDateTime(log.restockedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {restockConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-admin rounded-2xl p-6 w-full max-w-md mx-4 space-y-5 animate-scale-in">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">确认补货</h3>
                <p className="text-sm text-slate-400 mt-1">
                  补货后库存将恢复至最大库存
                </p>
              </div>
              <button
                onClick={() => setRestockConfirm(null)}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-800/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900">
                  <img
                    src={products.find(p => p.id === restockConfirm.productId)?.image}
                    alt=""
                    className="w-full h-full object-cover opacity-60"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-100 font-medium truncate">{restockConfirm.productName}</div>
                  <div className="text-[11px] text-slate-500 admin-font-mono">
                    {restockConfirm.productId}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-slate-500 mb-1">当前库存</div>
                  <div className={clsx(
                    'text-xl font-bold admin-font-mono',
                    restockConfirm.currentStock === 0 ? 'text-rose-400' :
                    restockConfirm.currentStock <= 10 ? 'text-amber-400' : 'text-emerald-300'
                  )}>
                    {restockConfirm.currentStock}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-slate-500 mb-1">补货后</div>
                  <div className="text-xl font-bold admin-font-mono text-sky-300">
                    {restockConfirm.maxStock}
                  </div>
                </div>
              </div>
              <div className="text-center text-[11px] text-emerald-300 pt-1 flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3" />
                预计补货数量：+{restockConfirm.maxStock - restockConfirm.currentStock} 件
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRestockConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 transition-colors"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!restockConfirm) return;
                  setRestockingId(restockConfirm.productId);
                  setRestockConfirm(null);
                  await restockProduct(restockConfirm.productId);
                  setRestockingId(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-400 hover:to-cyan-400 transition-all shadow-lg shadow-sky-500/20"
              >
                确认补货
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
