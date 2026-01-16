import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

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
  status: QuoteStatus
  total: number
  createdAt: string
  validUntil: string | null
  client: Client
  _count: {
    items: number
  }
}

interface QuotesResponse {
  quotes: Quote[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const STATUS_OPTIONS: { value: QuoteStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos os Status' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'SENT', label: 'Enviado' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'REJECTED', label: 'Rejeitado' },
  { value: 'COMPLETED', label: 'Concluído' },
]

const STATUS_BADGE_STYLES: Record<QuoteStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-800 hover:bg-slate-100',
  SENT: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  APPROVED: 'bg-green-100 text-green-800 hover:bg-green-100',
  REJECTED: 'bg-red-100 text-red-800 hover:bg-red-100',
  COMPLETED: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  COMPLETED: 'Concluído',
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export default function QuotesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const statusFilter = searchParams.get('status') || 'ALL'

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'ALL') {
        params.set('status', statusFilter)
      }
      const queryString = params.toString()
      const url = `/quotes${queryString ? `?${queryString}` : ''}`
      const data = await api.get<QuotesResponse>(url)
      setQuotes(data.quotes)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Falha ao carregar orçamentos')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [statusFilter])

  const handleStatusFilterChange = (value: string) => {
    if (value === 'ALL') {
      searchParams.delete('status')
    } else {
      searchParams.set('status', value)
    }
    setSearchParams(searchParams)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) {
      return
    }

    try {
      setDeleting(id)
      await api.delete(`/quotes/${id}`)
      setQuotes(quotes.filter((q) => q.id !== id))
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Failed to delete quote: ${err.message}`)
      } else {
        alert('Failed to delete quote')
      }
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchQuotes}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Orçamentos</h1>
        <Button asChild>
          <Link to="/quotes/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Todos os Orçamentos</CardTitle>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum orçamento encontrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">#{quote.number}</TableCell>
                    <TableCell>{quote.client.name}</TableCell>
                    <TableCell>{dateFormatter.format(new Date(quote.createdAt))}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE_STYLES[quote.status]} variant="secondary">
                        {STATUS_LABELS[quote.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{currencyFormatter.format(quote.total)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/quotes/${quote.id}`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(quote.id)}
                          disabled={deleting === quote.id}
                        >
                          {deleting === quote.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Excluir</span>
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
    </div>
  )
}
