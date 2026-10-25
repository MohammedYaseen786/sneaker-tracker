import * as XLSX from 'xlsx';
import { Product, Sale, Expense } from '@/types';

export function parseExcelFile(buffer: ArrayBuffer): { headers: string[]; rows: Record<string, unknown>[] } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as unknown[][];

  if (jsonData.length === 0) return { headers: [], rows: [] };

  const headers = (jsonData[0] as string[]).map(h => String(h || '').trim());
  const rows = jsonData.slice(1).map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      obj[header] = (row as unknown[])[idx] ?? null;
    });
    return obj;
  });

  return { headers, rows };
}

export function mapRowsToProducts(
  rows: Record<string, unknown>[],
  mapping: Record<string, string>,
  userId: string
): Partial<Product>[] {
  return rows
    .filter(row => {
      const brand = mapping.brand ? row[mapping.brand] : null;
      const model = mapping.model ? row[mapping.model] : null;
      return brand && model;
    })
    .map(row => ({
      user_id: userId,
      brand: mapping.brand ? String(row[mapping.brand] || '') : '',
      model: mapping.model ? String(row[mapping.model] || '') : '',
      sku: mapping.sku ? String(row[mapping.sku] || '') : undefined,
      colorway: mapping.colorway ? String(row[mapping.colorway] || '') : undefined,
      size: mapping.size ? String(row[mapping.size] || '') : undefined,
      gender: mapping.gender ? String(row[mapping.gender] || '') as Product['gender'] : 'Unisex',
      condition: mapping.condition ? String(row[mapping.condition] || 'New') as Product['condition'] : 'New',
      purchase_price: mapping.purchase_price ? parseFloat(String(row[mapping.purchase_price] || '0').replace(/[^0-9.]/g, '')) || 0 : 0,
      selling_price: mapping.selling_price ? parseFloat(String(row[mapping.selling_price] || '0').replace(/[^0-9.]/g, '')) || 0 : 0,
      quantity: mapping.quantity ? parseInt(String(row[mapping.quantity] || '1')) || 1 : 1,
      status: (mapping.status ? String(row[mapping.status] || 'In Stock') : 'In Stock') as Product['status'],
      supplier: mapping.supplier ? String(row[mapping.supplier] || '') : undefined,
      notes: mapping.notes ? String(row[mapping.notes] || '') : undefined,
      purchase_date: mapping.purchase_date
        ? formatDateField(row[mapping.purchase_date])
        : undefined,
    }));
}

export function mapRowsToSales(
  rows: Record<string, unknown>[],
  mapping: Record<string, string>,
  userId: string
): Partial<Sale>[] {
  return rows
    .filter(row => {
      const sellingPrice = mapping.selling_price ? row[mapping.selling_price] : null;
      return sellingPrice;
    })
    .map(row => {
      const sellingPrice = parseFloat(String(row[mapping.selling_price] || '0').replace(/[^0-9.]/g, '')) || 0;
      const purchaseCost = mapping.purchase_cost ? parseFloat(String(row[mapping.purchase_cost] || '0').replace(/[^0-9.]/g, '')) || 0 : 0;
      const shippingCost = mapping.shipping_cost ? parseFloat(String(row[mapping.shipping_cost] || '0').replace(/[^0-9.]/g, '')) || 0 : 0;
      const packagingCost = mapping.packaging_cost ? parseFloat(String(row[mapping.packaging_cost] || '0').replace(/[^0-9.]/g, '')) || 0 : 0;
      const fees = mapping.fees ? parseFloat(String(row[mapping.fees] || '0').replace(/[^0-9.]/g, '')) || 0 : 0;
      const otherCosts = mapping.other_costs ? parseFloat(String(row[mapping.other_costs] || '0').replace(/[^0-9.]/g, '')) || 0 : 0;
      const profit = sellingPrice - purchaseCost - shippingCost - packagingCost - fees - otherCosts;

      return {
        user_id: userId,
        product_name: mapping.product_name ? String(row[mapping.product_name] || '') : undefined,
        product_brand: mapping.product_brand ? String(row[mapping.product_brand] || '') : undefined,
        product_model: mapping.product_model ? String(row[mapping.product_model] || '') : undefined,
        product_size: mapping.product_size ? String(row[mapping.product_size] || '') : undefined,
        sale_date: mapping.sale_date ? (formatDateField(row[mapping.sale_date]) || new Date().toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10),
        selling_price: sellingPrice,
        purchase_cost: purchaseCost,
        platform: (mapping.platform ? String(row[mapping.platform] || 'Other') : 'Other') as Sale['platform'],
        payment_method: (mapping.payment_method ? String(row[mapping.payment_method] || 'Cash') : 'Cash') as Sale['payment_method'],
        shipping_cost: shippingCost,
        packaging_cost: packagingCost,
        fees,
        other_costs: otherCosts,
        profit,
        notes: mapping.notes ? String(row[mapping.notes] || '') : undefined,
      };
    });
}

export function mapRowsToExpenses(
  rows: Record<string, unknown>[],
  mapping: Record<string, string>,
  userId: string
): Partial<Expense>[] {
  return rows
    .filter(row => {
      const amount = mapping.amount ? row[mapping.amount] : null;
      return amount;
    })
    .map(row => ({
      user_id: userId,
      date: mapping.date ? (formatDateField(row[mapping.date]) || new Date().toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10),
      category: (mapping.category ? String(row[mapping.category] || 'Miscellaneous') : 'Miscellaneous') as Expense['category'],
      amount: parseFloat(String(row[mapping.amount] || '0').replace(/[^0-9.]/g, '')) || 0,
      description: mapping.description ? String(row[mapping.description] || '') : undefined,
    }));
}

function formatDateField(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const str = String(value);
  // Try to parse common date formats
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return undefined;
}

export function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName = 'Sheet1'): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportInventory(products: Product[], symbol = 'R'): void {
  const data = products.map(p => ({
    SKU: p.sku || '',
    Brand: p.brand,
    Model: p.model,
    Colorway: p.colorway || '',
    Size: p.size || '',
    Gender: p.gender || '',
    Condition: p.condition || '',
    'Purchase Date': p.purchase_date || '',
    'Purchase Price': p.purchase_price,
    'Selling Price': p.selling_price,
    'Min Selling Price': p.min_selling_price || '',
    Quantity: p.quantity,
    Supplier: p.supplier || '',
    Status: p.status,
    Notes: p.notes || '',
  }));
  exportToExcel(data, 'inventory_export');
}

export function exportSales(sales: Sale[]): void {
  const data = sales.map(s => ({
    'Sale Date': s.sale_date,
    Product: s.product_name || `${s.products?.brand} ${s.products?.model}` || '',
    Brand: s.product_brand || s.products?.brand || '',
    Model: s.product_model || s.products?.model || '',
    Size: s.product_size || s.products?.size || '',
    Platform: s.platform,
    'Payment Method': s.payment_method || '',
    'Selling Price': s.selling_price,
    'Purchase Cost': s.purchase_cost,
    'Shipping Cost': s.shipping_cost,
    'Packaging Cost': s.packaging_cost,
    Fees: s.fees,
    'Other Costs': s.other_costs,
    Profit: s.profit,
    'Is Return': s.is_return ? 'Yes' : 'No',
    Notes: s.notes || '',
  }));
  exportToExcel(data, 'sales_export');
}

export function exportExpenses(expenses: Expense[]): void {
  const data = expenses.map(e => ({
    Date: e.date,
    Category: e.category,
    Amount: e.amount,
    Description: e.description || '',
  }));
  exportToExcel(data, 'expenses_export');
}
