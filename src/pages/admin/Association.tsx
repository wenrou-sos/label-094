import { useMemo, useState } from 'react';
import AdminSidebar from '@/components/shared/AdminSidebar';
import { useAppStore } from '@/store/useAppStore';
import {
  Network, RefreshCw, ArrowUpDown, Filter, TrendingUp, Zap,
  Link2, BarChart3, Info, ChevronRight, Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import { formatPercent, formatNumber } from '@/utils/formatters';

type SortKey = 'confidence' | 'support' | 'lift' | 'supportCount';

export default function AdminAssociation() {
  const rules = useAppStore(s => s.associationRules);
  const simulatedOrders = useAppStore(s => s.simulatedOrders);
  const regenerate = useAppStore(s => s.regenerateAssociationRules);

  const [sortKey, setSortKey] = useState<SortKey>('confidence');
  const [sortAsc, setSortAsc] = useState(false);
  const [minConfidence, setMinConfidence] = useState(25);
  const [minLift, setMinLift] = useState(1.2);
  const [searchProduct, setSearchProduct] = useState('');
  const [orderCount, setOrderCount] = useState(800);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const paidOrders = useMemo(() =>
    simulatedOrders.filter(o => o.status === 'paid'),
    [simulatedOrders]
  );

  const filteredRules = useMemo(() => {
    let list = rules.filter(r => {
      if (r.confidence * 100 < minConfidence) return false;
      if (r.lift < minLift) return false;
      if (searchProduct.trim()) {
        const q = searchProduct.toLowerCase();
        const antMatch = r.antecedent.some(p => p.name.toLowerCase().includes(q));
        const consMatch = r.consequent.some(p => p.name.toLowerCase().includes(q));
        if (!antMatch && !consMatch) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortAsc ? av - bv : bv - av;
    });

    return list;
  }, [rules, minConfidence, minLift, searchProduct, sortKey, sortAsc]);

  const topRules = useMemo(() =>
    [...rules].sort((a, b) => b.lift - a.lift).slice(0, 5),
    [rules]
  );

  const productNetwork = useMemo(() => {
    const nodes = new Map<string, { id: string; name: string; count: number }>();
    const edges: { from: string; to: string; weight: number }[] = [];

    for (const rule of rules) {
      for (const p of rule.antecedent) {
        const n = nodes.get(p.id) || { id: p.id, name: p.name, count: 0 };
        n.count += rule.supportCount;
        nodes.set(p.id, n);
      }
      for (const p of rule.consequent) {
        const n = nodes.get(p.id) || { id: p.id, name: p.name, count: 0 };
        n.count += rule.supportCount;
        nodes.set(p.id, n);
      }
      if (rule.antecedent.length === 1 && rule.consequent.length === 1) {
        edges.push({
          from: rule.antecedent[0].name,
          to: rule.consequent[0].name,
          weight: rule.confidence
        });
      }
    }

    return {
      nodes: Array.from(nodes.values()).sort((a, b) => b.count - a.count).slice(0, 10),
      edges: edges.sort((a, b) => b.weight - a.weight).slice(0, 12)
    };
  }, [rules]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(v => !v);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const handleRegenerate = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      regenerate(orderCount);
      setIsRefreshing(false);
    }, 600);
  };

  const sortIcon = (key: SortKey) => (
    <ArrowUpDown className={clsx(
      'w-3 h-3 ml-1 inline transition-colors',
      sortKey === key ? 'text-sky-300' : 'text-slate-600'
    )} />
  );

  const liftColor = (lift: number) => {
    if (lift >= 3) return 'text-violet-300';
    if (lift >= 2) return 'text-emerald-300';
    if (lift >= 1.3) return 'text-sky-300';
    return 'text-slate-400';
  };

  const confBarColor = (conf: number) => {
    if (conf >= 0.6) return 'from-violet-500 to-fuchsia-500';
    if (conf >= 0.4) return 'from-sky-500 to-cyan-500';
    return 'from-emerald-500 to-teal-500';
  };

  return (
    <div className="min-h-screen gradient-admin-bg flex">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-6 animate-fade-in">
        <header className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-sky-400/60 mb-1 tracking-[0.2em] uppercase">Market Basket Analysis</div>
            <h1 className="text-2xl font-bold text-white admin-font-mono tracking-tight flex items-center gap-3">
              <Network className="w-6 h-6 text-sky-400" />
              商品关联分析
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              基于 Apriori 算法挖掘购买关联，识别强关联商品组合
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">模拟订单量</span>
              <select
                value={orderCount}
                onChange={e => setOrderCount(Number(e.target.value))}
                className="bg-slate-800/60 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-md text-xs focus:outline-none focus:border-sky-500"
              >
                <option value={400}>400 笔</option>
                <option value={800}>800 笔</option>
                <option value={1500}>1500 笔</option>
                <option value={3000}>3000 笔</option>
              </select>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-all disabled:opacity-50"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
              重新生成
            </button>
          </div>
        </header>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="glass-admin rounded-xl p-5 border-r-4 border-sky-400/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-sky-300/80">分析订单总数</div>
              <BarChart3 className="w-4 h-4 text-sky-300" />
            </div>
            <div className="text-2xl font-bold text-white admin-font-mono mb-1">
              {formatNumber(paidOrders.length)}
            </div>
            <div className="text-[11px] text-slate-400">
              有效支付订单，占模拟数据 {formatPercent(paidOrders.length / Math.max(simulatedOrders.length, 1), 0)}
            </div>
          </div>
          <div className="glass-admin rounded-xl p-5 border-r-4 border-violet-400/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-violet-300/80">挖掘关联规则</div>
              <Link2 className="w-4 h-4 text-violet-300" />
            </div>
            <div className="text-2xl font-bold text-white admin-font-mono mb-1">
              {formatNumber(rules.length)}
            </div>
            <div className="text-[11px] text-slate-400">
              满足最小支持度与置信度阈值
            </div>
          </div>
          <div className="glass-admin rounded-xl p-5 border-r-4 border-emerald-400/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-emerald-300/80">高置信规则 (≥60%)</div>
              <Zap className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-2xl font-bold text-white admin-font-mono mb-1">
              {formatNumber(rules.filter(r => r.confidence >= 0.6).length)}
            </div>
            <div className="text-[11px] text-slate-400">
              强关联购买倾向
            </div>
          </div>
          <div className="glass-admin rounded-xl p-5 border-r-4 border-amber-400/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-amber-300/80">平均提升度</div>
              <TrendingUp className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-2xl font-bold text-white admin-font-mono mb-1">
              {rules.length > 0
                ? (rules.reduce((s, r) => s + r.lift, 0) / rules.length).toFixed(2)
                : '0.00'}
            </div>
            <div className="text-[11px] text-slate-400">
              &gt;1.0 表示正相关
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="glass-admin rounded-xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-sm font-semibold text-sky-100 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-sky-400" />
                  关联规则列表
                  <span className="text-[11px] text-slate-500 font-normal">
                    ({filteredRules.length} 条规则)
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="搜索商品..."
                    value={searchProduct}
                    onChange={e => setSearchProduct(e.target.value)}
                    className="bg-slate-800/50 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-md text-xs w-44 focus:outline-none focus:border-sky-500 placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">最低置信度</span>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={minConfidence}
                    onChange={e => setMinConfidence(Number(e.target.value))}
                    className="w-28 accent-sky-500"
                  />
                  <span className="text-sky-300 admin-font-mono w-12">≥{minConfidence}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">最低提升度</span>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    value={Math.round(minLift * 10)}
                    onChange={e => setMinLift(Number(e.target.value) / 10)}
                    className="w-24 accent-violet-500"
                  />
                  <span className="text-violet-300 admin-font-mono w-10">≥{minLift.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-800/40">
                    <th className="px-5 py-3 font-medium w-12">#</th>
                    <th className="px-5 py-3 font-medium">关联规则 (前件 → 后件)</th>
                    <th
                      className="px-5 py-3 font-medium w-36 text-right cursor-pointer hover:text-sky-300"
                      onClick={() => handleSort('support')}
                    >
                      支持度{sortIcon('support')}
                    </th>
                    <th
                      className="px-5 py-3 font-medium w-44 text-right cursor-pointer hover:text-sky-300"
                      onClick={() => handleSort('confidence')}
                    >
                      置信度{sortIcon('confidence')}
                    </th>
                    <th
                      className="px-5 py-3 font-medium w-28 text-right cursor-pointer hover:text-sky-300"
                      onClick={() => handleSort('lift')}
                    >
                      提升度{sortIcon('lift')}
                    </th>
                    <th
                      className="px-5 py-3 font-medium w-24 text-right cursor-pointer hover:text-sky-300"
                      onClick={() => handleSort('supportCount')}
                    >
                      次数{sortIcon('supportCount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                        <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        暂无符合筛选条件的关联规则
                      </td>
                    </tr>
                  ) : filteredRules.map((rule, idx) => (
                    <tr
                      key={rule.id}
                      className="border-t border-slate-800/60 hover:bg-sky-500/5 transition-colors"
                    >
                      <td className="px-5 py-3 admin-font-mono text-slate-500">
                        #{idx + 1}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {rule.antecedent.map((p, i) => (
                            <span key={`a-${p.id}`} className="inline-flex items-center gap-1">
                              <span className="px-2 py-1 rounded bg-sky-500/10 text-sky-300 text-[11px] border border-sky-500/20 max-w-[180px] truncate">
                                {p.name}
                              </span>
                              {i < rule.antecedent.length - 1 && (
                                <span className="text-slate-600 text-xs">+</span>
                              )}
                            </span>
                          ))}
                          <ChevronRight className="w-4 h-4 text-violet-400" />
                          {rule.consequent.map((p, i) => (
                            <span key={`c-${p.id}`} className="inline-flex items-center gap-1">
                              <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-300 text-[11px] border border-violet-500/20 max-w-[180px] truncate">
                                {p.name}
                              </span>
                              {i < rule.consequent.length - 1 && (
                                <span className="text-slate-600 text-xs">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right admin-font-mono text-slate-300">
                        {formatPercent(rule.support, 1)}
                        <div className="text-[10px] text-slate-500">
                          {rule.supportCount} 笔订单
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 justify-end">
                          <div className="w-24 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                              className={clsx('h-full rounded-full bg-gradient-to-r', confBarColor(rule.confidence))}
                              style={{ width: `${Math.min(rule.confidence * 100, 100)}%` }}
                            />
                          </div>
                          <span className="admin-font-mono text-xs font-semibold w-12 text-right text-emerald-300">
                            {formatPercent(rule.confidence, 0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={clsx('admin-font-mono font-semibold', liftColor(rule.lift))}>
                          {rule.lift.toFixed(2)}×
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right admin-font-mono text-slate-400">
                        {formatNumber(rule.supportCount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 h-fit">
            <div className="glass-admin rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-sky-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Top 5 最强关联
              </h3>
              <div className="space-y-2.5">
                {topRules.map((rule, i) => (
                  <div key={rule.id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] admin-font-mono text-slate-500">#{i + 1}</span>
                      <span className={clsx('text-xs admin-font-mono font-semibold', liftColor(rule.lift))}>
                        提升 {rule.lift.toFixed(2)}×
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                      {rule.antecedent.map(p => (
                        <span key={p.id} className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 truncate max-w-[120px]">
                          {p.name}
                        </span>
                      ))}
                      <ChevronRight className="w-3 h-3 text-violet-400 flex-shrink-0" />
                      {rule.consequent.map(p => (
                        <span key={p.id} className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 truncate max-w-[120px]">
                          {p.name}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-300 admin-font-mono">置信 {formatPercent(rule.confidence, 0)}</span>
                      <span className="text-slate-500">{formatNumber(rule.supportCount)} 笔共同购买</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-admin rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-sky-100 flex items-center gap-2">
                <Network className="w-4 h-4 text-sky-400" />
                关联网络概览
              </h3>
              <div className="space-y-1.5 text-[11px]">
                <div className="text-slate-400 mb-1">高频商品节点</div>
                {productNetwork.nodes.map(n => (
                  <div key={n.id} className="flex items-center justify-between py-1 border-b border-slate-800/40 last:border-0">
                    <span className="text-slate-200 truncate pr-2">{n.name}</span>
                    <span className="text-sky-300 admin-font-mono flex-shrink-0">
                      {formatNumber(n.count)} 次
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/40 space-y-1.5 text-[11px]">
                <div className="text-slate-400 mb-1">最强关联边</div>
                {productNetwork.edges.map((e, i) => (
                  <div key={i} className="flex items-center gap-1.5 py-0.5">
                    <span className="text-sky-300 truncate max-w-[100px]">{e.from}</span>
                    <ChevronRight className="w-3 h-3 text-violet-400 flex-shrink-0" />
                    <span className="text-violet-300 truncate max-w-[100px]">{e.to}</span>
                    <span className="ml-auto text-slate-500 admin-font-mono">
                      {formatPercent(e.weight, 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-admin rounded-xl p-4 text-[11px] text-slate-400 space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-300 font-medium mb-0.5">指标说明</div>
                  <div><span className="text-sky-300">支持度</span>：该商品组合在所有订单中的出现频率</div>
                  <div><span className="text-emerald-300">置信度</span>：买了前件商品后，也买后件的概率</div>
                  <div><span className="text-violet-300">提升度</span>：相比随机购买，关联购买的倍数（&gt;1为正相关）</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
