import { useState, useEffect } from 'react';
import {
  X, ShoppingCart, Eye, EyeOff, Waves, Zap, Volume2,
  ShieldCheck, Droplets, ChevronDown, ChevronUp, Plus, Clock
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/utils/formatters';
import clsx from 'clsx';

const materialIcons: Record<string, any> = {
  '硅胶': ShieldCheck,
  'ABS': ShieldCheck,
  'TPE': ShieldCheck,
  '玻璃': Droplets,
  '金属': ShieldCheck,
  '其他': ShieldCheck
};

export default function ProductDetailModal() {
  const product = useAppStore(s => s.activeProduct);
  const open = useAppStore(s => s.isDetailModalOpen);
  const close = useAppStore(s => s.closeProductDetail);
  const addToCart = useAppStore(s => s.addToCart);
  const isPhoneBound = useAppStore(s => s.isPhoneBound);

  const [showClearImg, setShowClearImg] = useState(false);
  const [expandGuide, setExpandGuide] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (open) {
      setShowClearImg(false);
      setAdded(false);
    }
  }, [open, product?.id]);

  if (!open || !product) return null;

  const spec = product.specifications;
  const MatIcon = materialIcons[spec.material] || ShieldCheck;

  const handleAdd = () => {
    addToCart(product.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const tags = [
    { icon: MatIcon, label: '材质', value: `${spec.material} · ${spec.materialDetail}` },
    { icon: Droplets, label: '防水等级', value: spec.waterproof },
    { icon: Zap, label: '充电方式', value: spec.charging },
    { icon: Volume2, label: '工作噪音', value: spec.noise },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-[640px] glass-customer border-l border-fuchsia-500/20 animate-slide-right overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="px-7 pt-6 pb-4 flex items-center justify-between border-b border-fuchsia-500/15">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-fuchsia-500/40 blur-xl" />
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <div className="customer-font-display text-lg font-semibold text-fuchsia-50">
                  感应到商品详情
                </div>
                <div className="text-[11px] text-fuchsia-300/70 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 感应响应 · {(Math.random() * 0.3 + 0.15).toFixed(2)}秒
                </div>
              </div>
            </div>
            <button
              onClick={close}
              className="p-2 rounded-full text-fuchsia-200/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-6 space-y-6">
            <div className="relative rounded-[24px] overflow-hidden group aspect-[4/3] bg-slate-900/50">
              <img
                src={product.image}
                alt={product.name}
                className={clsx(
                  'w-full h-full object-cover transition-all duration-500',
                  showClearImg ? '' : 'privacy-blur'
                )}
                loading="lazy"
              />
              <button
                onClick={() => setShowClearImg(v => !v)}
                className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs text-white/80 hover:bg-black/80 transition-all"
              >
                {showClearImg ? (<><EyeOff className="w-3.5 h-3.5" /> 隐藏视图</>) : (<><Eye className="w-3.5 h-3.5" /> 查看清晰图</>)}
              </button>
              {product.originalPrice && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-[11px] font-bold text-white shadow-lg">
                  省 {formatCurrency(product.originalPrice - product.price)}
                </div>
              )}
              <div className="absolute top-4 right-16 flex gap-1.5">
                {product.tags.slice(0, 2).map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] text-white/80 border border-white/10">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="customer-font-display text-2xl font-semibold text-fuchsia-50 leading-tight">
                    {product.name}
                  </h2>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-fuchsia-300/60">
                    <span>SKU: <span className="text-fuchsia-300/80 font-mono">{product.sku}</span></span>
                    <span>分类: {product.category}</span>
                    <span className={clsx('px-2 py-0.5 rounded', product.inStock ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300')}>
                      {product.inStock ? '库存充足' : '暂缺货'}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-3xl font-bold bg-gradient-to-br from-fuchsia-200 to-pink-300 bg-clip-text text-transparent customer-font-display">
                    {formatCurrency(product.price)}
                  </div>
                  {product.originalPrice && (
                    <div className="text-sm text-fuchsia-300/40 line-through">
                      {formatCurrency(product.originalPrice)}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-fuchsia-200/70 text-sm leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-fuchsia-100 flex items-center gap-2">
                <Waves className="w-4 h-4 text-fuchsia-300" />
                规格参数
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {tags.map(t => {
                  const Icon = t.icon;
                  return (
                    <div key={t.label} className="glass-customer rounded-2xl p-4 space-y-1.5 hover:border-fuchsia-400/30 transition-all">
                      <div className="flex items-center gap-2 text-[11px] text-fuchsia-300/70">
                        <Icon className="w-3.5 h-3.5" />
                        {t.label}
                      </div>
                      <div className="text-sm font-medium text-fuchsia-50">{t.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setExpandGuide(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl glass-customer hover:border-fuchsia-400/25 transition-all"
              >
                <span className="text-sm font-semibold text-fuchsia-100 flex items-center gap-2">
                  <BookOpenIcon />
                  使用指南
                </span>
                {expandGuide
                  ? <ChevronUp className="w-4 h-4 text-fuchsia-300" />
                  : <ChevronDown className="w-4 h-4 text-fuchsia-300" />}
              </button>
              {expandGuide && (
                <div className="px-4 py-3 rounded-2xl bg-fuchsia-500/5 border border-fuchsia-500/10 text-sm text-fuchsia-200/75 leading-relaxed whitespace-pre-line animate-fade-in">
                  {product.usageGuide}
                </div>
              )}
            </div>
          </div>

          <div className="px-7 py-5 border-t border-fuchsia-500/15 flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={!product.inStock || added}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all',
                added
                  ? 'bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30'
                  : 'btn-customer'
              )}
            >
              {added ? (
                <>
                  <Plus className="w-5 h-5" />
                  已加入购物车
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4.5 h-4.5" />
                  加入购物车
                </>
              )}
            </button>
            {isPhoneBound && (
              <button
                onClick={handleAdd}
                className="btn-admin-ghost px-5 py-3.5 text-sm font-medium"
              >
                同步手机
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookOpenIcon() {
  return (
    <svg className="w-4 h-4 text-fuchsia-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
