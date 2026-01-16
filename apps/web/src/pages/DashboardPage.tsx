import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Package,
  Boxes,
  FileText,
  Clock,
  CheckCircle,
  Plus,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

interface Metrics {
  totalClients: number
  totalProducts: number
  totalMaterials: number
  pendingQuotes: number
  approvedQuotes: number
}

interface RecentQuote {
  id: string
  number: number
  title: string | null
  status: QuoteStatus
  total: number
  createdAt: string
  client: {
    id: string
    name: string
  }
}

interface LowStockProduct {
  id: string
  name: string
  quantity: number
  minStock: number
}

interface LowStockMaterial {
  id: string
  name: string
  quantity: number
  minStock: number
  unit: string
}

interface LowStockData {
  products: LowStockProduct[]
  materials: LowStockMaterial[]
  hasLowStock: boolean
}

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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[]>([])
  const [lowStock, setLowStock] = useState<LowStockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [metricsData, quotesData, lowStockData] = await Promise.all([
          api.get<{ metrics: Metrics }>('/dashboard/metrics'),
          api.get<{ quotes: RecentQuote[] }>('/dashboard/recent-quotes'),
          api.get<LowStockData>('/dashboard/low-stock'),
        ])
        setMetrics(metricsData.metrics)
        setRecentQuotes(quotesData.quotes)
        setLowStock(lowStockData)
        setError(null)
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Falha ao carregar dados do painel')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Painel</h1>

      {/* Low Stock Alerts */}
      {lowStock?.hasLowStock && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800">Alertas de Estoque Baixo</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              Os seguintes itens estão abaixo dos níveis mínimos de estoque
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowStock.products.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-2">Produtos</h4>
                <div className="space-y-2">
                  {lowStock.products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between text-sm">
                      <Link
                        to={`/products/${product.id}`}
                        className="text-amber-900 hover:underline"
                      >
                        {product.name}
                      </Link>
                      <span className="text-amber-700">
                        {product.quantity} / {product.minStock} unidades
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="p-0 h-auto mt-2 text-amber-800" asChild>
                  <Link to="/products?lowStock=true">Ver todos os produtos com estoque baixo →</Link>
                </Button>
              </div>
            )}
            {lowStock.materials.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-2">Materiais</h4>
                <div className="space-y-2">
                  {lowStock.materials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between text-sm">
                      <Link
                        to={`/materials/${material.id}`}
                        className="text-amber-900 hover:underline"
                      >
                        {material.name}
                      </Link>
                      <span className="text-amber-700">
                        {material.quantity} / {material.minStock} {material.unit}
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="p-0 h-auto mt-2 text-amber-800" asChild>
                  <Link to="/materials?lowStock=true">Ver todos os materiais com estoque baixo →</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalClients ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalProducts ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Materiais</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalMaterials ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pendingQuotes ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.approvedQuotes ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Quotes */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Orçamentos Recentes</CardTitle>
            <CardDescription>Seus últimos 5 orçamentos</CardDescription>
          </CardHeader>
          <CardContent>
            {recentQuotes.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum orçamento ainda. Crie seu primeiro orçamento para começar.</p>
            ) : (
              <div className="space-y-4">
                {recentQuotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Link
                        to={`/quotes/${quote.id}`}
                        className="text-sm font-medium leading-none hover:underline"
                      >
                        #{quote.number} - {quote.client.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {dateFormatter.format(new Date(quote.createdAt))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_BADGE_STYLES[quote.status]} variant="secondary">
                        {STATUS_LABELS[quote.status]}
                      </Badge>
                      <span className="text-sm font-medium">
                        {currencyFormatter.format(quote.total)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/quotes">Ver Todos os Orçamentos</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Tarefas comuns ao seu alcance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link to="/clients/new">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link to="/products/new">
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link to="/quotes/new">
                <FileText className="h-4 w-4 mr-2" />
                Novo Orçamento
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
