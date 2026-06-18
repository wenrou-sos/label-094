import { Link, useNavigate } from 'react-router-dom';
import CustomerNavBar from '@/components/shared/CustomerNavBar';
import CartItem from '@/components/customer/CartItem';
import ProductDetailModal from '@/components/customer/ProductDetailModal';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/utils/formatters';
import { ShoppingCart, ArrowRight, Trash2, Tag, ArrowLeft, Sparkles } from 'lucide-react';

export default function CustomerCart() {
  const cart = useAppStore(s => s.cart);
  const clear = useAppStore(s => s.clearCart);
  const createOrder = useAppStore(s => s.createOrder);
  const navigate = useNavigate();

  const items = cart?.items ?? [];
  const total = items.reduce((s, it) => s + it.product.price * it.quantity, 0);
  const discount = total >= 500 ? total * 0.05 : 0;
  const finalAmt = total - discount;
  const count = items.reduce((s, it) => s + it.quantity, 0);

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
              onClick={clear}
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
                  <span>{formatCurrency(total)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-300">
                    <span className="inline-flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> 满¥500立减95折
                    </span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="h-px bg-fuchsia-500/15 my-3" />
                <div className="flex items-center justify-between">
                  <span className="text-fuchsia-100 font-medium">应付金额</span>
                  <span className="text-3xl font-bold bg-gradient-to-br from-fuchsia-200 to-pink-300 bg-clip-text text-transparent customer-font-display">
                    {formatCurrency(finalAmt)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="text-[11px] text-emerald-300/80">
                    本单已优惠 {formatCurrency(discount)}
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="btn-customer w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                立即结算
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-fuchsia-300/40 text-center leading-relaxed">
                结算后将生成支付二维码，支持微信/支付宝<br />
                全程加密，支付完成自动清除购物记录
              </p>
            </div>

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
