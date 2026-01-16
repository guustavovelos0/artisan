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
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface Category {
  id: string
  name: string
  type: string
}

interface Material {
  id: string
  name: string
  description: string | null
  unit: string
  unitPrice: number
  quantity: number
  minStock: number
  supplier: string | null
  categoryId: string | null
  category: Category | null
  createdAt: string
  updatedAt: string
}

interface MaterialsResponse {
  materials: Material[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function MaterialsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const lowStockFilter = searchParams.get('lowStock') === 'true'

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const data = await api.get<MaterialsResponse>('/materials')
      let filteredMaterials = data.materials
      if (lowStockFilter) {
        filteredMaterials = data.materials.filter((m) => m.quantity < m.minStock)
      }
      setMaterials(filteredMaterials)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Falha ao carregar materiais')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [lowStockFilter])

  const clearLowStockFilter = () => {
    searchParams.delete('lowStock')
    setSearchParams(searchParams)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) {
      return
    }

    try {
      setDeleting(id)
      await api.delete(`/materials/${id}`)
      setMaterials(materials.filter((m) => m.id !== id))
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Failed to delete material: ${err.message}`)
      } else {
        alert('Failed to delete material')
      }
    } finally {
      setDeleting(null)
    }
  }

  const isLowStock = (material: Material) => {
    return material.quantity < material.minStock
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
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
        <Button variant="outline" className="mt-4" onClick={fetchMaterials}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Materiais</h1>
        <Button asChild>
          <Link to="/materials/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Material
          </Link>
        </Button>
      </div>

      {lowStockFilter && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800">Mostrando apenas materiais com estoque baixo</span>
          <Button variant="ghost" size="sm" onClick={clearLowStockFilter} className="ml-auto text-amber-800 hover:text-amber-900">
            Limpar filtro
          </Button>
        </div>
      )}

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {materials.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">
                {lowStockFilter
                  ? 'Nenhum material encontrado. Todos os materiais estão acima dos níveis mínimos de estoque.'
                  : 'Nenhum material encontrado. Crie seu primeiro material para começar.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          materials.map((material) => (
            <Card key={material.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{material.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {material.category?.name || 'Sem categoria'}
                    </p>
                  </div>
                  {isLowStock(material) && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="h-3 w-3" />
                      Estoque Baixo
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground">Estoque:</span>{' '}
                    <span className={isLowStock(material) ? 'text-amber-600 font-medium' : ''}>
                      {material.quantity}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unidade:</span>{' '}
                    {material.unit}
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Preço Unitário:</span>{' '}
                    {formatCurrency(material.unitPrice)}
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t pt-3">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/materials/${material.id}`}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(material.id)}
                    disabled={deleting === material.id}
                  >
                    {deleting === material.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table Layout */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>{lowStockFilter ? 'Materiais com Estoque Baixo' : 'Todos os Materiais'}</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {lowStockFilter
                ? 'Nenhum material encontrado. Todos os materiais estão acima dos níveis mínimos de estoque.'
                : 'Nenhum material encontrado. Crie seu primeiro material para começar.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Preço Unitário</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {material.name}
                        {isLowStock(material) && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" />
                            Estoque Baixo
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{material.category?.name || '-'}</TableCell>
                    <TableCell>
                      <span className={isLowStock(material) ? 'text-amber-600 font-medium' : ''}>
                        {material.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>{formatCurrency(material.unitPrice)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild title="Editar">
                          <Link to={`/materials/${material.id}`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(material.id)}
                          disabled={deleting === material.id}
                          title="Excluir"
                        >
                          {deleting === material.id ? (
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
