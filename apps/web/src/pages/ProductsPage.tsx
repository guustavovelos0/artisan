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
import { Plus, Pencil, Trash2, Loader2, AlertTriangle, FileText, Factory } from 'lucide-react'
import ManufactureDialog from '@/components/ManufactureDialog'

interface Category {
  id: string
  name: string
  type: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  laborCost: number
  quantity: number
  minStock: number
  categoryId: string | null
  category: Category | null
  createdAt: string
  updatedAt: string
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

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [manufactureProductId, setManufactureProductId] = useState<string | null>(null)
  const [manufactureDialogOpen, setManufactureDialogOpen] = useState(false)

  const lowStockFilter = searchParams.get('lowStock') === 'true'

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await api.get<ProductsResponse>('/products')
      let filteredProducts = data.products
      if (lowStockFilter) {
        filteredProducts = data.products.filter((p) => p.quantity < p.minStock)
      }
      setProducts(filteredProducts)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load products')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [lowStockFilter])

  const clearLowStockFilter = () => {
    searchParams.delete('lowStock')
    setSearchParams(searchParams)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      setDeleting(id)
      await api.delete(`/products/${id}`)
      setProducts(products.filter((p) => p.id !== id))
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Failed to delete product: ${err.message}`)
      } else {
        alert('Failed to delete product')
      }
    } finally {
      setDeleting(null)
    }
  }

  const isLowStock = (product: Product) => {
    return product.quantity < product.minStock
  }

  const handleManufactureClick = (productId: string) => {
    setManufactureProductId(productId)
    setManufactureDialogOpen(true)
  }

  const handleManufactureSuccess = () => {
    fetchProducts()
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
        <Button variant="outline" className="mt-4" onClick={fetchProducts}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button asChild>
          <Link to="/products/new">
            <Plus className="h-4 w-4 mr-2" />
            New Product
          </Link>
        </Button>
      </div>

      {lowStockFilter && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800">Showing only low stock products</span>
          <Button variant="ghost" size="sm" onClick={clearLowStockFilter} className="ml-auto text-amber-800 hover:text-amber-900">
            Clear filter
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{lowStockFilter ? 'Low Stock Products' : 'All Products'}</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No products yet. Create your first product to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Labor Cost</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {product.name}
                        {isLowStock(product) && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.category?.name || '-'}</TableCell>
                    <TableCell>
                      <span className={isLowStock(product) ? 'text-amber-600 font-medium' : ''}>
                        {product.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>{formatCurrency(product.laborCost)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild title="Edit">
                          <Link to={`/products/${product.id}`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Technical Sheet">
                          <Link to={`/products/${product.id}/technical-sheet`}>
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">Technical Sheet</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Manufacture"
                          onClick={() => handleManufactureClick(product.id)}
                        >
                          <Factory className="h-4 w-4" />
                          <span className="sr-only">Manufacture</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          disabled={deleting === product.id}
                          title="Delete"
                        >
                          {deleting === product.id ? (
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

      <ManufactureDialog
        productId={manufactureProductId}
        open={manufactureDialogOpen}
        onOpenChange={setManufactureDialogOpen}
        onSuccess={handleManufactureSuccess}
      />
    </div>
  )
}
