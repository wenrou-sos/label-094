import type { ProductBehavior, ShelfMonitor, RealtimeMetrics, HeatmapData, HourlyData, Product, Order, CartItem, ComparisonData } from '@/types';
import { products, shelfInfo } from './products';
import { randomInt, randomFloat, clamp, normalRandom, randomPick, generateOrderId, generateSessionId } from '@/utils/randomUtils';
import { formatDate, getWeekday } from '@/utils/formatters';

export function generateProductBehaviors(): ProductBehavior[] {
  return products.map(product => {
    const basePopularity = randomInt(50, 500);
    const purchaseBase = randomInt(20, 300);
    const pickupCount = basePopularity + randomInt(0, 200);
    const conversionFactor = clamp(normalRandom(0.45, 0.2), 0.08, 0.92);
    const purchaseCount = Math.floor(pickupCount * conversionFactor);
    const actualPurchase = Math.min(purchaseCount, purchaseBase);
    const conversionRate = pickupCount > 0
      ? parseFloat((actualPurchase / pickupCount).toFixed(3))
      : 0;

    return {
      productId: product.id,
      product,
      pickupCount,
      purchaseCount: actualPurchase,
      conversionRate,
      avgViewDuration: parseFloat(clamp(normalRandom(45, 20), 8, 180).toFixed(1))
    };
  });
}

export function generateShelfMonitors(): ShelfMonitor[] {
  const shelfIds = Object.keys(shelfInfo);
  return shelfIds.map(shelfId => {
    const shelfProducts = products.filter(p => p.shelfId === shelfId);
    const totalPickups = shelfProducts.reduce((sum) => sum + randomInt(80, 450), 0);
    const conversionRate = clamp(normalRandom(0.42, 0.15), 0.15, 0.78);
    const totalPurchases = Math.floor(totalPickups * conversionRate);

    return {
      shelfId,
      shelfName: shelfInfo[shelfId],
      totalPickups,
      totalPurchases,
      conversionRate: parseFloat(conversionRate.toFixed(3))
    };
  });
}

export function generateRealtimeMetrics(): RealtimeMetrics {
  const todayCustomers = Math.floor(clamp(normalRandom(180, 80), 30, 500));
  const avgOrderValue = parseFloat(clamp(normalRandom(420, 120), 100, 980).toFixed(2));
  const conversionRate = clamp(normalRandom(0.48, 0.12), 0.18, 0.72);
  const orders = Math.floor(todayCustomers * conversionRate);

  return {
    todayCustomers,
    todayRevenue: Math.floor(orders * avgOrderValue),
    overallPickupRate: parseFloat(clamp(normalRandom(0.72, 0.1), 0.4, 0.95).toFixed(3)),
    overallConversionRate: parseFloat(conversionRate.toFixed(3)),
    avgOrderValue,
    lastUpdated: Date.now()
  };
}

function generateHourlyData(hour: number): HourlyData {
  let baseCustomers = 0;
  const hourWeight = (h: number) => {
    if (h >= 0 && h < 6) return 0.05;
    if (h >= 6 && h < 10) return 0.15;
    if (h >= 10 && h < 14) return 0.55;
    if (h >= 14 && h < 18) return 0.45;
    if (h >= 18 && h < 22) return 1.0;
    return 0.75;
  };
  const w = hourWeight(hour);
  baseCustomers = Math.abs(normalRandom(8 * w, 4 * w));

  const avgSpend = clamp(normalRandom(350, 80), 80, 800);
  const conversionFactor = clamp(normalRandom(0.5, 0.15), 0.2, 0.75);

  return {
    hour,
    customers: Math.floor(baseCustomers),
    revenue: Math.floor(baseCustomers * conversionFactor * avgSpend)
  };
}

export function generateSingleDayHeatmap(dateStr?: string): HeatmapData {
  const date = dateStr ? new Date(dateStr) : new Date();
  const hourlyData: HourlyData[] = [];
  for (let h = 0; h < 24; h++) {
    hourlyData.push(generateHourlyData(h));
  }
  return {
    date: formatDate(date),
    weekday: getWeekday(date),
    hourlyData
  };
}

export function generateHeatmapData(dimension: 'day' | 'week' | 'month'): HeatmapData[] {
  const results: HeatmapData[] = [];
  const today = new Date();

  if (dimension === 'day') {
    results.push(generateSingleDayHeatmap());
  } else if (dimension === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      results.push(generateSingleDayHeatmap(formatDate(d)));
    }
  } else {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      results.push(generateSingleDayHeatmap(formatDate(d)));
    }
  }

  return results;
}

export function pickRandomProduct(): Product {
  const idx = randomInt(0, products.length - 1);
  return products[idx];
}

export function addDeltaToMetrics(prev: RealtimeMetrics): RealtimeMetrics {
  const deltaCustomers = randomInt(0, 6);
  const deltaRevenue = randomInt(0, 3000);
  const fluctuation = () => randomFloat(-0.01, 0.01);

  return {
    todayCustomers: prev.todayCustomers + deltaCustomers,
    todayRevenue: prev.todayRevenue + deltaRevenue,
    overallPickupRate: parseFloat(clamp(prev.overallPickupRate + fluctuation(), 0.3, 0.95).toFixed(3)),
    overallConversionRate: parseFloat(clamp(prev.overallConversionRate + fluctuation(), 0.15, 0.75).toFixed(3)),
    avgOrderValue: parseFloat(clamp(prev.avgOrderValue + randomFloat(-15, 15), 100, 900).toFixed(2)),
    lastUpdated: Date.now()
  };
}

export function addDeltaToBehaviors(prev: ProductBehavior[]): ProductBehavior[] {
  return prev.map(b => {
    if (Math.random() > 0.6) {
      const newPickup = b.pickupCount + randomInt(0, 3);
      const purchased = Math.random() < b.conversionRate ? randomInt(0, 2) : 0;
      const newPurchase = b.purchaseCount + purchased;
      return {
        ...b,
        pickupCount: newPickup,
        purchaseCount: newPurchase,
        conversionRate: parseFloat((newPurchase / Math.max(newPickup, 1)).toFixed(3))
      };
    }
    return b;
  });
}

export function generateComparisonData(): ComparisonData {
  const todayMetrics = generateRealtimeMetrics();

  const yesterdayFactor = clamp(normalRandom(0.92, 0.12), 0.6, 1.25);
  const lastWeekFactor = clamp(normalRandom(0.97, 0.08), 0.7, 1.3);

  const yesterdayCustomers = Math.floor(todayMetrics.todayCustomers * yesterdayFactor);
  const yesterdayAvgOrder = parseFloat(clamp(todayMetrics.avgOrderValue * clamp(normalRandom(1, 0.05), 0.9, 1.1), 100, 900).toFixed(2));
  const yesterdayConversion = clamp(todayMetrics.overallConversionRate * clamp(normalRandom(1, 0.08), 0.85, 1.15), 0.18, 0.72);
  const yesterdayOrders = Math.floor(yesterdayCustomers * yesterdayConversion);

  const lastWeekCustomers = Math.floor(todayMetrics.todayCustomers * lastWeekFactor);
  const lastWeekAvgOrder = parseFloat(clamp(todayMetrics.avgOrderValue * clamp(normalRandom(1, 0.06), 0.88, 1.12), 100, 900).toFixed(2));
  const lastWeekConversion = clamp(todayMetrics.overallConversionRate * clamp(normalRandom(1, 0.1), 0.82, 1.18), 0.18, 0.72);
  const lastWeekOrders = Math.floor(lastWeekCustomers * lastWeekConversion);

  const todayHourly: HourlyData[] = [];
  const yesterdayHourly: HourlyData[] = [];
  for (let h = 0; h < 24; h++) {
    const th = generateHourlyData(h);
    todayHourly.push(th);
    const yFactor = clamp(normalRandom(0.95, 0.2), 0.5, 1.4);
    yesterdayHourly.push({
      hour: h,
      customers: Math.floor(th.customers * yFactor),
      revenue: Math.floor(th.revenue * yFactor)
    });
  }

  const yesterdayShelves = generateShelfMonitors().map(s => {
    const f = clamp(normalRandom(0.9, 0.15), 0.6, 1.2);
    return {
      ...s,
      totalPickups: Math.floor(s.totalPickups * f),
      totalPurchases: Math.floor(s.totalPurchases * f),
      conversionRate: parseFloat(clamp(s.conversionRate * clamp(normalRandom(1, 0.1), 0.8, 1.2), 0.15, 0.78).toFixed(3))
    };
  });
  const lastWeekShelves = generateShelfMonitors().map(s => {
    const f = clamp(normalRandom(0.95, 0.12), 0.65, 1.25);
    return {
      ...s,
      totalPickups: Math.floor(s.totalPickups * f),
      totalPurchases: Math.floor(s.totalPurchases * f),
      conversionRate: parseFloat(clamp(s.conversionRate * clamp(normalRandom(1, 0.1), 0.8, 1.2), 0.15, 0.78).toFixed(3))
    };
  });

  return {
    yesterdayCustomers,
    yesterdayRevenue: Math.floor(yesterdayOrders * yesterdayAvgOrder),
    yesterdayPickupRate: parseFloat(clamp(todayMetrics.overallPickupRate * clamp(normalRandom(1, 0.06), 0.85, 1.15), 0.4, 0.95).toFixed(3)),
    yesterdayConversionRate: parseFloat(yesterdayConversion.toFixed(3)),
    yesterdayAvgOrderValue: yesterdayAvgOrder,

    lastWeekCustomers: lastWeekCustomers * 7,
    lastWeekRevenue: Math.floor(lastWeekOrders * lastWeekAvgOrder * 7),
    lastWeekPickupRate: parseFloat(clamp(todayMetrics.overallPickupRate * clamp(normalRandom(1, 0.05), 0.88, 1.12), 0.4, 0.95).toFixed(3)),
    lastWeekConversionRate: parseFloat(lastWeekConversion.toFixed(3)),
    lastWeekAvgOrderValue: lastWeekAvgOrder,

    yesterdayHourlyData: yesterdayHourly,
    todayHourlyData: todayHourly,

    yesterdayShelves,
    lastWeekShelves
  };
}

const ASSOCIATION_PATTERNS: string[][] = [
  ['p_001', 'p_007'],
  ['p_002', 'p_007'],
  ['p_009', 'p_007'],
  ['p_004', 'p_007'],
  ['p_005', 'p_006'],
  ['p_002', 'p_006'],
  ['p_008', 'p_007'],
  ['p_004', 'p_010'],
  ['p_010', 'p_011'],
  ['p_001', 'p_012'],
  ['p_003', 'p_007'],
  ['p_009', 'p_012'],
  ['p_005', 'p_007'],
  ['p_006', 'p_007'],
  ['p_008', 'p_002'],
];

function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

function buildCartItems(productIds: string[]): CartItem[] {
  return productIds
    .map(id => {
      const p = getProductById(id);
      if (!p) return null;
      return {
        productId: id,
        product: p,
        quantity: randomInt(1, 2),
        addedAt: Date.now() - randomInt(0, 3600000)
      } as CartItem;
    })
    .filter((it): it is CartItem => it !== null);
}

export function generateMockOrders(count = 800): Order[] {
  const orders: Order[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const itemCount = randomInt(1, 4);
    let selectedIds: string[] = [];

    if (itemCount >= 2 && Math.random() < 0.55) {
      const pattern = randomPick(ASSOCIATION_PATTERNS);
      selectedIds = [...pattern];
      if (itemCount > pattern.length) {
        const remaining = itemCount - pattern.length;
        for (let j = 0; j < remaining; j++) {
          let attempts = 0;
          while (attempts < 10) {
            const p = pickRandomProduct();
            if (!selectedIds.includes(p.id)) {
              selectedIds.push(p.id);
              break;
            }
            attempts++;
          }
        }
      }
    } else {
      for (let j = 0; j < itemCount; j++) {
        let attempts = 0;
        while (attempts < 10) {
          const p = pickRandomProduct();
          if (!selectedIds.includes(p.id)) {
            selectedIds.push(p.id);
            break;
          }
          attempts++;
        }
      }
    }

    const items = buildCartItems(selectedIds);
    if (items.length === 0) continue;

    const originalTotal = items.reduce((s, it) => s + it.product.price * it.quantity, 0);
    const strategyDiscount = originalTotal * (Math.random() < 0.4 ? randomFloat(0.05, 0.2) : 0);
    const afterStrategy = originalTotal - strategyDiscount;
    const thresholdDiscount = afterStrategy >= 500 ? afterStrategy * 0.05 : 0;
    const finalAmount = originalTotal - strategyDiscount - thresholdDiscount;

    const createdAt = now - randomInt(0, 30 * 24 * 3600 * 1000);

    orders.push({
      id: generateOrderId(),
      sessionId: generateSessionId(),
      items,
      totalAmount: parseFloat(originalTotal.toFixed(2)),
      discountAmount: parseFloat(thresholdDiscount.toFixed(2)),
      strategyDiscount: parseFloat(strategyDiscount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
      status: Math.random() < 0.92 ? 'paid' : (Math.random() < 0.5 ? 'pending' : 'cancelled'),
      paymentMethod: Math.random() < 0.6 ? 'wechat' : 'alipay',
      createdAt,
      paidAt: Math.random() < 0.92 ? createdAt + randomInt(30000, 180000) : undefined
    });
  }

  orders.sort((a, b) => b.createdAt - a.createdAt);
  return orders;
}
