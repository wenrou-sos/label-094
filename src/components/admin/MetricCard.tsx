import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatNumber, formatPercent, formatCurrency } from '@/utils/formatters';

interface Props {
  title: string;
  value: number;
  format?: 'number' | 'percent' | 'currency';
  icon: LucideIcon;
  trend?: number;
  accent: string;
  subtitle?: string;
}

export default function MetricCard({ title, value, format = 'number', icon: Icon, trend, accent, subtitle }: Props) {
  const displayVal = format === 'percent'
    ? formatPercent(value)
    : format === 'currency'
    ? formatCurrency(value)
    : formatNumber(value);

  const trendUp = (trend ?? 0) >= 0;

  return (
    <div className="glass-admin rounded-xl p-5 space-y-3 group hover:border-sky-500/30 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-400 font-medium tracking-wide uppercase">{title}</div>
          {subtitle && <div className="text-[11px] text-slate-500 mt-1">{subtitle}</div>}
        </div>
        <div className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          `bg-${accent}/10`,
          `text-${accent}`
        )} style={{
          background: accent.includes('from-') ? undefined : `hsl(var(--${accent}-hsl) / 0.12)`,
          color: 'var(--color)'
        }}>
          <Icon className="w-5 h-5" style={{ color: `hsl(var(--c-${accent}))` }} />
        </div>
      </div>

      <div>
        <div className={clsx(
          'text-2xl font-bold tracking-tight admin-font-mono',
          accent === 'emerald' ? 'text-emerald-300' :
          accent === 'amber' ? 'text-amber-300' :
          accent === 'sky' ? 'text-sky-300' :
          accent === 'violet' ? 'text-violet-300' :
          accent === 'rose' ? 'text-rose-300' :
          'text-white'
        )}>
          {displayVal}
        </div>
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className={clsx(
            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded',
            trendUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
          )}>
            {trendUp
              ? <ArrowUpRight className="w-3 h-3" />
              : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-slate-500">较昨日</span>
        </div>
      )}
    </div>
  );
}
