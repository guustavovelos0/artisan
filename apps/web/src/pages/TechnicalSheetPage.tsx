import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Trash2, Plus } from 'lucide-react'

interface Material {
  id: string
  name: string
  unit: string
  unitPrice: number
}

interface ProductMaterial {
  productId: string
  materialId: string
  quantity: number
  material: Material
}

interface Product {
  id: string
  name: string
  laborCost: number
}

interface CostResponse {
  productId: string
  productName: string
  materialCost: number
  laborCost: number
  totalCost: number
  materialBreakdown: Array<{
    materialId: string
    materialName: string
    quantity: number
    unit: string
    unitPrice: number
    cost: number
  }>
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

export default function TechnicalSheetPage() {
  const { id } = useParams<{ id: string }>()

  const [product, setProduct] = useState<Product | null>(null)
  const [productMaterials, setProductMaterials] = useState<ProductMaterial[]>([])
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([])
  const [cost, setCost] = useState<CostResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
  const [newMaterialQuantity, setNewMaterialQuantity] = useState<string>('1')
  const [addingMaterial, setAddingMaterial] = useState(false)

  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: string }>({})
  const [updatingMaterial, setUpdatingMaterial] = useState<string | null>(null)
  const [deletingMaterial, setDeletingMaterial] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchAll()
    }
  }, [id])

  const fetchAll = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchProduct(),
        fetchProductMaterials(),
        fetchAvailableMaterials(),
        fetchCost(),
      ])
      setError(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Falha ao carregar ficha técnica')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchProduct = async () => {
    const data = await api.get<{ product: Product }>(`/products/${id}`)
    setProduct(data.product)
  }

  const fetchProductMaterials = async () => {
    const data = await api.get<{ materials: ProductMaterial[] }>(`/products/${id}/materials`)
    setProductMaterials(data.materials)
    // Initialize editing quantities
    const quantities: { [key: string]: string } = {}
    data.materials.forEach((pm) => {
      quantities[pm.materialId] = String(pm.quantity)
    })
    setEditingQuantity(quantities)
  }

  const fetchAvailableMaterials = async () => {
    const data = await api.get<MaterialsResponse>('/materials?limit=100')
    setAvailableMaterials(data.materials)
  }

  const fetchCost = async () => {
    const data = await api.get<CostResponse>(`/products/${id}/cost`)
    setCost(data)
  }

  const handleAddMaterial = async () => {
    if (!selectedMaterialId || !newMaterialQuantity) {
      toast.error('Por favor, selecione um material e insira uma quantidade')
      return
    }

    try {
      setAddingMaterial(true)
      await api.post(`/products/${id}/materials`, {
        materialId: selectedMaterialId,
        quantity: parseFloat(newMaterialQuantity),
      })
      toast.success('Material adicionado com sucesso')
      setSelectedMaterialId('')
      setNewMaterialQuantity('1')
      await Promise.all([fetchProductMaterials(), fetchCost()])
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Falha ao adicionar material')
      }
    } finally {
      setAddingMaterial(false)
    }
  }

  const handleUpdateQuantity = async (materialId: string) => {
    const quantity = editingQuantity[materialId]
    if (!quantity) return

    try {
      setUpdatingMaterial(materialId)
      await api.put(`/products/${id}/materials/${materialId}`, {
        quantity: parseFloat(quantity),
      })
      toast.success('Quantidade atualizada')
      await Promise.all([fetchProductMaterials(), fetchCost()])
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Falha ao atualizar quantidade')
      }
    } finally {
      setUpdatingMaterial(null)
    }
  }

  const handleRemoveMaterial = async (materialId: string) => {
    if (!confirm('Tem certeza que deseja remover este material?')) {
      return
    }

    try {
      setDeletingMaterial(materialId)
      await api.delete(`/products/${id}/materials/${materialId}`)
      toast.success('Material removido')
      await Promise.all([fetchProductMaterials(), fetchCost()])
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Falha ao remover material')
      }
    } finally {
      setDeletingMaterial(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Filter out materials already in the technical sheet
  const materialsNotInSheet = availableMaterials.filter(
    (m) => !productMaterials.some((pm) => pm.materialId === m.id)
  )

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
        <Button variant="outline" className="mt-4" onClick={fetchAll}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/products">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar para produtos</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Ficha Técnica</h1>
          <p className="text-muted-foreground">{product?.name}</p>
        </div>
      </div>

      {/* Add Material Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Adicionar Material</CardTitle>
          <CardDescription>Selecione um material para adicionar à ficha técnica deste produto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Material</label>
              <Select
                value={selectedMaterialId}
                onValueChange={setSelectedMaterialId}
                disabled={materialsNotInSheet.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={materialsNotInSheet.length === 0 ? 'Nenhum material disponível' : 'Selecione um material'} />
                </SelectTrigger>
                <SelectContent>
                  {materialsNotInSheet.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.unit} - {formatCurrency(material.unitPrice)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <label className="text-sm font-medium mb-2 block">Quantidade</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={newMaterialQuantity}
                onChange={(e) => setNewMaterialQuantity(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAddMaterial}
              disabled={addingMaterial || !selectedMaterialId}
            >
              {addingMaterial ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Materiais</CardTitle>
          <CardDescription>Materiais necessários para produzir este produto</CardDescription>
        </CardHeader>
        <CardContent>
          {productMaterials.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum material adicionado ainda. Adicione materiais acima para construir a ficha técnica.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Unitário</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productMaterials.map((pm) => (
                  <TableRow key={pm.materialId}>
                    <TableCell className="font-medium">{pm.material.name}</TableCell>
                    <TableCell>{pm.material.unit}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="w-24"
                          value={editingQuantity[pm.materialId] || ''}
                          onChange={(e) =>
                            setEditingQuantity({
                              ...editingQuantity,
                              [pm.materialId]: e.target.value,
                            })
                          }
                          onBlur={() => {
                            if (editingQuantity[pm.materialId] !== String(pm.quantity)) {
                              handleUpdateQuantity(pm.materialId)
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateQuantity(pm.materialId)
                            }
                          }}
                          disabled={updatingMaterial === pm.materialId}
                        />
                        {updatingMaterial === pm.materialId && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(pm.material.unitPrice)}</TableCell>
                    <TableCell>{formatCurrency(pm.quantity * pm.material.unitPrice)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMaterial(pm.materialId)}
                        disabled={deletingMaterial === pm.materialId}
                        title="Remover material"
                      >
                        {deletingMaterial === pm.materialId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="sr-only">Remover</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">
                    Custo de Materiais
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(cost?.materialCost || 0)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Custos</CardTitle>
          <CardDescription>Detalhamento do custo total de produção</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Custo de Materiais</span>
              <span className="font-medium">{formatCurrency(cost?.materialCost || 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Custo de Mão de Obra</span>
              <span className="font-medium">{formatCurrency(cost?.laborCost || 0)}</span>
            </div>
            <div className="flex justify-between py-2 text-lg">
              <span className="font-semibold">Custo Total</span>
              <span className="font-bold text-primary">{formatCurrency(cost?.totalCost || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
