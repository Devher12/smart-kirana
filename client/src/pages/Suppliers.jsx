import { useEffect, useState } from 'react'
import { Plus, Pencil, Eye, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { suppliersAPI, productsAPI } from '@/api'
import { formatPKR, formatDateTime } from '@/utils/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

const emptySupplier = { name: '', phone: '', email: '', address: '' }

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptySupplier)
  const [purchaseForm, setPurchaseForm] = useState({ supplierId: '', productId: '', quantity: '', costPerUnit: '' })
  const [errors, setErrors] = useState({})

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const { data } = await suppliersAPI.getAll()
      setSuppliers(data)
    } catch {
      toast.error('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
    productsAPI.getAll().then((r) => setProducts(r.data))
  }, [])

  const openAdd = () => { setEditing(null); setForm(emptySupplier); setModalOpen(true) }
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '' }); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.name) { setErrors({ name: 'Name is required' }); return }
    try {
      if (editing) {
        await suppliersAPI.update(editing.id, form)
        toast.success('Supplier updated')
      } else {
        await suppliersAPI.create(form)
        toast.success('Supplier created')
      }
      setModalOpen(false)
      fetchSuppliers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const viewDetail = async (id) => {
    try {
      const { data } = await suppliersAPI.getById(id)
      setDetail(data)
    } catch {
      toast.error('Failed to load supplier details')
    }
  }

  const handlePurchase = async () => {
    const { supplierId, productId, quantity, costPerUnit } = purchaseForm
    if (!supplierId || !productId || !quantity || !costPerUnit) {
      toast.error('All fields are required')
      return
    }
    try {
      await suppliersAPI.createPurchaseOrder({
        supplierId: parseInt(supplierId),
        productId: parseInt(productId),
        quantity: parseFloat(quantity),
        costPerUnit: parseFloat(costPerUnit),
      })
      toast.success('Purchase recorded — stock updated')
      setPurchaseOpen(false)
      setPurchaseForm({ supplierId: '', productId: '', quantity: '', costPerUnit: '' })
      if (detail) viewDetail(detail.id)
      productsAPI.getAll().then((r) => setProducts(r.data))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Supplier Management"
        description="Manage suppliers and purchase orders"
        breadcrumbs="Home / Suppliers"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPurchaseOpen(true)}><Package className="w-4 h-4" /> Record Purchase</Button>
            <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Supplier</Button>
          </div>
        }
      />

      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : suppliers.length === 0 ? (
          <EmptyState title="No suppliers yet" description="Add suppliers to track your inventory sources." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Phone</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Products</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-gray-50/50">
                    <td className="py-3 font-medium">{s.name}</td>
                    <td className="py-3">{s.phone || '—'}</td>
                    <td className="py-3">{s.email || '—'}</td>
                    <td className="py-3">{s.productsSupplied || 0}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button onClick={() => viewDetail(s.id)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100"><Pencil className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {detail && (
        <Modal open={!!detail} onClose={() => setDetail(null)} title={detail.name} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted">Phone:</span> {detail.phone || '—'}</div>
              <div><span className="text-muted">Email:</span> {detail.email || '—'}</div>
              <div className="col-span-2"><span className="text-muted">Address:</span> {detail.address || '—'}</div>
            </div>
            <h3 className="font-semibold">Purchase Order History</h3>
            {detail.purchaseOrders?.length === 0 ? (
              <p className="text-sm text-muted">No purchase orders yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {detail.purchaseOrders?.map((po) => (
                  <div key={po.id} className="p-3 rounded-lg bg-gray-50 text-sm flex justify-between">
                    <div>
                      <p className="font-medium">{po.product?.name}</p>
                      <p className="text-xs text-muted">{formatDateTime(po.orderedAt)} — Qty: {po.quantity}</p>
                    </div>
                    <span className="font-medium">{formatPKR(po.totalCost)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Button onClick={handleSave} className="w-full">{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      <Modal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} title="Record Purchase">
        <div className="space-y-4">
          <Select label="Supplier" value={purchaseForm.supplierId} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })} placeholder="Select supplier" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
          <Select label="Product" value={purchaseForm.productId} onChange={(e) => setPurchaseForm({ ...purchaseForm, productId: e.target.value })} placeholder="Select product" options={products.map((p) => ({ value: p.id, label: p.name }))} />
          <Input label="Quantity" type="number" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} />
          <Input label="Cost Per Unit (PKR)" type="number" value={purchaseForm.costPerUnit} onChange={(e) => setPurchaseForm({ ...purchaseForm, costPerUnit: e.target.value })} />
          {purchaseForm.quantity && purchaseForm.costPerUnit && (
            <p className="text-sm text-muted">Total: {formatPKR(parseFloat(purchaseForm.quantity) * parseFloat(purchaseForm.costPerUnit))}</p>
          )}
          <Button onClick={handlePurchase} className="w-full">Record Purchase</Button>
        </div>
      </Modal>
    </div>
  )
}
