"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Download, Edit, Trash2, Receipt, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Expense } from "@/types"

const CATEGORIES = ['Rent', 'Ads', 'Packaging', 'Fuel', 'Staff', 'Miscellaneous', 'Returns', 'Other']
const CATEGORY_COLORS: Record<string, string> = {
  Rent: 'bg-blue-500/20 text-blue-400',
  Ads: 'bg-brand-500/20 text-brand-400',
  Packaging: 'bg-amber-500/20 text-amber-400',
  Fuel: 'bg-orange-500/20 text-orange-400',
  Staff: 'bg-green-500/20 text-green-400',
  Returns: 'bg-red-500/20 text-red-400',
  Miscellaneous: 'bg-gray-500/20 text-gray-400',
  Other: 'bg-gray-500/20 text-gray-400',
}

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  category: 'Miscellaneous',
  amount: 0,
  description: '',
}

export default function ExpensesPage() {
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ category: categoryFilter, date_from: dateFrom, date_to: dateTo, page: String(page), limit: '20' })
    const res = await fetch(`/api/expenses?${params}`)
    const json = await res.json()
    setExpenses(json.data || [])
    setTotal(json.count || 0)
    setLoading(false)
  }, [categoryFilter, dateFrom, dateTo, page])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const openAdd = () => {
    setEditingExpense(null)
    setFormData({ ...emptyForm, date: new Date().toISOString().slice(0, 10) })
    setDialogOpen(true)
  }

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({ date: expense.date, category: expense.category, amount: expense.amount, description: expense.description || '' })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.amount || formData.amount <= 0) {
      toast({ variant: "destructive", title: "Amount is required" })
      return
    }
    setSaving(true)
    const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'
    const method = editingExpense ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
    const json = await res.json()
    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: json.error })
    } else {
      toast({ title: editingExpense ? "Expense updated!" : "Expense added!" })
      setDialogOpen(false)
      fetchExpenses()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: "Expense deleted" }); fetchExpenses() }
  }

  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount), 0)

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
    return acc
  }, {} as Record<string, number>)

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">{total} expenses total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open('/api/export?type=expenses', '_blank')}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
          <Button variant="brand" size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />Add Expense
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Shown</p>
            <p className="text-xl font-bold mt-1 text-red-400">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        {Object.entries(byCategory).slice(0, 3).map(([cat, amt]) => (
          <Card key={cat}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{cat}</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(amt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="w-36" />
            <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="w-36" />
            {(categoryFilter || dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setCategoryFilter(''); setDateFrom(''); setDateTo(''); setPage(1) }}>
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
          ) : expenses.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Receipt className="h-10 w-10 opacity-30" />
              <p className="font-medium">No expenses found</p>
              <Button variant="brand" size="sm" onClick={openAdd} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />Add Expense
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-sm">{formatDate(expense.date)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[expense.category] || 'bg-gray-500/20 text-gray-400'}`}>
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{expense.description || '-'}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-red-400">-{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(expense)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(expense.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Amount (R) *</Label>
                <Input type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={v => setFormData(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="What was this expense for?" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="brand" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (editingExpense ? 'Update' : 'Add Expense')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
