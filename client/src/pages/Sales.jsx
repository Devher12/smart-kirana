import { useEffect, useState } from 'react'
import { Download, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { salesAPI } from '@/api'
import { formatPKR, formatDateTime } from '@/utils/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [summary, setSummary] = useState({ totalAmount: 0, count: 0 })
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selected, setSelected] = useState(null)

  const fetchSales = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      const { data } = await salesAPI.getAll(params)
      setSales(data.sales)
      setSummary(data.summary)
      setPagination(data.pagination)
    } catch {
      toast.error('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSales() }, [startDate, endDate])

  const viewDetail = async (id) => {
    try {
      const { data } = await salesAPI.getById(id)
      setSelected(data)
    } catch {
      toast.error('Failed to load sale details')
    }
  }

  const downloadPDF = async (id, invoiceNumber) => {
    try {
      const { data } = await salesAPI.downloadPDF(id)
      const url = window.URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceNumber}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('PDF download failed')
    }
  }

  return (
    <div>
      <PageHeader title="Sales History" description="View and manage all transactions" breadcrumbs="Home / Sales" />

      <Card className="!p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <div className="flex-1 sm:text-right">
            <p className="text-sm text-muted">Period Total</p>
            <p className="text-xl font-bold text-primary">{formatPKR(summary.totalAmount)}</p>
            <p className="text-xs text-muted">{summary.count} transactions</p>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={10} cols={7} />
        ) : sales.length === 0 ? (
          <EmptyState title="No sales found" description="Sales will appear here once transactions are made." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-3 font-medium">Invoice #</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Items</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Payment</th>
                  <th className="pb-3 font-medium">Cashier</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-gray-50/50 cursor-pointer" onClick={() => viewDetail(s.id)}>
                    <td className="py-3 font-medium">{s.invoiceNumber}</td>
                    <td className="py-3">{formatDateTime(s.createdAt)}</td>
                    <td className="py-3">{s.customer?.name || 'Walk-in'}</td>
                    <td className="py-3">{s.items?.length || 0}</td>
                    <td className="py-3 font-medium">{formatPKR(s.totalAmount)}</td>
                    <td className="py-3">
                      <Badge variant={s.paymentMethod === 'cash' ? 'success' : 'warning'}>{s.paymentMethod}</Badge>
                    </td>
                    <td className="py-3">{s.cashier?.name}</td>
                    <td className="py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => viewDetail(s.id)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => downloadPDF(s.id, s.invoiceNumber)} className="p-1.5 rounded-lg hover:bg-gray-100"><Download className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchSales(pagination.page - 1)}>Previous</Button>
            <span className="flex items-center text-sm text-muted">Page {pagination.page} of {pagination.totalPages}</span>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchSales(pagination.page + 1)}>Next</Button>
          </div>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Sale ${selected?.invoiceNumber}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted">Date:</span> {formatDateTime(selected.createdAt)}</div>
              <div><span className="text-muted">Cashier:</span> {selected.cashier?.name}</div>
              <div><span className="text-muted">Customer:</span> {selected.customer?.name || 'Walk-in'}</div>
              <div><span className="text-muted">Payment:</span> <Badge variant={selected.paymentMethod === 'cash' ? 'success' : 'warning'}>{selected.paymentMethod}</Badge></div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-2 text-left">Product</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selected.items?.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-2">{item.product?.name}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{formatPKR(item.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{formatPKR(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right space-y-1">
              {parseFloat(selected.discount) > 0 && <p className="text-sm text-muted">Discount: -{formatPKR(selected.discount)}</p>}
              <p className="text-xl font-bold text-primary">Total: {formatPKR(selected.totalAmount)}</p>
            </div>
            <Button onClick={() => downloadPDF(selected.id, selected.invoiceNumber)} variant="outline" className="w-full">
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
