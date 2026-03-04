import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  Users, 
  UserPlus, 
  Calculator, 
  LayoutDashboard, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Tổng quan', href: '/', icon: LayoutDashboard },
  { name: 'Nhân viên', href: '/employees', icon: Users },
  { name: 'Người phụ thuộc', href: '/dependents', icon: UserPlus },
  { name: 'Tính thuế TNCN', href: '/tax', icon: Calculator },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white shadow-xl transition-transform transform">
          <div className="flex items-center justify-between h-16 px-4 bg-blue-600 text-white">
            <span className="text-xl font-bold italic tracking-tight">PIT Calc</span>
            <button onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  location.pathname === item.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
          <div className="flex items-center h-16 px-6 bg-blue-600 text-white shadow-md">
            <Calculator className="mr-3" />
            <span className="text-xl font-bold tracking-tight">Thuế TNCN</span>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto pt-5 pb-4">
            <nav className="flex-1 px-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    location.pathname === item.href
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${location.pathname === item.href ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="px-3 mt-auto">
              <button
                onClick={handleLogout}
                className="w-full group flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-all"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none">
            <Menu size={24} />
          </button>
          <span className="ml-4 text-lg font-bold text-gray-800">Thuế TNCN</span>
        </header>
        <main className="flex-1 relative overflow-y-auto focus:outline-none py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
