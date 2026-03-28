'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (user.role === 'manager') {
        router.replace('/manager/dashboard');
      } else {
        router.replace('/employee/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-medium">Redirecting to your role dashboard...</p>
      </div>
    </ProtectedRoute>
  );
}
