import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
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
        setError('Failed to load product')
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
        toast.success('Product updated successfully')
      } else {
        await api.post('/products', payload)
        toast.success('Product created successfully')
      }
      navigate('/products')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to save product')
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
            <span className="sr-only">Back to products</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Edit Product' : 'New Product'}
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
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
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
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
                        placeholder="Product description"
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
                      <FormLabel>Price *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
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
                      <FormLabel>Labor Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
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
                      <FormLabel>Quantity</FormLabel>
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
                      <FormLabel>Min Stock</FormLabel>
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
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingCategories}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
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
                    'Update Product'
                  ) : (
                    'Create Product'
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/products">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
