import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { User } from '@/contexts/AuthContext'

// Types for Quote data
export interface QuoteItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Client {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
}

export interface Quote {
  id: string
  number: number
  title?: string | null
  description?: string | null
  status: string
  validUntil?: string | null
  notes?: string | null
  subtotal: number
  laborCost: number
  discount: number
  total: number
  manualTotal?: number | null
  createdAt: string
  client: Client
  items: QuoteItem[]
}

interface QuotePdfProps {
  quote: Quote
  user: User
}

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 15,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  businessInfo: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  infoBox: {
    width: '48%',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 10,
    marginBottom: 3,
    color: '#444',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  colDescription: {
    width: '45%',
  },
  colQty: {
    width: '15%',
    textAlign: 'center',
  },
  colUnitPrice: {
    width: '20%',
    textAlign: 'right',
  },
  colTotal: {
    width: '20%',
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 10,
    marginLeft: 'auto',
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 10,
    color: '#374151',
  },
  totalValue: {
    fontSize: 10,
    color: '#374151',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 5,
    borderTopWidth: 2,
    borderTopColor: '#333',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  notesSection: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  notesText: {
    fontSize: 10,
    color: '#444',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
})

// Format currency (BRL)
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Format date
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function QuotePdf({ quote, user }: QuotePdfProps) {
  const finalTotal = quote.manualTotal ?? quote.total

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Business Info */}
        <View style={styles.header}>
          <Text style={styles.businessName}>
            {user.businessName || user.name}
          </Text>
          {user.address && (
            <Text style={styles.businessInfo}>{user.address}</Text>
          )}
          {user.phone && (
            <Text style={styles.businessInfo}>Tel: {user.phone}</Text>
          )}
          {user.email && (
            <Text style={styles.businessInfo}>{user.email}</Text>
          )}
          <Text style={styles.quoteTitle}>
            {quote.title || `Orcamento #${quote.number}`}
          </Text>
        </View>

        {/* Quote and Client Info Section */}
        <View style={styles.infoSection}>
          {/* Quote Info */}
          <View style={styles.infoBox}>
            <Text style={styles.sectionLabel}>Dados do Orcamento</Text>
            <Text style={styles.infoText}>Numero: {quote.number}</Text>
            <Text style={styles.infoText}>
              Data: {formatDate(quote.createdAt)}
            </Text>
            {quote.validUntil && (
              <Text style={styles.infoText}>
                Valido ate: {formatDate(quote.validUntil)}
              </Text>
            )}
            {quote.description && (
              <Text style={styles.infoText}>{quote.description}</Text>
            )}
          </View>

          {/* Client Info */}
          <View style={styles.infoBox}>
            <Text style={styles.sectionLabel}>Cliente</Text>
            <Text style={styles.infoText}>{quote.client.name}</Text>
            {quote.client.email && (
              <Text style={styles.infoText}>{quote.client.email}</Text>
            )}
            {quote.client.phone && (
              <Text style={styles.infoText}>Tel: {quote.client.phone}</Text>
            )}
            {quote.client.address && (
              <Text style={styles.infoText}>{quote.client.address}</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>
              Descricao
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qtd</Text>
            <Text style={[styles.tableHeaderText, styles.colUnitPrice]}>
              Preco Unit.
            </Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>

          {/* Table Rows */}
          {quote.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnitPrice}>
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={styles.colTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(quote.subtotal)}
            </Text>
          </View>

          {quote.laborCost > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Mao de Obra</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(quote.laborCost)}
              </Text>
            </View>
          )}

          {quote.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Desconto</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(quote.discount)}
              </Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(finalTotal)}
            </Text>
          </View>
        </View>

        {/* Notes Section */}
        {quote.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Observacoes</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Documento gerado em {formatDate(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  )
}
