'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Trash2, ArrowRight, AlertCircle } from 'lucide-react';

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

const priorityConfig = {
  'Low': { color: 'bg-blue-50 text-blue-700 border-l-blue-500', bg: 'bg-blue-50' },
  'Medium': { color: 'bg-amber-50 text-amber-700 border-l-amber-500', bg: 'bg-amber-50' },
  'High': { color: 'bg-orange-50 text-orange-700 border-l-orange-500', bg: 'bg-orange-50' },
  'Critical': { color: 'bg-red-50 text-red-700 border-l-red-500', bg: 'bg-red-50' }
};

const statusConfig = {
  'New': { title: 'New Tasks', color: 'bg-gray-100', textColor: 'text-gray-700' },
  'In Progress': { title: 'In Progress', color: 'bg-blue-100', textColor: 'text-blue-700' },
  'Completed': { title: 'Completed', color: 'bg-emerald-100', textColor: 'text-emerald-700' },
  'Blocked': { title: 'Blocked', color: 'bg-red-100', textColor: 'text-red-700' }
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max">
        {(Object.keys(board) as Array<keyof typeof statusConfig>).map(status => {
          const config = statusConfig[status];
          return (
            <div key={status} className={`${config.color} rounded-lg p-4 min-h-96`}>
              <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-border`}>
                <h3 className={`font-semibold ${config.textColor} text-sm`}>
                  {config.title}
                </h3>
                <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  status === 'New' ? 'bg-gray-200 text-gray-700' :
                  status === 'In Progress' ? 'bg-blue-200 text-blue-700' :
                  status === 'Completed' ? 'bg-emerald-200 text-emerald-700' :
                  'bg-red-200 text-red-700'
                }`}>
                  {board[status].length}
                </span>
              </div>

              <div className="space-y-3">
                {board[status].map(task => {
                  const priority = task.priority as keyof typeof priorityConfig;
                  const priorityCfg = priorityConfig[priority];
                  return (
                    <Card
                      key={task._id}
                      className={`p-4 border-l-4 ${priorityCfg.bg} hover:shadow-md transition-all cursor-move`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <Link
                          href={`/tasks/${task._id}`}
                          className="text-primary hover:text-primary/80 font-semibold flex-1 text-sm line-clamp-2"
                        >
                          {task.title}
                        </Link>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors flex-shrink-0"
                          title="Delete task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Priority Badge */}
                      <div className="mb-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${priorityCfg.color}`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-2 mb-3 text-xs">
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {task.assignedTo && (
                          <div className="px-2 py-1 bg-background rounded text-xs font-medium border border-border">
                            {task.assignedTo.firstName} {task.assignedTo.lastName}
                          </div>
                        )}
                      </div>

                      {/* Status Transitions */}
                      {status !== 'Completed' && (
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                          {(Object.keys(board) as Array<keyof typeof board>).map(newStatus => {
                            if (newStatus !== status) {
                              return (
                                <button
                                  key={newStatus}
                                  onClick={() => handleUpdateTask(task._id, newStatus)}
                                  className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded text-xs font-medium transition-colors"
                                  title={`Move to ${newStatus}`}
                                >
                                  <ArrowRight size={12} />
                                  {newStatus}
                                </button>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </Card>
                  );
                })}

                {board[status].length === 0 && (
                  <div className="flex items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground text-sm">No tasks here yet</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
