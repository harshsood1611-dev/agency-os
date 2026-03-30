'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertCircle, MessageSquare, Trash2, MoreVertical } from 'lucide-react';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [formState, setFormState] = useState({
    title: '',
    message: '',
    type: 'general',
    userId: ''
  });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;

      try {
        if (user?.role === 'admin' || user?.role === 'manager') {
          const employeesRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/employees`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (employeesRes.ok) {
            const employeesData = await employeesRes.json();
            setEmployees(employeesData);
          }
        }

        const unreadParam = filter === 'unread' ? '?unread=true' : '';
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/notifications${unreadParam}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        } else {
          throw new Error('Failed to load notifications');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token, filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/notifications/${id}/read`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (res.ok) {
        setNotifications(
          notifications.map(n => n._id === id ? { ...n, read: true } : n)
        );
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/notifications/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (res.ok) {
        setNotifications(notifications.filter(n => n._id !== id));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (!formState.title || !formState.message) {
        setError('Title and message are required');
        return;
      }

      const method = editId ? 'PUT' : 'POST';
      const url = editId
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/notifications/${editId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/notifications`;

      const payload = {
        title: formState.title,
        message: formState.message,
        type: formState.type,
        userId: formState.userId || (user?.id || '')
      };

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
        throw new Error(err.message || 'Failed to save notification');
      }

      const saved = await res.json();
      if (editId) {
        setNotifications(notifications.map(n => n._id === editId ? saved : n));
      } else {
        setNotifications([saved, ...notifications]);
      }

      setFormState({ title: '', message: '', type: 'general', userId: '' });
      setEditId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving notification');
    }
  };

  const handleEdit = (notif: Notification) => {
    setEditId(notif._id);
    setFormState({ title: notif.title, message: notif.message, type: notif.type, userId: user?.id || '' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <MessageSquare className="text-blue-500" size={20} />;
      case 'task_completed':
        return <CheckCircle className="text-emerald-500" size={20} />;
      case 'deadline_approaching':
        return <AlertCircle className="text-amber-500" size={20} />;
      case 'payment_due':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <Bell className="text-primary" size={20} />;
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-2">Stay updated with important alerts and messages</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Card className="p-4 mb-4">
              <h2 className="text-lg font-semibold mb-3">Create / Update Notification</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <Input
                      value={formState.title}
                      onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Notification title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formState.type}
                      onChange={(e) => setFormState(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="general">General</option>
                      <option value="task_assigned">Task Assigned</option>
                      <option value="task_completed">Task Completed</option>
                      <option value="payment_due">Payment Due</option>
                      <option value="deadline_approaching">Deadline Approaching</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={formState.message}
                    onChange={(e) => setFormState(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Notification content"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target User (optional)</label>
                  <select
                    value={formState.userId}
                    onChange={(e) => setFormState(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Users / Default</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editId ? 'Update' : 'Send'}</Button>
                  {editId && (
                    <Button type="button" variant="secondary" onClick={() => { setEditId(null); setFormState({ title: '', message: '', type: 'general', userId: '' }); }}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              Unread Only
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-20 bg-muted rounded-lg"></div>
                </Card>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <Card
                  key={notif._id}
                  className={`p-6 flex items-start gap-4 hover:shadow-lg transition-all ${
                    notif.read ? 'bg-card' : 'bg-primary/5 border-l-4 border-l-primary'
                  }`}
                >
                  <div className="flex-shrink-0 pt-1">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{notif.title}</h3>
                    {notif.message && (
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        title="Mark as read"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif._id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive hover:bg-destructive/20"
                      title="Delete notification"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <Bell size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
                <p className="text-muted-foreground">You're all caught up!</p>
              </div>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
