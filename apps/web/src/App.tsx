import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Artisan!</CardTitle>
          <CardDescription>Your artisan management app</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage your clients, products, materials, and quotes all in one place.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">This page is under construction.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes with layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage title="Clients" />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage title="Products" />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/materials/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage title="Materials" />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotes/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage title="Quotes" />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage title="Settings" />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
