import * as XLSX from 'xlsx';
import type { RealtimeMetrics, ProductBehavior, HeatmapData, ExportConfig, Order } from '@/types';
import { formatDateTime, formatPercent, formatCurrency } from './formatters';

interface WorkSheetConfig {
  data: any[];
  sheetName: string;
}

function toCSV(data: any[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const escape = (v: any) => {
    const str = String(v ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const rows = [
    headers.join(','),
    ...data.map(row => headers.map(h => escape(row[h])).join(','))
  ];
  return rows.join('\n');
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function prepareMetricsSheet(metrics: RealtimeMetrics): any[] {
  return [{
    '统计时间': formatDateTime(metrics.lastUpdated),
    '今日客流量': metrics.todayCustomers,
    '今日销售额(元)': metrics.todayRevenue,
    '平均客单价(元)': metrics.avgOrderValue,
    '商品拿取率': formatPercent(metrics.overallPickupRate),
    '成交转化率': formatPercent(metrics.overallConversionRate)
  }];
}

export function prepareBehaviorSheet(behaviors: ProductBehavior[]): any[] {
  return behaviors.map((b, idx) => ({
    '排名': idx + 1,
    '商品名称': b.product.name,
    'SKU编码': b.product.sku,
    '分类': b.product.category,
    '单价(元)': b.product.price,
    '拿起次数': b.pickupCount,
    '购买次数': b.purchaseCount,
    '转化率': formatPercent(b.conversionRate),
    '平均查看时长(秒)': b.avgViewDuration,
    '所在货架': b.product.shelfId
  }));
}

export function prepareHeatmapSheet(data: HeatmapData[]): any[] {
  const rows: any[] = [];
  for (const day of data) {
    for (const h of day.hourlyData) {
      rows.push({
        '日期': day.date,
        '星期': day.weekday || '',
        '时段': `${String(h.hour).padStart(2, '0')}:00-${String(h.hour + 1).padStart(2, '0')}:00`,
        '客流量': h.customers,
        '销售额(元)': h.revenue
      });
    }
  }
  return rows;
}

export function prepareOrdersSheet(orders: Order[]): any[] {
  if (orders.length === 0) {
    return [{
      '订单编号': '暂无数据',
      '下单时间': '请先完成支付交易',
      '商品名称': '-',
      '数量': '-',
      '单价(元)': '-',
      '订单金额(元)': '-',
      '支付方式': '-',
      '订单状态': '-'
    }];
  }

  const rows: any[] = [];
  let totalAmount = 0;
  let totalQty = 0;

  for (const order of orders) {
    for (const item of order.items) {
      totalQty += item.quantity;
      const amt = item.product.price * item.quantity;
      totalAmount += amt;
      rows.push({
        '订单编号': order.id,
        '下单时间': formatDateTime(order.createdAt),
        '商品名称': item.product.name,
        '数量': item.quantity,
        '单价(元)': item.product.price,
        '订单金额(元)': amt,
        '支付方式': order.paymentMethod === 'wechat' ? '微信支付' : order.paymentMethod === 'alipay' ? '支付宝' : '-',
        '订单状态': order.status === 'paid' ? '已完成' : order.status === 'failed' ? '支付失败' : order.status === 'cancelled' ? '已取消' : '待支付',
        '支付时间': order.paidAt ? formatDateTime(order.paidAt) : '-',
        '优惠金额(元)': order.discountAmount,
        '实付金额(元)': order.finalAmount
      });
    }
  }

  rows.unshift({
    '订单编号': '【汇总】',
    '下单时间': `共${orders.length}单 / ${rows.length}条商品明细`,
    '商品名称': '-',
    '数量': totalQty,
    '单价(元)': '-',
    '订单金额(元)': totalAmount,
    '支付方式': '-',
    '订单状态': '-',
    '支付时间': '-',
    '优惠金额(元)': orders.reduce((s, o) => s + o.discountAmount, 0),
    '实付金额(元)': orders.reduce((s, o) => s + o.finalAmount, 0)
  });

  return rows;
}

export async function exportToXLSX(config: ExportConfig, data: {
  metrics: RealtimeMetrics;
  behaviors: ProductBehavior[];
  heatmap: HeatmapData[];
  orders: Order[];
}): Promise<Blob> {
  const sheets: WorkSheetConfig[] = [];
  const wb = XLSX.utils.book_new();

  sheets.push({
    data: prepareMetricsSheet(data.metrics),
    sheetName: '实时指标'
  });

  switch (config.type) {
    case 'behavior':
      sheets.push({
        data: prepareBehaviorSheet(data.behaviors),
        sheetName: '商品行为分析'
      });
      break;
    case 'heatmap':
      sheets.push({
        data: prepareHeatmapSheet(data.heatmap),
        sheetName: '热力图数据'
      });
      break;
    case 'orders':
      sheets.push({
        data: prepareOrdersSheet(data.orders),
        sheetName: '订单记录'
      });
      break;
    case 'metrics':
    default:
      sheets.push({
        data: prepareBehaviorSheet(data.behaviors),
        sheetName: '商品行为分析'
      });
      sheets.push({
        data: prepareHeatmapSheet(data.heatmap),
        sheetName: '热力图数据'
      });
  }

  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.data);
    ws['!cols'] = s.data[0] ? Object.keys(s.data[0]).map(() => ({ wch: 16 })) : [];
    XLSX.utils.book_append_sheet(wb, ws, s.sheetName);
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function exportToCSV(config: ExportConfig, data: {
  metrics: RealtimeMetrics;
  behaviors: ProductBehavior[];
  heatmap: HeatmapData[];
  orders: Order[];
}): Promise<Blob> {
  let content = '';

  content += '=== 实时指标 ===\n';
  content += toCSV(prepareMetricsSheet(data.metrics)) + '\n\n';

  switch (config.type) {
    case 'behavior':
      content += '=== 商品行为分析 ===\n';
      content += toCSV(prepareBehaviorSheet(data.behaviors)) + '\n';
      break;
    case 'heatmap':
      content += '=== 热力图数据 ===\n';
      content += toCSV(prepareHeatmapSheet(data.heatmap)) + '\n';
      break;
    case 'orders':
      content += '=== 订单记录 ===\n';
      content += toCSV(prepareOrdersSheet(data.orders)) + '\n';
      break;
    case 'metrics':
    default:
      content += '=== 商品行为分析 ===\n';
      content += toCSV(prepareBehaviorSheet(data.behaviors)) + '\n\n';
      content += '=== 热力图数据 ===\n';
      content += toCSV(prepareHeatmapSheet(data.heatmap)) + '\n';
  }

  return new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
}

export async function executeExport(
  config: ExportConfig,
  dataContext: { metrics: RealtimeMetrics; behaviors: ProductBehavior[]; heatmap: HeatmapData[]; orders: Order[] }
): Promise<{ fileName: string; size: number; blob: Blob }> {
  const timeStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const ext = config.format === 'xlsx' ? 'xlsx' : 'csv';
  const typeMap: Record<string, string> = {
    metrics: '综合指标',
    behavior: '商品行为',
    heatmap: '热力图数据',
    orders: '订单记录'
  };
  const fileName = `${typeMap[config.type]}_${timeStr}.${ext}`;

  const blob = config.format === 'xlsx'
    ? await exportToXLSX(config, dataContext)
    : await exportToCSV(config, dataContext);

  triggerDownload(blob, fileName);

  return {
    fileName,
    size: blob.size,
    blob
  };
}
