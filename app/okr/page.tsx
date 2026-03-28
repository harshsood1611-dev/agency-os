'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Card } from '@/components/ui/card';

interface OKRItem {
  _id: string;
  objective: string;
  status: string;
  quarter: string;
  year: number;
  keyResults: Array<{ title: string; status: string; target: number; progress: number }>;
  userId: { firstName: string; lastName: string };
}

export default function OKRPage() {
  const { token } = useAuth();
  const [okrs, setOkrs] = useState<OKRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOKRs = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/okr`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch OKRs');
        const data = await res.json();
        setOkrs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading OKRs');
      } finally {
        setLoading(false);
      }
    };

    fetchOKRs();
  }, [token]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">OKRs & Performance</h1>
          </div>

          <Card className="p-4">
            {loading ? (
              <p>Loading OKRs...</p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : okrs.length === 0 ? (
              <p>No OKRs yet. Set team objectives.</p>
            ) : (
              <div className="space-y-4">
                {okrs.map((okr) => (
                  <div key={okr._id} className="p-4 border border-border rounded-lg bg-background">
                    <div className="flex justify-between">
                      <h2 className="font-semibold text-lg">{okr.objective}</h2>
                      <span className="text-xs py-1 px-2 rounded-full bg-muted text-muted-foreground">{okr.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{okr.quarter} {okr.year} • {okr.userId.firstName} {okr.userId.lastName}</p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {okr.keyResults.map((kr, i) => (
                        <div key={i} className="p-3 bg-white border border-border rounded-lg">
                          <p className="font-medium">{kr.title}</p>
                          <p className="text-xs text-muted-foreground">Status: {kr.status}</p>
                          <p className="text-xs">Progress: {kr.progress}/{kr.target}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
