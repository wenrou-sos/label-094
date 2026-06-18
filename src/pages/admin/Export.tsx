import { useState } from 'react';
import AdminSidebar from '@/components/shared/AdminSidebar';
import { useAppStore } from '@/store/useAppStore';
import { FileSpreadsheet, FileText, Download, Clock, CheckCircle2, AlertCircle, BarChart3, ShoppingCart, TrendingUp, Activity } from 'lucide-react';
import { formatDateTime, formatFileSize } from '@/utils/formatters';
import type { ExportType, ExportFormat } from '@/types';

export default function Export() {
  const { realtimeMetrics, productBehaviors, heatmapData, exportData, exportRecords, orders } = useAppStore();
  const [selectedType, setSelectedType] = useState<ExportType>('metrics');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const typeOptions: { value: ExportType; label: string; desc: string; icon: typeof Activity }[] = [
    { value: 'metrics', label: '综合运营指标', desc: '实时客流、销售、转化率等核心指标汇总', icon: BarChart3 },
    { value: 'behavior', label: '商品行为分析', desc: '各商品拿取次数、购买次数、转化率明细', icon: Activity },
    { value: 'heatmap', label: '24小时热力图数据', desc: '分时段客流量与销售额的时粒度数据', icon: TrendingUp },
    { value: 'orders', label: '订单记录明细', desc: '实际成交订单完整记录，含商品金额与支付方式', icon: ShoppingCart }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);
    try {
      const record = await exportData({ type: selectedType, format: selectedFormat });
      setExportStatus({ type: 'success', msg: `导出成功：${record.fileName}（${formatFileSize(record.size)}）` });
      setTimeout(() => setExportStatus(null), 4000);
    } catch (e) {
      setExportStatus({ type: 'error', msg: '导出失败，请稍后重试' });
    } finally {
      setIsExporting(false);
    }
  };

  const previewStats = {
    behavior: productBehaviors.length,
    heatmap: `${heatmapData.length}天 × 24时 = ${heatmapData.length * 24}条`,
    orders: `${orders.length}单 / ${orders.reduce((s, o) => s + o.items.length, 0)}条明细`
  };

  return (
    <div className="min-h-screen flex gradient-admin-bg">
      <AdminSidebar active="export" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto animate-fade-in">
          <header className="mb-8">
            <h1 className="admin-font-mono text-3xl font-semibold text-sky-100 mb-2">
              <Download className="inline-block w-8 h-8 mr-3 -mt-1 text-sky-400" />
              数据导出中心
            </h1>
            <p className="text-slate-400">将运营数据导出为 Excel 或 CSV 格式，用于离线分析与存档</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="glass-admin rounded-2xl p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-sky-100 mb-6 flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2 text-sky-400" />
                选择导出类型
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {typeOptions.map(opt => {
                  const Icon = opt.icon;
                  const active = selectedType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedType(opt.value)}
                      className={`text-left p-5 rounded-xl border transition-all ${
                        active
                          ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_0_1px_rgba(14,165,233,0.5),0_8px_32px_rgba(14,165,233,0.15)]'
                          : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg ${active ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-700/50 text-slate-400'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium mb-1 ${active ? 'text-sky-100' : 'text-slate-200'}`}>{opt.label}</div>
                          <div className="text-xs text-slate-400 leading-relaxed">{opt.desc}</div>
                          <div className="mt-2 admin-font-mono text-[11px] text-slate-500">
                            预计记录数：{opt.value === 'metrics' ? '1条汇总' : previewStats[opt.value as keyof typeof previewStats] + '条'}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <h3 className="text-sm font-medium text-slate-300 mb-3">选择文件格式</h3>
              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => setSelectedFormat('xlsx')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border transition-all ${
                    selectedFormat === 'xlsx'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                      : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="font-medium">Excel (.xlsx)</span>
                  <span className="text-xs opacity-60 ml-1">· 多Sheet · 推荐</span>
                </button>
                <button
                  onClick={() => setSelectedFormat('csv')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border transition-all ${
                    selectedFormat === 'csv'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                      : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">CSV (.csv)</span>
                  <span className="text-xs opacity-60 ml-1">· 通用 · UTF-8 BOM</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-300">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">
                      将导出：<span className="text-sky-300">{typeOptions.find(o => o.value === selectedType)?.label}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      数据截至 {formatDateTime(realtimeMetrics.lastUpdated)}，共 {productBehaviors.length} 款商品参与统计
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="btn-admin px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>导出中...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>立即导出</span>
                    </>
                  )}
                </button>
              </div>

              {exportStatus && (
                <div className={`mt-4 p-3.5 rounded-xl flex items-center gap-3 animate-fade-in ${
                  exportStatus.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                    : 'bg-red-500/10 border border-red-500/30 text-red-200'
                }`}>
                  {exportStatus.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="text-sm">{exportStatus.msg}</span>
                </div>
              )}
            </div>

            <div className="glass-admin rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-sky-100 mb-5 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-sky-400" />
                最近导出记录
              </h2>

              {exportRecords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/60 flex items-center justify-center">
                    <FileSpreadsheet className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500">暂无导出记录</p>
                  <p className="text-xs text-slate-600 mt-1">完成首次导出后会在此显示</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-auto scrollbar-thin pr-1">
                  {exportRecords.map((rec, idx) => {
                    const typeLabel: Record<ExportType, string> = {
                      metrics: '综合指标',
                      behavior: '商品行为',
                      heatmap: '热力图',
                      orders: '订单记录'
                    };
                    const formatColor = rec.format === 'xlsx' ? 'text-emerald-400' : 'text-amber-400';
                    return (
                      <div
                        key={rec.id}
                        className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 animate-slide-up"
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="text-xs font-medium text-slate-200 truncate">{typeLabel[rec.type]}</div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 ${formatColor} uppercase`}>
                            .{rec.format}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mb-1.5 truncate admin-font-mono">{rec.fileName}</div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 admin-font-mono">
                          <span>{formatDateTime(rec.createdAt)}</span>
                          <span>{formatFileSize(rec.size)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="glass-admin rounded-2xl p-6">
            <h3 className="text-base font-semibold text-sky-100 mb-4">当前数据集摘要</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="text-xs text-slate-400 mb-1">统计商品数</div>
                <div className="text-2xl font-semibold admin-font-mono text-sky-300">{productBehaviors.length}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="text-xs text-slate-400 mb-1">累计拿取次数</div>
                <div className="text-2xl font-semibold admin-font-mono text-fuchsia-300">
                  {productBehaviors.reduce((s, b) => s + b.pickupCount, 0)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="text-xs text-slate-400 mb-1">累计成交订单</div>
                <div className="text-2xl font-semibold admin-font-mono text-emerald-300">{orders.length}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="text-xs text-slate-400 mb-1">订单总销售额</div>
                <div className="text-2xl font-semibold admin-font-mono text-indigo-300">
                  ¥{orders.reduce((s, o) => s + o.finalAmount, 0).toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="text-xs text-slate-400 mb-1">今日销售额</div>
                <div className="text-2xl font-semibold admin-font-mono text-amber-300">
                  ¥{realtimeMetrics.todayRevenue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
