export type ProductStatus = 'In Stock' | 'Sold' | 'Reserved' | 'Returned';
export type ProductCondition = 'New' | 'Used - Like New' | 'Used - Good' | 'Used - Fair';
export type ProductGender = 'Men' | 'Women' | 'Grade School' | 'Toddler' | 'Infant' | 'Unisex';
export type SalePlatform = 'In-store' | 'Instagram' | 'WhatsApp' | 'Website' | 'Marketplace' | 'Other';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'PayPal' | 'Card' | 'Crypto' | 'Other';
export type ExpenseCategory = 'Rent' | 'Ads' | 'Packaging' | 'Fuel' | 'Staff' | 'Miscellaneous' | 'Returns' | 'Other';

export interface Product {
  id: string;
  user_id: string;
  sku?: string;
  brand: string;
  model: string;
  colorway?: string;
  size?: string;
  gender?: ProductGender;
  condition?: ProductCondition;
  purchase_date?: string;
  purchase_price: number;
  selling_price: number;
  min_selling_price?: number;
  quantity: number;
  supplier?: string;
  status: ProductStatus;
  notes?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  instagram?: string;
  notes?: string;
  total_purchases?: number;
  total_spent?: number;
  last_purchase_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  product_id?: string;
  customer_id?: string;
  product_name?: string;
  product_brand?: string;
  product_model?: string;
  product_size?: string;
  sale_date: string;
  selling_price: number;
  purchase_cost: number;
  platform: SalePlatform;
  payment_method?: PaymentMethod;
  shipping_cost: number;
  packaging_cost: number;
  other_costs: number;
  fees: number;
  profit: number;
  is_return: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  products?: Product;
  customers?: Customer;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  contact?: string;
  email?: string;
  notes?: string;
  created_at: string;
}

export interface ImportedFile {
  id: string;
  user_id: string;
  filename: string;
  file_type?: string;
  import_type?: string;
  records_imported: number;
  records_failed: number;
  status: string;
  error_details?: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  type?: string;
  is_read: boolean;
  related_id?: string;
  related_type?: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  business_name: string;
  currency: string;
  currency_symbol: string;
  default_markup: number;
  theme: string;
  low_stock_threshold: number;
  aging_days_threshold: number;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_revenue: number;
  total_profit: number;
  total_cost: number;
  total_pairs_sold: number;
  total_stock_value: number;
  stock_on_hand: number;
  total_expenses: number;
  net_profit: number;
  monthly_revenue: number;
  monthly_profit: number;
  weekly_revenue: number;
  weekly_profit: number;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  profit: number;
  sales: number;
}

export interface TopProduct {
  name: string;
  brand: string;
  revenue: number;
  profit: number;
  units_sold: number;
}

export interface ImportMapping {
  [fieldName: string]: string;
}

export interface ImportRow {
  [key: string]: string | number | null;
}
