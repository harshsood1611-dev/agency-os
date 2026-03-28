'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Card } from '@/components/ui/card';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  agencyName?: string;
}

export default function EmployeesPage() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/employees`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch employees');
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [token]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Employees</h1>
          </div>

          <Card className="p-4">
            {loading ? (
              <p>Loading employees...</p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : employees.length === 0 ? (
              <p>No employees found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map(emp => (
                  <div key={emp._id} className="p-4 bg-background border border-border rounded-lg">
                    <p className="font-semibold">{emp.firstName} {emp.lastName}</p>
                    <p className="text-sm text-muted-foreground">{emp.email}</p>
                    <p className="text-sm">Role: <strong>{emp.role}</strong></p>
                    <p className="text-sm">Status: <strong>{emp.status}</strong></p>
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
