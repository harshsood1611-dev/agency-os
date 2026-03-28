'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Card } from '@/components/ui/card';

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <Card className="p-4">
            {loading ? (
              <p>Loading analytics...</p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : !stats ? (
              <p>No data available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="p-4 bg-background border border-border rounded-lg">
                  <h3 className="text-sm text-muted-foreground">Total Clients</h3>
                  <p className="text-3xl font-bold">{stats.totalClients || 0}</p>
                </div>
                <div className="p-4 bg-background border border-border rounded-lg">
                  <h3 className="text-sm text-muted-foreground">Active Projects</h3>
                  <p className="text-3xl font-bold">{stats.activeProjects || 0}</p>
                </div>
                <div className="p-4 bg-background border border-border rounded-lg">
                  <h3 className="text-sm text-muted-foreground">Revenue</h3>
                  <p className="text-3xl font-bold">${stats.totalRevenue?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 bg-background border border-border rounded-lg">
                  <h3 className="text-sm text-muted-foreground">Task Completion</h3>
                  <p className="text-3xl font-bold">{stats.taskCompletionRate || 0}%</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
