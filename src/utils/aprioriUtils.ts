import type { Order, Product, AssociationRule } from '@/types';
import { products } from '@/data/products';

function combinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  const n = arr.length;
  if (k > n) return result;

  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    result.push(idx.map(i => arr[i]));
    let i = k - 1;
    while (i >= 0 && idx[i] === i + n - k) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
  return result;
}

function subsetsOfSize<T>(items: T[], minSize: number, maxSize: number): T[][] {
  const result: T[][] = [];
  for (let s = minSize; s <= maxSize; s++) {
    result.push(...combinations(items, s));
  }
  return result;
}

export interface AprioriConfig {
  minSupport: number;
  minConfidence: number;
  minLift: number;
  maxAntecedentSize: number;
}

const DEFAULT_CONFIG: AprioriConfig = {
  minSupport: 0.015,
  minConfidence: 0.25,
  minLift: 1.1,
  maxAntecedentSize: 2
};

export function generateAssociationRules(
  orders: Order[],
  config: Partial<AprioriConfig> = {}
): AssociationRule[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const totalOrders = orders.length;
  if (totalOrders === 0) return [];

  const orderItemSets = orders.map(o =>
    Array.from(new Set(o.items.map(it => it.productId))).sort()
  ).filter(s => s.length >= 2);

  if (orderItemSets.length === 0) return [];

  const itemSupport = new Map<string, number>();
  for (const itemSet of orderItemSets) {
    for (const item of itemSet) {
      itemSupport.set(item, (itemSupport.get(item) || 0) + 1);
    }
  }

  const frequentItemsets = new Map<string, number>();
  itemSupport.forEach((count, item) => {
    const support = count / totalOrders;
    if (support >= cfg.minSupport) {
      frequentItemsets.set(JSON.stringify([item]), count);
    }
  });

  let currentSize = 2;
  let prevFrequent = Array.from(frequentItemsets.keys()).map(k => JSON.parse(k) as string[]);

  while (prevFrequent.length > 0 && currentSize <= cfg.maxAntecedentSize + 1) {
    const candidateCounts = new Map<string, number>();

    for (const itemSet of orderItemSets) {
      const candidates = subsetsOfSize(itemSet, currentSize, currentSize);
      for (const cand of candidates) {
        const key = JSON.stringify(cand);
        candidateCounts.set(key, (candidateCounts.get(key) || 0) + 1);
      }
    }

    const newFrequent: string[][] = [];
    candidateCounts.forEach((count, key) => {
      const support = count / totalOrders;
      if (support >= cfg.minSupport) {
        frequentItemsets.set(key, count);
        newFrequent.push(JSON.parse(key));
      }
    });

    prevFrequent = newFrequent;
    currentSize++;
  }

  const rules: AssociationRule[] = [];
  const productMap = new Map(products.map(p => [p.id, p]));

  frequentItemsets.forEach((count, key) => {
    const itemset = JSON.parse(key) as string[];
    if (itemset.length < 2) return;

    const maxAntecedent = Math.min(itemset.length - 1, cfg.maxAntecedentSize);

    for (let aSize = 1; aSize <= maxAntecedent; aSize++) {
      const antecedentCandidates = combinations(itemset, aSize);
      for (const antecedent of antecedentCandidates) {
        const consequent = itemset.filter(i => !antecedent.includes(i));
        if (consequent.length === 0) continue;

        const antecedentKey = JSON.stringify([...antecedent].sort());
        const antecedentCount = frequentItemsets.get(antecedentKey);
        if (!antecedentCount) continue;

        const support = count / totalOrders;
        const confidence = count / antecedentCount;
        if (confidence < cfg.minConfidence) continue;

        let lift = 1;
        if (consequent.length === 1) {
          const consCount = itemSupport.get(consequent[0]) || 0;
          const consSupport = consCount / totalOrders;
          if (consSupport > 0) {
            lift = confidence / consSupport;
          }
        } else {
          const consKey = JSON.stringify([...consequent].sort());
          const consCount = frequentItemsets.get(consKey);
          if (consCount) {
            lift = (count / totalOrders) / ((antecedentCount / totalOrders) * (consCount / totalOrders));
          }
        }

        if (lift < cfg.minLift) continue;

        const antecedentProducts = antecedent
          .map(id => productMap.get(id))
          .filter((p): p is Product => p !== undefined);
        const consequentProducts = consequent
          .map(id => productMap.get(id))
          .filter((p): p is Product => p !== undefined);

        if (antecedentProducts.length === 0 || consequentProducts.length === 0) continue;

        rules.push({
          id: `rule_${antecedent.join('_')}__${consequent.join('_')}`,
          antecedent: antecedentProducts,
          antecedentIds: antecedent,
          consequent: consequentProducts,
          consequentIds: consequent,
          support: parseFloat(support.toFixed(4)),
          confidence: parseFloat(confidence.toFixed(4)),
          lift: parseFloat(lift.toFixed(4)),
          supportCount: count
        });
      }
    }
  });

  rules.sort((a, b) => {
    if (b.lift !== a.lift) return b.lift - a.lift;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.support - a.support;
  });

  return rules;
}

export function getTopRelatedProducts(
  productId: string,
  rules: AssociationRule[],
  limit = 3
): { product: Product; confidence: number; lift: number }[] {
  const related = new Map<string, { product: Product; confidence: number; lift: number }>();

  for (const rule of rules) {
    if (rule.antecedentIds.length === 1 && rule.antecedentIds[0] === productId && rule.consequentIds.length === 1) {
      const consId = rule.consequentIds[0];
      const existing = related.get(consId);
      if (!existing || rule.confidence > existing.confidence) {
        related.set(consId, {
          product: rule.consequent[0],
          confidence: rule.confidence,
          lift: rule.lift
        });
      }
    }

    if (rule.consequentIds.length === 1 && rule.consequentIds[0] === productId && rule.antecedentIds.length === 1) {
      const antId = rule.antecedentIds[0];
      const existing = related.get(antId);
      if (!existing || rule.confidence > existing.confidence) {
        related.set(antId, {
          product: rule.antecedent[0],
          confidence: rule.confidence,
          lift: rule.lift
        });
      }
    }
  }

  return Array.from(related.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

export function getCartRecommendations(
  cartProductIds: string[],
  rules: AssociationRule[],
  limit = 2
): { product: Product; confidence: number; missingAmount: number }[] {
  if (cartProductIds.length === 0) return [];

  const inCart = new Set(cartProductIds);
  const candidates = new Map<string, { product: Product; maxConfidence: number }>();

  for (const rule of rules) {
    if (rule.antecedentIds.every(id => inCart.has(id)) && rule.consequentIds.length === 1) {
      const consId = rule.consequentIds[0];
      if (inCart.has(consId)) continue;

      const existing = candidates.get(consId);
      if (!existing || rule.confidence > existing.maxConfidence) {
        candidates.set(consId, {
          product: rule.consequent[0],
          maxConfidence: rule.confidence
        });
      }
    }
  }

  return Array.from(candidates.values())
    .sort((a, b) => b.maxConfidence - a.maxConfidence)
    .slice(0, limit)
    .map(c => ({
      product: c.product,
      confidence: c.maxConfidence,
      missingAmount: c.product.price
    }));
}
