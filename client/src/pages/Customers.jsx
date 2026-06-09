import { useEffect, useState } from 'react'
import { Plus, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { customersAPI } from '@/api'
import { formatPKR, formatDateTime } from '@/utils/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [payAmount, setPayAmount] = useState('')
  const [errors, setErrors] = useState({})

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data } = await customersAPI.getAll()
      setCustomers(data)
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [])

  const viewDetail = async (id) => {
    try {
      const { data } = await customersAPI.getById(id)
      setDetail(data)
    } catch {
      toast.error('Failed to load customer details')
    }
  }

  const handleAdd = async () => {
    if (!form.name) { setErrors({ name: 'Name is required' }); return }
    try {
      await customersAPI.create(form)
      toast.success('Customer created')
      setAddOpen(false)
      setForm({ name: '', phone: '' })
      fetchCustomers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create customer')
    }
  }

  const handlePayment = async () => {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    try {
      await customersAPI.recordPayment(detail.id, { amountPaid: amount })
      toast.success('Payment recorded')
      setPayOpen(false)
      setPayAmount('')
      viewDetail(detail.id)
      fetchCustomers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Customer Credit Ledger"
        description="Track customer credit and payments"
        breadcrumbs="Home / Customers"
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add Customer</Button>}
      />

      <Card>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers yet" description="Add customers to track credit sales." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Phone</th>
                  <th className="pb-3 font-medium">Total Credit</th>
                  <th className="pb-3 font-medium">Total Paid</th>
                  <th className="pb-3 font-medium">Outstanding</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-gray-50/50">
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3">{c.phone || '—'}</td>
                    <td className="py-3">{formatPKR(c.totalCredit)}</td>
                    <td className="py-3">{formatPKR(c.totalPaid)}</td>
                    <td className="py-3">
                      <span className={c.outstanding > 0 ? 'text-danger font-semibold' : 'text-success'}>
                        {formatPKR(c.outstanding)}
                      </span>
                    </td>
                    <td className="py-3">
                      <button onClick={() => viewDetail(c.id)} className="p-1.5 rounded-lg hover:bg-gray-100">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl animate-in slide-in-from-right">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold font-[family-name:var(--font-heading)]">{detail.name}</h2>
              <p className="text-muted">{detail.phone}</p>
              <div className="flex gap-4 mt-3">
                <div><p className="text-xs text-muted">Outstanding</p><p className="text-lg font-bold text-danger">{formatPKR(detail.outstanding)}</p></div>
                <div><p className="text-xs text-muted">Total Credit</p><p className="text-lg font-bold">{formatPKR(detail.totalCredit)}</p></div>
              </div>
              {detail.outstanding > 0 && (
                <Button onClick={() => setPayOpen(true)} className="mt-4" size="sm">Record Payment</Button>
              )}
            </div>

            <div className="p-6">
              <h3 className="font-semibold mb-3">Credit Sales</h3>
              {detail.creditSales?.length === 0 ? (
                <p className="text-sm text-muted">No credit sales</p>
              ) : (
                <div className="space-y-2 mb-6">
                  {detail.creditSales?.map((s) => (
                    <div key={s.id} className="p-3 rounded-lg bg-gray-50 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{s.invoiceNumber}</span>
                        <span>{formatPKR(s.totalAmount)}</span>
                      </div>
                      <p className="text-xs text-muted">{formatDateTime(s.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="font-semibold mb-3">Payments</h3>
              {detail.payments?.length === 0 ? (
                <p className="text-sm text-muted">No payments recorded</p>
              ) : (
                <div className="space-y-2">
                  {detail.payments?.map((p) => (
                    <div key={p.id} className="p-3 rounded-lg bg-green-50 text-sm flex justify-between">
                      <span>{formatDateTime(p.paidAt)}</span>
                      <span className="font-medium text-success">{formatPKR(p.amountPaid)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Customer">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Button onClick={handleAdd} className="w-full">Create Customer</Button>
        </div>
      </Modal>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record Payment">
        <div className="space-y-4">
          <p className="text-sm text-muted">Outstanding: <span className="font-bold text-danger">{formatPKR(detail?.outstanding)}</span></p>
          <Input label="Amount (PKR)" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          <Button onClick={handlePayment} className="w-full">Record Payment</Button>
        </div>
      </Modal>
    </div>
  )
}
