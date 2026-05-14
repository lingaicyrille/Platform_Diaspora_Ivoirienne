'use client'
import { useState } from 'react'
import { Sidebar } from './sidebar'
import { TopBar } from './topbar'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  user: {
    full_name: string
    email: string
    country_of_residence?: string
    is_verified?: boolean
  } | null
  onLogout: () => void
}

export function AppLayout({ children, title, user, onLogout }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={onLogout}
      />

      {/* Content area */}
      <div className="flex flex-col flex-1 lg:ml-64 min-w-0 overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          user={user}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
