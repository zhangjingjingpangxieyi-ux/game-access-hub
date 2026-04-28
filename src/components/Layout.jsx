import { NavLink } from 'react-router-dom'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-[#1a1d2e] flex items-center px-6 shadow-lg">
        <div className="text-white font-bold text-[15px] tracking-wide">
          游戏接入<span className="text-primary-400">Hub</span>
        </div>
        <div className="flex gap-1 ml-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-md text-[13px] transition-colors ${
                isActive ? 'bg-primary-400/20 text-primary-400 font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/[0.08]'
              }`
            }
          >
            项目管理
          </NavLink>
          <NavLink
            to="/docs"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-md text-[13px] transition-colors ${
                isActive ? 'bg-primary-400/20 text-primary-400 font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/[0.08]'
              }`
            }
          >
            文档中心
          </NavLink>
        </div>
        <div className="ml-auto">
          <NavLink
            to="/admin"
            className="px-3.5 py-1.5 border border-white/20 rounded-md text-gray-400 text-[12px] hover:border-primary-400 hover:text-primary-400 transition-colors"
          >
            🔑 管理入口
          </NavLink>
        </div>
      </nav>

      {/* 页面内容 */}
      <div className="pt-[52px]">
        {children}
      </div>
    </div>
  )
}
