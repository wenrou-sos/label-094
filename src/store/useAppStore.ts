import { create } from 'zustand';
import type { AppState, HeatmapDimension, Order, ExportConfig, ExportRecord } from '@/types';
import { generateProductBehaviors, generateShelfMonitors, generateRealtimeMetrics, generateHeatmapData, pickRandomProduct, addDeltaToMetrics, addDeltaToBehaviors } from '@/data/mockGenerator';
import { generateSessionId, generateOrderId, randomId } from '@/utils/randomUtils';
import { getProductById } from '@/data/products';
import { executeExport } from '@/utils/exportUtils';

let autoSimInterval: ReturnType<typeof setInterval> | null = null;
let metricsInterval: ReturnType<typeof setInterval> | null = null;

const initialBehaviors = generateProductBehaviors();
const initialMetrics = generateRealtimeMetrics();
const initialShelves = generateShelfMonitors();
const initialHeatmap = generateHeatmapData('week');

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
    if (!product || !state.cart) return state;

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

    return {
      cart: { ...state.cart, items: newItems, updatedAt: Date.now() }
    };
  }),

  removeFromCart: (productId) => set(state => {
    if (!state.cart) return state;
    return {
      cart: {
        ...state.cart,
        items: state.cart.items.filter(it => it.productId !== productId),
        updatedAt: Date.now()
      }
    };
  }),

  updateCartQuantity: (productId, quantity) => set(state => {
    if (!state.cart) return state;
    if (quantity <= 0) {
      const items = state.cart.items.filter(it => it.productId !== productId);
      return {
        cart: {
          ...state.cart,
          items,
          updatedAt: Date.now()
        }
      };
    }
    return {
      cart: {
        ...state.cart,
        items: state.cart.items.map(it =>
          it.productId === productId ? { ...it, quantity } : it
        ),
        updatedAt: Date.now()
      }
    };
  }),

  clearCart: () => set(state => state.cart ? {
    cart: { ...state.cart, items: [], updatedAt: Date.now() }
  } : state),

  createOrder: () => {
    const state = get();
    if (!state.cart || state.cart.items.length === 0) {
      throw new Error('购物车为空');
    }
    const totalAmount = state.cart.items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
    const discountAmount = totalAmount >= 500 ? totalAmount * 0.05 : 0;
    const finalAmount = totalAmount - discountAmount;

    const order: Order = {
      id: generateOrderId(),
      sessionId: state.cart.sessionId,
      items: state.cart.items,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
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
        return {
          currentOrder: state.currentOrder && state.currentOrder.id === orderId ? {
            ...state.currentOrder,
            status: 'paid',
            paidAt: Date.now()
          } : state.currentOrder,
          productBehaviors: behaviors,
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
      heatmap: state.heatmapData
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
  }
}));
