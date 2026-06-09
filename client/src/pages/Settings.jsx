import { useEffect, useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsAPI } from '@/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/utils/formatters'

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [storeForm, setStoreForm] = useState({ storeName: '', ownerName: '', ownerEmail: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [userModal, setUserModal] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'cashier' })
  const [errors, setErrors] = useState({})

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data } = await settingsAPI.get()
      setSettings(data.settings)
      setUsers(data.users)
      setStoreForm({
        storeName: data.settings.storeName || '',
        ownerName: data.settings.ownerName || '',
        ownerEmail: data.settings.ownerEmail || '',
      })
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSettings() }, [])

  const saveStore = async () => {
    try {
      await settingsAPI.update(storeForm)
      toast.success('Store settings updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  const changePassword = async () => {
    const errs = {}
    if (!passwordForm.currentPassword) errs.currentPassword = 'Required'
    if (!passwordForm.newPassword) errs.newPassword = 'Required'
    else if (passwordForm.newPassword.length < 6) errs.newPassword = 'Min 6 characters'
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }

    try {
      await settingsAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed')
    }
  }

  const createUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast.error('All fields are required')
      return
    }
    try {
      await settingsAPI.createUser(userForm)
      toast.success('User created')
      setUserModal(false)
      setUserForm({ name: '', email: '', password: '', role: 'cashier' })
      fetchSettings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage store and user accounts" breadcrumbs="Home / Settings" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Store Information</CardTitle>
          <div className="space-y-4 mt-4">
            <Input label="Store Name" value={storeForm.storeName} onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })} />
            <Input label="Owner Name" value={storeForm.ownerName} onChange={(e) => setStoreForm({ ...storeForm, ownerName: e.target.value })} />
            <Input label="Owner Email" type="email" value={storeForm.ownerEmail} onChange={(e) => setStoreForm({ ...storeForm, ownerEmail: e.target.value })} />
            <Button onClick={saveStore}>Save Changes</Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Change Password</CardTitle>
          <div className="space-y-4 mt-4">
            <Input label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} error={errors.currentPassword} />
            <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} error={errors.newPassword} />
            <Input label="Confirm Password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} error={errors.confirmPassword} />
            <Button onClick={changePassword}>Update Password</Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>User Management</CardTitle>
            <Button size="sm" onClick={() => setUserModal(true)}><UserPlus className="w-4 h-4" /> Add Cashier</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-3 font-medium">{u.name}</td>
                    <td className="py-3">{u.email}</td>
                    <td className="py-3"><Badge variant={u.role === 'owner' ? 'primary' : 'default'}>{u.role}</Badge></td>
                    <td className="py-3">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal open={userModal} onClose={() => setUserModal(false)} title="Add User">
        <div className="space-y-4">
          <Input label="Name" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
          <Input label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
          <Input label="Password" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
          <Select label="Role" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} options={[{ value: 'cashier', label: 'Cashier' }, { value: 'owner', label: 'Owner' }]} />
          <Button onClick={createUser} className="w-full"><Plus className="w-4 h-4" /> Create User</Button>
        </div>
      </Modal>
    </div>
  )
}
