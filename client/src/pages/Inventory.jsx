import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { productsAPI, suppliersAPI } from '@/api'
import { formatPKR, formatDate } from '@/utils/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

const CATEGORIES = ['Dairy', 'Beverages', 'Snacks', 'Household', 'Grains', 'Personal Care']
const UNITS = [{ value: 'pcs', label: 'Pieces' }, { value: 'kg', label: 'Kilogram' }, { value: 'ltr', label: 'Litre' }]

const emptyProduct = {
  name: '', category: '', barcode: '', unit: 'pcs',
  costPrice: '', sellingPrice: '', currentStock: '', minStockThreshold: '',
  expiryDate: '', supplierId: '',
}

function getStockBadge(stock, threshold) {
  const s = parseFloat(stock)
  const t = parseFloat(threshold)
  if (s <= t / 2) return 'danger'
  if (s <= t) return 'warning'
  return 'success'
}

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyProduct)
  const [errors, setErrors] = useState({})

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter
      if (supplierFilter) params.supplierId = supplierFilter
      if (filter === 'low') params.lowStock = 'true'
      if (filter === 'expiring') params.expiring = 'true'
      const { data } = await productsAPI.getAll(params)
      setProducts(data)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    suppliersAPI.getAll().then((r) => setSuppliers(r.data))
    fetchProducts()
  }, [filter, categoryFilter, supplierFilter])

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timer)
  }, [search])

  const validate = () => {
    const errs = {}
    if (!form.name) errs.name = 'Name is required'
    if (!form.category) errs.category = 'Category is required'
    if (!form.sellingPrice) errs.sellingPrice = 'Selling price is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openAdd = () => { setEditing(null); setForm(emptyProduct); setErrors({}); setModalOpen(true) }
  const openEdit = (p) => {
    setEditing(p)
    setForm({
      name: p.name, category: p.category, barcode: p.barcode || '',
      unit: p.unit, costPrice: p.costPrice, sellingPrice: p.sellingPrice,
      currentStock: p.currentStock, minStockThreshold: p.minStockThreshold,
      expiryDate: p.expiryDate || '', supplierId: p.supplierId || '',
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      const payload = { ...form, costPrice: parseFloat(form.costPrice) || 0, sellingPrice: parseFloat(form.sellingPrice), currentStock: parseFloat(form.currentStock) || 0, minStockThreshold: parseFloat(form.minStockThreshold) || 5, supplierId: form.supplierId || null, expiryDate: form.expiryDate || null }
      if (editing) {
        await productsAPI.update(editing.id, payload)
        toast.success('Product updated')
      } else {
        await productsAPI.create(payload)
        toast.success('Product created')
      }
      setModalOpen(false)
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await productsAPI.delete(id)
      toast.success('Product deleted')
      fetchProducts()
    } catch {
      toast.error('Delete failed')
    }
  }

  const tabs = [
    { key: 'all', label: 'All Products' },
    { key: 'low', label: 'Low Stock' },
    { key: 'expiring', label: 'Expiring Soon' },
  ]

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Manage your product catalog and stock levels"
        breadcrumbs="Home / Inventory"
        actions={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Product</Button>}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === t.key ? 'bg-primary text-white' : 'bg-white border border-border hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="!p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="All Categories"
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            className="sm:w-48"
          />
          <Select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            placeholder="All Suppliers"
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            className="sm:w-48"
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : products.length === 0 ? (
          <EmptyState title="No products found" description="Add your first product or adjust filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Stock</th>
                  <th className="pb-3 font-medium">Unit</th>
                  <th className="pb-3 font-medium">Min</th>
                  <th className="pb-3 font-medium">Expiry</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Supplier</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-gray-50/50">
                    <td className="py-3 font-medium">{p.name}</td>
                    <td className="py-3">{p.category}</td>
                    <td className="py-3">
                      <Badge variant={getStockBadge(p.currentStock, p.minStockThreshold)}>
                        {parseFloat(p.currentStock)}
                      </Badge>
                    </td>
                    <td className="py-3">{p.unit}</td>
                    <td className="py-3">{parseFloat(p.minStockThreshold)}</td>
                    <td className="py-3">{formatDate(p.expiryDate)}</td>
                    <td className="py-3">{formatPKR(p.sellingPrice)}</td>
                    <td className="py-3">{p.supplier?.name || '—'}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-danger"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Select category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} error={errors.category} />
          <Input label="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          <Select label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} options={UNITS} />
          <Input label="Cost Price" type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
          <Input label="Selling Price" type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} error={errors.sellingPrice} />
          <Input label="Current Stock" type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
          <Input label="Min Stock Threshold" type="number" value={form.minStockThreshold} onChange={(e) => setForm({ ...form, minStockThreshold: e.target.value })} />
          <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          <Select label="Supplier" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} placeholder="Select supplier" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  )
}
