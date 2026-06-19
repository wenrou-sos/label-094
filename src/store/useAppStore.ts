import { create } from 'zustand';
import type { AppState, Order, ExportRecord, Strategy, AppliedStrategyResult, AssociationRule, Product, StockRestockLog } from '@/types';
import { generateProductBehaviors, generateShelfMonitors, generateRealtimeMetrics, generateHeatmapData, pickRandomProduct, addDeltaToMetrics, addDeltaToBehaviors, generateMockOrders } from '@/data/mockGenerator';
import { generateSessionId, generateOrderId, randomId } from '@/utils/randomUtils';
import { getProductById, products as initialProducts } from '@/data/products';
import { executeExport } from '@/utils/exportUtils';
import {
  generateDefaultStrategies,
  calculateActiveStrategies,
  getCurrentHour,
  getProductLimitForStrategies,
  getOrderLimitForStrategies
} from '@/utils/strategyUtils';
import { generateAssociationRules, getTopRelatedProducts, getCartRecommendations } from '@/utils/aprioriUtils';

let autoSimInterval: ReturnType<typeof setInterval> | null = null;
let metricsInterval: ReturnType<typeof setInterval> | null = null;

const initialBehaviors = generateProductBehaviors();
const initialMetrics = generateRealtimeMetrics();
const initialShelves = generateShelfMonitors();
const initialHeatmap = generateHeatmapData('week');
const initialStrategies = generateDefaultStrategies();
const initialSimulatedOrders = generateMockOrders(800);
const initialPaidOrders = initialSimulatedOrders.filter(o => o.status === 'paid');
const initialAssociationRules = generateAssociationRules(initialPaidOrders);

export const useAppStore = create<AppState>((set, get) => ({
  cart: {
    sessionId: generateSessionId(),
    items: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  activeProduct: null,
  isDetailModalOpen: false,
  currentOrder: null,
  isPhoneBound: false,

  realtimeMetrics: initialMetrics,
  productBehaviors: initialBehaviors,
  shelfMonitors: initialShelves,
  heatmapData: initialHeatmap,
  exportRecords: [],
  orders: [],
  lastPaidOrder: null,
  strategies: initialStrategies,
  associationRules: initialAssociationRules,
  simulatedOrders: initialSimulatedOrders,
  restockLogs: [],
  products: initialProducts.map(p => ({ ...p })),

  bindPhone: (phone) => set(state => ({
    isPhoneBound: true,
    cart: state.cart ? { ...state.cart, boundPhone: phone } : null
  })),

  showProductDetail: (product) => set({
    activeProduct: product,
    isDetailModalOpen: true
  }),

  closeProductDetail: () => set({
    isDetailModalOpen: false,
    activeProduct: null
  }),

  addToCart: (productId, quantity = 1) => set(state => {
    const product = getProductById(productId);
    const currentProduct = state.products.find(p => p.id === productId);
    if (!product || !state.cart || !currentProduct) return state;

    if (currentProduct.stock < quantity) {
      return state;
    }

    const existingIdx = state.cart.items.findIndex(it => it.productId === productId);
    let newItems;

    if (existingIdx >= 0) {
      newItems = state.cart.items.map((it, idx) =>
        idx === existingIdx ? { ...it, quantity: it.quantity + quantity } : it
      );
    } else {
      newItems = [...state.cart.items, {
        productId,
        product,
        quantity,
        addedAt: Date.now()
      }];
    }

    const newProducts = state.products.map(p =>
      p.id === productId
        ? { ...p, stock: p.stock - quantity, inStock: p.stock - quantity > 0 }
        : p
    );

    return {
      cart: { ...state.cart, items: newItems, updatedAt: Date.now() },
      products: newProducts
    };
  }),

  removeFromCart: (productId) => set(state => {
    if (!state.cart) return state;
    const item = state.cart.items.find(it => it.productId === productId);
    if (!item) return state;

    const newProducts = state.products.map(p =>
      p.id === productId
        ? { ...p, stock: p.stock + item.quantity, inStock: true }
        : p
    );

    return {
      cart: {
        ...state.cart,
        items: state.cart.items.filter(it => it.productId !== productId),
        updatedAt: Date.now()
      },
      products: newProducts
    };
  }),

  updateCartQuantity: (productId, quantity) => set(state => {
    if (!state.cart) return state;
    const item = state.cart.items.find(it => it.productId === productId);
    if (!item) return state;

    const delta = quantity - item.quantity;
    const currentProduct = state.products.find(p => p.id === productId);
    if (!currentProduct || currentProduct.stock < delta) {
      return state;
    }

    if (quantity <= 0) {
      const newProducts = state.products.map(p =>
        p.id === productId
          ? { ...p, stock: p.stock + item.quantity, inStock: true }
          : p
      );
      return {
        cart: {
          ...state.cart,
          items: state.cart.items.filter(it => it.productId !== productId),
          updatedAt: Date.now()
        },
        products: newProducts
      };
    }

    const newProducts = state.products.map(p =>
      p.id === productId
        ? { ...p, stock: p.stock - delta, inStock: p.stock - delta > 0 }
        : p
    );

    return {
      cart: {
        ...state.cart,
        items: state.cart.items.map(it =>
          it.productId === productId ? { ...it, quantity } : it
        ),
        updatedAt: Date.now()
      },
      products: newProducts
    };
  }),

  clearCart: (restoreStock = true) => set(state => {
    if (!state.cart) return state;
    if (restoreStock) {
      const newProducts = state.products.map(p => {
        const cartItem = state.cart!.items.find(it => it.productId === p.id);
        if (cartItem) {
          return { ...p, stock: p.stock + cartItem.quantity, inStock: true };
        }
        return p;
      });
      return {
        cart: { ...state.cart, items: [], updatedAt: Date.now() },
        products: newProducts
      };
    }
    return {
      cart: { ...state.cart, items: [], updatedAt: Date.now() }
    };
  }),

  clearReceipt: () => set({ lastPaidOrder: null, currentOrder: null }),

  createOrder: () => {
    const state = get();
    if (!state.cart || state.cart.items.length === 0) {
      throw new Error('购物车为空');
    }
    const active = state.getActiveStrategies();
    const priceOverrides = active.priceOverrides;

    const getFinalPrice = (price: number, productId: string) => {
      const override = priceOverrides[productId];
      return override ? override.finalPrice : price;
    };

    const originalTotal = state.cart.items.reduce((s, it) => s + it.product.price * it.quantity, 0);
    const strategyTotal = state.cart.items.reduce((s, it) => s + getFinalPrice(it.product.price, it.productId) * it.quantity, 0);
    const strategyDiscount = originalTotal - strategyTotal;
    const thresholdDiscount = strategyTotal >= 500 ? strategyTotal * 0.05 : 0;
    const finalAmount = originalTotal - strategyDiscount - thresholdDiscount;

    const order: Order = {
      id: generateOrderId(),
      sessionId: state.cart.sessionId,
      items: state.cart.items,
      totalAmount: parseFloat(originalTotal.toFixed(2)),
      discountAmount: parseFloat(thresholdDiscount.toFixed(2)),
      strategyDiscount: parseFloat(strategyDiscount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
      status: 'pending',
      createdAt: Date.now()
    };
    set({ currentOrder: order });
    return order;
  },

  simulatePayment: async (orderId, method) => {
    set(state => state.currentOrder && state.currentOrder.id === orderId ? {
      currentOrder: { ...state.currentOrder, paymentMethod: method }
    } : state);

    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
    const success = Math.random() > 0.08;

    if (success) {
      set(state => {
        const behaviors = state.productBehaviors.map(b => {
          const order = state.currentOrder;
          if (!order) return b;
          const match = order.items.find(it => it.productId === b.productId);
          if (match) {
            const newPurchase = b.purchaseCount + match.quantity;
            return {
              ...b,
              purchaseCount: newPurchase,
              conversionRate: parseFloat((newPurchase / Math.max(b.pickupCount, 1)).toFixed(3))
            };
          }
          return b;
        });
        const paidOrder = state.currentOrder && state.currentOrder.id === orderId ? {
          ...state.currentOrder,
          status: 'paid' as const,
          paidAt: Date.now(),
          paymentMethod: method
        } : state.currentOrder;
        return {
          currentOrder: paidOrder,
          productBehaviors: behaviors,
          orders: paidOrder ? [paidOrder, ...state.orders] : state.orders,
          lastPaidOrder: paidOrder ?? state.lastPaidOrder,
          realtimeMetrics: {
            ...state.realtimeMetrics,
            todayCustomers: state.realtimeMetrics.todayCustomers + 1,
            todayRevenue: state.realtimeMetrics.todayRevenue + (state.currentOrder?.finalAmount || 0),
            lastUpdated: Date.now()
          }
        };
      });
      get().clearCart();
    } else {
      set(state => state.currentOrder && state.currentOrder.id === orderId ? {
        currentOrder: { ...state.currentOrder, status: 'failed' }
      } : state);
    }

    return success;
  },

  refreshMetrics: () => set(state => ({
    realtimeMetrics: addDeltaToMetrics(state.realtimeMetrics),
    productBehaviors: addDeltaToBehaviors(state.productBehaviors)
  })),

  refreshHeatmap: (dimension) => set({
    heatmapData: generateHeatmapData(dimension)
  }),

  exportData: async (config) => {
    const state = get();
    const result = await executeExport(config, {
      metrics: state.realtimeMetrics,
      behaviors: state.productBehaviors,
      heatmap: state.heatmapData,
      orders: state.orders
    });
    const record: ExportRecord = {
      id: randomId('exp'),
      fileName: result.fileName,
      type: config.type,
      format: config.format,
      createdAt: Date.now(),
      size: result.size
    };
    set(state => ({ exportRecords: [record, ...state.exportRecords].slice(0, 20) }));
    return record;
  },

  simulateProductPickup: () => {
    const product = pickRandomProduct();
    get().showProductDetail(product);
    set(state => ({
      productBehaviors: state.productBehaviors.map(b =>
        b.productId === product.id ? { ...b, pickupCount: b.pickupCount + 1 } : b
      )
    }));
  },

  startAutoSimulation: () => {
    if (autoSimInterval) return;
    autoSimInterval = setInterval(() => {
      if (Math.random() > 0.35) {
        get().simulateProductPickup();
      }
    }, 4000 + Math.random() * 6000);

    if (!metricsInterval) {
      metricsInterval = setInterval(() => {
        get().refreshMetrics();
      }, 60000);
    }
  },

  stopAutoSimulation: () => {
    if (autoSimInterval) {
      clearInterval(autoSimInterval);
      autoSimInterval = null;
    }
  },

  addStrategy: (data) => {
    const newStrat: Strategy = {
      ...data,
      id: `strat_${randomId('id')}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    set(state => ({ strategies: [newStrat, ...state.strategies] }));
    return newStrat;
  },

  updateStrategy: (id, updates) => set(state => ({
    strategies: state.strategies.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
    )
  })),

  deleteStrategy: (id) => set(state => ({
    strategies: state.strategies.filter(s => s.id !== id)
  })),

  reorderStrategies: (ids) => set(state => {
    const map = new Map(state.strategies.map(s => [s.id, s]));
    const reordered: Strategy[] = [];
    for (let i = 0; i < ids.length; i++) {
      const s = map.get(ids[i]);
      if (s) reordered.push({ ...s, priority: ids.length - i, updatedAt: Date.now() });
    }
    const remaining = state.strategies.filter(s => !ids.includes(s.id));
    return { strategies: [...reordered, ...remaining] };
  }),

  toggleStrategy: (id) => set(state => ({
    strategies: state.strategies.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled, updatedAt: Date.now() } : s
    )
  })),

  getActiveStrategies: (): AppliedStrategyResult => {
    return calculateActiveStrategies(get().strategies, getCurrentHour());
  },

  checkPurchaseLimit: (productId, currentQty) => {
    const active = get().getActiveStrategies();
    const cart = get().cart;
    const totalQty = cart?.items.reduce((s, it) => s + it.quantity, 0) || 0;

    const orderLimit = getOrderLimitForStrategies(active);
    if (orderLimit && totalQty + 1 > orderLimit.maxPerPerson) {
      return { allowed: false, limit: orderLimit };
    }

    const limit = getProductLimitForStrategies(productId, active);
    if (!limit) return { allowed: true };
    if (currentQty >= limit.maxPerPerson) {
      return { allowed: false, limit };
    }
    return { allowed: true, limit };
  },

  checkOrderLimit: () => {
    const active = get().getActiveStrategies();
    const cart = get().cart;
    const totalQty = cart?.items.reduce((s, it) => s + it.quantity, 0) || 0;

    const limit = getOrderLimitForStrategies(active);
    if (!limit) return { allowed: true, totalQty };
    if (totalQty > limit.maxPerPerson) {
      return { allowed: false, limit, totalQty };
    }
    return { allowed: true, limit, totalQty };
  },

  regenerateAssociationRules: (orderCount = 800) => {
    const newOrders = generateMockOrders(orderCount);
    const paidOrders = newOrders.filter(o => o.status === 'paid');
    const newRules = generateAssociationRules(paidOrders);
    set({ simulatedOrders: newOrders, associationRules: newRules });
  },

  getProductRecommendations: (productId, limit = 3) => {
    return getTopRelatedProducts(productId, get().associationRules, limit);
  },

  getCartPairingRecommendations: (cartProductIds, limit = 2) => {
    return getCartRecommendations(cartProductIds, get().associationRules, limit);
  },

  updateProductStock: (productId, newStock) => set(state => {
    const newProducts = state.products.map(p => {
      if (p.id !== productId) return p;
      return {
        ...p,
        stock: newStock,
        inStock: newStock > 0
      };
    });

    const newBehaviors = state.productBehaviors.map(b => {
      if (b.productId !== productId) return b;
      const updatedProduct = newProducts.find(p => p.id === productId);
      if (!updatedProduct) return b;
      return { ...b, product: updatedProduct };
    });

    return { products: newProducts, productBehaviors: newBehaviors };
  }),

  restockProduct: async (productId) => {
    const state = get();
    const product = state.products.find(p => p.id === productId);
    if (!product) return false;

    const previousStock = product.stock;
    const restockAmount = product.maxStock - previousStock;

    await new Promise(resolve => setTimeout(resolve, 2000));

    const newStock = product.maxStock;

    get().updateProductStock(productId, newStock);

    const log: StockRestockLog = {
      id: `restock_${Date.now()}_${randomId()}`,
      productId,
      productName: product.name,
      restockAmount,
      previousStock,
      newStock,
      restockedAt: Date.now()
    };

    set(s => ({
      restockLogs: [log, ...s.restockLogs].slice(0, 100)
    }));

    return true;
  },

  getStockStats: () => {
    const products = get().products;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    for (const p of products) {
      if (p.stock === 0) {
        outOfStock++;
      } else if (p.stock <= p.minStock) {
        lowStock++;
      } else {
        inStock++;
      }
    }

    return { inStock, lowStock, outOfStock };
  }
}));
