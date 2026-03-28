'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Users, TrendingUp, Briefcase, DollarSign, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  prospects: number;
  activeProjects?: number;
  completedProjects?: number;
  totalRevenue?: number;
  pendingPayments?: number;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/clients/stats/overview`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-4 rounded-lg">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back! Here's your agency overview.</p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-20 bg-muted rounded-lg"></div>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <>
              {/* Main Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Clients */}
                <Card className="p-6 border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                      <p className="text-3xl font-bold text-foreground mt-3">{stats.totalClients}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Users className="text-primary" size={24} />
                    </div>
                  </div>
                </Card>

                {/* Active Clients */}
                <Card className="p-6 border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                      <p className="text-3xl font-bold text-foreground mt-3">{stats.activeClients}</p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                      <TrendingUp className="text-emerald-500" size={24} />
                    </div>
                  </div>
                </Card>

                {/* Active Projects */}
                <Card className="p-6 border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                      <p className="text-3xl font-bold text-foreground mt-3">{stats.activeProjects || 0}</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                      <Briefcase className="text-amber-500" size={24} />
                    </div>
                  </div>
                </Card>

                {/* Total Revenue */}
                <Card className="p-6 border-l-4 border-l-emerald-600 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-3xl font-bold text-foreground mt-3">{"$" + (stats.totalRevenue || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-emerald-600/10 rounded-lg">
                      <DollarSign className="text-emerald-600" size={24} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Prospects */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Pipeline</p>
                  <p className="text-2xl font-bold text-foreground">{stats.prospects}</p>
                  <p className="text-xs text-muted-foreground mt-2">Prospects & Leads</p>
                </Card>

                {/* Completed Projects */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Completed</p>
                  <p className="text-2xl font-bold text-foreground">{stats.completedProjects || 0}</p>
                  <p className="text-xs text-muted-foreground mt-2">Finished Projects</p>
                </Card>

                {/* Pending Payments */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Pending</p>
                  <p className="text-2xl font-bold text-foreground">{"$" + (stats.pendingPayments || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">Awaiting Payment</p>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <a
                    href="/clients/new"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                  >
                    <Users size={16} /> Add Client
                  </a>
                  <a
                    href="/projects/new"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                  >
                    <Briefcase size={16} /> New Project
                  </a>
                  <a
                    href="/clients"
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-border hover:bg-secondary rounded-lg transition-colors font-medium text-sm"
                  >
                    <Users size={16} /> View Clients
                  </a>
                  <a
                    href="/projects"
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-border hover:bg-secondary rounded-lg transition-colors font-medium text-sm"
                  >
                    <Briefcase size={16} /> All Projects
                  </a>
                </div>
              </Card>
            </>
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
