'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DollarSign, FileText, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  dueDate: string;
  clientId: { _id: string; name: string };
  projectId?: { _id: string; name: string };
  description?: string;
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
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    projectId: '',
    amount: '',
    dueDate: '',
    description: '',
    invoiceNumber: ''
  });
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [clients, setClients] = useState<{ _id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ _id: string; name: string }[]>([]);


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

        const clientsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/clients?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.clients);
        }

        const projectsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/projects?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData.projects);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const resetInvoiceForm = () => {
    setInvoiceForm({
      clientId: '',
      projectId: '',
      amount: '',
      dueDate: '',
      description: '',
      invoiceNumber: ''
    });
    setEditingInvoiceId(null);
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload = {
        clientId: invoiceForm.clientId,
        projectId: invoiceForm.projectId,
        amount: Number(invoiceForm.amount),
        dueDate: invoiceForm.dueDate,
        description: invoiceForm.description,
        invoiceNumber: invoiceForm.invoiceNumber
      };

      const url = editingInvoiceId
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/invoices/${editingInvoiceId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/invoices`;

      const method = editingInvoiceId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save invoice');
      }

      const saved = await res.json();
      if (editingInvoiceId) {
        setInvoices((prev) => prev.map(inv => inv._id === editingInvoiceId ? saved : inv));
      } else {
        setInvoices((prev) => [saved, ...prev]);
      }

      resetInvoiceForm();
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/invoices/stats/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving invoice');
    }
  };

  const handleInvoiceEdit = (invoice: Invoice) => {
    const invoiceAny = invoice as any;
    setEditingInvoiceId(invoice._id);
    setInvoiceForm({
      clientId: invoiceAny.clientId?._id || invoiceAny.clientId?.name || '',
      projectId: invoiceAny.projectId?._id || '',
      amount: invoice.amount.toString(),
      description: invoiceAny.description || '',
      dueDate: invoice.dueDate.split('T')[0],
      invoiceNumber: invoice.invoiceNumber || ''
    });
  };

  const handleInvoiceDelete = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/invoices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete invoice');
      setInvoices(prev => prev.filter(inv => inv._id !== id));
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/invoices/stats/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting invoice');
    }
  };


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

          <Card id="create-invoice" className="p-6">
            <h2 className="text-xl font-semibold mb-4">{editingInvoiceId ? 'Edit Invoice' : 'Create New Invoice'}</h2>
            <form onSubmit={handleInvoiceSubmit} className="grid grid-cols-1 lg:grid-cols-6 gap-3">
              <select
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                value={invoiceForm.clientId}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, clientId: e.target.value }))}
                required
              >
                <option value="">Select Client</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <select
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                value={invoiceForm.projectId}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, projectId: e.target.value }))}
                required
              >
                <option value="">Select Project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <Input
                type="number"
                name="amount"
                className="col-span-1"
                placeholder="Amount"
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
              <Input
                type="date"
                name="dueDate"
                className="col-span-1"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, dueDate: e.target.value }))}
                required
              />
              <Input
                name="invoiceNumber"
                className="col-span-2"
                placeholder="Invoice #"
                value={invoiceForm.invoiceNumber}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              />
              <Input
                name="description"
                className="col-span-4"
                placeholder="Description"
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm(prev => ({ ...prev, description: e.target.value }))}
              />
              <div className="col-span-2 flex gap-2">
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                  {editingInvoiceId ? 'Update Invoice' : 'Create Invoice'}
                </button>
                {editingInvoiceId && (
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                    onClick={resetInvoiceForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Card>

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
