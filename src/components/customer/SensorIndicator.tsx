import { useEffect, useState } from 'react';
import { Radio, Hand, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { products } from '@/data/products';
import clsx from 'clsx';

export default function SensorIndicator() {
  const simulate = useAppStore(s => s.simulateProductPickup);
  const start = useAppStore(s => s.startAutoSimulation);
  const stop = useAppStore(s => s.stopAutoSimulation);
  const activeProduct = useAppStore(s => s.activeProduct);
  const behaviors = useAppStore(s => s.productBehaviors);

  const [autoOn, setAutoOn] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    if (autoOn) start();
    else stop();
    return () => stop();
  }, [autoOn, start, stop]);

  useEffect(() => {
    if (activeProduct) {
      setPulse(true);
      setFlashId(activeProduct.id);
      const t = setTimeout(() => {
        setPulse(false);
        setFlashId(null);
      }, 1600);
      return () => clearTimeout(t);
    }
  }, [activeProduct?.id]);

  const pickupTotal = behaviors.reduce((s, b) => s + b.pickupCount, 0);

  return (
    <div className="glass-customer rounded-[28px] p-6 space-y-5 animate-fade-in relative overflow-hidden">
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={clsx(
              'absolute inset-0 rounded-full bg-fuchsia-500/40',
              pulse ? 'animate-ping' : ''
            )} />
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-lg shadow-fuchsia-900/50">
              <Radio className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="customer-font-display text-lg font-semibold text-fuchsia-50">
              感应标签系统
            </h3>
            <p className="text-xs text-fuchsia-300/60 mt-0.5">
              实时捕捉货架拿起动作 · 已感应 <span className="text-fuchsia-200 font-medium">{pickupTotal}</span> 次
            </p>
          </div>
        </div>

        <button
          onClick={() => setAutoOn(v => !v)}
          className={clsx(
            'relative px-4 py-2 rounded-full text-xs font-medium transition-all border',
            autoOn
              ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
              : 'bg-slate-700/30 border-slate-500/30 text-slate-400'
          )}
        >
          <span className={clsx(
            'inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle',
            autoOn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
          )} />
          自动模拟 {autoOn ? '开启' : '暂停'}
        </button>
      </div>

      <div className="relative grid grid-cols-4 gap-3">
        {products.slice(0, 8).map(p => {
          const behavior = behaviors.find(b => b.productId === p.id);
          const isFlash = flashId === p.id;
          return (
            <button
              key={p.id}
              onClick={simulate}
              className={clsx(
                'group relative aspect-square rounded-2xl overflow-hidden transition-all border',
                isFlash
                  ? 'border-fuchsia-400 scale-[1.03] shadow-2xl shadow-fuchsia-600/40 z-10'
                  : 'border-fuchsia-500/10 hover:border-fuchsia-400/30 hover:scale-[1.02]'
              )}
            >
              <img
                src={p.image}
                alt=""
                className="w-full h-full object-cover transition-all group-hover:scale-105 privacy-blur group-hover:blur-md"
                loading="lazy"
              />
              <div className={clsx(
                'absolute inset-0 flex items-center justify-center bg-gradient-to-t from-fuchsia-950/90 via-fuchsia-950/50 to-transparent',
                isFlash ? 'opacity-100' : 'opacity-80'
              )}>
                <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
                  <div className="text-[10px] text-fuchsia-200/80 truncate">{p.name}</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-amber-300 font-semibold">
                      ¥{p.price}
                    </span>
                    {behavior && (
                      <span className="text-[9px] text-fuchsia-300/60">
                        <Hand className="w-2.5 h-2.5 inline mr-0.5" />{behavior.pickupCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isFlash && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-fuchsia-500 flex items-center justify-center shadow-lg animate-pulse">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="relative pt-2">
        <button
          onClick={simulate}
          className="w-full py-3 rounded-2xl border border-dashed border-fuchsia-400/30 text-sm text-fuchsia-300/70 hover:text-fuchsia-200 hover:bg-fuchsia-500/5 hover:border-fuchsia-400/50 transition-all flex items-center justify-center gap-2"
        >
          <Hand className="w-4 h-4" />
          手动模拟一次顾客拿取商品动作
        </button>
      </div>
    </div>
  );
}
