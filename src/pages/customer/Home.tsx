import CustomerNavBar from '@/components/shared/CustomerNavBar';
import QRCodePanel from '@/components/customer/QRCodePanel';
import SensorIndicator from '@/components/customer/SensorIndicator';
import ProductDetailModal from '@/components/customer/ProductDetailModal';
import { Sparkles, Shield, Clock, MapPin, ArrowRight, Users, ShoppingCart, BadgePercent, Filter, AlertCircle, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';
import { products, shelfInfo } from '@/data/products';
import { useEffect, useRef, useState } from 'react';
import { getCurrentHour, formatTimeRange, beginnerPriceThreshold } from '@/utils/strategyUtils';
import type { AppliedStrategyResult } from '@/types';

export default function CustomerHome() {
  const cart = useAppStore(s => s.cart);
  const metrics = useAppStore(s => s.realtimeMetrics);
  const getActiveStrategies = useAppStore(s => s.getActiveStrategies);
  const addToCart = useAppStore(s => s.addToCart);
  const checkPurchaseLimit = useAppStore(s => s.checkPurchaseLimit);
  const showProductDetail = useAppStore(s => s.showProductDetail);
  const total = cart?.items.reduce((s, it) => s + it.product.price * it.quantity, 0) || 0;
  const count = cart?.items.reduce((s, it) => s + it.quantity, 0) || 0;

  const [activeResult, setActiveResult] = useState<AppliedStrategyResult>(getActiveStrategies());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const prevIdsRef = useRef<string>('');

  useEffect(() => {
    const update = () => {
      const next = getActiveStrategies();
      const idKey = next.activeStrategies.map(s => s.id).join(',');
      if (idKey !== prevIdsRef.current && prevIdsRef.current) {
        setIsTransitioning(true);
        setTimeout(() => {
          setActiveResult(next);
          setTimeout(() => setIsTransitioning(false), 500);
        }, 200);
        if (next.activeStrategies.length > 0) {
          const names = next.activeStrategies.map(s => s.name).join('、');
          setToastMsg(`已自动应用策略：${names}`);
          setTimeout(() => setToastMsg(null), 3000);
        }
      } else {
        setActiveResult(next);
      }
      prevIdsRef.current = idKey;
    };

    update();
    const t = setInterval(update, 5000);
    return () => clearInterval(t);
  }, [getActiveStrategies]);

  const { visibleProductIds, priceOverrides, activeStrategies } = activeResult;
  const visibleProducts = products.filter(p => visibleProductIds.includes(p.id));
  const groupedByShelf = visibleProducts.reduce<Record<string, typeof products>>((acc, p) => {
    if (!acc[p.shelfId]) acc[p.shelfId] = [];
    acc[p.shelfId].push(p);
    return acc;
  }, {});

  const currentHour = getCurrentHour();

  const handleAddToCart = (productId: string) => {
    const cartItem = cart?.items.find(it => it.productId === productId);
    const qty = cartItem ? cartItem.quantity : 0;
    const check = checkPurchaseLimit(productId, qty);
    if (!check.allowed && check.limit) {
      setToastMsg(`限购提示：「${products.find(p => p.id === productId)?.name}」每人限购 ${check.limit.maxPerPerson} 件`);
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    addToCart(productId);
    const p = products.find(x => x.id === productId);
    setToastMsg(`已加入购物车：${p?.name}`);
    setTimeout(() => setToastMsg(null), 2000);
  };

  return (
    <div className="min-h-screen gradient-customer-bg">
      <CustomerNavBar />
      <ProductDetailModal />

      <main className="max-w-[1400px] mx-auto px-8 py-8 space-y-8 animate-fade-in">
        {toastMsg && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className="glass-customer px-5 py-3 rounded-2xl border border-fuchsia-500/30 shadow-2xl shadow-fuchsia-500/20 text-sm text-fuchsia-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-fuchsia-300" />
              {toastMsg}
            </div>
          </div>
        )}

        {activeStrategies.length > 0 && (
          <div className="glass-customer rounded-2xl p-4 border border-fuchsia-500/20 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-fuchsia-500/15">
                <Sparkles className="w-5 h-5 text-fuchsia-300 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-fuchsia-100">
                  当前 {activeStrategies.length} 条策略已自动生效
                </div>
                <div className="text-xs text-fuchsia-300/70 mt-0.5 truncate">
                  {activeStrategies.map(s => {
                    const discount = priceOverrides && Object.values(priceOverrides).find(d => d.strategyId === s.id);
                    return `${s.name} (${formatTimeRange(s.timeRange)}${discount ? ` · ${(discount.percent * 10).toFixed(1)}折` : ''})`;
                  }).join('  |  ')}
                </div>
              </div>
              <div className="text-[10px] text-fuchsia-300/60 font-mono">
                每5秒检测 · {String(currentHour).padStart(2, '0')}:00
              </div>
            </div>
          </div>
        )}

        <section className="relative overflow-hidden rounded-[36px] p-10 glass-customer animate-slide-up">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-fuchsia-600/25 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full bg-violet-700/20 blur-3xl" />

          <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-fuchsia-200/70">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                欢迎光临 · 24小时无人值守私密体验店
              </div>

              <h1 className="customer-font-display text-5xl font-bold leading-[1.15] text-transparent bg-clip-text bg-gradient-to-br from-white via-fuchsia-100 to-violet-200">
                私享时光<br />
                <span className="bg-gradient-to-r from-fuchsia-400 to-pink-300 bg-clip-text text-transparent">
                  此刻由你定义
                </span>
              </h1>

              <p className="text-fuchsia-200/70 leading-relaxed max-w-lg">
                拿起货架上任意商品，面板将在 <span className="text-fuchsia-200 font-semibold">0.5秒内</span> 感应并展示详情。
                您可扫码绑定手机远程购物，全程加密保护您的隐私，离店自动清除所有会话记录。
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/cart"
                  className="btn-customer px-7 py-3.5 text-sm font-semibold flex items-center gap-2"
                >
                  {count > 0 ? `去购物车 (${count}件)` : '开始购物体验'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/admin/dashboard"
                  className="px-6 py-3.5 rounded-full text-sm text-fuchsia-200/70 border border-fuchsia-500/20 hover:bg-white/5 hover:text-white transition-all"
                >
                  商家管理入口
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 max-w-xl">
                {[
                  { icon: Shield, label: '端到端加密', sub: '隐私零记录' },
                  { icon: Clock, label: '全天候营业', sub: '24小时服务' },
                  { icon: MapPin, label: 'A/B/C/D四区', sub: `${visibleProducts.length}款精选` },
                ].map((it, i) => {
                  const Icon = it.icon;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center gap-2 text-fuchsia-200">
                        <Icon className="w-4 h-4 text-fuchsia-300" />
                        <span className="text-sm font-medium">{it.label}</span>
                      </div>
                      <div className="text-[11px] text-fuchsia-300/50 pl-6">{it.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative space-y-4">
              <div className="absolute -inset-4 bg-gradient-to-br from-fuchsia-500/10 to-violet-600/10 rounded-[32px] blur-2xl" />
              <div className="relative grid grid-cols-2 gap-3">
                <div className="glass-customer rounded-3xl p-5 col-span-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-fuchsia-300/70">
                    <Users className="w-3.5 h-3.5" /> 今日实时数据
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <div className="text-[11px] text-fuchsia-300/60">到店人数</div>
                      <div className="text-xl font-bold text-white admin-font-mono">{metrics.todayCustomers}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-fuchsia-300/60">成交转化</div>
                      <div className="text-xl font-bold text-emerald-300 admin-font-mono">
                        {(metrics.overallConversionRate * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-fuchsia-300/60">客单价</div>
                      <div className="text-xl font-bold text-amber-300 admin-font-mono">
                        {formatCurrency(metrics.avgOrderValue)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-customer rounded-3xl p-5 space-y-1">
                  <div className="text-[11px] text-fuchsia-300/60">购物车商品</div>
                  <div className="text-2xl font-bold text-white admin-font-mono">{count}</div>
                  <div className="text-[10px] text-fuchsia-300/50">件商品待结算</div>
                </div>
                <div className="glass-customer rounded-3xl p-5 space-y-1">
                  <div className="text-[11px] text-fuchsia-300/60">当前合计</div>
                  <div className="text-2xl font-bold bg-gradient-to-br from-fuchsia-200 to-pink-300 bg-clip-text text-transparent admin-font-mono">
                    {formatCurrency(total)}
                  </div>
                  <div className="text-[10px] text-fuchsia-300/50">满¥500享95折</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          <QRCodePanel />
          <SensorIndicator />
        </div>

        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="customer-font-display text-2xl font-bold text-white flex items-center gap-3">
                <Eye className="w-6 h-6 text-fuchsia-400" />
                商品列表
              </h2>
              <p className="text-sm text-fuchsia-300/60 mt-1">
                共 {visibleProducts.length} 款商品可浏览
                {visibleProducts.length < products.length && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    已按时段策略过滤 {products.length - visibleProducts.length} 款
                  </span>
                )}
              </p>
            </div>
            {activeStrategies.some(s => s.type === 'limit') && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                晚高峰时段每单限购3件
              </div>
            )}
          </div>

          <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-40 scale-[0.99] blur-sm' : 'opacity-100'}`}>
            {Object.keys(groupedByShelf).length === 0 ? (
              <div className="glass-customer rounded-2xl p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-fuchsia-500/10 flex items-center justify-center">
                  <Filter className="w-8 h-8 text-fuchsia-400" />
                </div>
                <p className="text-fuchsia-200 font-medium mb-1">当前时段无展示商品</p>
                <p className="text-sm text-fuchsia-300/50">深夜时段仅展示入门级商品（≤¥{beginnerPriceThreshold}），请稍后再来</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedByShelf).map(([shelfId, shelfProducts]) => (
                  <div key={shelfId} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-6 rounded-full bg-gradient-to-b from-fuchsia-400 to-violet-500" />
                      <h3 className="text-base font-semibold text-fuchsia-100">{shelfInfo[shelfId] || shelfId}</h3>
                      <span className="text-[11px] text-fuchsia-300/50">{shelfProducts.length} 款</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {shelfProducts.map(product => {
                        const discount = priceOverrides[product.id];
                        const finalPrice = discount ? discount.finalPrice : product.price;
                        const cartItem = cart?.items.find(it => it.productId === product.id);
                        const cartQty = cartItem?.quantity || 0;
                        const limit = activeStrategies.find(s => s.type === 'limit')
                          ? checkPurchaseLimit(product.id, cartQty)
                          : null;

                        return (
                          <div
                            key={product.id}
                            className="glass-customer rounded-2xl p-4 group hover:shadow-customer-glow transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                          >
                            <div
                              className="aspect-[4/3] rounded-xl overflow-hidden mb-3 cursor-pointer bg-slate-800/50 relative"
                              onClick={() => showProductDetail(product)}
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover privacy-blur group-hover:blur-sm transition-all duration-300"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-xs">
                                <span className="text-xs text-white/90 px-3 py-1 rounded-full bg-white/10 border border-white/20">
                                  点击查看详情
                                </span>
                              </div>
                              {discount && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-[10px] font-bold shadow-lg flex items-center gap-1">
                                  <BadgePercent className="w-3 h-3" />
                                  {((1 - discount.percent) * 100).toFixed(0)}% OFF
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2 min-h-[40px]">
                                <h4
                                  className="text-sm font-medium text-fuchsia-50 line-clamp-2 leading-snug cursor-pointer hover:text-fuchsia-200 transition-colors"
                                  onClick={() => showProductDetail(product)}
                                >
                                  {product.name}
                                </h4>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {product.tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-300/80 border border-fuchsia-500/20"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-end justify-between pt-1">
                                <div className="space-y-0.5">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold bg-gradient-to-br from-fuchsia-200 to-pink-300 bg-clip-text text-transparent admin-font-mono leading-none">
                                      {formatCurrency(finalPrice)}
                                    </span>
                                    {discount && (
                                      <span className="text-xs text-fuchsia-300/40 line-through admin-font-mono">
                                        {formatCurrency(discount.originalPrice)}
                                      </span>
                                    )}
                                  </div>
                                  {discount && (
                                    <div className="text-[10px] text-emerald-400">
                                      省 {formatCurrency(discount.originalPrice - discount.finalPrice)}
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                  {limit?.limit && cartQty >= limit.limit.maxPerPerson ? (
                                    <div className="text-[9px] text-amber-400 flex items-center gap-0.5">
                                      <AlertCircle className="w-2.5 h-2.5" />
                                      已达上限
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleAddToCart(product.id)}
                                        disabled={limit && !limit.allowed}
                                        className="p-2 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white hover:shadow-lg hover:shadow-fuchsia-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        <ShoppingCart className="w-3.5 h-3.5" />
                                      </button>
                                      {cartQty > 0 && (
                                        <span className="text-[10px] text-fuchsia-300/60 admin-font-mono">
                                          已加 {cartQty}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
