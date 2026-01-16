import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const data = await api.get<MaterialsResponse>('/materials')
      setMaterials(data.materials)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load materials')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

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
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Materials</h1>
        <Button asChild>
          <Link to="/materials/new">
            <Plus className="h-4 w-4 mr-2" />
            New Material
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Materials</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No materials yet. Create your first material to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
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
                            Low Stock
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
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/materials/${material.id}`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(material.id)}
                          disabled={deleting === material.id}
                        >
                          {deleting === material.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Delete</span>
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
