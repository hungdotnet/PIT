import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Plus, 
  Search, 
  FileUp, 
  Edit2, 
  Trash2, 
  UserPlus, 
  CheckCircle2, 
  XCircle,
  Loader2
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface Employee {
  id: string
  ma_nv: string
  ho_ten: string
  don_vi: string
  ma_so_thue: string
  so_cccd: string
  nghi_viec: boolean
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    ma_nv: '',
    ho_ten: '',
    don_vi: '',
    ma_so_thue: '',
    so_cccd: '',
    nghi_viec: false
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('ma_nv', { ascending: true })
    
    if (data) setEmployees(data)
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEmployee) {
      const { error } = await supabase
        .from('employees')
        .update(formData)
        .eq('id', editingEmployee.id)
      if (!error) {
        setShowModal(false)
        fetchEmployees()
      }
    } else {
      const { error } = await supabase
        .from('employees')
        .insert([formData])
      if (!error) {
        setShowModal(false)
        fetchEmployees()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (!error) fetchEmployees()
    }
  }

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws) as any[]
      
      const formattedData = data.map(row => ({
        ma_nv: row.MaNV || row['Mã nhân viên'] || '',
        ho_ten: row.HoTen || row['Họ tên'] || '',
        don_vi: row.DonVi || row['Đơn vị'] || '',
        ma_so_thue: row.MaSoThue || row['Mã số thuế'] || '',
        so_cccd: row.SoCCCD || row['Số CCCD'] || '',
        nghi_viec: false
      }))

      const { error } = await supabase.from('employees').insert(formattedData)
      if (error) alert('Lỗi khi import: ' + error.message)
      else fetchEmployees()
    }
    reader.readAsBinaryString(file)
  }

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp)
    setFormData({
      ma_nv: emp.ma_nv,
      ho_ten: emp.ho_ten,
      don_vi: emp.don_vi,
      ma_so_thue: emp.ma_so_thue,
      so_cccd: emp.so_cccd,
      nghi_viec: emp.nghi_viec
    })
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditingEmployee(null)
    setFormData({
      ma_nv: '',
      ho_ten: '',
      don_vi: '',
      ma_so_thue: '',
      so_cccd: '',
      nghi_viec: false
    })
    setShowModal(true)
  }

  const filteredEmployees = employees.filter(emp => 
    emp.ho_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.ma_nv.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Nhân viên</h1>
          <p className="text-gray-500 text-sm">Quản lý thông tin hồ sơ nhân viên</p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 flex items-center shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500">
            <FileUp className="mr-2 h-4 w-4" />
            Import Excel
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
          </label>
          <button 
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center shadow-md transition-all active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 font-semibold text-gray-700 text-sm border-b border-gray-200">
                <th className="px-6 py-4">Mã NV</th>
                <th className="px-6 py-4">Họ và Tên</th>
                <th className="px-6 py-4">Đơn vị</th>
                <th className="px-6 py-4">MST / CCCD</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-500" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                    Không tìm thấy nhân viên nào.
                  </td>
                </tr>
              ) : filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-sm text-blue-600 font-bold">{emp.ma_nv}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{emp.ho_ten}</td>
                  <td className="px-6 py-4 text-gray-600">{emp.don_vi}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">MST: {emp.ma_so_thue || '---'}</div>
                    <div className="text-xs text-gray-500">CCCD: {emp.so_cccd || '---'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {emp.nghi_viec ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" /> Nghỉ việc
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Đang làm
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(emp)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
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
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">
                {editingEmployee ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhân viên *</label>
                  <input
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.ma_nv}
                    onChange={(e) => setFormData({...formData, ma_nv: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                  <input
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.ho_ten}
                    onChange={(e) => setFormData({...formData, ho_ten: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.don_vi}
                  onChange={(e) => setFormData({...formData, don_vi: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
                  <input
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.ma_so_thue}
                    onChange={(e) => setFormData({...formData, ma_so_thue: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số CCCD</label>
                  <input
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.so_cccd}
                    onChange={(e) => setFormData({...formData, so_cccd: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="nghi_viec"
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  checked={formData.nghi_viec}
                  onChange={(e) => setFormData({...formData, nghi_viec: e.target.checked})}
                />
                <label htmlFor="nghi_viec" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Nhân viên đã nghỉ việc
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95"
                >
                  {editingEmployee ? 'Lưu thay đổi' : 'Thêm nhân viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
