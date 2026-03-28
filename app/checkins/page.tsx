'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Card } from '@/components/ui/card';

interface Checkin {
  _id: string;
  weekStart: string;
  progressSummary?: string;
  blockers?: string;
  focusForNextWeek?: string;
  rating?: number;
}

export default function CheckinsPage() {
  const { token } = useAuth();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCheckins = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/checkins`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch check-ins');
        const data = await res.json();
        setCheckins(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading check-ins');
      } finally {
        setLoading(false);
      }
    };

    fetchCheckins();
  }, [token]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Weekly Check-ins</h1>

          <Card className="p-4">
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : checkins.length === 0 ? (
              <p>No check-ins found. Submit your first weekly check-in.</p>
            ) : (
              <div className="space-y-4">
                {checkins.map((c) => (
                  <div key={c._id} className="p-4 border border-border rounded-lg bg-background">
                    <p className="font-semibold">Week of {new Date(c.weekStart).toLocaleDateString()}</p>
                    {c.progressSummary && <p><strong>Progress:</strong> {c.progressSummary}</p>}
                    {c.blockers && <p><strong>Blockers:</strong> {c.blockers}</p>}
                    {c.focusForNextWeek && <p><strong>Next Week:</strong> {c.focusForNextWeek}</p>}
                    <p className="text-sm text-muted-foreground">Rating: {c.rating || 0}/5</p>
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
