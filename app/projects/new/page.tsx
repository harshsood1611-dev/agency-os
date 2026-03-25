'use client';

import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { ProjectForm } from '@/app/components/ProjectForm';

export default function NewProjectPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl">
          <ProjectForm />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
