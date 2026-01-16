import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ClientsPage from '@/pages/ClientsPage'
import ClientFormPage from '@/pages/ClientFormPage'
import MaterialsPage from '@/pages/MaterialsPage'
import MaterialFormPage from '@/pages/MaterialFormPage'
import ProductsPage from '@/pages/ProductsPage'
import ProductFormPage from '@/pages/ProductFormPage'
import TechnicalSheetPage from '@/pages/TechnicalSheetPage'
import QuotesPage from '@/pages/QuotesPage'
import QuoteFormPage from '@/pages/QuoteFormPage'
import QuotePreviewPage from '@/pages/QuotePreviewPage'

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
        <Toaster />
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
            path="/clients"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id/technical-sheet"
            element={
              <ProtectedRoute>
                <Layout>
                  <TechnicalSheetPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/materials"
            element={
              <ProtectedRoute>
                <Layout>
                  <MaterialsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/materials/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <MaterialFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/materials/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <MaterialFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotes"
            element={
              <ProtectedRoute>
                <Layout>
                  <QuotesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotes/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <QuoteFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotes/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <QuoteFormPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotes/:id/preview"
            element={
              <ProtectedRoute>
                <Layout>
                  <QuotePreviewPage />
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
