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

  simulateProductPickup: () => void;
  startAutoSimulation: () => void;
  stopAutoSimulation: () => void;
}
