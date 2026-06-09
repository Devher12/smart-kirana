import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import toast from 'react-hot-toast'
import { salesAPI, customersAPI, reportsAPI } from '@/api'
import { formatPKR } from '@/utils/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'

const COLORS = ['#1B4332', '#2D6A4F', '#F59E0B', '#40916C', '#52B788', '#74C69D']

export default function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [topProducts, setTopProducts] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  const params = { startDate, endDate }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const [topRes, catRes, weekRes, custRes] = await Promise.all([
        salesAPI.getTopProducts({ ...params, limit: 10 }),
        salesAPI.getCategoryBreakdown(params),
        salesAPI.getWeeklySummary(),
        customersAPI.getAll(),
      ])
      setTopProducts(topRes.data)
      setCategoryData(catRes.data)
      setWeeklyData(weekRes.data)
      setCustomers(custRes.data)
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [startDate, endDate])

  const downloadDailyPDF = async () => {
    try {
      const { data } = await reportsAPI.downloadDailyPDF()
      const url = window.URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `daily-report-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch {
      toast.error('PDF download failed')
    }
  }

  const totalCredit = customers.reduce((s, c) => s + parseFloat(c.totalCredit), 0)
  const totalPaid = customers.reduce((s, c) => s + parseFloat(c.totalPaid), 0)
  const totalOutstanding = customers.reduce((s, c) => s + (c.outstanding || 0), 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Analyze sales performance and trends"
        breadcrumbs="Home / Reports"
        actions={
          <Button onClick={downloadDailyPDF} variant="accent">
            <Download className="w-4 h-4" /> Export Daily PDF
          </Button>
        }
      />

      <Card className="!p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardTitle>Top Selling Products</CardTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatPKR(v)} />
              <Bar dataKey="revenue" fill="#1B4332" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-2 text-left">Product</th>
                  <th className="pb-2 text-right">Sold</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-right">{p.sold}</td>
                    <td className="py-2 text-right font-medium">{formatPKR(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardTitle>Revenue by Category</CardTitle>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatPKR(v)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>Daily Sales Trend (Last 7 Days)</CardTitle>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatPKR(v)} labelFormatter={(v) => `Date: ${v}`} />
              <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>Customer Credit Summary</CardTitle>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-sm text-muted">Total Credit</p>
                <p className="text-xl font-bold mt-1">{formatPKR(totalCredit)}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50">
                <p className="text-sm text-muted">Total Paid</p>
                <p className="text-xl font-bold mt-1 text-success">{formatPKR(totalPaid)}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50">
                <p className="text-sm text-muted">Outstanding</p>
                <p className="text-xl font-bold mt-1 text-danger">{formatPKR(totalOutstanding)}</p>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {customers.filter((c) => c.outstanding > 0).map((c) => (
                <div key={c.id} className="flex justify-between p-3 rounded-lg bg-gray-50 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-danger font-medium">{formatPKR(c.outstanding)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
