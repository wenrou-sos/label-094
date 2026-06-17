import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/utils/formatters';
import clsx from 'clsx';
import type { Order } from '@/types';

interface Props {
  order: Order;
  method: 'wechat' | 'alipay';
}

export default function PaymentQRCode({ order, method }: Props) {
  const simulatePayment = useAppStore(s => s.simulatePayment);
  const currentOrder = useAppStore(s => s.currentOrder);

  const [status, setStatus] = useState<'pending' | 'loading' | 'paid' | 'failed'>('pending');
  const [expireSec, setExpireSec] = useState(180);

  const orderRef = order;

  useEffect(() => {
    if (!orderRef?.id || status === 'paid' || status === 'failed') return;

    const timer = setInterval(() => {
      setExpireSec(s => {
        if (s <= 1) {
          clearInterval(timer);
          setStatus('failed');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [orderRef?.id, status]);

  useEffect(() => {
    if (status === 'loading') return;
    if (currentOrder && currentOrder.id === orderRef.id) {
      if (currentOrder.status === 'paid') setStatus('paid');
      else if (currentOrder.status === 'failed') setStatus('failed');
    }
  }, [currentOrder, orderRef.id, status]);

  const doPay = async () => {
    setStatus('loading');
    const ok = await simulatePayment(orderRef.id, method);
    setStatus(ok ? 'paid' : 'failed');
  };

  const colorMap = {
    wechat: {
      main: '#07C160',
      label: '微信支付',
      bg: 'from-emerald-500/10 to-green-500/5',
      ring: 'ring-emerald-400/30'
    },
    alipay: {
      main: '#1677FF',
      label: '支付宝',
      bg: 'from-blue-500/10 to-sky-500/5',
      ring: 'ring-blue-400/30'
    }
  };
  const c = colorMap[method];

  const payUrl = `${method === 'wechat' ? 'wxp://' : 'alipays://'}pay?order=${orderRef.id}&amt=${orderRef.finalAmount}`;
  const mins = Math.floor(expireSec / 60);
  const secs = String(expireSec % 60).padStart(2, '0');

  return (
    <div className={clsx(
      'rounded-3xl p-7 bg-gradient-to-br border transition-all',
      c.bg,
      status === 'paid' ? 'border-emerald-400/30' :
      status === 'failed' ? 'border-rose-400/30' :
      'border-white/10'
    )}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{ background: c.main }}
          >
            {method === 'wechat' ? '微' : '支'}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">{c.label}</div>
            <div className="text-[11px] text-slate-400">扫码立即支付</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-slate-400">应付金额</div>
          <div className="text-2xl font-bold text-white customer-font-display">
            {formatCurrency(orderRef.finalAmount)}
          </div>
        </div>
      </div>

      <div className="relative w-[220px] h-[220px] mx-auto">
        {status === 'pending' && (
          <>
            <div className={clsx('absolute inset-0 rounded-3xl ring-4 animate-pulse-ring', c.ring)} />
            <div className={clsx('absolute inset-0 rounded-3xl ring-2 animate-pulse-ring opacity-70', c.ring)} style={{ animationDelay: '0.8s' }} />
          </>
        )}

        <div className="relative bg-white p-4 rounded-3xl shadow-2xl">
          <QRCodeCanvas
            value={payUrl}
            size={188}
            level="H"
            bgColor="#ffffff"
            fgColor={status === 'pending' ? '#111' : status === 'paid' ? '#10b981' : '#f43f5e'}
          />
          {(status === 'paid' || status === 'failed' || status === 'loading') && (
            <div className="absolute inset-0 rounded-3xl bg-white/90 flex flex-col items-center justify-center gap-3">
              {status === 'paid' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center animate-fade-in">
                    <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-emerald-600 font-semibold">支付成功</div>
                  <div className="text-xs text-emerald-500/70">感谢您的光临，祝您购物愉快</div>
                </>
              )}
              {status === 'failed' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-rose-600 font-semibold">支付超时或失败</div>
                  <button
                    onClick={doPay}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 text-white text-xs hover:bg-slate-800"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> 重新模拟支付
                  </button>
                </>
              )}
              {status === 'loading' && (
                <>
                  <Loader2 className="w-10 h-10 text-slate-500 animate-spin" />
                  <div className="text-slate-500 text-sm font-medium">正在确认支付…</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs">
        <div className="text-slate-400">
          订单号：<span className="font-mono text-slate-300">{orderRef.id}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={clsx(
            'px-2.5 py-1 rounded-full',
            expireSec < 30
              ? 'bg-rose-500/10 text-rose-300'
              : 'bg-amber-500/10 text-amber-300'
          )}>
            {mins}:{secs} 后过期
          </span>
        </div>
      </div>

      {status === 'pending' && (
        <button
          onClick={doPay}
          className="mt-4 w-full py-2.5 rounded-2xl text-sm font-medium text-white/80 hover:text-white border border-white/15 hover:border-white/25 hover:bg-white/5 transition-all"
        >
          模拟手机已扫码完成支付
        </button>
      )}
    </div>
  );
}
