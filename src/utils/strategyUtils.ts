import type { Strategy, TimeRange, Product, AppliedStrategyResult, AppliedDiscount, AppliedLimit } from '@/types';
import { products, getProductById } from '@/data/products';

export function isTimeInRange(timeRange: TimeRange, currentHour: number): boolean {
  const { start, end } = timeRange;
  if (start === end) return false;
  if (start < end) {
    return currentHour >= start && currentHour < end;
  } else {
    return currentHour >= start || currentHour < end;
  }
}

export function getCurrentHour(): number {
  return new Date().getHours();
}

export function sortByPriority(strategies: Strategy[]): Strategy[] {
  return [...strategies].sort((a, b) => b.priority - a.priority);
}

export function getApplicableStrategies(strategies: Strategy[], currentHour: number): Strategy[] {
  return sortByPriority(
    strategies.filter(s => s.enabled && isTimeInRange(s.timeRange, currentHour))
  );
}

export function isProductInShelfScope(strategy: Strategy, product: Product): boolean {
  if (strategy.applyToShelves === 'all') return true;
  return strategy.applyToShelves.includes(product.shelfId);
}

export function calculateActiveStrategies(
  strategies: Strategy[],
  currentHour: number
): AppliedStrategyResult {
  const active = getApplicableStrategies(strategies, currentHour);
  const allProductIds = products.map(p => p.id);

  let visibleProductIds: string[] = [...allProductIds];
  const priceOverrides: Record<string, AppliedDiscount> = {};
  const limits: AppliedLimit[] = [];

  for (const strategy of active) {
    switch (strategy.type) {
      case 'filter': {
        const filter = strategy.config.filter;
        if (!filter) break;

        visibleProductIds = visibleProductIds.filter(pid => {
          const product = getProductById(pid);
          if (!product) return false;
          if (!isProductInShelfScope(strategy, product)) return true;

          switch (filter.mode) {
            case 'tags':
              if (filter.includeTags?.length) {
                return filter.includeTags.some(tag => product.tags.includes(tag));
              }
              if (filter.excludeTags?.length) {
                return !filter.excludeTags.some(tag => product.tags.includes(tag));
              }
              return true;

            case 'price_range':
              return (
                product.price >= (filter.priceMin ?? 0) &&
                product.price <= (filter.priceMax ?? Infinity)
              );

            case 'beginner_only':
              return product.price <= 399 || product.tags.includes('推荐') || product.tags.includes('入门');

            default:
              return true;
          }
        });
        break;
      }

      case 'discount': {
        const discount = strategy.config.discount;
        if (!discount) break;
        const percent = discount.percent;

        for (const pid of visibleProductIds) {
          if (priceOverrides[pid]) continue;

          const product = getProductById(pid);
          if (!product) continue;
          if (!isProductInShelfScope(strategy, product)) continue;

          let applies = false;
          switch (discount.applyTo) {
            case 'all':
              applies = true;
              break;
            case 'shelf':
              applies = discount.shelfIds?.includes(product.shelfId) ?? false;
              break;
            case 'tags':
              applies = discount.tags?.some(t => product.tags.includes(t)) ?? false;
              break;
            default:
              applies = true;
          }

          if (applies) {
            const finalPrice = parseFloat((product.price * percent).toFixed(2));
            priceOverrides[pid] = {
              strategyId: strategy.id,
              strategyName: strategy.name,
              percent,
              originalPrice: product.price,
              finalPrice
            };
          }
        }
        break;
      }

      case 'limit': {
        const limit = strategy.config.limit;
        if (!limit) break;

        limits.push({
          strategyId: strategy.id,
          strategyName: strategy.name,
          maxPerPerson: limit.maxPerPerson,
          scope: limit.scope || 'per_product'
        });
        break;
      }
    }
  }

  return {
    visibleProductIds,
    priceOverrides,
    limits,
    activeStrategies: active
  };
}

export function getProductLimitForStrategies(
  productId: string,
  active: AppliedStrategyResult
): AppliedLimit | null {
  if (active.limits.length === 0) return null;
  const product = getProductById(productId);
  if (!product) return null;

  let strictest: AppliedLimit | null = null;
  for (const limit of active.limits) {
    if (limit.scope !== 'per_product') continue;

    const strategy = active.activeStrategies.find(s => s.id === limit.strategyId);
    if (!strategy || strategy.type !== 'limit') continue;

    const cfg = strategy.config.limit;
    if (!cfg) continue;

    let applies = false;
    switch (cfg.applyTo) {
      case 'all':
        applies = true;
        break;
      case 'shelf':
        applies = cfg.shelfIds?.includes(product.shelfId) ?? false;
        break;
      case 'tags':
        applies = cfg.tags?.some(t => product.tags.includes(t)) ?? false;
        break;
      default:
        applies = true;
    }

    if (applies) {
      if (!strictest || limit.maxPerPerson < strictest.maxPerPerson) {
        strictest = limit;
      }
    }
  }
  return strictest;
}

export function getOrderLimitForStrategies(
  active: AppliedStrategyResult
): AppliedLimit | null {
  if (active.limits.length === 0) return null;

  let strictest: AppliedLimit | null = null;
  for (const limit of active.limits) {
    if (limit.scope !== 'per_order') continue;
    if (!strictest || limit.maxPerPerson < strictest.maxPerPerson) {
      strictest = limit;
    }
  }
  return strictest;
}

export function generateDefaultStrategies(): Strategy[] {
  const now = Date.now();
  return [
    {
      id: 'strat_001',
      name: '深夜入门级商品展示',
      type: 'filter',
      description: '23:00-08:00 只展示入门级商品（≤399元 / 推荐标签）',
      priority: 100,
      enabled: true,
      timeRange: { start: 23, end: 8 },
      applyToShelves: 'all',
      config: { filter: { mode: 'beginner_only' } },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'strat_002',
      name: '午后特惠9折',
      type: 'discount',
      description: '13:00-17:00 全店商品自动9折',
      priority: 80,
      enabled: true,
      timeRange: { start: 13, end: 17 },
      applyToShelves: 'all',
      config: { discount: { percent: 0.9, applyTo: 'all' } },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'strat_003',
      name: '晚高峰限购3件',
      type: 'limit',
      description: '18:00-22:00 每人每单限购3件商品',
      priority: 90,
      enabled: true,
      timeRange: { start: 18, end: 22 },
      applyToShelves: 'all',
      config: { limit: { maxPerPerson: 3, scope: 'per_order', applyTo: 'all' } },
      createdAt: now,
      updatedAt: now
    }
  ];
}

export function formatTimeRange(range: TimeRange): string {
  const fmt = (h: number) => `${String(h).padStart(2, '0')}:00`;
  const crossDay = range.start > range.end;
  return `${fmt(range.start)} - ${fmt(range.end)}${crossDay ? ' (跨日)' : ''}`;
}

export const beginnerPriceThreshold = 399;

export { calculateActiveStrategies as getActiveStrategies };
