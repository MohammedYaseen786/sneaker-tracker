import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol = 'R'): string {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function calculateProfit(
  sellingPrice: number,
  purchaseCost: number,
  shippingCost = 0,
  packagingCost = 0,
  otherCosts = 0,
  fees = 0
): number {
  return sellingPrice - purchaseCost - shippingCost - packagingCost - otherCosts - fees;
}

export function calculateProfitMargin(profit: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0;
  return (profit / sellingPrice) * 100;
}

export function calculateSuggestedPrice(purchaseCost: number, markupPercent: number): number {
  return purchaseCost * (1 + markupPercent / 100);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'In Stock':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Sold':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Reserved':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'Returned':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function getPlatformIcon(platform: string): string {
  switch (platform) {
    case 'Instagram':
      return '📸';
    case 'WhatsApp':
      return '💬';
    case 'Website':
      return '🌐';
    case 'Marketplace':
      return '🛒';
    case 'In-store':
      return '🏪';
    default:
      return '📦';
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function generateSKU(brand: string, model: string, size: string): string {
  const brandCode = brand.slice(0, 2).toUpperCase();
  const modelCode = model.replace(/\s+/g, '').slice(0, 4).toUpperCase();
  const sizeCode = size.replace('.', '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${brandCode}-${modelCode}-${sizeCode}-${random}`;
}

export function isLowStock(quantity: number, threshold: number): boolean {
  return quantity > 0 && quantity <= threshold;
}

export function daysInStock(purchaseDate: string): number {
  const purchase = new Date(purchaseDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - purchase.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function groupByDate(
  items: { date?: string; sale_date?: string; created_at: string }[],
  dateField: string = 'sale_date'
): Record<string, typeof items> {
  return items.reduce((groups, item) => {
    const date = (item as Record<string, string>)[dateField] || item.created_at.slice(0, 10);
    const key = date.slice(0, 7); // YYYY-MM
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, typeof items>);
}

export function getLastNMonths(n: number): string[] {
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}
