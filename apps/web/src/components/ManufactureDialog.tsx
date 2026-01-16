import { useState, useEffect } from 'react'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Material {
  id: string
  name: string
  unit: string
  unitPrice: number
  quantity: number
  minStock: number
}

interface ProductMaterial {
  materialId: string
  quantity: number
  material: Material
}

interface Product {
  id: string
  name: string
  quantity: number
  materials: ProductMaterial[]
}

interface ProductResponse {
  product: Product
}

interface InsufficientMaterial {
  materialId: string
  materialName: string
  required: number
  available: number
  shortage: number
  unit: string
}

interface LowStockWarning {
  materialId: string
  materialName: string
  currentStock: number
  minStock: number
  unit: string
}

interface ManufactureResponse {
  message: string
  product: Product
  manufactured: number
  warnings?: LowStockWarning[]
}

interface ManufactureDialogProps {
  productId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function ManufactureDialog({
  productId,
  open,
  onOpenChange,
  onSuccess,
}: ManufactureDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [insufficientMaterials, setInsufficientMaterials] = useState<InsufficientMaterial[]>([])
  const [lowStockWarnings, setLowStockWarnings] = useState<LowStockWarning[]>([])

  // Fetch product with materials when dialog opens
  useEffect(() => {
    if (open && productId) {
      setQuantity(1)
      setInsufficientMaterials([])
      setLowStockWarnings([])
      fetchProduct()
    } else {
      setProduct(null)
      setInsufficientMaterials([])
      setLowStockWarnings([])
    }
  }, [open, productId])

  // Check stock levels when quantity changes
  useEffect(() => {
    if (product && quantity > 0) {
      checkStockLevels()
    }
  }, [quantity, product])

  const fetchProduct = async () => {
    if (!productId) return

    try {
      setLoadingProduct(true)
      const data = await api.get<ProductResponse>(`/products/${productId}`)
      setProduct(data.product)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Falha ao carregar produto')
      }
      onOpenChange(false)
    } finally {
      setLoadingProduct(false)
    }
  }

  const checkStockLevels = () => {
    if (!product) return

    const insufficient: InsufficientMaterial[] = []
    const warnings: LowStockWarning[] = []

    for (const pm of product.materials) {
      const required = pm.quantity * quantity
      const available = pm.material.quantity

      if (available < required) {
        insufficient.push({
          materialId: pm.materialId,
          materialName: pm.material.name,
          required,
          available,
          shortage: required - available,
          unit: pm.material.unit,
        })
      } else {
        const newStock = available - required
        if (newStock < pm.material.minStock) {
          warnings.push({
            materialId: pm.materialId,
            materialName: pm.material.name,
            currentStock: newStock,
            minStock: pm.material.minStock,
            unit: pm.material.unit,
          })
        }
      }
    }

    setInsufficientMaterials(insufficient)
    setLowStockWarnings(warnings)
  }

  const handleManufacture = async () => {
    if (!productId || quantity <= 0) return

    try {
      setLoading(true)
      const response = await api.post<ManufactureResponse>(`/products/${productId}/manufacture`, {
        quantity,
      })

      toast.success(response.message)

      if (response.warnings && response.warnings.length > 0) {
        const warningNames = response.warnings.map((w) => w.materialName).join(', ')
        toast.warning(`Alerta de estoque baixo: ${warningNames}`)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Falha ao produzir produto')
      }
    } finally {
      setLoading(false)
    }
  }

  const canManufacture = product && product.materials.length > 0 && quantity > 0 && insufficientMaterials.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Produzir Produto</DialogTitle>
          <DialogDescription>
            {product ? `Quantas unidades você deseja produzir?` : 'Carregando...'}
          </DialogDescription>
        </DialogHeader>

        {loadingProduct ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : product ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade a produzir</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
            </div>

            {product.materials.length === 0 ? (
              <div className="p-4 border rounded-lg bg-amber-50 text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Este produto não possui materiais definidos na ficha técnica.</span>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Label>Materiais Necessários</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead className="text-right">Necessário</TableHead>
                          <TableHead className="text-right">Disponível</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {product.materials.map((pm) => {
                          const required = pm.quantity * quantity
                          const available = pm.material.quantity
                          const isInsufficient = available < required
                          const willBeLow = !isInsufficient && (available - required) < pm.material.minStock

                          return (
                            <TableRow key={pm.materialId}>
                              <TableCell className="font-medium">{pm.material.name}</TableCell>
                              <TableCell className="text-right">
                                {required.toFixed(2)} {pm.material.unit}
                              </TableCell>
                              <TableCell className="text-right">
                                {available.toFixed(2)} {pm.material.unit}
                              </TableCell>
                              <TableCell className="text-right">
                                {isInsufficient ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                    <XCircle className="h-3 w-3" />
                                    Insuficiente
                                  </span>
                                ) : willBeLow ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                    <AlertTriangle className="h-3 w-3" />
                                    Estoque Baixo
                                  </span>
                                ) : (
                                  <span className="text-xs text-green-600">OK</span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {insufficientMaterials.length > 0 && (
                  <div className="p-4 border rounded-lg bg-red-50 text-red-800">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Materiais insuficientes</p>
                        <p className="text-sm mt-1">
                          Não há materiais suficientes disponíveis para produzir:
                        </p>
                        <ul className="text-sm mt-1 list-disc list-inside">
                          {insufficientMaterials.map((m) => (
                            <li key={m.materialId}>
                              {m.materialName}: necessário {m.required.toFixed(2)} {m.unit}, disponível{' '}
                              {m.available.toFixed(2)} {m.unit} (falta: {m.shortage.toFixed(2)}{' '}
                              {m.unit})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {lowStockWarnings.length > 0 && insufficientMaterials.length === 0 && (
                  <div className="p-4 border rounded-lg bg-amber-50 text-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Alerta de estoque baixo</p>
                        <p className="text-sm mt-1">
                          Os seguintes materiais ficarão abaixo do estoque mínimo após a produção:
                        </p>
                        <ul className="text-sm mt-1 list-disc list-inside">
                          {lowStockWarnings.map((w) => (
                            <li key={w.materialId}>
                              {w.materialName}: ficará com {w.currentStock.toFixed(2)} {w.unit}{' '}
                              (mín: {w.minStock.toFixed(2)} {w.unit})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleManufacture} disabled={!canManufacture || loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Produzir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
