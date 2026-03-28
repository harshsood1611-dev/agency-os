'use client';

import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Card } from '@/components/ui/card';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function EmployeeDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== 'employee') {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="p-4">My Tasks</Card>
            <Card className="p-4">My Projects</Card>
            <Card className="p-4">Performance</Card>
            <Card className="p-4">Team Chat</Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
