import { useState } from 'react';
import type { HeatmapData, HeatmapType } from '@/types';
import { formatHour, formatCurrency } from '@/utils/formatters';
import clsx from 'clsx';

interface Props {
  data: HeatmapData[];
  type: HeatmapType;
}

export default function HeatmapGrid({ data, type }: Props) {
  const [hover, setHover] = useState<{ day: number; hour: number; x: number; y: number; v: number } | null>(null);

  if (!data.length) return null;

  const flat = data.flatMap(d => d.hourlyData.map(h => h[type]));
  const max = Math.max(...flat, 1);

  const intensity = (v: number) => {
    const ratio = Math.min(v / max, 1);
    return Math.max(0.08, ratio);
  };

  const cellColor = (v: number) => {
    const alpha = intensity(v);
    if (type === 'customers') {
      const r = Math.round(56 + (14 - 56) * alpha);
      const g = Math.round(189 + (165 - 189) * alpha);
      const b = Math.round(248 + (233 - 248) * alpha);
      return `rgba(${r}, ${g}, ${b}, ${0.18 + alpha * 0.82})`;
    } else {
      const r = Math.round(16 + (124 - 16) * alpha);
      const g = Math.round(185 + (58 - 185) * alpha);
      const b = Math.round(129 + (237 - 129) * alpha);
      return `rgba(${r}, ${g}, ${b}, ${0.18 + alpha * 0.82})`;
    }
  };

  return (
    <div className="glass-admin rounded-xl p-5 overflow-x-auto scrollbar-thin">
      <div className="min-w-[720px] relative">
        <div className="flex mb-2 pl-16 sticky left-0">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 text-center text-[10px] text-slate-500 font-mono">
              {h % 2 === 0 ? formatHour(h) : ''}
            </div>
          ))}
        </div>

        {data.map((day, di) => (
          <div key={di} className="flex items-center mb-1 group">
            <div className="w-16 shrink-0 pr-3 text-right">
              <div className="text-[11px] text-slate-300 font-medium">{day.weekday || ''}</div>
              <div className="text-[10px] text-slate-500 font-mono">{day.date.slice(5)}</div>
            </div>
            <div className="flex-1 grid grid-cols-24 gap-[3px]">
              {day.hourlyData.map((h, hi) => {
                const val = h[type];
                return (
                  <div
                    key={hi}
                    className="aspect-square rounded-[3px] cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-white/30 z-10 relative"
                    style={{ background: cellColor(val) }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      const parent = (e.currentTarget as HTMLElement).closest('.min-w-\\[720px\\]') as HTMLElement;
                      const prect = parent.getBoundingClientRect();
                      setHover({
                        day: di,
                        hour: hi,
                        x: rect.left - prect.left + rect.width / 2,
                        y: rect.top - prect.top - 8,
                        v: val
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                  >
                    <div className="w-full h-full" />
                  </div>
                );
              })}
            </div>
            <div className="w-10 shrink-0 pl-2 text-right">
              <div className="text-[10px] text-slate-400 font-mono">
                {type === 'customers'
                  ? day.hourlyData.reduce((s, h) => s + h.customers, 0)
                  : formatCurrency(day.hourlyData.reduce((s, h) => s + h.revenue, 0)).replace('¥', '¥')}
              </div>
            </div>
          </div>
        ))}

        {hover && (
          <div
            className="absolute pointer-events-none z-50 -translate-x-1/2 -translate-y-full"
            style={{ left: hover.x + 64, top: hover.y }}
          >
            <div className="bg-slate-900/95 backdrop-blur-md border border-sky-500/30 rounded-lg px-3 py-2 text-xs shadow-xl whitespace-nowrap">
              <div className="text-slate-400 mb-0.5">
                {data[hover.day].weekday} {data[hover.day].date.slice(5)} · {formatHour(hover.hour)}
              </div>
              <div className="font-semibold text-white admin-font-mono">
                {type === 'customers'
                  ? `👥 ${hover.v} 人`
                  : `💰 ${formatCurrency(hover.v)}`}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pl-16">
          <div className="text-[10px] text-slate-500">低 → 高</div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="w-8 h-2.5 rounded-sm"
                style={{ background: cellColor((i + 1) * (max / 6)) }}
              />
            ))}
          </div>
          <div className="w-10" />
        </div>
      </div>
    </div>
  );
}
