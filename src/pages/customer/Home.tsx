import CustomerNavBar from '@/components/shared/CustomerNavBar';
import QRCodePanel from '@/components/customer/QRCodePanel';
import SensorIndicator from '@/components/customer/SensorIndicator';
import ProductDetailModal from '@/components/customer/ProductDetailModal';
import { Sparkles, Shield, Clock, MapPin, ArrowRight, Users } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';

export default function CustomerHome() {
  const cart = useAppStore(s => s.cart);
  const metrics = useAppStore(s => s.realtimeMetrics);
  const total = cart?.items.reduce((s, it) => s + it.product.price * it.quantity, 0) || 0;
  const count = cart?.items.reduce((s, it) => s + it.quantity, 0) || 0;

  return (
    <div className="min-h-screen gradient-customer-bg">
      <CustomerNavBar />
      <ProductDetailModal />

      <main className="max-w-[1400px] mx-auto px-8 py-8 space-y-8 animate-fade-in">
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
                  to={count > 0 ? '/cart' : '/cart'}
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
                  { icon: MapPin, label: 'A/B/C/D四区', sub: '300+精选' },
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
      </main>
    </div>
  );
}
