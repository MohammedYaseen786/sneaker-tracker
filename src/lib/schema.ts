// SQLite schema. Applied automatically every time the app opens the database
// (all statements are idempotent).

const NOW = "(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT ${NOW}
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT ${NOW}
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sku TEXT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  colorway TEXT,
  size TEXT,
  gender TEXT DEFAULT 'Unisex',
  condition TEXT DEFAULT 'New',
  purchase_date TEXT,
  purchase_price REAL DEFAULT 0,
  selling_price REAL DEFAULT 0,
  min_selling_price REAL DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  supplier TEXT,
  status TEXT DEFAULT 'In Stock',
  notes TEXT,
  image_url TEXT,
  created_at TEXT DEFAULT ${NOW},
  updated_at TEXT DEFAULT ${NOW}
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  instagram TEXT,
  notes TEXT,
  created_at TEXT DEFAULT ${NOW},
  updated_at TEXT DEFAULT ${NOW}
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  product_name TEXT,
  product_brand TEXT,
  product_model TEXT,
  product_size TEXT,
  sale_date TEXT NOT NULL DEFAULT (date('now')),
  selling_price REAL NOT NULL DEFAULT 0,
  purchase_cost REAL DEFAULT 0,
  platform TEXT DEFAULT 'In-store',
  payment_method TEXT DEFAULT 'Cash',
  shipping_cost REAL DEFAULT 0,
  packaging_cost REAL DEFAULT 0,
  other_costs REAL DEFAULT 0,
  fees REAL DEFAULT 0,
  profit REAL DEFAULT 0,
  is_return INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT ${NOW},
  updated_at TEXT DEFAULT ${NOW}
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL DEFAULT (date('now')),
  category TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  description TEXT,
  receipt_url TEXT,
  created_at TEXT DEFAULT ${NOW},
  updated_at TEXT DEFAULT ${NOW}
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  notes TEXT,
  created_at TEXT DEFAULT ${NOW}
);

CREATE TABLE IF NOT EXISTS imported_files (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT,
  import_type TEXT,
  records_imported INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',
  error_details TEXT,
  created_at TEXT DEFAULT ${NOW}
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  is_read INTEGER DEFAULT 0,
  related_id TEXT,
  related_type TEXT,
  created_at TEXT DEFAULT ${NOW}
);

CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT DEFAULT 'My Sneaker Business',
  currency TEXT DEFAULT 'ZAR',
  currency_symbol TEXT DEFAULT 'R',
  default_markup REAL DEFAULT 30,
  theme TEXT DEFAULT 'dark',
  low_stock_threshold INTEGER DEFAULT 2,
  aging_days_threshold INTEGER DEFAULT 60,
  email_notifications INTEGER DEFAULT 0,
  created_at TEXT DEFAULT ${NOW},
  updated_at TEXT DEFAULT ${NOW}
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
`
