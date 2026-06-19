import { Link, useNavigate } from 'react-router-dom';
import CustomerNavBar from '@/components/shared/CustomerNavBar';
import CartItem from '@/components/customer/CartItem';
import ProductDetailModal from '@/components/customer/ProductDetailModal';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { getActiveStrategies } from '@/utils/strategyUtils';
import { ShoppingCart, ArrowRight, Trash2, Tag, ArrowLeft, Sparkles, AlertCircle, BadgePercent, Link2, Plus, ShoppingBag } from 'lucide-react';
import clsx from 'clsx';

export default function CustomerCart() {
  const cart = useAppStore(s => s.cart);
  const clear = useAppStore(s => s.clearCart);
  const createOrder = useAppStore(s => s.createOrder);
  const strategies = useAppStore(s => s.strategies);
  const checkPurchaseLimit = useAppStore(s => s.checkPurchaseLimit);
  const checkOrderLimit = useAppStore(s => s.checkOrderLimit);
  const addToCart = useAppStore(s => s.addToCart);
  const getCartPairingRecommendations = useAppStore(s => s.getCartPairingRecommendations);
  const simulatedOrders = useAppStore(s => s.simulatedOrders);
  const navigate = useNavigate();

  const cartProductIds = cart?.items.map(it => it.productId) ?? [];
  const pairingRecs = getCartPairingRecommendations(cartProductIds, 2);
  const paidOrderCount = simulatedOrders.filter(o => o.status === 'paid').length;

  const items = cart?.items ?? [];
  const active = getActiveStrategies(strategies, new Date().getHours());
  const priceOverrides = active.priceOverrides;

  const getFinalPrice = (price: number, productId: string) => {
    const override = priceOverrides[productId];
    return override ? override.finalPrice : price;
  };

  const total = items.reduce((s, it) => s + getFinalPrice(it.product.price, it.productId) * it.quantity, 0);
  const originalTotal = items.reduce((s, it) => s + it.product.price * it.quantity, 0);
  const strategyDiscount = originalTotal - total;
  const thresholdDiscount = total >= 500 ? total * 0.05 : 0;
  const totalDiscount = strategyDiscount + thresholdDiscount;
  const finalAmt = originalTotal - totalDiscount;
  const count = items.reduce((s, it) => s + it.quantity, 0);

  const productLimitViolation = items.some(it => {
    const check = checkPurchaseLimit(it.productId, it.quantity - 1);
    return !check.allowed && check.limit?.scope === 'per_product';
  });
  const orderLimitCheck = checkOrderLimit();
  const hasLimitViolation = productLimitViolation || !orderLimitCheck.allowed;

  const handleCheckout = () => {
    try {
      createOrder();
      navigate('/checkout');
    } catch (e) {
      console.error('创建订单失败:', e);
    }
  };

  return (
    <div className="min-h-screen gradient-customer-bg">
      <CustomerNavBar />
      <ProductDetailModal />

      <main className="max-w-[1400px] mx-auto px-8 py-8 animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-fuchsia-300/60 text-xs mb-2">
              <Link to="/" className="hover:text-fuchsia-200 transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> 返回首页
              </Link>
              <span>/</span>
              <span>购物车</span>
            </div>
            <h1 className="customer-font-display text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              我的购物车
              {count > 0 && (
                <span className="text-sm font-medium text-fuchsia-300/70">({count}件商品)</span>
              )}
            </h1>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => clear()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs text-rose-300/70 hover:text-rose-200 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> 清空购物车
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="glass-customer rounded-3xl p-16 text-center animate-slide-up">
                <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-white/5 flex items-center justify-center">
                  <ShoppingCart className="w-10 h-10 text-fuchsia-300/40" />
                </div>
                <h3 className="customer-font-display text-xl text-fuchsia-100 mb-2">购物车是空的</h3>
                <p className="text-sm text-fuchsia-300/60 mb-6">
                  回到店内拿起任意商品，感应后可自动加入购物车
                </p>
                <Link to="/" className="btn-customer px-6 py-2.5 text-sm inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> 去逛逛吧
                </Link>
              </div>
            ) : (
              items.map(it => <CartItem key={it.productId} item={it} />)
            )}
          </div>

          <aside className="space-y-4 h-fit lg:sticky lg:top-28">
            <div className="glass-customer rounded-3xl p-6 space-y-4">
              <h3 className="customer-font-display text-lg font-semibold text-fuchsia-50">
                订单摘要
              </h3>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-fuchsia-200/70">
                  <span>商品合计 ({count}件)</span>
                  <span>{formatCurrency(originalTotal)}</span>
                </div>
                {strategyDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-300">
                    <span className="inline-flex items-center gap-1">
                      <BadgePercent className="w-3.5 h-3.5" /> 时段自动折扣
                    </span>
                    <span>-{formatCurrency(strategyDiscount)}</span>
                  </div>
                )}
                {thresholdDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-300">
                    <span className="inline-flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> 满¥500立减95折
                    </span>
                    <span>-{formatCurrency(thresholdDiscount)}</span>
                  </div>
                )}
                <div className="h-px bg-fuchsia-500/15 my-3" />
                <div className="flex items-center justify-between">
                  <span className="text-fuchsia-100 font-medium">应付金额</span>
                  <span className="text-3xl font-bold bg-gradient-to-br from-fuchsia-200 to-pink-300 bg-clip-text text-transparent customer-font-display">
                    {formatCurrency(finalAmt)}
                  </span>
                </div>
                {totalDiscount > 0 && (
                  <div className="text-[11px] text-emerald-300/80">
                    本单已优惠 {formatCurrency(totalDiscount)}
                  </div>
                )}
              </div>

              {hasLimitViolation && (
                <div className="text-xs px-3 py-2 rounded-xl bg-red-500/10 text-red-300 border border-red-500/30 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {!orderLimitCheck.allowed && orderLimitCheck.limit
                      ? `「${orderLimitCheck.limit.strategyName}」每单限购 ${orderLimitCheck.limit.maxPerPerson} 件，当前已有 ${orderLimitCheck.totalQty} 件`
                      : '部分商品已超出限购数量，请调整后再结算'}
                  </span>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || hasLimitViolation}
                className="btn-customer w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                立即结算
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-fuchsia-300/40 text-center leading-relaxed">
                结算后将生成支付二维码，支持微信/支付宝<br />
                全程加密，支付完成自动清除购物记录
              </p>
            </div>

            {items.length > 0 && pairingRecs.length > 0 && (
              <div className="glass-customer rounded-3xl p-5 space-y-3 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-fuchsia-50">智能搭配推荐</span>
                  </div>
                  <span className="text-[10px] text-fuchsia-400/50">
                    基于 {paidOrderCount} 笔订单分析
                  </span>
                </div>
                <div className="space-y-2">
                  {pairingRecs.map(rec => {
                    const recCartItem = cart?.items.find(it => it.productId === rec.product.id);
                    const recCartQty = recCartItem?.quantity || 0;
                    const recLimit = checkPurchaseLimit(rec.product.id, recCartQty);
                    const isDisabled = !recLimit.allowed;

                    const handleAddPairing = () => {
                      if (!recLimit.allowed) return;
                      addToCart(rec.product.id, 1);
                    };

                    return (
                      <div
                        key={rec.product.id}
                        className={clsx(
                          'flex items-center gap-3 p-3 rounded-2xl bg-amber-500/5 border transition-all group',
                          isDisabled ? 'opacity-50 border-amber-500/10' : 'border-amber-500/15 hover:border-amber-400/30'
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-900/50">
                          <img
                            src={rec.product.image}
                            alt=""
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-fuchsia-50 truncate">{rec.product.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-base font-bold bg-gradient-to-br from-amber-200 to-orange-300 bg-clip-text text-transparent customer-font-display">
                              {formatCurrency(rec.product.price)}
                            </span>
                            <span className="text-[10px] text-amber-300/70 flex items-center gap-0.5">
                              <Link2 className="w-2.5 h-2.5" />
                              {formatPercent(rec.confidence, 0)} 人搭配购买
                            </span>
                          </div>
                          {!recLimit.allowed && recLimit.limit && (
                            <div className="text-[10px] text-amber-400 mt-0.5 flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" />
                              已达购买上限
                            </div>
                          )}
                        </div>
                        <button
                          onClick={handleAddPairing}
                          disabled={isDisabled}
                          className={clsx(
                            'shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold transition-all',
                            isDisabled
                              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 border border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30'
                          )}
                        >
                          {isDisabled ? '已达上限' : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              加购
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-amber-300/60 text-center pt-1 flex items-center justify-center gap-1">
                  <Plus className="w-3 h-3" />
                  再加 <span className="font-semibold text-amber-300">{formatCurrency(pairingRecs[0]?.missingAmount || 0)}</span> 可享完美搭配
                </div>
              </div>
            )}

            <div className="glass-customer rounded-2xl p-4 space-y-2 text-xs text-fuchsia-200/60">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>支持到店后再结算，无时间限制</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>离店前请完成支付，出口将自动开启</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>如需帮助，可按店内呼叫按钮联系客服</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
