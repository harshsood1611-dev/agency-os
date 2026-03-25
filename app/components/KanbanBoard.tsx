'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  status: 'New' | 'In Progress' | 'Completed' | 'Blocked';
}

interface KanbanBoardProps {
  projectId: string;
  onTaskCreated?: () => void;
}

const priorityColors = {
  'Low': 'border-l-gray-400',
  'Medium': 'border-l-blue-400',
  'High': 'border-l-orange-400',
  'Critical': 'border-l-red-400'
};

const statusTitles = {
  'New': 'New Tasks',
  'In Progress': 'In Progress',
  'Completed': 'Completed',
  'Blocked': 'Blocked'
};

export function KanbanBoard({ projectId, onTaskCreated }: KanbanBoardProps) {
  const { token } = useAuth();
  const [board, setBoard] = useState<Record<string, Task[]>>({
    'New': [],
    'In Progress': [],
    'Completed': [],
    'Blocked': []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBoard = async () => {
      if (!token) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/tasks/project/${projectId}/kanban`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const data = await response.json();
        setBoard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [projectId, token]);

  const handleUpdateTask = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/tasks/${taskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (!response.ok) throw new Error('Failed to update task');

      // Refresh board
      const fetchResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/tasks/project/${projectId}/kanban`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setBoard(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/tasks/${taskId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to delete task');

      // Refresh board
      const fetchResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/tasks/project/${projectId}/kanban`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setBoard(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting task');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(board) as Array<keyof typeof board>).map(status => (
          <div key={status} className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              {statusTitles[status]} ({board[status].length})
            </h3>

            <div className="space-y-3">
              {board[status].map(task => (
                <Card
                  key={task._id}
                  className={`p-4 cursor-move border-l-4 ${priorityColors[task.priority]} bg-white`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Link
                      href={`/tasks/${task._id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium flex-1"
                    >
                      {task.title}
                    </Link>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">{task.description.substring(0, 50)}...</p>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <span className="font-semibold text-gray-700">{task.priority}</span>
                    {task.dueDate && (
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>

                  {task.assignedTo && (
                    <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                      {task.assignedTo.firstName} {task.assignedTo.lastName}
                    </div>
                  )}

                  {status !== 'Completed' && (
                    <div className="flex gap-2 text-xs">
                      {Object.keys(board).map(newStatus => {
                        if (newStatus !== status) {
                          return (
                            <button
                              key={newStatus}
                              onClick={() => handleUpdateTask(task._id, newStatus)}
                              className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition"
                            >
                              → {newStatus}
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </Card>
              ))}

              {board[status].length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No tasks here yet
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
