import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Smartphone, Check, Sparkles, Shield } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function QRCodePanel() {
  const isBound = useAppStore(s => s.isPhoneBound);
  const bindPhone = useAppStore(s => s.bindPhone);
  const cart = useAppStore(s => s.cart);

  const [hovered, setHovered] = useState(false);

  const bindUrl = `https://private-store.app/bind?sess=${cart?.sessionId || 'demo'}`;

  const handleSimulateBind = () => {
    const mockPhone = '138****' + Math.floor(1000 + Math.random() * 9000);
    bindPhone(mockPhone);
  };

  return (
    <div
      className="glass-customer rounded-[32px] p-8 animate-fade-in relative overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 via-violet-400 to-pink-500" />
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-fuchsia-600/20 blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-fuchsia-300" />
            <h3 className="customer-font-display text-xl font-semibold text-fuchsia-100">
              扫码绑定您的手机
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-emerald-300">端到端加密</span>
          </div>
        </div>

        <div className="flex items-start gap-8">
          <div className="relative">
            <div
              className={`absolute inset-0 rounded-[28px] border-2 border-fuchsia-400/40 animate-pulse-ring ${hovered ? 'opacity-100' : 'opacity-60'}`}
              style={{ animationDelay: '0s' }}
            />
            <div
              className={`absolute inset-0 rounded-[28px] border-2 border-violet-400/30 animate-pulse-ring ${hovered ? 'opacity-100' : 'opacity-40'}`}
              style={{ animationDelay: '0.8s' }}
            />
            <div className="relative bg-white p-4 rounded-[24px] shadow-2xl shadow-violet-950/50">
              <QRCodeCanvas
                value={bindUrl}
                size={180}
                level="H"
                bgColor="#ffffff"
                fgColor="#3b0764"
                includeMargin={false}
              />
              {isBound && (
                <div className="absolute inset-0 bg-emerald-500/95 rounded-[24px] flex flex-col items-center justify-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
                    <Check className="w-8 h-8 text-white" strokeWidth={3} />
                  </div>
                  <div className="text-white text-sm font-medium">已成功绑定</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4 pt-2">
            <div>
              <p className="text-fuchsia-200/80 text-sm leading-relaxed mb-4">
                使用微信扫描左侧二维码，即可将购物车状态与您的手机关联。
                扫码后可在手机上远程查看商品详情、管理购物车、完成支付，全程无需在公共面板操作敏感信息。
              </p>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="text-fuchsia-200/70">购物车状态实时同步</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-sky-300 shrink-0" />
                  <span className="text-fuchsia-200/70">本地会话加密，离店自动清除</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span className="text-fuchsia-200/70">手机端完成支付，保护支付隐私</span>
                </div>
              </div>
            </div>

            {!isBound && (
              <button
                onClick={handleSimulateBind}
                className="btn-customer px-5 py-2.5 text-sm font-medium"
              >
                模拟扫码绑定（演示）
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
