"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"

type ImportType = 'inventory' | 'sales' | 'expenses'

const FIELD_MAPPINGS: Record<ImportType, Array<{ key: string; label: string; required?: boolean }>> = {
  inventory: [
    { key: 'brand', label: 'Brand', required: true },
    { key: 'model', label: 'Model', required: true },
    { key: 'colorway', label: 'Colorway' },
    { key: 'sku', label: 'SKU' },
    { key: 'size', label: 'Size' },
    { key: 'gender', label: 'Gender' },
    { key: 'condition', label: 'Condition' },
    { key: 'purchase_price', label: 'Purchase Price' },
    { key: 'selling_price', label: 'Selling Price' },
    { key: 'min_selling_price', label: 'Min Selling Price' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'purchase_date', label: 'Purchase Date' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Notes' },
  ],
  sales: [
    { key: 'product_name', label: 'Product Name' },
    { key: 'product_brand', label: 'Brand' },
    { key: 'product_model', label: 'Model' },
    { key: 'product_size', label: 'Size' },
    { key: 'selling_price', label: 'Selling Price', required: true },
    { key: 'purchase_cost', label: 'Purchase Cost' },
    { key: 'sale_date', label: 'Sale Date' },
    { key: 'platform', label: 'Platform' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'shipping_cost', label: 'Shipping Cost' },
    { key: 'packaging_cost', label: 'Packaging Cost' },
    { key: 'fees', label: 'Fees' },
    { key: 'other_costs', label: 'Other Costs' },
    { key: 'notes', label: 'Notes' },
  ],
  expenses: [
    { key: 'date', label: 'Date' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', required: true },
    { key: 'description', label: 'Description' },
  ],
}

interface ParsedFile {
  headers: string[]
  preview: Record<string, unknown>[]
  total_rows: number
  filename: string
  raw_data?: Record<string, unknown>[]
}

interface ImportHistory {
  id: string
  filename: string
  import_type: string
  records_imported: number
  records_failed: number
  status: string
  created_at: string
}

export default function ImportPage() {
  const { toast } = useToast()
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'result'>('upload')
  const [importType, setImportType] = useState<ImportType>('inventory')
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [fileData, setFileData] = useState<Record<string, unknown>[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; failed: number; errors: string[] } | null>(null)
  const [history, setHistory] = useState<ImportHistory[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const loadHistory = async () => {
    const res = await fetch('/api/import')
    const json = await res.json()
    setHistory(json.data || [])
    setHistoryLoaded(true)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import?action=parse', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        toast({ variant: "destructive", title: "Parse failed", description: json.error })
        return
      }

      // Also fetch all rows for actual import
      // We'll need to re-read the file for import — store preview data
      const reader = new FileReader()
      reader.onload = async (e) => {
        // Parse again to get all rows
        const buffer = e.target?.result as ArrayBuffer
        const { parseExcelFile } = await import('@/lib/excel')
        const { rows } = parseExcelFile(buffer)
        setFileData(rows)
      }
      reader.readAsArrayBuffer(file)

      setParsedFile({ ...json })
      setStep('map')
    } catch (err) {
      toast({ variant: "destructive", title: "Error reading file" })
    }
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  })

  const handleImport = async () => {
    const requiredFields = FIELD_MAPPINGS[importType].filter(f => f.required)
    for (const field of requiredFields) {
      if (!mapping[field.key]) {
        toast({ variant: "destructive", title: `Please map the required field: ${field.label}` })
        return
      }
    }

    setImporting(true)
    try {
      const res = await fetch('/api/import?action=import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: fileData,
          mapping,
          import_type: importType,
          filename: parsedFile?.filename,
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        toast({ variant: "destructive", title: "Import failed", description: json.error })
      } else {
        setResult(json)
        setStep('result')
        toast({ title: `Import complete! ${json.imported} records imported.` })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Import error" })
    }
    setImporting(false)
  }

  const reset = () => {
    setStep('upload')
    setParsedFile(null)
    setMapping({})
    setFileData([])
    setResult(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import / Export</h1>
        <p className="text-muted-foreground">Import data from Excel or CSV files</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['upload', 'map', 'preview', 'result'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step === s ? 'bg-brand-600 text-white' :
              ['upload', 'map', 'preview', 'result'].indexOf(step) > i ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'
            }`}>
              {['upload', 'map', 'preview', 'result'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className={step === s ? 'font-medium' : 'text-muted-foreground capitalize'}>{s}</span>
            {i < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload File</CardTitle>
                <CardDescription>Supported formats: .xlsx, .xls, .csv</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Import Type</Label>
                  <Select value={importType} onValueChange={(v) => setImportType(v as ImportType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inventory">Inventory / Products</SelectItem>
                      <SelectItem value="sales">Sales History</SelectItem>
                      <SelectItem value="expenses">Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-brand-500 bg-brand-500/5' : 'border-border hover:border-brand-500/50 hover:bg-accent/30'
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-base font-medium mb-1">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop your file here'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <Button variant="outline" size="sm" type="button">Browse File</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expected Columns</CardTitle>
                <CardDescription>For {importType} import</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {FIELD_MAPPINGS[importType].map(f => (
                    <div key={f.key} className="flex items-center gap-2 text-sm">
                      <div className={`h-1.5 w-1.5 rounded-full ${f.required ? 'bg-brand-400' : 'bg-muted-foreground'}`} />
                      <span>{f.label}</span>
                      {f.required && <Badge variant="info" className="text-[10px] py-0 px-1.5">Required</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Import History</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadHistory}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                {!historyLoaded ? (
                  <Button variant="ghost" size="sm" onClick={loadHistory} className="w-full">Load History</Button>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">No imports yet</p>
                ) : (
                  <div className="space-y-2">
                    {history.slice(0, 5).map(h => (
                      <div key={h.id} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium truncate">{h.filename}</p>
                          <p className="text-muted-foreground">{h.records_imported} imported · {formatDate(h.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === 'map' && parsedFile && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>
              File: <strong>{parsedFile.filename}</strong> · {parsedFile.total_rows} rows detected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_MAPPINGS[importType].map(field => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    {field.label}
                    {field.required && <span className="text-brand-400 text-xs">*</span>}
                  </Label>
                  <Select
                    value={mapping[field.key] || 'none'}
                    onValueChange={v => setMapping(m => ({ ...m, [field.key]: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Skip —</SelectItem>
                      {parsedFile.headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div>
              <h4 className="text-sm font-medium mb-2">Data Preview (first 5 rows)</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {parsedFile.headers.map(h => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedFile.preview.map((row, i) => (
                      <TableRow key={i}>
                        {parsedFile.headers.map(h => (
                          <TableCell key={h} className="text-xs whitespace-nowrap max-w-32 truncate">
                            {String(row[h] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button variant="brand" onClick={handleImport} disabled={importing}>
                {importing ? (
                  <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Importing...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Import {parsedFile.total_rows} Rows</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {step === 'result' && result && (
        <Card>
          <CardContent className="p-8 text-center">
            {result.failed === 0 ? (
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            ) : (
              <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            )}
            <h2 className="text-xl font-bold mb-2">Import Complete!</h2>
            <div className="flex justify-center gap-6 mb-4">
              <div>
                <p className="text-3xl font-bold text-emerald-400">{result.imported}</p>
                <p className="text-sm text-muted-foreground">Records Imported</p>
              </div>
              {result.failed > 0 && (
                <div>
                  <p className="text-3xl font-bold text-red-400">{result.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="text-left bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-red-400 mb-2">Errors:</p>
                {result.errors.map((e, i) => <p key={i} className="text-xs text-muted-foreground">{e}</p>)}
              </div>
            )}
            <Button variant="brand" onClick={reset}>Import Another File</Button>
          </CardContent>
        </Card>
      )}

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download your data as Excel files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { type: 'inventory', label: 'Export Inventory', desc: 'All products and stock' },
              { type: 'sales', label: 'Export Sales', desc: 'Complete sales history' },
              { type: 'expenses', label: 'Export Expenses', desc: 'All business expenses' },
            ].map(({ type, label, desc }) => (
              <button
                key={type}
                onClick={() => window.open(`/api/export?type=${type}`, '_blank')}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent transition-colors text-left"
              >
                <FileSpreadsheet className="h-8 w-8 text-brand-400 shrink-0" />
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
