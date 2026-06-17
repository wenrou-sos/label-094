import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, BarChart3, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className={`min-h-screen flex items-center justify-center p-8 ${
      isAdminPath ? 'gradient-admin-bg' : 'gradient-customer-bg'
    }`}>
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="relative mb-10">
          <div className="text-[120px] font-black leading-none select-none" style={{
            fontFamily: isAdminPath ? "'JetBrains Mono', monospace" : "'Noto Serif SC', serif",
            background: isAdminPath
              ? 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)'
              : 'linear-gradient(135deg, #9333EA 0%, #F472B6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.3))'
          }}>
            404
          </div>
          <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full animate-pulse-ring ${
            isAdminPath ? 'bg-sky-500/20' : 'bg-fuchsia-500/20'
          }`} style={{ transform: 'translate(-50%, -50%)' }} />
        </div>

        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-medium ${
          isAdminPath
            ? 'bg-sky-500/10 border border-sky-500/30 text-sky-300'
            : 'bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300'
        }`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>访问的页面不存在</span>
        </div>

        <h1 className={`text-2xl font-bold mb-3 ${
          isAdminPath ? 'text-sky-100 admin-font-mono' : 'text-fuchsia-50 customer-font-display'
        }`}>
          {isAdminPath ? '管理页面未找到' : '页面走丢了'}
        </h1>

        <p className="text-slate-400 text-sm mb-2 leading-relaxed">
          您访问的路径 <code className={`px-1.5 py-0.5 rounded text-xs ${
            isAdminPath ? 'bg-slate-700/60 text-sky-300' : 'bg-slate-700/60 text-fuchsia-300'
          }`}>{location.pathname}</code> 不存在
        </p>
        <p className="text-slate-500 text-xs mb-10">
          可能是链接已失效，或您输入了错误的地址
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className={`px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-medium ${
              isAdminPath
                ? 'btn-admin-ghost text-sm'
                : 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回上一页</span>
          </button>

          <Link
            to={isAdminPath ? '/admin' : '/'}
            className={`px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-medium ${
              isAdminPath ? 'btn-admin' : 'btn-customer'
            }`}
          >
            {isAdminPath ? (
              <>
                <BarChart3 className="w-4 h-4" />
                <span>返回管理首页</span>
              </>
            ) : (
              <>
                <Home className="w-4 h-4" />
                <span>返回顾客首页</span>
              </>
            )}
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 mb-4">其他导航入口：</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/"
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3 h-3" />顾客端
            </Link>
            <Link
              to="/cart"
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              购物车
            </Link>
            <Link
              to="/admin"
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1.5"
            >
              <BarChart3 className="w-3 h-3" />管理仪表盘
            </Link>
            <Link
              to="/admin/analytics"
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              行为分析
            </Link>
            <Link
              to="/admin/export"
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              数据导出
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
