import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Home, CreditCard, Settings } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import clsx from 'clsx';

export default function CustomerNavBar() {
  const location = useLocation();
  const cart = useAppStore(s => s.cart);
  const itemCount = cart?.items.reduce((sum, it) => sum + it.quantity, 0) || 0;

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/cart', label: '购物车', icon: ShoppingCart, badge: itemCount },
    { path: '/checkout', label: '结算', icon: CreditCard },
  ];

  return (
    <nav className="sticky top-0 z-40 glass-customer border-b border-fuchsia-500/15 px-8 py-3">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <span className="text-white text-lg customer-font-display font-bold">秘</span>
          </div>
          <div>
            <div className="customer-font-display text-lg font-semibold text-fuchsia-100 tracking-wide">
              私密优选 · 无人体验店
            </div>
            <div className="text-[11px] text-fuchsia-300/60 tracking-[0.2em]">
              PRIVATE · 24H SELF-SERVICE
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'relative flex items-center gap-2 px-5 py-2 rounded-full text-sm transition-all',
                  active
                    ? 'bg-gradient-to-r from-fuchsia-500/25 to-violet-500/25 text-white border border-fuchsia-400/30 shadow-inner shadow-fuchsia-500/10'
                    : 'text-fuchsia-200/70 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 text-[10px] flex items-center justify-center font-bold text-white shadow">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <Link
            to="/admin/dashboard"
            className="ml-3 p-2 rounded-full text-fuchsia-300/50 hover:text-fuchsia-200 hover:bg-white/5 transition-all"
            title="管理后台"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
