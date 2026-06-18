import { Trash2, Plus, Minus, BadgePercent, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/utils/formatters';
import { getActiveStrategies } from '@/utils/strategyUtils';
import type { CartItem as CartItemType } from '@/types';

interface Props {
  item: CartItemType;
}

export default function CartItem({ item }: Props) {
  const update = useAppStore(s => s.updateCartQuantity);
  const remove = useAppStore(s => s.removeFromCart);
  const strategies = useAppStore(s => s.strategies);
  const checkPurchaseLimit = useAppStore(s => s.checkPurchaseLimit);

  const active = getActiveStrategies(strategies, new Date().getHours());
  const discount = active.priceOverrides[item.productId];
  const finalPrice = discount ? discount.finalPrice : item.product.price;
  const lineTotal = finalPrice * item.quantity;
  const limit = checkPurchaseLimit(item.productId, item.quantity - 1);
  const canIncrease = limit.allowed;

  return (
    <div className="glass-customer rounded-2xl p-4 flex items-center gap-4 animate-slide-up group">
      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-900/60">
        <img
          src={item.product.image}
          alt=""
          className="w-full h-full object-cover privacy-blur group-hover:blur-md"
          loading="lazy"
        />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-fuchsia-50 truncate">
            {item.product.name}
          </h4>
          <button
            onClick={() => remove(item.productId)}
            className="p-1.5 rounded-lg text-fuchsia-300/40 hover:text-rose-300 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
            title="移除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] text-fuchsia-300/50 font-mono">
          {item.product.sku} · {item.product.specifications.material} · {item.product.specifications.waterproof}
        </div>

        {discount && (
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <BadgePercent className="w-3 h-3" />
            已应用「{discount.strategyName}」{((1 - discount.percent) * 100).toFixed(0)}% OFF
          </div>
        )}

        {!limit.allowed && limit.limit && (
          <div className="text-[10px] text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            已达限购上限 {limit.limit.maxPerPerson} 件
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 bg-slate-900/50 rounded-full p-0.5">
            <button
              onClick={() => update(item.productId, item.quantity - 1)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-fuchsia-300/70 hover:text-white hover:bg-fuchsia-500/20 transition-all"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-medium text-fuchsia-100">
              {item.quantity}
            </span>
            <button
              onClick={() => update(item.productId, item.quantity + 1)}
              disabled={!canIncrease}
              className="w-7 h-7 rounded-full flex items-center justify-center text-fuchsia-300/70 hover:text-white hover:bg-fuchsia-500/20 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-right">
            <div className="text-base font-semibold text-fuchsia-100">
              {formatCurrency(lineTotal)}
            </div>
            <div className="flex items-baseline gap-2 justify-end">
              {discount && (
                <span className="text-[10px] text-fuchsia-300/40 line-through">
                  原 {formatCurrency(item.product.price * item.quantity)}
                </span>
              )}
              {item.quantity > 1 && (
                <div className="text-[11px] text-fuchsia-300/50">
                  单 {formatCurrency(finalPrice)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
