import { useState, useRef, useCallback, useEffect } from 'react';
import AdminSidebar from '@/components/shared/AdminSidebar';
import { useAppStore } from '@/store/useAppStore';
import { formatTimeRange, getCurrentHour, isTimeInRange, beginnerPriceThreshold } from '@/utils/strategyUtils';
import { shelfInfo, products } from '@/data/products';
import { formatDateTime, formatPercent } from '@/utils/formatters';
import {
  Settings, Plus, GripVertical, Trash2, ToggleLeft, ToggleRight, Clock,
  Filter, BadgePercent, ShoppingBag, X, Check, ChevronDown, ChevronUp,
  LayoutGrid, Tag, AlertTriangle, Save, RotateCcw, ArrowUp, ArrowDown
} from 'lucide-react';
import type { Strategy, StrategyType, TimeRange, StrategyFilterMode } from '@/types';

type FormState = Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>;

const defaultForm: FormState = {
  name: '',
  type: 'discount',
  description: '',
  priority: 50,
  enabled: true,
  timeRange: { start: 0, end: 6 },
  applyToShelves: 'all',
  config: { discount: { percent: 0.9, applyTo: 'all' } }
};

const typeOptions: { value: StrategyType; label: string; icon: typeof Filter; color: string; desc: string }[] = [
  { value: 'filter', label: '商品过滤', icon: Filter, color: 'sky', desc: '按标签/价格/等级筛选可展示商品' },
  { value: 'discount', label: '价格折扣', icon: BadgePercent, color: 'emerald', desc: '指定时段自动应用折扣率' },
  { value: 'limit', label: '购买限购', icon: ShoppingBag, color: 'amber', desc: '每人每单最大购买数量限制' }
];

const filterModeOptions: { value: StrategyFilterMode; label: string; desc: string }[] = [
  { value: 'beginner_only', label: '仅入门级', desc: `价格≤¥${beginnerPriceThreshold} 或含「推荐」「入门」标签` },
  { value: 'tags', label: '标签筛选', desc: '按商品标签包含/排除规则过滤' },
  { value: 'price_range', label: '价格区间', desc: '按价格上下限范围过滤' }
];

const presetRanges: { label: string; range: TimeRange }[] = [
  { label: '凌晨 00:00-06:00', range: { start: 0, end: 6 } },
  { label: '早间 06:00-10:00', range: { start: 6, end: 10 } },
  { label: '午后 12:00-17:00', range: { start: 12, end: 17 } },
  { label: '傍晚 17:00-22:00', range: { start: 17, end: 22 } },
  { label: '深夜 23:00-08:00', range: { start: 23, end: 8 } },
  { label: '全天 00:00-24:00', range: { start: 0, end: 24 } }
];

const allTags = Array.from(new Set(products.flatMap(p => p.tags)));
const shelfEntries = Object.entries(shelfInfo);

export default function AdminStrategy() {
  const { strategies, addStrategy, updateStrategy, deleteStrategy, toggleStrategy, reorderStrategies } = useAppStore();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draggedRange, setDraggedRange] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);
  const [dragMode, setDragMode] = useState<'start' | 'end' | 'range' | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [reorderId, setReorderId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentHour = getCurrentHour();
  const activeCount = strategies.filter(s => s.enabled && isTimeInRange(s.timeRange, currentHour)).length;

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const openNew = (type?: StrategyType) => {
    const base = { ...defaultForm, type: type ?? defaultForm.type };
    if (type === 'filter') base.config = { filter: { mode: 'beginner_only' } };
    if (type === 'limit') base.config = { limit: { maxPerPerson: 3, scope: 'per_order', applyTo: 'all' } };
    setForm(base);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (s: Strategy) => {
    const cfg = JSON.parse(JSON.stringify(s.config));
    if (cfg.limit && !cfg.limit.scope) {
      cfg.limit.scope = 'per_order';
    }
    setForm({
      name: s.name,
      type: s.type,
      description: s.description,
      priority: s.priority,
      enabled: s.enabled,
      timeRange: { ...s.timeRange },
      applyToShelves: s.applyToShelves,
      config: cfg
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      showMsg('error', '请输入策略名称');
      return;
    }
    if (editingId) {
      updateStrategy(editingId, form);
      showMsg('success', '策略已更新');
    } else {
      addStrategy(form);
      showMsg('success', '策略已创建');
    }
    setShowForm(false);
    setForm(defaultForm);
    setEditingId(null);
  };

  const handleTypeChange = (type: StrategyType) => {
    const newForm = { ...form, type };
    if (type === 'filter') newForm.config = { filter: { mode: 'beginner_only' } };
    if (type === 'discount') newForm.config = { discount: { percent: 0.9, applyTo: 'all' } };
    if (type === 'limit') newForm.config = { limit: { maxPerPerson: 3, scope: 'per_order', applyTo: 'all' } };
    setForm(newForm);
  };

  const getHourFromClientX = (e: React.MouseEvent | React.TouchEvent, rect: DOMRect): number => {
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rel = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    return Math.floor(rel * 24);
  };

  const timelineRef = useRef<HTMLDivElement>(null);

  const onTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const hour = getHourFromClientX(e, rect);
    const { start, end } = form.timeRange;

    const hourWidth = rect.width / 24;
    const startX = start * hourWidth;
    const endX = (end > start ? end : end + 24) * hourWidth;
    const clickX = (hour + 0.5) * hourWidth;

    if (Math.abs(clickX - startX) < hourWidth * 0.8) {
      setDragMode('start');
    } else if (Math.abs(clickX - endX) < hourWidth * 0.8) {
      setDragMode('end');
    } else {
      setDragMode('range');
      setDragStart(hour);
    }
    setDragCurrent(hour);
    setDraggedRange(true);
    e.preventDefault();
  }, [form.timeRange]);

  const onTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedRange || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const hour = getHourFromClientX(e, rect);
    setDragCurrent(hour);

    if (dragMode === 'start') {
      setForm(f => ({ ...f, timeRange: { ...f.timeRange, start: hour } }));
    } else if (dragMode === 'end') {
      setForm(f => ({ ...f, timeRange: { ...f.timeRange, end: hour === 24 ? 0 : hour } }));
    } else if (dragMode === 'range' && dragStart !== null) {
      let start = Math.min(dragStart, hour);
      let end = Math.max(dragStart, hour) + 1;
      if (end > 24) end = 24;
      setForm(f => ({ ...f, timeRange: { start, end: end === 24 ? 0 : end } }));
    }
  }, [draggedRange, dragMode, dragStart]);

  const onTimelineMouseUp = useCallback(() => {
    setDraggedRange(false);
    setDragStart(null);
    setDragCurrent(null);
    setDragMode(null);
  }, []);

  useEffect(() => {
    const up = () => {
      if (draggedRange) onTimelineMouseUp();
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [draggedRange, onTimelineMouseUp]);

  const applyPreset = (range: TimeRange) => {
    setForm(f => ({ ...f, timeRange: range }));
    setShowPresets(false);
  };

  const toggleShelf = (shelfId: string) => {
    if (form.applyToShelves === 'all') {
      setForm(f => ({ ...f, applyToShelves: [shelfId] }));
    } else {
      const arr = form.applyToShelves;
      const has = arr.includes(shelfId);
      if (has && arr.length === 1) {
        setForm(f => ({ ...f, applyToShelves: 'all' }));
      } else {
        setForm(f => ({
          ...f,
          applyToShelves: has ? arr.filter(id => id !== shelfId) : [...arr, shelfId]
        }));
      }
    }
  };

  const movePriority = (id: string, dir: -1 | 1) => {
    const idx = strategies.findIndex(s => s.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= strategies.length) return;
    const newIds = [...strategies.map(s => s.id)];
    [newIds[idx], newIds[target]] = [newIds[target], newIds[idx]];
    reorderStrategies(newIds);
  };

  const renderTimeline = (range: TimeRange, interactive = false) => {
    const cells = [];
    const { start, end } = range;
    const isActiveNow = isTimeInRange(range, currentHour);
    const isCross = start > end;

    for (let h = 0; h < 24; h++) {
      let active = false;
      if (isCross) {
        active = h >= start || h < end;
      } else {
        active = h >= start && h < end;
      }
      const isNow = h === currentHour && interactive;
      cells.push(
        <div
          key={h}
          className={`relative group ${interactive ? 'cursor-pointer' : ''}`}
          style={{ width: `${100 / 24}%` }}
        >
          <div
            className={`h-8 m-px rounded transition-colors ${
              active
                ? isActiveNow
                  ? 'bg-gradient-to-t from-violet-500 to-fuchsia-400'
                  : 'bg-sky-500/70'
                : 'bg-slate-700/40 hover:bg-slate-700/70'
            } ${isNow ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900' : ''}`}
          />
          {interactive && h % 3 === 0 && (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">
              {String(h).padStart(2, '0')}
            </div>
          )}
          {interactive && ((h === start && dragMode !== 'end') || (h === end && dragMode !== 'start')) && (
            <div className={`absolute -top-1 ${h === start ? '-left-1' : '-right-1'} w-2.5 h-2.5 rounded-full bg-white shadow-lg border-2 border-sky-500 cursor-ew-resize z-10`} />
          )}
          {isNow && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-900 font-bold whitespace-nowrap">
              现在
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="flex">
        {cells}
      </div>
    );
  };

  const typeColor = form.type === 'discount' ? 'emerald' : form.type === 'filter' ? 'sky' : 'amber';

  const sortedStrategies = [...strategies].sort((a, b) => b.priority - a.priority);

  return (
    <div className="min-h-screen flex gradient-admin-bg">
      <AdminSidebar active="strategy" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto animate-fade-in">
          <header className="flex items-start justify-between mb-8">
            <div>
              <h1 className="admin-font-mono text-3xl font-semibold text-sky-100 mb-2">
                <Settings className="inline-block w-8 h-8 mr-3 -mt-1 text-sky-400" />
                运营策略配置
              </h1>
              <p className="text-slate-400">配置分时段运营策略，支持优先级排序，按时间范围自动生效</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-sm">
                当前 {activeCount} 条策略生效中
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> 新建策略
                </button>
                {showPresets && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl z-20 overflow-hidden animate-fade-in">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 border-b border-slate-700/50">选择类型</div>
                    {typeOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => { openNew(opt.value); setShowPresets(false); }}
                          className="w-full px-3 py-2.5 text-left hover:bg-slate-700/50 flex items-center gap-3 border-b border-slate-700/30 last:border-0"
                        >
                          <Icon className={`w-4 h-4 text-${opt.color}-400`} />
                          <div>
                            <div className="text-sm text-slate-200">{opt.label}</div>
                            <div className="text-[10px] text-slate-500">{opt.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </header>

          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                : 'bg-red-500/10 border border-red-500/30 text-red-200'
            }`}>
              {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
              <div className="glass-admin rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-auto animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-sky-100 mb-1">
                      {editingId ? '编辑策略' : '新建策略'}
                    </h2>
                    <p className="text-sm text-slate-400">配置分时段运营规则，优先级高的先匹配</p>
                  </div>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">策略名称</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="如：深夜入门级商品展示"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">优先级</label>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={form.priority}
                        onChange={e => setForm(f => ({ ...f, priority: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 text-sm focus:border-sky-500 focus:outline-none admin-font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">策略类型</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {typeOptions.map(opt => {
                        const Icon = opt.icon;
                        const active = form.type === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => handleTypeChange(opt.value)}
                            className={`p-4 rounded-xl border text-left transition-all ${
                              active
                                ? `border-${opt.color}-500 bg-${opt.color}-500/10 shadow-[0_0_0_1px_rgba(var(--${opt.color}-500),0.5)]`
                                : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${active ? `bg-${opt.color}-500/20 text-${opt.color}-300` : 'bg-slate-700/50 text-slate-400'}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className={`font-medium mb-1 ${active ? 'text-sky-100' : 'text-slate-200'}`}>{opt.label}</div>
                            <div className="text-xs text-slate-400">{opt.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        生效时间范围
                      </span>
                      <span className="text-sm font-mono text-sky-300">{formatTimeRange(form.timeRange)}</span>
                    </label>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {presetRanges.map(p => (
                        <button
                          key={p.label}
                          onClick={() => applyPreset(p.range)}
                          className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                            form.timeRange.start === p.range.start && form.timeRange.end === p.range.end
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-slate-300'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <div
                      ref={timelineRef}
                      onMouseDown={onTimelineMouseDown}
                      onMouseMove={onTimelineMouseMove}
                      onMouseUp={onTimelineMouseUp}
                      className="bg-slate-900/50 rounded-xl p-4 pb-8 border border-slate-700/50 select-none"
                      style={{ cursor: draggedRange ? 'grabbing' : 'pointer' }}
                    >
                      {renderTimeline(form.timeRange, true)}
                      <div className="mt-10 flex items-center justify-between text-[10px] text-slate-500">
                        <span>提示：拖拽两侧圆点调整起止时间，拖拽中间区域平移整个时段</span>
                        <span>24小时制 · 跨日时段自动识别</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
                      应用货架
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {shelfEntries.map(([id, label]) => {
                        const active = form.applyToShelves === 'all' || (Array.isArray(form.applyToShelves) && form.applyToShelves.includes(id));
                        return (
                          <button
                            key={id}
                            onClick={() => toggleShelf(id)}
                            className={`px-3 py-2.5 rounded-lg border text-left transition-all ${
                              active
                                ? 'border-sky-500/50 bg-sky-500/10 text-sky-200'
                                : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            <div className="text-xs font-medium">{label}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 uppercase">{id}</div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2">选中=应用，点击取消选中；全部取消则恢复为「全部货架」</div>
                  </div>

                  {form.type === 'filter' && form.config.filter && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">过滤模式</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {filterModeOptions.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setForm(f => ({ ...f, config: { filter: { ...f.config.filter, mode: opt.value } } }))}
                              className={`p-3 rounded-lg border text-left text-sm ${
                                form.config.filter?.mode === opt.value
                                  ? 'border-sky-500/50 bg-sky-500/10 text-sky-200'
                                  : 'border-slate-700/50 bg-slate-800/30 text-slate-300 hover:border-slate-600'
                              }`}
                            >
                              <div className="font-medium mb-0.5">{opt.label}</div>
                              <div className="text-[10px] text-slate-500">{opt.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {form.config.filter.mode === 'tags' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-sky-400" /> 包含标签（任一匹配即展示）
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {allTags.map(tag => {
                              const included = form.config.filter?.includeTags?.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  onClick={() => {
                                    const cur = form.config.filter?.includeTags ?? [];
                                    const next = included ? cur.filter(t => t !== tag) : [...cur, tag];
                                    setForm(f => ({ ...f, config: { filter: { ...f.config.filter, includeTags: next } } }));
                                  }}
                                  className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                                    included
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-slate-300'
                                  }`}
                                >
                                  {included && <Check className="w-3 h-3 inline mr-1" />}
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {form.config.filter.mode === 'price_range' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">最低价格 (¥)</label>
                            <input
                              type="number"
                              value={form.config.filter.priceMin ?? ''}
                              onChange={e => setForm(f => ({ ...f, config: { filter: { ...f.config.filter, priceMin: parseFloat(e.target.value) || 0 } } }))}
                              placeholder="0"
                              className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 text-sm focus:border-sky-500 focus:outline-none admin-font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">最高价格 (¥)</label>
                            <input
                              type="number"
                              value={form.config.filter.priceMax ?? ''}
                              onChange={e => setForm(f => ({ ...f, config: { filter: { ...f.config.filter, priceMax: parseFloat(e.target.value) || undefined } } }))}
                              placeholder="不限"
                              className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 text-sm focus:border-sky-500 focus:outline-none admin-font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {form.type === 'discount' && form.config.discount && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">折扣率</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="50"
                            max="99"
                            value={Math.round(form.config.discount.percent * 100)}
                            onChange={e => setForm(f => ({ ...f, config: { discount: { ...f.config.discount, percent: parseInt(e.target.value) / 100 } } }))}
                            className="flex-1 accent-emerald-500"
                          />
                          <div className="admin-font-mono text-2xl font-bold text-emerald-400 w-20 text-right">
                            {formatPercent(form.config.discount.percent)}
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">滑动调整，范围 50% - 99%</div>
                      </div>
                    </div>
                  )}

                  {form.type === 'limit' && form.config.limit && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">限购范围</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setForm(f => ({ ...f, config: { limit: { ...f.config.limit, scope: 'per_order' } } }))}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                              form.config.limit.scope === 'per_order'
                                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                                : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            整单限购（每单最多N件）
                          </button>
                          <button
                            onClick={() => setForm(f => ({ ...f, config: { limit: { ...f.config.limit, scope: 'per_product' } } }))}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                              form.config.limit.scope === 'per_product'
                                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                                : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            单商品限购（每件商品最多N件）
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">最大购买数量</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={form.config.limit.maxPerPerson}
                            onChange={e => setForm(f => ({ ...f, config: { limit: { ...f.config.limit, maxPerPerson: parseInt(e.target.value) } } }))}
                            className="flex-1 accent-amber-500"
                          />
                          <div className="admin-font-mono text-2xl font-bold text-amber-400 w-16 text-right">
                            {form.config.limit.maxPerPerson} 件
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">策略描述</label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="说明此策略的应用场景和用途，方便团队理解"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none transition-colors text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-700/50">
                  <button
                    onClick={() => setForm({ ...form, enabled: !form.enabled })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      form.enabled ? 'text-emerald-300' : 'text-slate-400'
                    }`}
                  >
                    {form.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                    <span className="text-sm">{form.enabled ? '已启用' : '已停用'}</span>
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowForm(false); setForm(defaultForm); setEditingId(null); }}
                      className="px-5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 text-sm flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" /> 取消
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="btn-admin px-6 py-2.5 text-sm flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {editingId ? '保存修改' : '创建策略'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-300">策略列表（按优先级从高到低）</h3>
              <span className="text-xs text-slate-500">优先级高的先匹配生效 · 拖拽箭头调整顺序</span>
            </div>

            {sortedStrategies.length === 0 ? (
              <div className="glass-admin rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/60 flex items-center justify-center">
                  <Settings className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 mb-1">暂无运营策略</p>
                <p className="text-xs text-slate-600">点击右上角「新建策略」开始配置</p>
              </div>
            ) : (
              sortedStrategies.map((strategy, idx) => {
                const active = isTimeInRange(strategy.timeRange, currentHour) && strategy.enabled;
                const typeOpt = typeOptions.find(o => o.value === strategy.type)!;
                const Icon = typeOpt.icon;
                return (
                  <div
                    key={strategy.id}
                    className={`glass-admin rounded-2xl p-5 transition-all ${
                      reorderId === strategy.id ? 'ring-2 ring-sky-500 scale-[1.01]' : ''
                    } ${!strategy.enabled ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <button
                          onClick={() => movePriority(strategy.id, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-slate-700/40 text-slate-400 hover:text-sky-300 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <div className="w-7 h-7 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-center admin-font-mono text-xs text-sky-300 font-bold">
                          #{strategy.priority}
                        </div>
                        <button
                          onClick={() => movePriority(strategy.id, 1)}
                          disabled={idx === sortedStrategies.length - 1}
                          className="p-1 rounded hover:bg-slate-700/40 text-slate-400 hover:text-sky-300 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="w-px h-16 bg-slate-700/50" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              strategy.type === 'discount' ? 'bg-emerald-500/15 text-emerald-300'
                                : strategy.type === 'filter' ? 'bg-sky-500/15 text-sky-300'
                                  : 'bg-amber-500/15 text-amber-300'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-100">{strategy.name}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  active
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-slate-700/50 text-slate-500'
                                }`}>
                                  {active ? '生效中' : strategy.enabled ? '未到时间' : '已停用'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">{strategy.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => toggleStrategy(strategy.id)}
                              className="text-slate-400 hover:text-white transition-colors"
                              title={strategy.enabled ? '停用' : '启用'}
                            >
                              {strategy.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={() => openEdit(strategy)}
                              className="text-slate-400 hover:text-sky-300 p-1 transition-colors"
                              title="编辑"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('确定删除此策略？')) {
                                  deleteStrategy(strategy.id);
                                  showMsg('success', '策略已删除');
                                }
                              }}
                              className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-900/40 rounded-xl p-3 mb-3">
                          {renderTimeline(strategy.timeRange)}
                          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                            <span className="font-mono">{formatTimeRange(strategy.timeRange)}</span>
                            <span>
                              适用货架: {strategy.applyToShelves === 'all' ? '全部' : strategy.applyToShelves.map(id => shelfInfo[id] || id).join(', ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          {strategy.type === 'filter' && strategy.config.filter && (
                            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/30">
                              {filterModeOptions.find(m => m.value === strategy.config.filter?.mode)?.label || '商品过滤'}
                            </span>
                          )}
                          {strategy.type === 'discount' && strategy.config.discount && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 admin-font-mono">
                              {formatPercent(strategy.config.discount.percent)} OFF
                            </span>
                          )}
                          {strategy.type === 'limit' && strategy.config.limit && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              限购 {strategy.config.limit.maxPerPerson} 件
                            </span>
                          )}
                          <span className="text-slate-500 ml-auto">
                            更新于 {formatDateTime(strategy.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
