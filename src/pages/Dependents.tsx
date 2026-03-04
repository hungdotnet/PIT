import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserPlus, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Calendar,
  User as UserIcon
} from 'lucide-react'

interface Dependent {
  id: string
  employee_id: string
  ho_ten: string
  quan_he: string
  ngay_sinh: string
  ma_so_thue: string
  so_cccd: string
  tu_thang: string
  den_thang: string
  khong_su_dung: boolean
  employee?: {
    ho_ten: string
    ma_nv: string
  }
}

interface Employee {
  id: string
  ho_ten: string
  ma_nv: string
}

export default function Dependents() {
  const [dependents, setDependents] = useState<Dependent[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDependent, setEditingDependent] = useState<Dependent | null>(null)
  
  const [formData, setFormData] = useState({
    employee_id: '',
    ho_ten: '',
    quan_he: '',
    ngay_sinh: '',
    ma_so_thue: '',
    so_cccd: '',
    tu_thang: '', // MM/YYYY
    den_thang: '', // MM/YYYY
    khong_su_dung: false
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [depsRes, empsRes] = await Promise.all([
      supabase.from('dependents').select('*, employee:employees(ho_ten, ma_nv)').order('created_at', { ascending: false }),
      supabase.from('employees').select('id, ho_ten, ma_nv').eq('nghi_viec', false).order('ma_nv')
    ])
    
    if (depsRes.data) setDependents(depsRes.data)
    if (empsRes.data) setEmployees(empsRes.data)
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingDependent) {
      const { error } = await supabase.from('dependents').update(formData).eq('id', editingDependent.id)
      if (!error) { setShowModal(false); fetchData() }
    } else {
      const { error } = await supabase.from('dependents').insert([formData])
      if (!error) { setShowModal(false); fetchData() }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Xóa người phụ thuộc này?')) {
      const { error } = await supabase.from('dependents').delete().eq('id', id)
      if (!error) fetchData()
    }
  }

  const openEditModal = (dep: Dependent) => {
    setEditingDependent(dep)
    setFormData({
      employee_id: dep.employee_id,
      ho_ten: dep.ho_ten,
      quan_he: dep.quan_he || '',
      ngay_sinh: dep.ngay_sinh || '',
      ma_so_thue: dep.ma_so_thue || '',
      so_cccd: dep.so_cccd || '',
      tu_thang: dep.tu_thang,
      den_thang: dep.den_thang || '',
      khong_su_dung: dep.khong_su_dung
    })
    setShowModal(true)
  }

  const filteredDependents = dependents.filter(dep => 
    dep.ho_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dep.employee?.ho_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dep.employee?.ma_nv.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Người phụ thuộc</h1>
          <p className="text-gray-500 text-sm">Ghi nhận người phụ thuộc để giảm trừ gia cảnh</p>
        </div>
        <button 
          onClick={() => {
            setEditingDependent(null)
            setFormData({
              employee_id: '',
              ho_ten: '',
              quan_he: '',
              ngay_sinh: '',
              ma_so_thue: '',
              so_cccd: '',
              tu_thang: '',
              den_thang: '',
              khong_su_dung: false
            })
            setShowModal(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center shadow-md transition-all active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm người phụ thuộc
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              type="text"
              placeholder="Tìm theo NV hoặc người phụ thuộc..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
                <th className="px-6 py-4">Nhân viên bảo lãnh</th>
                <th className="px-6 py-4">Người phụ thuộc</th>
                <th className="px-6 py-4">Quan hệ / Ngày sinh</th>
                <th className="px-6 py-4">Thời gian giảm trừ</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-500" /></td></tr>
              ) : filteredDependents.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Chưa có người phụ thuộc nào.</td></tr>
              ) : filteredDependents.map((dep) => (
                <tr key={dep.id} className="hover:bg-blue-50/20 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{dep.employee?.ho_ten}</div>
                    <div className="text-xs text-blue-600 font-mono">{dep.employee?.ma_nv}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-700">{dep.ho_ten}</div>
                    <div className="text-xs text-gray-500">MST/CCCD: {dep.ma_so_thue || dep.so_cccd || '---'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{dep.quan_he}</div>
                    <div className="text-xs text-gray-400">{dep.ngay_sinh ? new Date(dep.ngay_sinh).toLocaleDateString('vi-VN') : '---'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="mr-1 h-3 w-3" />
                      {dep.tu_thang} - {dep.den_thang || 'Nay'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {dep.khong_su_dung ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Dừng giảm trừ</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Đang giảm trừ</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(dep)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(dep.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-bold text-gray-900">{editingDependent ? 'Cập nhật' : 'Thêm mới'} người phụ thuộc</h2>
              <button onClick={() => setShowModal(false)}><XCircle size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên bảo lãnh *</label>
                <select 
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.ma_nv} - {emp.ho_ten}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên người phụ thuộc *</label>
                  <input required className="w-full px-4 py-2 border border-gray-300 rounded-xl" value={formData.ho_ten} onChange={(e) => setFormData({...formData, ho_ten: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mối quan hệ</label>
                  <input className="w-full px-4 py-2 border border-gray-300 rounded-xl" placeholder="Con, Vợ, Chồng,..." value={formData.quan_he} onChange={(e) => setFormData({...formData, quan_he: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-xl" value={formData.ngay_sinh} onChange={(e) => setFormData({...formData, ngay_sinh: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MST (nếu có)</label>
                  <input className="w-full px-4 py-2 border border-gray-300 rounded-xl" value={formData.ma_so_thue} onChange={(e) => setFormData({...formData, ma_so_thue: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ tháng (MM/YYYY) *</label>
                  <input required placeholder="01/2024" className="w-full px-4 py-2 border border-gray-300 rounded-xl" value={formData.tu_thang} onChange={(e) => setFormData({...formData, tu_thang: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến tháng (MM/YYYY)</label>
                  <input placeholder="12/2025" className="w-full px-4 py-2 border border-gray-300 rounded-xl" value={formData.den_thang} onChange={(e) => setFormData({...formData, den_thang: e.target.value})} />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="khong_su_dung" className="w-4 h-4 rounded" checked={formData.khong_su_dung} onChange={(e) => setFormData({...formData, khong_su_dung: e.target.checked})} />
                <label htmlFor="khong_su_dung" className="text-sm font-medium text-gray-700 cursor-pointer">Dừng tính giảm trừ (không còn sử dụng)</label>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 rounded-xl">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow-md">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
