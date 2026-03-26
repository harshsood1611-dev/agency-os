'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  FileText,
  TrendingUp,
  Bell,
  DollarSign,
  FolderOpen,
  User
} from 'lucide-react';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const sidebarItems: SidebarItem[] = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Users size={20} />, label: 'Clients', href: '/clients' },
    { icon: <Briefcase size={20} />, label: 'Projects', href: '/projects' },
    { icon: <MessageSquare size={20} />, label: 'Messages', href: '/messages' },
    { icon: <FileText size={20} />, label: 'Documents', href: '/documents' },
    { icon: <DollarSign size={20} />, label: 'Revenue', href: '/revenue' },
    { icon: <TrendingUp size={20} />, label: 'Analytics', href: '/analytics' },
  ];

  const secondaryItems: SidebarItem[] = [
    { icon: <Bell size={20} />, label: 'Notifications', href: '/notifications' },
    { icon: <Settings size={20} />, label: 'Settings', href: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative h-full bg-card border-r border-border shadow-lg transition-transform duration-300 z-30 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-64 flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AO</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AgencyOS</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.agencyName || 'Agency'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-4">
            Main Menu
          </p>
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-foreground rounded-lg hover:bg-secondary hover:text-primary transition-colors group"
            >
              <span className="text-muted-foreground group-hover:text-primary transition-colors">
                {item.icon}
              </span>
              <span className="font-medium flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          <div className="my-6 border-t border-border pt-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-4">
              Tools
            </p>
            {secondaryItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-foreground rounded-lg hover:bg-secondary hover:text-primary transition-colors group"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">
                  {item.icon}
                </span>
                <span className="font-medium flex-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border space-y-4 bg-secondary/30">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium text-sm"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-lg font-semibold text-foreground flex-1 ml-4 lg:ml-0">
              Dashboard
            </h2>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                <Bell size={20} />
              </button>
              <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 md:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
