import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CalendarIcon, ArrowLeft, Loader2 } from 'lucide-react'
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

interface Quote {
  id: string
  number: number
  title: string | null
  description: string | null
  validUntil: string | null
  notes: string | null
  clientId: string
  client: Client
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

  async function onSubmit(data: QuoteFormValues) {
    setError(null)
    setIsSubmitting(true)

    try {
      const payload = {
        clientId: data.clientId,
        title: data.title || null,
        description: data.description || null,
        validUntil: data.validUntil ? data.validUntil.toISOString() : null,
        notes: data.notes || null,
        // Items will be added in US-030, for now send a placeholder item
        ...(isEditing ? {} : { items: [{ description: 'Item placeholder', quantity: 1, unitPrice: 0 }] }),
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
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/quotes">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to quotes</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Edit Quote' : 'New Quote'}
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Quote Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

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

              <div className="flex gap-4 pt-4">
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
        </CardContent>
      </Card>
    </div>
  )
}
