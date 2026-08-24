// Stock status constants — single source of truth
export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
} as const;

export type StockStatus = typeof STOCK_STATUS[keyof typeof STOCK_STATUS];

// Order status constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Indian mobile number regex — must start with 6-9, exactly 10 digits
export const INDIAN_PHONE_REGEX = /^[+]?91?[-\s]?[6-9]\d{9}$/;
