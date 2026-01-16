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

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.string().min(1, 'Preço é obrigatório'),
  laborCost: z.string().optional(),
  quantity: z.string().optional(),
  minStock: z.string().optional(),
  categoryId: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

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
}

export default function ProductFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      laborCost: '',
      quantity: '',
      minStock: '',
      categoryId: '',
    },
  })

  useEffect(() => {
    fetchCategories()
    if (isEditing && id) {
      fetchProduct(id)
    }
  }, [id, isEditing])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const data = await api.get<{ categories: Category[] }>('/categories?type=PRODUCT')
      setCategories(data.categories)
    } catch (err) {
      console.error('Failed to load categories:', err)
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true)
      const data = await api.get<{ product: Product }>(`/products/${productId}`)
      form.reset({
        name: data.product.name,
        description: data.product.description || '',
        price: String(data.product.price),
        laborCost: String(data.product.laborCost),
        quantity: String(data.product.quantity),
        minStock: String(data.product.minStock),
        categoryId: data.product.categoryId || '',
      })
      setError(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Falha ao carregar produto')
      }
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(data: ProductFormValues) {
    setError(null)
    setIsSubmitting(true)

    try {
      const payload = {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price) || 0,
        laborCost: parseFloat(data.laborCost || '0') || 0,
        quantity: parseInt(data.quantity || '0', 10) || 0,
        minStock: parseInt(data.minStock || '0', 10) || 0,
        categoryId: data.categoryId || null,
      }

      if (isEditing && id) {
        await api.put(`/products/${id}`, payload)
        toast.success('Produto atualizado com sucesso')
      } else {
        await api.post('/products', payload)
        toast.success('Produto criado com sucesso')
      }
      navigate('/products')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Falha ao salvar produto')
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
          <Link to="/products">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar para produtos</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
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
                      <Input placeholder="Nome do produto" {...field} />
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
                        placeholder="Descrição do produto"
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço *</FormLabel>
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

                <FormField
                  control={form.control}
                  name="laborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo de Mão de Obra</FormLabel>
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
                          step="1"
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
                          step="1"
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
                        type="PRODUCT"
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
                    'Atualizar Produto'
                  ) : (
                    'Criar Produto'
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/products">Cancelar</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
