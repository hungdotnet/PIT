import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { 
  FileUp, 
  Search, 
  History, 
  Calculator as CalcIcon, 
  Table as TableIcon,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { calculatePIT, isDependentActive, PERSONAL_DEDUCTION, DEPENDENT_DEDUCTION } from '../utils/taxCalculator'

interface TaxRecord {
  id?: string
  employee_id: string
  employee_name?: string
  employee_code?: string
  thang_nam: string
  tong_thu_nhap: number
  khong_chiu_thue: number
  bao_hiem: number
  so_nguoi_phu_thuoc: number
  thu_nhap_tinh_thue: number
  thue_tncn: number
}

export default function TaxCalculation() {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
  })
  const [records, setRecords] = useState<TaxRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null)

  const fetchHistory = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('income_records')
      .select('*, employee:employees(ho_ten, ma_nv)')
      .eq('thang_nam', month)
    
    if (data) {
      setRecords(data.map(r => ({
        id: r.id,
        employee_id: r.employee_id,
        employee_name: r.employee.ho_ten,
        employee_code: r.employee.ma_nv,
        thang_nam: r.thang_nam,
        tong_thu_nhap: r.tong_thu_nhap,
        khong_chiu_thue: r.khong_chiu_thue,
        bao_hiem: r.bao_hiem,
        so_nguoi_phu_thuoc: 0, // Will fetch if needed
        thu_nhap_tinh_thue: 0,
        thue_tncn: r.thue_tncn_tam_tinh
      })))
    }
    setLoading(false)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      setLoading(true)
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws) as any[]

        // Fetch all employees and dependents
        const [empRes, depRes] = await Promise.all([
          supabase.from('employees').select('id, ma_nv, ho_ten'),
          supabase.from('dependents').select('*')
        ])

        const employees = empRes.data || []
        const allDependents = depRes.data || []

        const newRecords: TaxRecord[] = []
        
        for (const row of data) {
          const maNV = (row.MaNV || row['Mã NV'] || row['Mã nhân viên']).toString()
          const emp = employees.find(e => e.ma_nv === maNV)
          if (!emp) continue

          const tongThuNhap = Number(row.TongThuNhap || row['Tổng thu nhập'] || 0)
          const khongChiuThue = Number(row.KhgChiuThue || row['Thu nhập không chịu thuế'] || 0)
          const baoHiem = Number(row.BaoHiem || row['Bảo hiểm'] || 0)

          // Count active dependents for this month
          const activeDeps = allDependents.filter(d => 
            d.employee_id === emp.id && isDependentActive(d, month)
          )

          const personalDeduction = PERSONAL_DEDUCTION
          const dependentDeduction = activeDeps.length * DEPENDENT_DEDUCTION
          
          let taxableIncome = tongThuNhap - khongChiuThue - baoHiem - personalDeduction - dependentDeduction
          if (taxableIncome < 0) taxableIncome = 0

          const pit = calculatePIT(taxableIncome)

          newRecords.push({
            employee_id: emp.id,
            employee_name: emp.ho_ten,
            employee_code: emp.ma_nv,
            thang_nam: month,
            tong_thu_nhap: tongThuNhap,
            khong_chiu_thue: khongChiuThue,
            bao_hiem: baoHiem,
            so_nguoi_phu_thuoc: activeDeps.length,
            thu_nhap_tinh_thue: taxableIncome,
            thue_tncn: pit
          })
        }

        setRecords(newRecords)
        setStatusMsg({type: 'success', text: `Đã tính toán xong cho ${newRecords.length} nhân viên.`})
      } catch (err) {
        setStatusMsg({type: 'error', text: 'Lỗi khi xử lý file Excel.'})
      }
      setLoading(false)
    }
    reader.readAsBinaryString(file)
  }

  const handleSaveToDB = async () => {
    setLoading(true)
    // Clear old records for this month first
    await supabase.from('income_records').delete().eq('thang_nam', month)
    
    const toInsert = records.map(r => ({
      employee_id: r.employee_id,
      thang_nam: r.thang_nam,
      tong_thu_nhap: r.tong_thu_nhap,
      khong_chiu_thue: r.khong_chiu_thue,
      bao_hiem: r.bao_hiem,
      thue_tncn_tam_tinh: r.thue_tncn
    }))

    const { error } = await supabase.from('income_records').insert(toInsert)
    if (error) setStatusMsg({type: 'error', text: 'Lỗi khi lưu dữ liệu.'})
    else setStatusMsg({type: 'success', text: 'Đã lưu kết quả tính thuế thành công.'})
    setLoading(false)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tính thuế Thu nhập cá nhân</h1>
          <p className="text-gray-500 text-sm">Cấu hình tham số và nhập liệu thu nhập tháng</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex bg-white border border-gray-300 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <span className="text-gray-500 mr-2 text-sm self-center">Tháng:</span>
            <input 
              type="text" 
              placeholder="03/2026" 
              className="outline-none w-20 text-sm font-bold"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchHistory}
            className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600"
            title="Xem lịch sử tháng này"
          >
            <History size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg space-y-4">
            <h3 className="font-bold flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" /> Tham số hiện tại
            </h3>
            <div className="space-y-3 text-sm opacity-90">
              <div className="flex justify-between">
                <span>Giảm trừ bản thân:</span>
                <span className="font-bold">{formatCurrency(PERSONAL_DEDUCTION)}</span>
              </div>
              <div className="flex justify-between">
                <span>Giảm trừ NPT:</span>
                <span className="font-bold">{formatCurrency(DEPENDENT_DEDUCTION)}</span>
              </div>
            </div>
            <div className="pt-2">
              <label className="w-full flex items-center justify-center bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl cursor-pointer transition-colors border border-white/30">
                <FileUp className="mr-2 h-5 w-5" />
                <span className="font-semibold">Import Thu nhập</span>
                <input type="file" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </div>
          
          {records.length > 0 && (
            <button 
              onClick={handleSaveToDB}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
              Lưu kết quả
            </button>
          )}

          {statusMsg && (
            <div className={`p-4 rounded-xl text-sm font-medium ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {statusMsg.text}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Thu nhập / Trừ</th>
                  <th className="px-6 py-4 text-center">NPT</th>
                  <th className="px-6 py-4">Thu nhập tính thuế</th>
                  <th className="px-6 py-4 text-right">Thuế TNCN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                      <TableIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Vui lòng Import file Excel thu nhập tháng para tính toán.</p>
                    </td>
                  </tr>
                ) : records.map((r, i) => (
                  <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{r.employee_name}</div>
                      <div className="text-xs text-blue-600 font-mono">{r.employee_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">TN: {formatCurrency(r.tong_thu_nhap)}</div>
                      <div className="text-xs text-red-500">BH: {formatCurrency(r.bao_hiem)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
                        {r.so_nguoi_phu_thuoc}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {formatCurrency(r.thu_nhap_tinh_thue)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-lg font-black text-blue-700">{formatCurrency(r.thue_tncn)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
