'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { DollarSign, FileText, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  dueDate: string;
  clientId: { name: string };
}

interface RevenueStats {
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  totalInvoices: number;
  paidInvoices: number;
}

export default function RevenuePage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        // Fetch stats
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/invoices/stats/overview`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch invoices
        const invoicesRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/invoices?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (invoicesRes.ok) {
          const invoicesData = await invoicesRes.json();
          setInvoices(invoicesData.invoices);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-l-emerald-500';
      case 'Overdue':
        return 'bg-red-50 text-red-700 border-l-red-500';
      case 'Sent':
        return 'bg-blue-50 text-blue-700 border-l-blue-500';
      default:
        return 'bg-gray-50 text-gray-700 border-l-gray-500';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Revenue & Billing</h1>
              <p className="text-muted-foreground mt-2">Manage invoices and track payments</p>
            </div>
            <Link
              href="#create-invoice"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              New Invoice
            </Link>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

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
              {/* Revenue Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 border-l-4 border-l-emerald-600">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-3xl font-bold text-foreground mt-3">
                        ${stats.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-600/10 rounded-lg">
                      <DollarSign className="text-emerald-600" size={24} />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-blue-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Paid Invoices</p>
                      <p className="text-3xl font-bold text-foreground mt-3">
                        ${stats.paidAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">{stats.paidInvoices} invoices</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <FileText className="text-blue-500" size={24} />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-amber-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Payment</p>
                      <p className="text-3xl font-bold text-foreground mt-3">
                        ${stats.pendingAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                      <TrendingUp className="text-amber-500" size={24} />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-red-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                      <p className="text-3xl font-bold text-foreground mt-3">
                        ${stats.overdueAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <AlertCircle className="text-red-500" size={24} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recent Invoices */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Recent Invoices</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Invoice #</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Client</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Due Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice._id} className="border-b border-border hover:bg-secondary transition-colors">
                          <td className="py-4 px-4 font-medium text-foreground">{invoice.invoiceNumber}</td>
                          <td className="py-4 px-4 text-foreground">{invoice.clientId?.name || 'N/A'}</td>
                          <td className="py-4 px-4 font-semibold text-foreground">${invoice.amount.toLocaleString()}</td>
                          <td className="py-4 px-4 text-muted-foreground">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
