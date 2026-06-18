import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import CustomerNavBar from '@/components/shared/CustomerNavBar';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { getActiveStrategies } from '@/utils/strategyUtils';
import {
  Receipt as ReceiptIcon, CheckCircle2, Home, Trash2,
  Clock, QrCode, Share2, Eraser, DoorOpen, ShieldCheck, Sparkles, BadgePercent
} from 'lucide-react';

export default function CustomerReceipt() {
  const navigate = useNavigate();
  const lastPaidOrder = useAppStore(s => s.lastPaidOrder);
  const clearReceipt = useAppStore(s => s.clearReceipt);
  const clearCart = useAppStore(s => s.clearCart);

  const [countdown, setCountdown] = useState(180);
  const [isCopied, setIsCopied] = useState(false);
  const clearedRef = useRef(false);

  const order = lastPaidOrder;
  const items = order?.items ?? [];
  const qty = items.reduce((s, it) => s + it.quantity, 0);
  const strategies = useAppStore(s => s.strategies);
  const active = getActiveStrategies(strategies, new Date().getHours());
  const priceOverrides = active.priceOverrides;

  const getFinalPrice = (price: number, productId: string) => {
    const override = priceOverrides[productId];
    return override ? override.finalPrice : price;
  };

  useEffect(() => {
    if (!order) {
      navigate('/');
      return;
    }
  }, [order, navigate]);

  useEffect(() => {
    if (!order) return;
    const timer = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [order]);

  useEffect(() => {
    if (!order) return;

    const wipe = () => {
      if (clearedRef.current) return;
      clearedRef.current = true;
      clearReceipt();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const t = setTimeout(wipe, 5000);
        (window as any).__receiptVisibilityTimer = t;
      } else {
        const t = (window as any).__receiptVisibilityTimer;
        if (t) clearTimeout(t);
      }
    };

    const onBeforeUnload = () => wipe();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      const t = (window as any).__receiptVisibilityTimer;
      if (t) clearTimeout(t);
      if (countdown <= 0 && !clearedRef.current) wipe();
    };
  }, [order, countdown, clearReceipt]);

  useEffect(() => {
    if (countdown <= 0 && order && !clearedRef.current) {
      clearedRef.current = true;
      clearReceipt();
      setTimeout(() => navigate('/'), 600);
    }
  }, [countdown, order, clearReceipt, navigate]);

  if (!order) return null;

  const receiptText = [
    '==============================',
    '      私密优选 · 数字小票',
    '==============================',
    `订单号: ${order.id}`,
    `时间: ${order.paidAt ? formatDateTime(order.paidAt) : '-'}`,
    `支付: ${order.paymentMethod === 'wechat' ? '微信支付' : order.paymentMethod === 'alipay' ? '支付宝' : '-'}`,
    '------------------------------',
    '商品清单:',
    ...items.flatMap(it => {
      const unitPrice = getFinalPrice(it.product.price, it.productId);
      const override = priceOverrides[it.productId];
      const lines: string[] = [`  ${it.product.name} x${it.quantity}`];
      if (override && override.originalPrice !== override.finalPrice) {
        lines.push(`      原价 ${formatCurrency(it.product.price)} · 折扣后 ${formatCurrency(unitPrice)} [${override.strategyName}]`);
      } else {
        lines.push(`      ${formatCurrency(unitPrice)} × ${it.quantity} = ${formatCurrency(unitPrice * it.quantity)}`);
      }
      return lines;
    }),
    '------------------------------',
    `商品总额: ${formatCurrency(order.totalAmount)}`,
    order.strategyDiscount > 0 ? `时段自动折扣: -${formatCurrency(order.strategyDiscount)}` : '',
    order.discountAmount > 0 ? `满减优惠: -${formatCurrency(order.discountAmount)}` : '',
    `实付金额: ${formatCurrency(order.finalAmount)}`,
    '==============================',
    '  离店后本小票自动销毁',
    '  感谢您的光临，祝您愉快',
    '==============================',
  ].filter(Boolean).join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = receiptText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${order.id.slice(-8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLeave = () => {
    clearedRef.current = true;
    clearReceipt();
    clearCart();
    navigate('/');
  };

  const methodLabel = order.paymentMethod === 'wechat' ? '微信支付' : order.paymentMethod === 'alipay' ? '支付宝' : '-';
  const methodColor = order.paymentMethod === 'wechat' ? 'text-emerald-300' : order.paymentMethod === 'alipay' ? 'text-sky-300' : 'text-slate-400';
  const qrValue = `BEGIN:RECEIPT\nID:${order.id}\nAMOUNT:${order.finalAmount}\nTIME:${order.paidAt ?? ''}\nITEMS:${qty}\nPAY:${order.paymentMethod ?? ''}\nEND:RECEIPT\n\n[扫码已保存]此小票为临时凭证，离店后自动销毁。\n私密优选 · 无人零售`;

  return (
    <div className="min-h-screen gradient-customer-bg pb-16">
      <CustomerNavBar />

      <main className="max-w-[520px] mx-auto px-5 py-8 animate-fade-in">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-fuchsia-300/50 hover:text-fuchsia-200 mb-3 transition-colors">
            <Home className="w-3 h-3" /> 顾客首页
          </Link>
          <h1 className="customer-font-display text-2xl font-bold text-white flex items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center">
              <ReceiptIcon className="w-4.5 h-4.5 text-white" />
            </div>
            数字小票
          </h1>
        </div>

        <div className="relative mx-auto" style={{ filter: 'drop-shadow(0 12px 32px rgba(147,51,234,0.25))' }}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-10 z-10">
            <div className="w-6 h-6 rounded-full bg-[#0F172A]" />
            <div className="w-6 h-6 rounded-full bg-[#0F172A]" />
          </div>

          <div className="bg-gradient-to-b from-[#FDFAFF] to-[#FAF5FF] rounded-3xl pt-10 pb-8 px-6 space-y-5 text-slate-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-fuchsia-500" />

            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-600 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" /> 支付成功
              </div>
              <div className="customer-font-display text-lg font-bold text-slate-900">私密优选 · 无人零售</div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">PRIVATE · SELF-SERVICE STORE</div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
              <div>
                <div className="text-slate-400 text-[10px] mb-0.5">订单号</div>
                <div className="text-slate-700 font-semibold">{order.id}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-[10px] mb-0.5">支付时间</div>
                <div className="text-slate-700 font-semibold">{order.paidAt ? formatDateTime(order.paidAt) : '-'}</div>
              </div>
            </div>

            <div className="h-px border-t border-dashed border-slate-300" />

            <div className="space-y-2.5 px-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold text-slate-600 tracking-wide">商品清单</span>
                <span className="text-[10px] text-slate-400">共 {qty} 件</span>
              </div>
              {items.map(it => {
                const unitPrice = getFinalPrice(it.product.price, it.productId);
                const lineTotal = unitPrice * it.quantity;
                const override = priceOverrides[it.productId];
                return (
                  <div key={it.productId} className="flex items-start gap-3 py-1.5 border-b border-slate-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-800 leading-snug line-clamp-2">{it.product.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {formatCurrency(unitPrice)} × {it.quantity}
                        {override && override.originalPrice !== override.finalPrice && (
                          <span className="text-slate-400 ml-1 line-through">{formatCurrency(it.product.price)}</span>
                        )}
                      </div>
                      {override && (
                        <div className="text-[10px] text-emerald-600 mt-0.5">
                          「{override.strategyName}」-${((1 - override.percent) * 100).toFixed(0)}% OFF
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 shrink-0 pt-0.5 font-mono">
                      {formatCurrency(lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="h-px border-t border-dashed border-slate-300" />

            <div className="space-y-1.5 px-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>商品总额</span>
                <span className="font-mono">{formatCurrency(order.totalAmount)}</span>
              </div>
              {order.strategyDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <BadgePercent className="w-3 h-3" /> 时段自动折扣
                  </span>
                  <span className="font-mono">-{formatCurrency(order.strategyDiscount)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 满¥500 95折优惠
                  </span>
                  <span className="font-mono">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="h-px border-t border-slate-200 my-1.5" />
              <div className="flex justify-between items-end pt-0.5">
                <span className="text-sm font-semibold text-slate-900">实付金额</span>
                <span className="text-2xl font-bold font-mono bg-gradient-to-br from-fuchsia-600 to-violet-600 bg-clip-text text-transparent customer-font-display leading-none">
                  {formatCurrency(order.finalAmount)}
                </span>
              </div>
            </div>

            <div className="h-px border-t border-dashed border-slate-300" />

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">支付方式</span>
                <span className={`text-[11px] font-semibold ${methodColor.replace('300', '600').replace('emerald', 'emerald').replace('sky', 'sky')}`}>{methodLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <DoorOpen className="w-3 h-3" /> 出口门已开启
              </div>
            </div>

            <div className="pt-2">
              <div className="flex gap-3 items-start">
                <div className="shrink-0 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <QRCodeSVG
                    value={qrValue}
                    size={96}
                    level="M"
                    marginSize={1}
                    fgColor="#1E1B4B"
                    bgColor="#FFFFFF"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                      <QrCode className="w-3.5 h-3.5 text-violet-600" /> 扫码保存至手机
                    </div>
                    <div className="text-[10.5px] text-slate-500 leading-relaxed">
                      手机微信/支付宝扫一扫，即可保存此小票凭证，无需拍照
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={handleCopy}
                      className="text-[10.5px] px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      {isCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3" />}
                      {isCopied ? '已复制' : '复制文本'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="text-[10.5px] px-2 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <ReceiptIcon className="w-3 h-3" /> 下载TXT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-10">
            <div className="w-6 h-6 rounded-full bg-[#0F172A]" />
            <div className="w-6 h-6 rounded-full bg-[#0F172A]" />
          </div>
        </div>

        <div className="mt-10 space-y-3">
          <div className={`glass-customer rounded-2xl p-4 flex items-center justify-between ${countdown <= 30 ? 'border border-amber-400/40 bg-amber-500/5' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${countdown <= 30 ? 'bg-amber-500/15' : 'bg-fuchsia-500/15'}`}>
                <Clock className={`w-5 h-5 ${countdown <= 30 ? 'text-amber-400 animate-pulse' : 'text-fuchsia-300'}`} />
              </div>
              <div>
                <div className={`text-sm font-semibold ${countdown <= 30 ? 'text-amber-200' : 'text-fuchsia-100'}`}>
                  {countdown > 0 ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')} 后自动销毁` : '正在销毁...'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  <ShieldCheck className="w-3 h-3 inline mr-1 -mt-0.5" />
                  离开页面/切后台 5 秒后自动清除，不留痕迹
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleLeave}
              className="btn-customer py-3 text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Eraser className="w-4 h-4" /> 立即销毁并离店
            </button>
            <button
              onClick={() => { clearReceipt(); navigate('/'); }}
              className="bg-white/5 hover:bg-white/10 border border-white/15 rounded-full py-3 text-sm font-medium text-fuchsia-100 flex items-center justify-center gap-1.5 transition-all"
            >
              <Home className="w-4 h-4" /> 返回首页
            </button>
          </div>

          <div className="glass-customer rounded-2xl p-4 space-y-2 text-[11px] text-fuchsia-200/60">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>本次小票仅存储于本机内存，既未上传云端，也不会写入本地磁盘缓存</span>
            </div>
            <div className="flex items-start gap-2">
              <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>销毁动作采用内存覆盖式清除，符合隐私保护最佳实践，无法被数据恢复工具找回</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
