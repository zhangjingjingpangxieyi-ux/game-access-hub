import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'

function Icon({ name, className = 'h-4 w-4' }) {
  const common = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (name === 'briefcase') return <svg {...common}><path d="M10 6h4" /><path d="M8 6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" /><path d="M4 13h16" /></svg>
  if (name === 'book') return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" /></svg>
  if (name === 'help') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.4 2.4 0 0 1 4.6 1c0 1.8-2.3 2-2.3 3.6" /><path d="M12 17h.01" /></svg>
  if (name === 'key') return <svg {...common}><circle cx="7.5" cy="14.5" r="3.5" /><path d="M10 12l8-8" /><path d="M15 7l2 2" /><path d="M17 5l2 2" /></svg>
  if (name === 'close') return <svg {...common}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
  return <svg {...common}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></svg>
}

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, roles, logout } = useAuth()
  const accountName = user?.display_name || user?.name || user?.email || String.fromCharCode(20225,19994,36134,21495)
  const roleLabel = roles.length ? roles.join(' / ') : String.fromCharCode(26222,36890,25104,21592)

  const navLinks = [
    { to: '/', label: '项目管理', icon: 'briefcase' },
    { to: '/docs', label: '文档中心', icon: 'book' },
    { to: '/guide', label: '使用指南', icon: 'help' },
  ]

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] border-b border-slate-200 bg-white flex items-center px-4 md:px-6 shadow-sm">
        <div className="text-slate-950 font-semibold text-[14px] md:text-[15px] tracking-wide flex-shrink-0">
          运营后台接入工作台
        </div>

        {/* 桌面端导航链接 */}
        <div className="hidden md:flex gap-1 ml-8">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'
                }`
              }
            >
              <Icon name={link.icon} className="h-4 w-4" />{link.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-3" title="??????">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-[12px] font-semibold text-primary-700">{accountName.slice(0, 1).toUpperCase()}</span>
            <div className="max-w-[150px] leading-tight">
              <div className="truncate text-[12px] font-medium text-slate-700">{accountName}</div>
              <div className="truncate text-[10px] text-slate-400">已登录 ? {roleLabel}</div>
              <button onClick={logout} className="text-[10px] text-slate-400 hover:text-red-600">退出</button>
            </div>
          </div>

          {/* 桌面端管理入口 */}
          <NavLink
            to="/admin"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 rounded-md text-slate-500 text-[12px] hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 transition-colors"
          >
            <Icon name="key" className="h-3.5 w-3.5" />
            管理入口
          </NavLink>

          {/* 移动端汉堡按钮 */}
          <button
            className="md:hidden icon-control"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <Icon name="close" className="h-5 w-5" /> : <Icon name="menu" className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* 移动端下拉菜单 */}
      {menuOpen && (
        <div className="fixed top-[52px] left-0 right-0 z-40 border-b border-slate-200 bg-white shadow-lg md:hidden">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-3.5 text-[14px] border-b border-slate-100 transition-colors ${
                  isActive ? 'text-primary-700 font-semibold bg-primary-50' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`
              }
            >
              <Icon name={link.icon} className="h-4 w-4" />{link.label}
            </NavLink>
          ))}
          <NavLink
            to="/admin"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-5 py-3.5 text-[14px] text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-colors"
          >
            <Icon name="key" className="h-4 w-4" />
            管理入口
          </NavLink>
        </div>
      )}

      {/* 页面内容 */}
      <div className="pt-[52px]">
        {children}
      </div>
    </div>
  )
}
