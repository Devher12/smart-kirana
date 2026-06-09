import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Trash2, ShoppingCart, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { productsAPI, salesAPI, customersAPI } from '@/api'
import { formatPKR } from '@/utils/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'

export default function POS() {
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [cart, setCart] = useState([])
  const [barcode, setBarcode] = useState('')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState('pkr')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [invoice, setInvoice] = useState(null)
  const barcodeRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const [prodRes, custRes] = await Promise.all([
        productsAPI.getAll(),
        customersAPI.getAll(),
      ])
      setProducts(prodRes.data)
      setCustomers(custRes.data)
    }
    load()
    barcodeRef.current?.focus()
  }, [])

  useEffect(() => {
    if (search.length < 2) { setSearchResults([]); return }
    const filtered = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8)
    setSearchResults(filtered)
  }, [search, products])

  const addToCart = useCallback((product, qty = 1) => {
    if (parseFloat(product.currentStock) <= 0) {
      toast.error(`${product.name} is out of stock`)
      return
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        const newQty = existing.quantity + qty
        if (newQty > parseFloat(product.currentStock)) {
          toast.error('Insufficient stock')
          return prev
        }
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: newQty, subtotal: newQty * i.unitPrice }
            : i
        )
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: qty,
        unitPrice: parseFloat(product.sellingPrice),
        subtotal: qty * parseFloat(product.sellingPrice),
        maxStock: parseFloat(product.currentStock),
      }]
    })
    setSearch('')
    setSearchResults([])
    barcodeRef.current?.focus()
  }, [])

  const handleBarcode = async (e) => {
    e.preventDefault()
    if (!barcode.trim()) return
    try {
      const { data } = await productsAPI.getByBarcode(barcode.trim())
      addToCart(data)
      setBarcode('')
    } catch {
      toast.error('Product not found')
      setBarcode('')
    }
  }

  const updateQty = (productId, qty) => {
    const num = parseFloat(qty)
    if (isNaN(num) || num <= 0) return
    setCart((prev) => prev.map((i) => {
      if (i.productId !== productId) return i
      if (num > i.maxStock) { toast.error('Insufficient stock'); return i }
      return { ...i, quantity: num, subtotal: num * i.unitPrice }
    }))
  }

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
  const discountAmount = discountType === 'percent'
    ? subtotal * (parseFloat(discount) || 0) / 100
    : parseFloat(discount) || 0
  const grandTotal = Math.max(0, subtotal - discountAmount)

  const completeSale = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return }
    if (paymentMethod === 'credit' && !customerId) {
      toast.error('Select a customer for credit sale')
      return
    }
    setLoading(true)
    try {
      const { data } = await salesAPI.create({
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        discount: discountAmount,
        paymentMethod,
        customerId: customerId || null,
      })
      setInvoice(data)
      setCart([])
      setDiscount(0)
      setCustomerId('')
      setPaymentMethod('cash')
      toast.success('Sale completed!')
      const prodRes = await productsAPI.getAll()
      setProducts(prodRes.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sale failed')
    } finally {
      setLoading(false)
      barcodeRef.current?.focus()
    }
  }

  const printInvoice = () => window.print()

  return (
    <div>
      <PageHeader title="Point of Sale" description="Process sales quickly" breadcrumbs="Home / POS" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Cart */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="!p-4">
            <form onSubmit={handleBarcode} className="flex gap-2">
              <Input
                ref={barcodeRef}
                placeholder="Scan or enter barcode..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="outline">Add</Button>
            </form>
          </Card>

          <Card className="!p-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                placeholder="Search products by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute z-10 left-4 right-4 mt-1 bg-white border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-sm text-muted">{formatPKR(p.sellingPrice)}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium w-20">Qty</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Subtotal</th>
                    <th className="pb-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        Cart is empty — scan a barcode or search products
                      </td>
                    </tr>
                  ) : (
                    cart.map((item) => (
                      <tr key={item.productId} className="border-b border-border/50">
                        <td className="py-3 font-medium">{item.name}</td>
                        <td className="py-3">
                          <input
                            type="number"
                            min="1"
                            max={item.maxStock}
                            value={item.quantity}
                            onChange={(e) => updateQty(item.productId, e.target.value)}
                            className="w-16 h-8 px-2 rounded-lg border border-border text-center"
                          />
                        </td>
                        <td className="py-3">{formatPKR(item.unitPrice)}</td>
                        <td className="py-3 font-medium">{formatPKR(item.subtotal)}</td>
                        <td className="py-3">
                          <button onClick={() => removeItem(item.productId)} className="text-danger hover:bg-red-50 p-1 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right - Checkout */}
        <div>
          <Card className="sticky top-4">
            <h3 className="text-lg font-semibold mb-4 font-[family-name:var(--font-heading)]">Checkout</h3>

            <div className="space-y-4">
              <Select
                label="Customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Walk-in Customer"
                options={customers.map((c) => ({ value: c.id, label: c.name }))}
              />

              <div className="flex gap-2">
                <Select
                  label="Discount Type"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  options={[
                    { value: 'pkr', label: 'PKR' },
                    { value: 'percent', label: '%' },
                  ]}
                  className="w-24"
                />
                <Input
                  label="Discount"
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <div className="flex gap-2 mt-1">
                  {['cash', 'credit'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                        paymentMethod === m
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-foreground hover:bg-gray-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPKR(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Discount</span>
                    <span className="text-danger">-{formatPKR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatPKR(grandTotal)}</span>
                </div>
              </div>

              <Button
                onClick={completeSale}
                disabled={loading || cart.length === 0}
                className="w-full"
                size="lg"
                variant="accent"
              >
                {loading ? 'Processing...' : 'Complete Sale'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={!!invoice} onClose={() => setInvoice(null)} title="Sale Complete" size="md">
        {invoice && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="success" className="mb-2">Success</Badge>
              <p className="text-lg font-bold">{invoice.invoiceNumber}</p>
              <p className="text-2xl font-bold text-primary mt-2">{formatPKR(invoice.totalAmount)}</p>
              <p className="text-sm text-muted capitalize mt-1">{invoice.paymentMethod} payment</p>
            </div>
            <div className="border-t border-border pt-4 space-y-1">
              {invoice.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product?.name} x{item.quantity}</span>
                  <span>{formatPKR(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={printInvoice} variant="outline" className="flex-1">
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button onClick={() => setInvoice(null)} className="flex-1">New Sale</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
