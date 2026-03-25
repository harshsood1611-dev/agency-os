'use client';

import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { TaskForm } from '@/app/components/TaskForm';
import { useParams } from 'next/navigation';

export default function NewTaskPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl">
          <TaskForm projectId={projectId} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
