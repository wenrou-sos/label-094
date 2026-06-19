export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  tags: string[];
  description: string;
  usageGuide: string;
  specifications: {
    material: '硅胶' | 'ABS' | 'TPE' | '玻璃' | '金属' | '其他';
    materialDetail: string;
    waterproof: 'IPX4' | 'IPX5' | 'IPX6' | 'IPX7' | 'IPX8' | '不防水';
    charging: 'USB-C' | 'Micro-USB' | '无线充电' | '电池' | '无需充电';
    noise: string;
    [key: string]: string;
  };
  shelfId: string;
  inStock: boolean;
  stock: number;
  minStock: number;
  maxStock: number;
}

export interface StockRestockLog {
  id: string;
  productId: string;
  productName: string;
  restockAmount: number;
  previousStock: number;
  newStock: number;
  restockedAt: number;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  addedAt: number;
}

export interface Cart {
  sessionId: string;
  items: CartItem[];
  boundPhone?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Order {
  id: string;
  sessionId: string;
  items: CartItem[];
  totalAmount: number;
  discountAmount: number;
  strategyDiscount: number;
  finalAmount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paymentMethod?: 'wechat' | 'alipay';
  createdAt: number;
  paidAt?: number;
}

export interface ProductBehavior {
  productId: string;
  product: Product;
  pickupCount: number;
  purchaseCount: number;
  conversionRate: number;
  avgViewDuration: number;
}

export interface ShelfMonitor {
  shelfId: string;
  shelfName: string;
  totalPickups: number;
  totalPurchases: number;
  conversionRate: number;
}

export interface RealtimeMetrics {
  todayCustomers: number;
  todayRevenue: number;
  overallPickupRate: number;
  overallConversionRate: number;
  avgOrderValue: number;
  lastUpdated: number;
}

export interface HourlyData {
  hour: number;
  customers: number;
  revenue: number;
}

export interface HeatmapData {
  date: string;
  weekday?: string;
  hourlyData: HourlyData[];
}

export type HeatmapDimension = 'day' | 'week' | 'month';
export type HeatmapType = 'customers' | 'revenue';

export type ExportType = 'metrics' | 'behavior' | 'heatmap' | 'orders';
export type ExportFormat = 'xlsx' | 'csv';

export interface ExportConfig {
  type: ExportType;
  dateRange?: { start: string; end: string };
  format: ExportFormat;
}

export interface ExportRecord {
  id: string;
  fileName: string;
  type: string;
  format: string;
  createdAt: number;
  size: number;
}

export interface AppState {
  cart: Cart | null;
  activeProduct: Product | null;
  isDetailModalOpen: boolean;
  currentOrder: Order | null;
  isPhoneBound: boolean;

  realtimeMetrics: RealtimeMetrics;
  productBehaviors: ProductBehavior[];
  shelfMonitors: ShelfMonitor[];
  heatmapData: HeatmapData[];
  exportRecords: ExportRecord[];
  orders: Order[];
  lastPaidOrder: Order | null;
  strategies: Strategy[];
  associationRules: AssociationRule[];
  simulatedOrders: Order[];
  restockLogs: StockRestockLog[];
  products: Product[];

  bindPhone: (phone: string) => void;
  showProductDetail: (product: Product) => void;
  closeProductDetail: () => void;
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  createOrder: () => Order;
  simulatePayment: (orderId: string, method: 'wechat' | 'alipay') => Promise<boolean>;
  clearReceipt: () => void;

  refreshMetrics: () => void;
  refreshHeatmap: (dimension: HeatmapDimension) => void;
  exportData: (config: ExportConfig) => Promise<ExportRecord>;
  regenerateAssociationRules: (orderCount?: number) => void;

  simulateProductPickup: () => void;
  startAutoSimulation: () => void;
  stopAutoSimulation: () => void;

  addStrategy: (strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>) => Strategy;
  updateStrategy: (id: string, updates: Partial<Strategy>) => void;
  deleteStrategy: (id: string) => void;
  reorderStrategies: (ids: string[]) => void;
  toggleStrategy: (id: string) => void;
  getActiveStrategies: () => AppliedStrategyResult;
  checkPurchaseLimit: (productId: string, currentCartQty: number) => { allowed: boolean; limit?: AppliedLimit };
  checkOrderLimit: () => { allowed: boolean; limit?: AppliedLimit; totalQty: number };

  getProductRecommendations: (productId: string, limit?: number) => { product: Product; confidence: number; lift: number }[];
  getCartPairingRecommendations: (cartProductIds: string[], limit?: number) => { product: Product; confidence: number; missingAmount: number }[];

  updateProductStock: (productId: string, newStock: number) => void;
  restockProduct: (productId: string) => Promise<boolean>;
  getStockStats: () => { inStock: number; lowStock: number; outOfStock: number };
}

export type StrategyType = 'filter' | 'discount' | 'limit';
export type StrategyFilterMode = 'tags' | 'price_range' | 'beginner_only';

export interface TimeRange {
  start: number;
  end: number;
}

export interface StrategyConfig {
  filter?: {
    mode: StrategyFilterMode;
    includeTags?: string[];
    excludeTags?: string[];
    priceMin?: number;
    priceMax?: number;
  };
  discount?: {
    percent: number;
    applyTo?: 'all' | 'shelf' | 'tags';
    shelfIds?: string[];
    tags?: string[];
  };
  limit?: {
    maxPerPerson: number;
    scope: 'per_order' | 'per_product';
    applyTo?: 'all' | 'shelf' | 'tags';
    shelfIds?: string[];
    tags?: string[];
  };
}

export interface Strategy {
  id: string;
  name: string;
  type: StrategyType;
  description: string;
  priority: number;
  enabled: boolean;
  timeRange: TimeRange;
  applyToShelves: 'all' | string[];
  config: StrategyConfig;
  createdAt: number;
  updatedAt: number;
}

export interface AppliedDiscount {
  strategyId: string;
  strategyName: string;
  percent: number;
  originalPrice: number;
  finalPrice: number;
}

export interface AppliedLimit {
  strategyId: string;
  strategyName: string;
  maxPerPerson: number;
  scope: 'per_order' | 'per_product';
}

export interface AppliedStrategyResult {
  visibleProductIds: string[];
  priceOverrides: Record<string, AppliedDiscount>;
  limits: AppliedLimit[];
  activeStrategies: Strategy[];
}

export interface AssociationRule {
  id: string;
  antecedent: Product[];
  antecedentIds: string[];
  consequent: Product[];
  consequentIds: string[];
  support: number;
  confidence: number;
  lift: number;
  supportCount: number;
}
