import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import CategoryManager from '@/components/CategoryManager'

// Predefined unit options for materials
const UNIT_OPTIONS = [
  { value: 'm', label: 'm (metros)' },
  { value: 'cm', label: 'cm (centímetros)' },
  { value: 'kg', label: 'kg (quilogramas)' },
  { value: 'g', label: 'g (gramas)' },
  { value: 'ml', label: 'ml (mililitros)' },
  { value: 'L', label: 'L (litros)' },
  { value: 'un', label: 'un (unidades)' },
] as const

const materialSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  unitPrice: z.string().min(1, 'Preço unitário é obrigatório'),
  quantity: z.string().optional(),
  minStock: z.string().optional(),
  supplier: z.string().optional(),
  categoryId: z.string().optional(),
})

type MaterialFormValues = z.infer<typeof materialSchema>

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
}

export default function MaterialFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      description: '',
      unit: '',
      unitPrice: '',
      quantity: '',
      minStock: '',
      supplier: '',
      categoryId: '',
    },
  })

  useEffect(() => {
    fetchCategories()
    if (isEditing && id) {
      fetchMaterial(id)
    }
  }, [id, isEditing])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const data = await api.get<{ categories: Category[] }>('/categories?type=MATERIAL')
      setCategories(data.categories)
    } catch (err) {
      console.error('Failed to load categories:', err)
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchMaterial = async (materialId: string) => {
    try {
      setLoading(true)
      const data = await api.get<{ material: Material }>(`/materials/${materialId}`)
      form.reset({
        name: data.material.name,
        description: data.material.description || '',
        unit: data.material.unit,
        unitPrice: String(data.material.unitPrice),
        quantity: String(data.material.quantity),
        minStock: String(data.material.minStock),
        supplier: data.material.supplier || '',
        categoryId: data.material.categoryId || '',
      })
      setError(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Falha ao carregar material')
      }
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(data: MaterialFormValues) {
    setError(null)
    setIsSubmitting(true)

    try {
      const payload = {
        name: data.name,
        description: data.description || null,
        unit: data.unit,
        unitPrice: parseFloat(data.unitPrice) || 0,
        quantity: parseFloat(data.quantity || '0') || 0,
        minStock: parseFloat(data.minStock || '0') || 0,
        supplier: data.supplier || null,
        categoryId: data.categoryId || null,
      }

      if (isEditing && id) {
        await api.put(`/materials/${id}`, payload)
        toast.success('Material atualizado com sucesso')
      } else {
        await api.post('/materials', payload)
        toast.success('Material criado com sucesso')
      }
      navigate('/materials')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Falha ao salvar material')
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
          <Link to="/materials">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar para materiais</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Material' : 'Novo Material'}
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Material</CardTitle>
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do material" {...field} />
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição do material"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNIT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Unitário *</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          placeholder="0,00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade em Estoque</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do fornecedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <div className="flex gap-2">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loadingCategories}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <CategoryManager
                        type="MATERIAL"
                        onCategoriesChange={fetchCategories}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : isEditing ? (
                    'Atualizar Material'
                  ) : (
                    'Criar Material'
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/materials">Cancelar</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
