'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SettingsPayload {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  dateFormat: string;
  timezone: string;
}

export default function SettingsPage() {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState<SettingsPayload>({
    companyName: '',
    logoUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1d4ed8',
    dateFormat: 'YYYY-MM-DD',
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('Failed to load settings');
        }

        const data = await res.json();
        setSettings({
          companyName: data.companyName || '',
          logoUrl: data.logoUrl || '',
          primaryColor: data.primaryColor || '#2563eb',
          secondaryColor: data.secondaryColor || '#1d4ed8',
          dateFormat: data.dateFormat || 'YYYY-MM-DD',
          timezone: data.timezone || 'UTC'
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save settings');
      }

      setMessage('Settings updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="p-6">Loading...</div>;
  }

  if (user.role !== 'admin') {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Card className="p-6">Only admins can access settings</Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage company and app configuration</p>
          </div>

          {error && <Card className="p-4 bg-red-50 border border-red-200 text-red-800">{error}</Card>}
          {message && <Card className="p-4 bg-green-50 border border-green-200 text-green-800">{message}</Card>}

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <Input value={settings.companyName} onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <Input value={settings.logoUrl} onChange={(e) => setSettings(prev => ({ ...prev, logoUrl: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <Input type="color" value={settings.primaryColor} onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                  <Input type="color" value={settings.secondaryColor} onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                  <Input value={settings.dateFormat} onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <Input value={settings.timezone} onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))} />
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}