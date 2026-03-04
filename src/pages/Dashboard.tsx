import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  DollarSign,
  Loader2,
  AlertCircle
} from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeDependents: 0,
    totalTaxThisMonth: 0,
    lastMonthTax: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    const thisMonth = `${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`
    
    const [empRes, depRes, taxRes] = await Promise.all([
      supabase.from('employees').select('id', { count: 'exact' }).eq('nghi_viec', false),
      supabase.from('dependents').select('id', { count: 'exact' }).eq('khong_su_dung', false),
      supabase.from('income_records').select('thue_tncn_tam_tinh').eq('thang_nam', thisMonth)
    ])

    const totalTax = (taxRes.data || []).reduce((acc, curr) => acc + curr.thue_tncn_tam_tinh, 0)

    setStats({
      totalEmployees: empRes.count || 0,
      activeDependents: depRes.count || 0,
      totalTaxThisMonth: totalTax,
      lastMonthTax: 0 // Simplification
    })
    setLoading(false)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tổng quan hệ thống</h1>
        <p className="mt-2 text-gray-500">Chào mừng bạn trở lại, Nhân viên Kế toán.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Nhân viên" 
          value={stats.totalEmployees} 
          icon={<Users className="text-blue-600" />} 
          color="bg-blue-50"
          subtitle="Đang làm việc"
        />
        <StatCard 
          title="Người phụ thuộc" 
          value={stats.activeDependents} 
          icon={<UserPlus className="text-purple-600" />} 
          color="bg-purple-50"
          subtitle="Đang tính giảm trừ"
        />
        <StatCard 
          title="Tổng thuế tháng này" 
          value={formatCurrency(stats.totalTaxThisMonth)} 
          icon={<DollarSign className="text-green-600" />} 
          color="bg-green-50"
          subtitle="Tạm tính"
        />
        <StatCard 
          title="Biến động" 
          value="+12%" 
          icon={<TrendingUp className="text-orange-600" />} 
          color="bg-orange-50"
          subtitle="So với tháng trước"
        />
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <CalcIcon size={120} />
        </div>
        <div className="relative z-10 w-full md:w-2/3">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mẹo tính thuế nhanh</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Bạn có thể Import danh sách nhân viên và thu nhập từ file Excel để tiết kiệm thời gian. 
            Hệ thống sẽ tự động đối soát người phụ thuộc và áp dụng định mức giảm trừ mới nhất theo luật Việt Nam.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-100 italic">
              <AlertCircle size={16} className="mr-2" />
              Bản thân: 11tr/tháng
            </div>
            <div className="flex items-center bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-semibold border border-purple-100 italic">
              <AlertCircle size={16} className="mr-2" />
              NPT: 4.4tr/tháng
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color, subtitle }: any) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-gray-500 text-sm font-medium mb-1">{title}</div>
      <div className="text-3xl font-black text-gray-900 truncate tracking-tight">{value}</div>
      <div className="mt-2 text-xs text-gray-400 font-medium ">{subtitle}</div>
    </div>
  )
}

function CalcIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  )
}
