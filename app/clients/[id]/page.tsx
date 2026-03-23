'use client';

import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { ClientForm } from '@/app/components/ClientForm';
import { useParams } from 'next/navigation';

export default function EditClientPage() {
  const params = useParams();
  const clientId = params.id as string;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl">
          <ClientForm clientId={clientId} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
