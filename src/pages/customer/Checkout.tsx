import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerNavBar from '@/components/shared/CustomerNavBar';
import PaymentQRCode from '@/components/customer/PaymentQRCode';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import {
  CreditCard, ArrowLeft, CheckCircle2, Home, ShoppingBag,
  Clock, DoorOpen, ShieldCheck
} from 'lucide-react';

export default function CustomerCheckout() {
  const navigate = useNavigate();
  const cart = useAppStore(s => s.cart);
  const createOrder = useAppStore(s => s.createOrder);
  const currentOrder = useAppStore(s => s.currentOrder);
  const clearCart = useAppStore(s => s.clearCart);

  const [order, setOrder] = useState(currentOrder);

  useEffect(() => {
    if (!currentOrder) {
      try {
        const o = createOrder();
        setOrder(o);
      } catch {
        navigate('/cart');
      }
    }
  }, [currentOrder, createOrder, navigate]);

  useEffect(() => {
    if (currentOrder) setOrder(currentOrder);
  }, [currentOrder]);

  const paid = order?.status === 'paid';
  const items = order?.items ?? [];
  const qty = items.reduce((s, it) => s + it.quantity, 0);

  useEffect(() => {
    if (paid) {
      const t = setTimeout(() => navigate('/receipt'), 800);
      return () => clearTimeout(t);
    }
  }, [paid, navigate]);

  if (!order) return null;

  if (paid) {
    return (
      <div className="min-h-screen gradient-customer-bg flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
              <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
          </div>
          <h2 className="customer-font-display text-2xl font-bold text-white mb-1">支付成功</h2>
          <p className="text-fuchsia-200/70 text-sm">正在生成数字小票...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-customer-bg">
      <CustomerNavBar />

      <main className="max-w-[1200px] mx-auto px-8 py-8 animate-fade-in">
        <div className="mb-6">
          <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs text-fuchsia-300/60 hover:text-fuchsia-200 mb-2 transition-colors">
            <ArrowLeft className="w-3 h-3" /> 返回购物车
          </Link>
          <h1 className="customer-font-display text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            支付结算
          </h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_460px] gap-8">
            <div className="space-y-4">
              <div className="glass-customer rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="customer-font-display text-lg font-semibold text-fuchsia-50">
                    订单信息
                  </h3>
                  <span className="text-xs text-fuchsia-300/60 admin-font-mono">
                    {order.id}
                  </span>
                </div>

                <div className="h-px bg-fuchsia-500/15" />

                <div className="space-y-3 max-h-[440px] overflow-y-auto scrollbar-thin pr-2">
                  {items.map(it => (
                    <div key={it.productId} className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-900/60">
                        <img
                          src={it.product.image}
                          alt=""
                          className="w-full h-full object-cover privacy-blur"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-fuchsia-50 truncate">{it.product.name}</div>
                        <div className="text-[11px] text-fuchsia-300/50 font-mono">{it.product.sku}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm text-fuchsia-100 admin-font-mono">×{it.quantity}</div>
                        <div className="text-xs text-fuchsia-300/60">{formatCurrency(it.product.price * it.quantity)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-fuchsia-500/15" />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-fuchsia-200/70">
                    <span>商品总价</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-300">
                      <span>满减优惠</span>
                      <span>-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-base font-semibold text-fuchsia-50">应付金额</span>
                    <span className="text-2xl font-bold bg-gradient-to-br from-fuchsia-200 to-pink-300 bg-clip-text text-transparent customer-font-display">
                      {formatCurrency(order.finalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-customer rounded-2xl p-4 space-y-2 text-xs text-fuchsia-200/60">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>支付二维码将在 <span className="admin-font-mono text-fuchsia-200">3分钟</span> 后过期，请尽快完成支付</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>本次交易由微信/支付宝官方加密通道保障安全</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 h-fit lg:sticky lg:top-28">
              <PaymentQRCode order={order} method="wechat" />
              <PaymentQRCode order={order} method="alipay" />
            </div>
        </div>
      </main>
    </div>
  );
}
