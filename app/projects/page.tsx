'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface Project {
  _id: string;
  name: string;
  clientId: {
    _id: string;
    name: string;
    company: string;
  };
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string;
  budget: number;
  assignedTo?: { _id: string; firstName: string; lastName: string }[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const statusColors = {
  'Not Started': 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'Completed': 'bg-green-100 text-green-800',
  'On Hold': 'bg-yellow-100 text-yellow-800'
};

const priorityColors = {
  'Low': 'text-gray-600',
  'Medium': 'text-blue-600',
  'High': 'text-orange-600',
  'Critical': 'text-red-600'
};

export default function ProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10'
        });
        if (search) params.append('search', search);
        if (status) params.append('status', status);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/projects?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        setProjects(data.projects);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [token, page, search, status]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/projects/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(projects.filter(p => p._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting project');
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <Link
              href="/projects/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              + New Project
            </Link>
          </div>

          {/* Filters */}
          <Card className="p-4 bg-white">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <Input
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Projects Table */}
          <Card className="bg-white overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {search || status ? 'No projects found matching filters' : 'No projects yet. Create one!'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Project Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Priority</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Team</th>                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Budget</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projects.map(project => (
                      <tr key={project._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Link
                            href={`/projects/tasks/${project._id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {project.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {project.clientId.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${priorityColors[project.priority]}`}>
                            {project.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {project.assignedTo && project.assignedTo.length > 0 ? project.assignedTo.map((user) => `${user.firstName} ${user.lastName}`).join(', ') : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          ${project.budget.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/projects/edit/${project._id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(project._id)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    pageNum === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
