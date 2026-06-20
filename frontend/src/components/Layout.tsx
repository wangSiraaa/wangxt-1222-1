import React from 'react'
import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import '@/styles/layout.css'

interface MenuItem {
  key: string
  label: string
  icon: ReactNode
  path: string
}

interface Props {
  children: ReactNode
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', label: '调度总览', icon: '📊', path: '/' },
  { key: 'water-level', label: '水位录入', icon: '💧', path: '/water-level' },
  { key: 'gate-schedule', label: '闸门调度', icon: '🚪', path: '/gate-schedule' },
  { key: 'gate-actual', label: '实际开度', icon: '📏', path: '/gate-actual' },
  { key: 'ecological', label: '生态流量', icon: '🌿', path: '/ecological' },
  { key: 'water-supply', label: '供水影响', icon: '🚰', path: '/water-supply' },
  { key: 'approval', label: '审批记录', icon: '✅', path: '/approval' },
  { key: 'warning', label: '预警中心', icon: '⚠️', path: '/warning' },
]

const Layout: React.FC<Props> = ({ children }) => {
  const location = useLocation()

  return (
    <div className="app-layout">
      <aside className="app-sider">
        <div className="app-logo">🏞️ 水库调度系统</div>
        <nav className="app-menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={`app-menu-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="app-content">
        <header className="app-header">
          <div className="app-header-title">
            {menuItems.find((m) => location.pathname === m.path)?.label || '水库闸门调度系统'}
          </div>
          <div className="app-header-user">
            <span>👤 调度员</span>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}

export default Layout
