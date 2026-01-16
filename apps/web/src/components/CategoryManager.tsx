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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  type: 'PRODUCT' | 'MATERIAL'
}

interface CategoryManagerProps {
  type: 'PRODUCT' | 'MATERIAL'
  onCategoriesChange?: () => void
}

export default function CategoryManager({ type, onCategoriesChange }: CategoryManagerProps) {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open, type])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await api.get<{ categories: Category[] }>(`/categories?type=${type}`)
      setCategories(data.categories)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Falha ao carregar categorias')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      setSaving(true)
      await api.post('/categories', {
        name: newCategoryName.trim(),
        type,
      })
      toast.success('Categoria criada com sucesso')
      setNewCategoryName('')
      fetchCategories()
      onCategoriesChange?.()
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Falha ao criar categoria')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory || !editName.trim()) return

    try {
      setSaving(true)
      await api.put(`/categories/${editingCategory.id}`, {
        name: editName.trim(),
      })
      toast.success('Categoria atualizada com sucesso')
      setEditingCategory(null)
      setEditName('')
      fetchCategories()
      onCategoriesChange?.()
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Falha ao atualizar categoria')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return

    try {
      setDeletingId(id)
      await api.delete(`/categories/${id}`)
      toast.success('Categoria excluída com sucesso')
      fetchCategories()
      onCategoriesChange?.()
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Falha ao excluir categoria')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const startEditing = (category: Category) => {
    setEditingCategory(category)
    setEditName(category.name)
  }

  const cancelEditing = () => {
    setEditingCategory(null)
    setEditName('')
  }

  const typeLabel = type === 'PRODUCT' ? 'Produtos' : 'Materiais'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon" title="Gerenciar categorias">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
          <DialogDescription>
            Categorias de {typeLabel.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add new category */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="new-category" className="sr-only">
                  Nova categoria
                </Label>
                <Input
                  id="new-category"
                  placeholder="Nome da nova categoria"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCategory()
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                onClick={handleAddCategory}
                disabled={saving || !newCategoryName.trim()}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="ml-1">Adicionar</span>
              </Button>
            </div>

            {/* Categories list */}
            {categories.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Nenhuma categoria cadastrada
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          {editingCategory?.id === category.id ? (
                            <div className="flex gap-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleEditCategory()
                                  }
                                  if (e.key === 'Escape') {
                                    cancelEditing()
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleEditCategory}
                                disabled={saving || !editName.trim()}
                              >
                                {saving ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Salvar'
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditing}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            category.name
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingCategory?.id !== category.id && (
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditing(category)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCategory(category.id)}
                                disabled={deletingId === category.id}
                                title="Excluir"
                              >
                                {deletingId === category.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
