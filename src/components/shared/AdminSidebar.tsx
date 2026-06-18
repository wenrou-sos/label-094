import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Network,
  Calendar,
  Download,
  Settings,
  Store,
  LogOut
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/admin/dashboard', label: '监控仪表盘', icon: LayoutDashboard },
  { path: '/admin/analytics', label: '行为分析', icon: BarChart3 },
  { path: '/admin/association', label: '关联分析', icon: Network },
  { path: '/admin/heatmap', label: '营业热力图', icon: Calendar },
  { path: '/admin/strategy', label: '运营策略', icon: Settings },
  { path: '/admin/export', label: '数据导出', icon: Download }
];

type AdminSidebarProps = {
  active?: string;
};

export default function AdminSidebar({ active }: AdminSidebarProps) {
  return (
    <aside className="w-60 shrink-0 h-screen glass-admin border-r border-sky-500/15 flex flex-col sticky top-0">
      <div className="px-6 py-5 border-b border-sky-500/15 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="admin-font-mono text-sm font-bold text-sky-200">私密优选</div>
          <div className="text-[10px] text-sky-400/70 tracking-wide">ADMIN · 管理中心</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                'group flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-all',
                isActive
                  ? 'bg-sky-500/15 text-sky-200 border border-sky-500/30'
                  : 'text-slate-400 hover:bg-sky-500/8 hover:text-sky-300'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sky-500/15">
        <button
          onClick={() => window.location.href = '/'}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>返回顾客端</span>
        </button>
      </div>
    </aside>
  );
}
