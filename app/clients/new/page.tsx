'use client';

import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { ClientForm } from '@/app/components/ClientForm';

export default function NewClientPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl">
          <ClientForm />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
