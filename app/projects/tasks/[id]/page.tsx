'use client';

import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { KanbanBoard } from '@/app/components/KanbanBoard';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Project Tasks</h1>
            <div className="flex gap-2">
              <Link
                href={`/projects/tasks/${projectId}/new`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                + New Task
              </Link>
              <Link
                href="/projects"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Back to Projects
              </Link>
            </div>
          </div>

          {/* Kanban Board */}
          <KanbanBoard projectId={projectId} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
