'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TaskFormProps {
  projectId: string;
  taskId?: string;
  onSuccess?: () => void;
}

interface TaskData {
  title: string;
  description: string;
  status: 'New' | 'In Progress' | 'Completed' | 'Blocked';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string;
  assignedTo: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
}

export function TaskForm({ projectId, taskId, onSuccess }: TaskFormProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<TaskData>({
    title: '',
    description: '',
    status: 'New',
    priority: 'Medium',
    dueDate: '',
    assignedTo: ''
  });

  // Load users and task if editing
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        // For now, we'll use a placeholder for fetching team members
        // In a real app, you'd have an endpoint to get all users in the organization
        // setUsers([]); // TODO: Fetch team members

        // If editing, fetch the task
        if (taskId) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/tasks/${taskId}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          if (!response.ok) throw new Error('Failed to load task');

          const task = await response.json();
          setFormData({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            assignedTo: task.assignedTo?._id || ''
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      }
    };

    fetchData();
  }, [projectId, taskId, token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        projectId
      };

      const method = taskId ? 'PUT' : 'POST';
      const url = taskId
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/tasks/${taskId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/tasks`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save task');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/projects/tasks/${projectId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="p-8 bg-white max-w-2xl flex-1 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {taskId ? 'Edit Task' : 'Create New Task'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Task title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Task description..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status and Priority */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Priority</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Due Date and Assignment */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <Input
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 sticky bottom-0 bg-white border-t border-gray-200 p-6 -mx-8 -mb-8">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
            >
              {loading ? 'Saving...' : (taskId ? 'Update Task' : 'Create Task')}
            </Button>
            <button
              type="button"
              onClick={() => router.push(`/projects/tasks/${projectId}`)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
