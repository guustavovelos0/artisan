import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PDFViewer, pdf } from '@react-pdf/renderer'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { QuotePdf, Quote } from '@/pdf/QuotePdf'

export default function QuotePreviewPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchQuote(id)
    }
  }, [id])

  const fetchQuote = async (quoteId: string) => {
    try {
      setLoading(true)
      const data = await api.get<{ quote: Quote }>(`/quotes/${quoteId}`)
      setQuote(data.quote)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load quote')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!quote || !user) return

    try {
      setDownloading(true)

      // Generate PDF blob
      const blob = await pdf(<QuotePdf quote={quote} user={user} />).toBlob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      // Generate filename: orcamento-{number}-{clientName}.pdf
      const clientName = quote.client.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

      link.href = url
      link.download = `orcamento-${quote.number}-${clientName}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download PDF:', err)
    } finally {
      setDownloading(false)
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
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/quotes">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to quotes</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Quote Preview</h1>
        </div>
        <div className="p-4 text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      </div>
    )
  }

  if (!quote || !user) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/quotes">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to quotes</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Quote Preview</h1>
        </div>
        <div className="p-4 text-muted-foreground">
          Quote not found.
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/quotes/${id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to quote</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Quote #{quote.number} Preview</h1>
            <p className="text-muted-foreground">{quote.client.name}</p>
          </div>
        </div>
        <Button onClick={handleDownload} disabled={downloading}>
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-gray-100">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <QuotePdf quote={quote} user={user} />
        </PDFViewer>
      </div>
    </div>
  )
}
