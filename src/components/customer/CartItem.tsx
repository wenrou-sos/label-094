import { Trash2, Plus, Minus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/utils/formatters';
import type { CartItem as CartItemType } from '@/types';

interface Props {
  item: CartItemType;
}

export default function CartItem({ item }: Props) {
  const update = useAppStore(s => s.updateCartQuantity);
  const remove = useAppStore(s => s.removeFromCart);

  const lineTotal = item.product.price * item.quantity;

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
              className="w-7 h-7 rounded-full flex items-center justify-center text-fuchsia-300/70 hover:text-white hover:bg-fuchsia-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-right">
            <div className="text-base font-semibold text-fuchsia-100">
              {formatCurrency(lineTotal)}
            </div>
            {item.quantity > 1 && (
              <div className="text-[11px] text-fuchsia-300/50">
                单 {formatCurrency(item.product.price)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
