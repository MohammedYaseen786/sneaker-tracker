"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Download, Upload, Edit, Trash2, Package, X, RefreshCw, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Product } from "@/types"
import Link from "next/link"

const BRANDS = ['Nike', 'Adidas', 'Jordan', 'New Balance', 'Puma', 'Reebok', 'Converse', 'Vans', 'Yeezy', 'Other']
const CONDITIONS = ['New', 'Used - Like New', 'Used - Good', 'Used - Fair']
const STATUSES = ['In Stock', 'Sold', 'Reserved', 'Returned']
const GENDERS = ['Men', 'Women', 'Grade School', 'Toddler', 'Infant', 'Unisex']

const emptyProduct = {
  sku: '', brand: '', model: '', colorway: '', size: '', gender: 'Unisex',
  condition: 'New', purchase_date: '', purchase_price: 0, selling_price: 0,
  min_selling_price: 0, quantity: 1, supplier: '', status: 'In Stock', notes: '',
}

export default function InventoryPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null)
  const [formData, setFormData] = useState(emptyProduct)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      search, status: statusFilter, brand: brandFilter,
      sort_by: sortBy, sort_order: sortOrder, page: String(page), limit: '20'
    })
    const res = await fetch(`/api/inventory?${params}`)
    const json = await res.json()
    setProducts(json.data || [])
    setTotal(json.count || 0)
    setLoading(false)
  }, [search, statusFilter, brandFilter, sortBy, sortOrder, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const openAdd = () => {
    setEditingProduct(null)
    setFormData({ ...emptyProduct })
    setImageFile(null)
    setDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      sku: product.sku || '', brand: product.brand, model: product.model,
      colorway: product.colorway || '', size: product.size || '', gender: product.gender || 'Unisex',
      condition: product.condition || 'New', purchase_date: product.purchase_date || '',
      purchase_price: product.purchase_price, selling_price: product.selling_price,
      min_selling_price: product.min_selling_price || 0, quantity: product.quantity,
      supplier: product.supplier || '', status: product.status, notes: product.notes || '',
    })
    setDialogOpen(true)
  }

  // Navigate to sales page with this product pre-selected
  const handleSell = (product: Product) => {
    router.push(`/sales?product=${product.id}`)
  }

  const handleSave = async () => {
    if (!formData.brand || !formData.model) {
      toast({ variant: "destructive", title: "Brand and Model are required" })
      return
    }
    setSaving(true)

    let imageUrl: string | undefined
    if (imageFile) {
      const fd = new FormData()
      fd.append('file', imageFile)
      const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
      const upJson = await upRes.json()
      if (upJson.url) imageUrl = upJson.url
    }

    const body = { ...formData, ...(imageUrl ? { image_url: imageUrl } : {}) }
    const url = editingProduct ? `/api/inventory/${editingProduct.id}` : '/api/inventory'
    const method = editingProduct ? 'PUT' : 'POST'

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()

    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: json.error })
    } else {
      toast({ title: editingProduct ? "Product updated!" : "Product added!" })
      setDialogOpen(false)
      fetchProducts()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: "Product deleted" })
      fetchProducts()
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">{total} products total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => window.open('/api/export?type=inventory', '_blank')}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
          <Link href="/import">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />Import
            </Button>
          </Link>
          <Button variant="brand" size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search brand, model, SKU..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={v => { setBrandFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Brand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Added</SelectItem>
                <SelectItem value="brand">Brand</SelectItem>
                <SelectItem value="purchase_price">Cost</SelectItem>
                <SelectItem value="selling_price">Price</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
            {(search || statusFilter || brandFilter) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setBrandFilter(''); setPage(1) }}>
                <X className="h-4 w-4 mr-1" />Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Package className="h-10 w-10 opacity-30" />
              <p className="font-medium">No products found</p>
              <Button variant="brand" size="sm" onClick={openAdd} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />Add Product
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Qty</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Margin</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => {
                  const margin = product.selling_price > 0
                    ? ((product.selling_price - product.purchase_price) / product.selling_price * 100).toFixed(0)
                    : '0'
                  const canSell = product.status === 'In Stock' && product.quantity > 0
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="h-9 w-9 rounded-lg object-cover bg-muted" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg">👟</div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{product.brand} {product.model}</p>
                            <p className="text-xs text-muted-foreground">{product.colorway || product.sku || '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{product.size || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(product.purchase_price)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(product.selling_price)}</TableCell>
                      <TableCell className="text-right text-sm hidden sm:table-cell">{product.quantity}</TableCell>
                      <TableCell className="text-right text-sm hidden lg:table-cell">
                        <span className={Number(margin) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{margin}%</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {canSell && (
                            <Button
                              variant="brand"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleSell(product)}
                            >
                              <ShoppingCart className="h-3.5 w-3.5 mr-1" />Sell
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(product.id, `${product.brand} ${product.model}`)}>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Brand *</Label>
              <Select value={formData.brand} onValueChange={v => setFormData(f => ({ ...f, brand: v }))}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>{BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Model *</Label>
              <Input placeholder="e.g. Air Jordan 1 Retro High" value={formData.model} onChange={e => setFormData(f => ({ ...f, model: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Colorway</Label>
              <Input placeholder="e.g. Chicago" value={formData.colorway} onChange={e => setFormData(f => ({ ...f, colorway: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input placeholder="e.g. NK-AJ1-001" value={formData.sku} onChange={e => setFormData(f => ({ ...f, sku: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Input placeholder="e.g. 10, 10.5" value={formData.size} onChange={e => setFormData(f => ({ ...f, size: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={formData.gender} onValueChange={v => setFormData(f => ({ ...f, gender: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={formData.condition} onValueChange={v => setFormData(f => ({ ...f, condition: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Purchase Date</Label>
              <Input type="date" value={formData.purchase_date} onChange={e => setFormData(f => ({ ...f, purchase_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" min="0" value={formData.quantity} onChange={e => setFormData(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Purchase Price (R)</Label>
              <Input type="number" step="0.01" min="0" value={formData.purchase_price} onChange={e => setFormData(f => ({ ...f, purchase_price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Selling Price (R)</Label>
              <Input type="number" step="0.01" min="0" value={formData.selling_price} onChange={e => setFormData(f => ({ ...f, selling_price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Min Selling Price (R)</Label>
              <Input type="number" step="0.01" min="0" value={formData.min_selling_price} onChange={e => setFormData(f => ({ ...f, min_selling_price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Input placeholder="e.g. SNKRS App" value={formData.supplier} onChange={e => setFormData(f => ({ ...f, supplier: e.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Input placeholder="Any additional notes..." value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Product Image</Label>
              <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="cursor-pointer" />
            </div>
          </div>

          {formData.purchase_price > 0 && formData.selling_price > 0 && (
            <div className="flex gap-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-sm">
              <div><span className="text-muted-foreground">Est. Profit: </span><span className="font-semibold text-emerald-400">{formatCurrency(formData.selling_price - formData.purchase_price)}</span></div>
              <div><span className="text-muted-foreground">Margin: </span><span className="font-semibold text-emerald-400">{formData.selling_price > 0 ? ((formData.selling_price - formData.purchase_price) / formData.selling_price * 100).toFixed(1) : 0}%</span></div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="brand" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (editingProduct ? 'Update' : 'Add Product')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
