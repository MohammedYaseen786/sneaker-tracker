"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Edit, Trash2, Users, RefreshCw, X, Mail, Phone, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Customer } from "@/types"

const emptyForm = { name: '', phone: '', email: '', address: '', instagram: '', notes: '' }

export default function CustomersPage() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [detailCustomer, setDetailCustomer] = useState<(Customer & { sales: unknown[] }) | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ search, page: String(page), limit: '20' })
    const res = await fetch(`/api/customers?${params}`)
    const json = await res.json()
    setCustomers(json.data || [])
    setTotal(json.count || 0)
    setLoading(false)
  }, [search, page])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const openAdd = () => {
    setEditingCustomer(null)
    setFormData({ ...emptyForm })
    setDialogOpen(true)
  }

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({ name: customer.name, phone: customer.phone || '', email: customer.email || '', address: customer.address || '', instagram: customer.instagram || '', notes: customer.notes || '' })
    setDialogOpen(true)
  }

  const openDetail = async (customerId: string) => {
    const res = await fetch(`/api/customers/${customerId}`)
    const json = await res.json()
    setDetailCustomer(json.data)
    setDetailOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name) { toast({ variant: "destructive", title: "Name is required" }); return }
    setSaving(true)
    const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
    const method = editingCustomer ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
    const json = await res.json()
    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: json.error })
    } else {
      toast({ title: editingCustomer ? "Customer updated!" : "Customer added!" })
      setDialogOpen(false)
      fetchCustomers()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: "Customer deleted" }); fetchCustomers() }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">{total} customers total</p>
        </div>
        <Button variant="brand" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />Add Customer
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, phone, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            {search && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setPage(1) }}>
                <X className="h-4 w-4" />
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
          ) : customers.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Users className="h-10 w-10 opacity-30" />
              <p className="font-medium">No customers found</p>
              <Button variant="brand" size="sm" onClick={openAdd} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />Add Customer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Purchases</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Purchase</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(customer => (
                  <TableRow key={customer.id} className="cursor-pointer" onClick={() => openDetail(customer.id)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 font-semibold text-sm">
                          {customer.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{customer.name}</p>
                          {customer.instagram && <p className="text-xs text-muted-foreground">{customer.instagram}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-0.5">
                        {customer.phone && <p className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</p>}
                        {customer.email && <p className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" />{customer.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm hidden sm:table-cell">{customer.total_purchases || 0}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{formatCurrency(customer.total_spent || 0)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{customer.last_purchase_date ? formatDate(customer.last_purchase_date) : 'Never'}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(customer)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(customer.id, customer.name)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="Full name" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+1 555 0000" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Instagram Handle</Label>
              <Input placeholder="@username" value={formData.instagram} onChange={e => setFormData(f => ({ ...f, instagram: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="Delivery address" value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input placeholder="Any notes about this customer" value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="brand" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (editingCustomer ? 'Update' : 'Add Customer')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
          </DialogHeader>
          {detailCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 text-2xl font-bold">
                  {detailCustomer.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{detailCustomer.name}</h3>
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    {detailCustomer.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{detailCustomer.phone}</span>}
                    {detailCustomer.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{detailCustomer.email}</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Purchases', value: detailCustomer.total_purchases || 0 },
                  { label: 'Total Spent', value: formatCurrency(detailCustomer.total_spent || 0) },
                  { label: 'Last Purchase', value: detailCustomer.last_purchase_date ? formatDate(detailCustomer.last_purchase_date) : 'Never' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {detailCustomer.notes && (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">{detailCustomer.notes}</p>
              )}
              <div>
                <h4 className="font-medium mb-2 text-sm">Purchase History ({(detailCustomer.sales || []).length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(detailCustomer.sales as Array<{ id: string; product_name: string; selling_price: number; sale_date: string; platform: string }>).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No purchases yet</p>
                  ) : (
                    (detailCustomer.sales as Array<{ id: string; product_name: string; selling_price: number; sale_date: string; platform: string }>).map(s => (
                      <div key={s.id} className="flex justify-between text-sm p-2 rounded bg-muted">
                        <span className="truncate">{s.product_name || 'Product'}</span>
                        <span className="font-semibold ml-2">{formatCurrency(s.selling_price)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
