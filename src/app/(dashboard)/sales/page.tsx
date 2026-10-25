"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Download, Edit, Trash2, ShoppingCart, X, RefreshCw, PackageSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, calculateProfit } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Sale, Product, Customer } from "@/types"

const PLATFORMS = ['In-store', 'Instagram', 'WhatsApp', 'Website', 'Marketplace', 'Other']
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'PayPal', 'Card', 'Crypto', 'Other']

const emptyForm = {
  product_id: '', customer_id: '',
  sale_date: new Date().toISOString().slice(0, 10),
  selling_price: 0, purchase_cost: 0,
  platform: 'In-store', payment_method: 'Cash',
  shipping_cost: 0, packaging_cost: 0, fees: 0, other_costs: 0,
  is_return: false, notes: '',
  // read-only display fields (populated from selected product)
  product_name: '', product_brand: '', product_model: '', product_size: '',
}

function SalesPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [sales, setSales] = useState<Sale[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const fetchSales = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ search, platform: platformFilter, date_from: dateFrom, date_to: dateTo, page: String(page), limit: '20' })
    const res = await fetch(`/api/sales?${params}`)
    const json = await res.json()
    setSales(json.data || [])
    setTotal(json.count || 0)
    setLoading(false)
  }, [search, platformFilter, dateFrom, dateTo, page])

  useEffect(() => { fetchSales() }, [fetchSales])

  const fetchProductsAndCustomers = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([
      fetch('/api/inventory?status=In Stock&limit=200'),
      fetch('/api/customers?limit=200'),
    ])
    const [pJson, cJson] = await Promise.all([pRes.json(), cRes.json()])
    setProducts(pJson.data || [])
    setCustomers(cJson.data || [])
    return pJson.data || []
  }, [])

  // Auto-open dialog when ?product=<id> is in URL
  useEffect(() => {
    const productId = searchParams.get('product')
    if (!productId) return

    fetchProductsAndCustomers().then((loadedProducts: Product[]) => {
      const product = loadedProducts.find((p: Product) => p.id === productId)
      if (product) {
        applyProduct(product)
        setDialogOpen(true)
      } else {
        toast({ variant: "destructive", title: "Product not found or not in stock" })
      }
      // Clear the URL param without navigation
      router.replace('/sales', { scroll: false })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyProduct = (product: Product) => {
    setSelectedProduct(product)
    setFormData(f => ({
      ...f,
      product_id: product.id,
      product_name: `${product.brand} ${product.model}${product.colorway ? ` ${product.colorway}` : ''}`,
      product_brand: product.brand || '',
      product_model: product.model || '',
      product_size: product.size || '',
      purchase_cost: product.purchase_price || 0,
      selling_price: product.selling_price || 0,
    }))
  }

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) applyProduct(product)
  }

  const openEdit = (sale: Sale) => {
    setEditingSale(sale)
    setSelectedProduct(null)
    setFormData({
      product_id: sale.product_id || '',
      customer_id: sale.customer_id || '',
      product_name: sale.product_name || '',
      product_brand: sale.product_brand || '',
      product_model: sale.product_model || '',
      product_size: sale.product_size || '',
      sale_date: sale.sale_date,
      selling_price: sale.selling_price,
      purchase_cost: sale.purchase_cost,
      platform: sale.platform,
      payment_method: sale.payment_method || 'Cash',
      shipping_cost: sale.shipping_cost,
      packaging_cost: sale.packaging_cost,
      fees: sale.fees,
      other_costs: sale.other_costs,
      is_return: sale.is_return,
      notes: sale.notes || '',
    })
    fetchProductsAndCustomers()
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.product_id) {
      toast({ variant: "destructive", title: "Select an inventory item", description: "Sales must be linked to an item in your inventory." })
      return
    }
    if (!formData.selling_price) {
      toast({ variant: "destructive", title: "Selling price is required" })
      return
    }
    setSaving(true)
    const url = editingSale ? `/api/sales/${editingSale.id}` : '/api/sales'
    const method = editingSale ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
    const json = await res.json()
    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: json.error })
    } else {
      toast({ title: editingSale ? "Sale updated!" : "Sale recorded!" })
      setDialogOpen(false)
      fetchSales()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sale? Stock will be restored.')) return
    const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: "Sale deleted" }); fetchSales() }
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingSale(null)
      setSelectedProduct(null)
      setFormData({ ...emptyForm, sale_date: new Date().toISOString().slice(0, 10) })
    }
    setDialogOpen(open)
  }

  const estimatedProfit = calculateProfit(
    formData.selling_price, formData.purchase_cost,
    formData.shipping_cost, formData.packaging_cost, formData.other_costs, formData.fees
  )

  const totalRevenue = sales.reduce((s, sale) => s + Number(sale.selling_price), 0)
  const totalProfit = sales.reduce((s, sale) => s + Number(sale.profit), 0)
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-muted-foreground">{total} sales total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open('/api/export?type=sales', '_blank')}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
          <Button variant="brand" size="sm" onClick={() => router.push('/inventory')}>
            <PackageSearch className="h-4 w-4 mr-2" />Go to Inventory to Sell
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-brand-500/30 bg-brand-500/5 px-4 py-3 text-sm text-muted-foreground">
        <ShoppingCart className="h-4 w-4 mt-0.5 text-brand-400 shrink-0" />
        <span>To record a sale, go to <button onClick={() => router.push('/inventory')} className="text-brand-400 hover:underline font-medium">Inventory</button> and click the <strong className="text-foreground">Sell</strong> button on an In Stock item.</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-foreground' },
          { label: 'Total Profit', value: formatCurrency(totalProfit), color: totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Avg Profit/Sale', value: sales.length > 0 ? formatCurrency(totalProfit / sales.length) : 'R0.00', color: 'text-brand-400' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search product, brand..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={platformFilter} onValueChange={v => { setPlatformFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Platform" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="w-36" placeholder="From" />
            <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="w-36" placeholder="To" />
            {(search || platformFilter || dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setPlatformFilter(''); setDateFrom(''); setDateTo(''); setPage(1) }}>
                <X className="h-4 w-4 mr-1" />Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sales.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 opacity-30" />
              <p className="font-medium">No sales yet</p>
              <p className="text-xs text-center max-w-xs">Go to Inventory and click <strong>Sell</strong> on an In Stock item to record your first sale.</p>
              <Button variant="brand" size="sm" onClick={() => router.push('/inventory')} className="mt-2">
                <PackageSearch className="h-4 w-4 mr-2" />View Inventory
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Platform</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Margin</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map(sale => {
                  const margin = sale.selling_price > 0 ? (sale.profit / sale.selling_price * 100).toFixed(0) : '0'
                  return (
                    <TableRow key={sale.id} className={sale.is_return ? 'opacity-60' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{sale.product_name || 'Unknown Product'}</p>
                          <p className="text-xs text-muted-foreground">
                            {sale.product_size ? `Size ${sale.product_size} · ` : ''}{sale.payment_method}
                            {sale.is_return && <Badge variant="error" className="ml-1 text-xs">Return</Badge>}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{formatDate(sale.sale_date)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm">{sale.platform}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(sale.selling_price)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-semibold ${Number(sale.profit) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {Number(sale.profit) >= 0 ? '+' : ''}{formatCurrency(sale.profit)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right text-sm">
                        <span className={Number(margin) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{margin}%</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(sale)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(sale.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Sale Dialog — only opened from inventory or edit */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSale ? 'Edit Sale' : 'Record Sale from Inventory'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">

            {/* Inventory item selector — required */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>
                Inventory Item <span className="text-destructive">*</span>
              </Label>
              {editingSale ? (
                // When editing, allow changing the linked inventory item
                <Select value={formData.product_id} onValueChange={handleProductSelect}>
                  <SelectTrigger><SelectValue placeholder="Select inventory item..." /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.brand} {p.model} {p.colorway ? `(${p.colorway})` : ''} — Size {p.size || '?'} — Cost {formatCurrency(p.purchase_price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                // New sale — item was pre-selected from inventory
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  {formData.product_name ? (
                    <span className="font-medium">{formData.product_name}{formData.product_size ? ` — Size ${formData.product_size}` : ''}</span>
                  ) : (
                    <span className="text-muted-foreground">No item selected — go to Inventory and click Sell</span>
                  )}
                </div>
              )}
            </div>

            {/* Product details (read-only, auto-filled) */}
            {formData.product_name && (
              <div className="sm:col-span-2 grid grid-cols-3 gap-2 rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-2 text-sm">
                <div><span className="text-muted-foreground text-xs">Brand</span><p className="font-medium">{formData.product_brand || '—'}</p></div>
                <div><span className="text-muted-foreground text-xs">Model</span><p className="font-medium">{formData.product_model || '—'}</p></div>
                <div><span className="text-muted-foreground text-xs">Size</span><p className="font-medium">{formData.product_size || '—'}</p></div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Sale Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={formData.sale_date} onChange={e => setFormData(f => ({ ...f, sale_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Selling Price (R) <span className="text-destructive">*</span></Label>
              <Input type="number" step="0.01" min="0" value={formData.selling_price || ''} onChange={e => setFormData(f => ({ ...f, selling_price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Purchase Cost (R)</Label>
              <Input type="number" step="0.01" min="0" value={formData.purchase_cost || ''} onChange={e => setFormData(f => ({ ...f, purchase_cost: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={formData.platform} onValueChange={v => setFormData(f => ({ ...f, platform: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={formData.payment_method} onValueChange={v => setFormData(f => ({ ...f, payment_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select value={formData.customer_id} onValueChange={v => setFormData(f => ({ ...f, customer_id: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No customer</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Shipping Cost (R)</Label>
              <Input type="number" step="0.01" min="0" value={formData.shipping_cost || ''} onChange={e => setFormData(f => ({ ...f, shipping_cost: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Packaging Cost (R)</Label>
              <Input type="number" step="0.01" min="0" value={formData.packaging_cost || ''} onChange={e => setFormData(f => ({ ...f, packaging_cost: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Platform Fees (R)</Label>
              <Input type="number" step="0.01" min="0" value={formData.fees || ''} onChange={e => setFormData(f => ({ ...f, fees: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Other Costs (R)</Label>
              <Input type="number" step="0.01" min="0" value={formData.other_costs || ''} onChange={e => setFormData(f => ({ ...f, other_costs: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Input placeholder="Additional notes..." value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>

          {/* Profit preview */}
          <div className={`flex flex-wrap gap-4 p-3 rounded-lg border text-sm ${estimatedProfit >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div><span className="text-muted-foreground">Revenue: </span><span className="font-semibold">{formatCurrency(formData.selling_price)}</span></div>
            <div><span className="text-muted-foreground">Total Costs: </span><span className="font-semibold">{formatCurrency(formData.purchase_cost + formData.shipping_cost + formData.packaging_cost + formData.fees + formData.other_costs)}</span></div>
            <div><span className="text-muted-foreground">Net Profit: </span><span className={`font-bold ${estimatedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{estimatedProfit >= 0 ? '+' : ''}{formatCurrency(estimatedProfit)}</span></div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
            <Button variant="brand" onClick={handleSave} disabled={saving || !formData.product_id}>
              {saving ? 'Saving...' : (editingSale ? 'Update Sale' : 'Record Sale')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SalesPage() {
  return (
    <Suspense>
      <SalesPageInner />
    </Suspense>
  )
}
