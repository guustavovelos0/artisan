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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface ClientsResponse {
  clients: Client[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchClients = async () => {
    try {
      setLoading(true)
      const data = await api.get<ClientsResponse>('/clients')
      setClients(data.clients)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Falha ao carregar clientes')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) {
      return
    }

    try {
      setDeleting(id)
      await api.delete(`/clients/${id}`)
      setClients(clients.filter((c) => c.id !== id))
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Failed to delete client: ${err.message}`)
      } else {
        alert('Failed to delete client')
      }
    } finally {
      setDeleting(null)
    }
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
        <Button variant="outline" className="mt-4" onClick={fetchClients}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Button asChild>
          <Link to="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {clients.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">
                Nenhum cliente encontrado
              </p>
            </CardContent>
          </Card>
        ) : (
          clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{client.name}</h3>
                    {client.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div><span className="text-muted-foreground">Email:</span> {client.email || '-'}</div>
                  <div><span className="text-muted-foreground">Telefone:</span> {client.phone || '-'}</div>
                </div>
                <div className="flex items-center gap-2 border-t pt-3">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/clients/${client.id}`}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(client.id)}
                    disabled={deleting === client.id}
                  >
                    {deleting === client.id ? (
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
          <CardTitle>Todos os Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum cliente encontrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/clients/${client.id}`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(client.id)}
                          disabled={deleting === client.id}
                        >
                          {deleting === client.id ? (
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
