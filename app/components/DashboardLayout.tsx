'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">AgencyOS</h1>
          <p className="text-sm text-gray-600 mt-1">{user?.agencyName}</p>
        </div>

        <nav className="mt-8 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="w-5 h-5 mr-3">📊</span>
            Dashboard
          </Link>
          <Link
            href="/clients"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="w-5 h-5 mr-3">👥</span>
            Clients
          </Link>
          <Link
            href="/projects"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="w-5 h-5 mr-3">📋</span>
            Projects
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6">
          <div className="text-sm text-gray-700 mb-4">
            <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-gray-600">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow">
          <div className="px-8 py-4">
            <h2 className="text-gray-900 font-semibold">Agency Dashboard</h2>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
