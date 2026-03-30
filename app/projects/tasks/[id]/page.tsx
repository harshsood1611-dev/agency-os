'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { KanbanBoard } from '@/app/components/KanbanBoard';
import { ProjectChat } from '@/app/components/ProjectChat';
import { useAuth } from '@/app/context/AuthContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface ProjectDetails {
  _id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  budget?: number;
  assignedTo?: User[];
}

interface DocumentItem {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: { firstName: string; lastName: string };
  createdAt: string;
}

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { user, token } = useAuth();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [newDoc, setNewDoc] = useState({ fileName: '', fileUrl: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!token || !projectId) return;
      setLoading(true);
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error('Failed to load project');
        const data = await resp.json();
        setProject(data);

        const docsResp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/documents?projectId=${projectId}&limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!docsResp.ok) throw new Error('Failed to load documents');
        const docsData = await docsResp.json();
        setDocuments(docsData.documents);

        const tasksResp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/tasks?projectId=${projectId}&limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!tasksResp.ok) throw new Error('Failed to load tasks');
        const tasksData = await tasksResp.json();
        setTasks(tasksData.tasks);

        if (user?.role === 'manager' || user?.role === 'admin') {
          const employeesResp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/employees`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (employeesResp.ok) {
            const employeeList = await employeesResp.json();
            setEmployees(employeeList);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, token]);

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !projectId) return;

    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: newDoc.fileName,
          fileUrl: newDoc.fileUrl,
          projectId,
          userId: project?.assignedTo?.[0]?._id,
        })
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.message || 'Could not upload document');
      }

      const added = await resp.json();
      setDocuments(prev => [added, ...prev]);
      setNewDoc({ fileName: '', fileUrl: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading document');
    }
  };

  const updateTask = async (taskId: string, updates: Record<string, any>) => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (!resp.ok) throw new Error('Failed to update task');
      const updated = await resp.json();
      setTasks(prev => prev.map(task => task._id === taskId ? updated : task));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Failed to delete task');
      setTasks(prev => prev.filter(task => task._id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting task');
    }
  };

  const removeDocument = async (id: string) => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Failed to delete document');
      setDocuments(prev => prev.filter(doc => doc._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting document');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 text-center">Loading project details...</div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project: {project?.name}</h1>
              <p className="text-sm text-muted-foreground">{project?.description}</p>
            </div>
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

          {error && (
            <Card className="bg-red-50 border border-red-200 text-red-800 p-4">
              {error}
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">Project Summary</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Status:</strong> {project?.status}</p>
                <p><strong>Priority:</strong> {project?.priority}</p>
                <p><strong>Start Date:</strong> {project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Due Date:</strong> {project?.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Budget:</strong> ${project?.budget?.toFixed(2) ?? '0.00'}</p>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">Assigned Team</h3>
              {project?.assignedTo?.length ? (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {project.assignedTo.map(member => (
                    <li key={member._id}>{member.firstName} {member.lastName} ({member.role})</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No members assigned yet.</p>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">Project Documents</h3>
              {(user?.role === 'admin' || user?.role === 'manager') ? (
                <form onSubmit={handleDocumentSubmit} className="space-y-2 mb-3">
                  <Input
                    placeholder="Document title"
                    value={newDoc.fileName}
                    onChange={(e) => setNewDoc(prev => ({ ...prev, fileName: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Document URL"
                    value={newDoc.fileUrl}
                    onChange={(e) => setNewDoc(prev => ({ ...prev, fileUrl: e.target.value }))}
                    required
                  />
                  <Button type="submit" className="w-full">Upload Document</Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">Only manager/admin can upload documents. Assigned members can view them.</p>
              )}
              <ul className="space-y-2 text-sm">
                {documents.length ? documents.map(doc => (
                  <li key={doc._id} className="flex justify-between items-center">
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {doc.fileName}
                    </a>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <button onClick={() => removeDocument(doc._id)} className="text-red-600 hover:text-red-800 text-xs">
                        Delete
                      </button>
                    )}
                  </li>
                )) : <p>No documents found for this project.</p>}
              </ul>
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Management</h3>
            {tasks.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-t border-b border-gray-200">
                    <tr>
                      <th className="p-2 text-left">Task</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Assigned To</th>
                      <th className="p-2 text-left">Priority</th>
                      <th className="p-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task._id} className="border-b border-gray-200">
                        <td className="p-2">{task.title}</td>
                        <td className="p-2">
                          <select
                            value={task.status}
                            onChange={(e) => updateTask(task._id, { status: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            {['New', 'In Progress', 'Completed', 'Blocked'].map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            value={task.assignedTo?._id || ''}
                            onChange={(e) => updateTask(task._id, { assignedTo: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="">Unassigned</option>
                            {employees.map(emp => (
                              <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">{task.priority}</td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => deleteTask(task._id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No tasks yet. Create one using the New Task button.</p>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Task Kanban</h3>
              <KanbanBoard projectId={projectId} />
            </Card>

            <Card className="p-4 h-full">
              <h3 className="text-lg font-semibold mb-3">Project Group Chat</h3>
              <ProjectChat projectId={projectId} />
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
