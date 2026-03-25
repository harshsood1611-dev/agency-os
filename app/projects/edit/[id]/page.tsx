'use client';

import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { ProjectForm } from '@/app/components/ProjectForm';
import { useParams } from 'next/navigation';

export default function EditProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl">
          <ProjectForm projectId={projectId} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
