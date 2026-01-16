import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CalendarIcon, ArrowLeft, Loader2, Plus, Trash2, Package, Calculator, FileText } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const quoteSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  validUntil: z.date().optional().nullable(),
  notes: z.string().optional(),
})

type QuoteFormValues = z.infer<typeof quoteSchema>

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface Product {
  id: string
  name: string
  price: number
  description: string | null
}

interface QuoteItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  productId: string | null
  product?: {
    id: string
    name: string
    price: number
  } | null
}

type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

interface Quote {
  id: string
  number: number
  title: string | null
  description: string | null
  validUntil: string | null
  notes: string | null
  status: QuoteStatus
  clientId: string
  client: Client
  items: QuoteItem[]
  subtotal: number
  laborCost: number
  discount: number
  total: number
  manualTotal: number | null
}

const STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'COMPLETED', label: 'Completed' },
]

const STATUS_BADGE_STYLES: Record<QuoteStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  SENT: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  APPROVED: 'bg-green-100 text-green-800 hover:bg-green-200',
  REJECTED: 'bg-red-100 text-red-800 hover:bg-red-200',
  COMPLETED: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
}

interface ProductsResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface ClientsResponse {
  clients: Client[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function QuoteFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<QuoteItem[]>([])
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [laborCost, setLaborCost] = useState<number>(0)
  const [discount, setDiscount] = useState<number>(0)
  const [manualTotal, setManualTotal] = useState<number | null>(null)
  const [useManualTotal, setUseManualTotal] = useState(false)
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('DRAFT')
  const [quoteNumber, setQuoteNumber] = useState<number | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      clientId: '',
      title: '',
      description: '',
      validUntil: null,
      notes: '',
    },
  })

  useEffect(() => {
    fetchClients()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (isEditing && id && clients.length > 0) {
      fetchQuote(id)
    }
  }, [id, isEditing, clients.length])

  const fetchClients = async () => {
    try {
      const data = await api.get<ClientsResponse>('/clients?limit=1000')
      setClients(data.clients)
      if (!isEditing) {
        setLoading(false)
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load clients')
      }
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const data = await api.get<ProductsResponse>('/products?limit=1000')
      setProducts(data.products)
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  const fetchQuote = async (quoteId: string) => {
    try {
      setLoading(true)
      const data = await api.get<{ quote: Quote }>(`/quotes/${quoteId}`)
      form.reset({
        clientId: data.quote.clientId,
        title: data.quote.title || '',
        description: data.quote.description || '',
        validUntil: data.quote.validUntil ? new Date(data.quote.validUntil) : null,
        notes: data.quote.notes || '',
      })
      // Load existing items
      if (data.quote.items && data.quote.items.length > 0) {
        setItems(data.quote.items)
      }
      // Load totals fields
      setLaborCost(data.quote.laborCost || 0)
      setDiscount(data.quote.discount || 0)
      if (data.quote.manualTotal !== null) {
        setManualTotal(data.quote.manualTotal)
        setUseManualTotal(true)
      }
      // Load status and number
      setQuoteStatus(data.quote.status || 'DRAFT')
      setQuoteNumber(data.quote.number)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load quote')
      }
    } finally {
      setLoading(false)
    }
  }

  // Currency formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Add item from product
  const addItemFromProduct = (product: Product) => {
    const newItem: QuoteItem = {
      description: product.name,
      quantity: 1,
      unitPrice: product.price,
      total: product.price,
      productId: product.id,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
      },
    }
    setItems([...items, newItem])
    setProductDialogOpen(false)
  }

  // Add manual item
  const addManualItem = () => {
    const newItem: QuoteItem = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      productId: null,
    }
    setItems([...items, newItem])
  }

  // Remove item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Update item field
  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const updatedItems = [...items]
    const item = updatedItems[index]

    if (field === 'quantity') {
      const qty = typeof value === 'string' ? parseFloat(value) || 0 : value
      item.quantity = qty
      item.total = qty * item.unitPrice
    } else if (field === 'unitPrice') {
      const price = typeof value === 'string' ? parseFloat(value) || 0 : value
      item.unitPrice = price
      item.total = item.quantity * price
    } else if (field === 'description') {
      item.description = value as string
    }

    setItems(updatedItems)
  }

  // Calculate subtotal and total
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const calculatedTotal = subtotal + laborCost - discount
  const finalTotal = useManualTotal && manualTotal !== null ? manualTotal : calculatedTotal

  // Handle status change (immediate API call)
  const handleStatusChange = async (newStatus: QuoteStatus) => {
    if (!isEditing || !id) return

    try {
      setStatusUpdating(true)
      await api.put(`/quotes/${id}/status`, { status: newStatus })
      setQuoteStatus(newStatus)
      toast.success(`Status updated to ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Failed to update status: ${err.message}`)
      } else {
        toast.error('Failed to update status')
      }
    } finally {
      setStatusUpdating(false)
    }
  }

  async function onSubmit(data: QuoteFormValues) {
    setError(null)
    setIsSubmitting(true)

    // Validate items
    if (items.length === 0) {
      setError('At least one item is required')
      setIsSubmitting(false)
      return
    }

    // Validate all items have description and quantity > 0
    for (const item of items) {
      if (!item.description.trim()) {
        setError('All items must have a description')
        setIsSubmitting(false)
        return
      }
      if (item.quantity <= 0) {
        setError('All items must have a quantity greater than 0')
        setIsSubmitting(false)
        return
      }
    }

    try {
      const payload = {
        clientId: data.clientId,
        title: data.title || null,
        description: data.description || null,
        validUntil: data.validUntil ? data.validUntil.toISOString() : null,
        notes: data.notes || null,
        laborCost,
        discount,
        manualTotal: useManualTotal ? manualTotal : null,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          productId: item.productId || undefined,
        })),
      }

      if (isEditing && id) {
        await api.put(`/quotes/${id}`, payload)
        toast.success('Quote updated successfully')
      } else {
        await api.post('/quotes', payload)
        toast.success('Quote created successfully')
      }
      navigate('/quotes')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to save quote')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/quotes">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to quotes</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? `Edit Quote #${quoteNumber}` : 'New Quote'}
            </h1>
          </div>
        </div>
        {isEditing && (
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link to={`/quotes/${id}/preview`}>
                <FileText className="h-4 w-4 mr-2" />
                PDF Preview
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select
              value={quoteStatus}
              onValueChange={(value) => handleStatusChange(value as QuoteStatus)}
              disabled={statusUpdating}
            >
              <SelectTrigger className="w-[160px]">
                {statusUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Badge className={STATUS_BADGE_STYLES[quoteStatus]} variant="secondary">
                    {STATUS_OPTIONS.find(s => s.value === quoteStatus)?.label}
                  </Badge>
                )}
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <Badge className={STATUS_BADGE_STYLES[option.value]} variant="secondary">
                      {option.label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Quote Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                            {client.email && (
                              <span className="text-muted-foreground ml-2">
                                ({client.email})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Quote title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this quote"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valid Until</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Items *</CardTitle>
                <div className="flex gap-2">
                  <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Package className="h-4 w-4 mr-2" />
                        From Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Select a Product</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-[400px] overflow-y-auto">
                        {products.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            No products available. Create products first.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {products.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => addItemFromProduct(product)}
                                className="w-full p-3 text-left border rounded-lg hover:bg-muted transition-colors"
                              >
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(product.price)}
                                  {product.description && ` - ${product.description}`}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button type="button" variant="outline" size="sm" onClick={addManualItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Manual Entry
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No items added yet.</p>
                  <p className="text-sm">Click "From Product" to add an existing product or "Manual Entry" for custom items.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead className="w-[15%]">Qty</TableHead>
                      <TableHead className="w-[20%]">Unit Price</TableHead>
                      <TableHead className="w-[15%] text-right">Total</TableHead>
                      <TableHead className="w-[10%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                            className="min-w-[200px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Subtotal:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(subtotal)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Totals Section */}
          <Card className="max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                <CardTitle>Quote Totals</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subtotal (auto-calculated, read-only) */}
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Subtotal (from items)</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              {/* Labor Cost */}
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="laborCost" className="text-muted-foreground">
                  Labor Cost
                </Label>
                <Input
                  id="laborCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={laborCost}
                  onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                  className="w-32 text-right"
                  placeholder="0.00"
                />
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="discount" className="text-muted-foreground">
                  Discount
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-32 text-right"
                  placeholder="0.00"
                />
              </div>

              {/* Divider */}
              <div className="border-t pt-4">
                {/* Calculated Total */}
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">Calculated Total</span>
                  <span className={cn(
                    "font-medium",
                    useManualTotal && "text-muted-foreground line-through"
                  )}>
                    {formatCurrency(calculatedTotal)}
                  </span>
                </div>

                {/* Manual Total Override */}
                <div className="flex items-center gap-2 py-2">
                  <Checkbox
                    id="useManualTotal"
                    checked={useManualTotal}
                    onCheckedChange={(checked) => {
                      setUseManualTotal(checked === true)
                      if (!checked) {
                        setManualTotal(null)
                      } else if (manualTotal === null) {
                        setManualTotal(calculatedTotal)
                      }
                    }}
                  />
                  <Label htmlFor="useManualTotal" className="text-sm cursor-pointer">
                    Override with manual total
                  </Label>
                </div>

                {useManualTotal && (
                  <div className="flex items-center justify-between gap-4 py-2">
                    <Label htmlFor="manualTotal" className="text-muted-foreground">
                      Manual Total
                    </Label>
                    <Input
                      id="manualTotal"
                      type="number"
                      min="0"
                      step="0.01"
                      value={manualTotal ?? 0}
                      onChange={(e) => setManualTotal(parseFloat(e.target.value) || 0)}
                      className="w-32 text-right"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Final Total */}
                <div className="flex items-center justify-between py-4 border-t mt-4">
                  <span className="text-lg font-bold">Final Total</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes for this quote"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Update Quote'
              ) : (
                'Create Quote'
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/quotes">Cancel</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
