import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, ShoppingBag, AlertTriangle, CreditCard } from 'lucide-react'
import { dashboardAPI, salesAPI } from '@/api'
import { formatPKR } from '@/utils/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'

const COLORS = ['#1B4332', '#2D6A4F', '#F59E0B', '#40916C', '#52B788', '#74C69D']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const [dashRes, catRes] = await Promise.all([
          dashboardAPI.get(),
          salesAPI.getCategoryBreakdown(),
        ])
        setData(dashRes.data)
        setCategoryData(catRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  const stats = [
    { label: "Today's Revenue", value: formatPKR(data.todaySales), icon: TrendingUp, color: 'text-primary' },
    { label: "Today's Transactions", value: data.todayTransactions, icon: ShoppingBag, color: 'text-accent' },
    { label: 'Low Stock Items', value: data.lowStockCount, icon: AlertTriangle, color: 'text-warning' },
    { label: 'Pending Credit', value: formatPKR(data.pendingCreditTotal), icon: CreditCard, color: 'text-danger' },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your store performance" breadcrumbs="Home / Dashboard" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="!p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{label}</p>
                <p className="text-2xl font-bold mt-1 font-[family-name:var(--font-heading)]">{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardTitle>Weekly Revenue</CardTitle>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.weeklyRevenueChart}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B4332" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1B4332" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatPKR(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#1B4332" fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>Top 5 Products Today</CardTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(v) => formatPKR(v)} />
              <Bar dataKey="revenue" fill="#F59E0B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardTitle>Category Breakdown</CardTitle>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryData} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category }) => category}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatPKR(v)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            Low Stock Alerts
            <Badge variant="danger">{data.lowStockCount}</Badge>
          </CardTitle>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.lowStockProducts?.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">All stock levels are healthy</p>
            ) : (
              data.lowStockProducts?.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate('/inventory')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  <Badge variant={p.currentStock <= p.minStockThreshold / 2 ? 'danger' : 'warning'}>
                    {p.currentStock} left
                  </Badge>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            Expiring Soon
            <Badge variant="warning">{data.expiringProductsCount}</Badge>
          </CardTitle>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.expiringProducts?.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">No products expiring soon</p>
            ) : (
              data.expiringProducts?.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate('/inventory')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  <Badge variant="warning">{p.expiryDate}</Badge>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
