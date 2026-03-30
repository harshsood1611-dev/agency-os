'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { DirectChat } from '@/app/components/DirectChat';
import { ProjectChat } from '@/app/components/ProjectChat';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UserQuick {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function MessagesPage() {
  const { token } = useAuth();
  const [projectId, setProjectId] = useState('');
  const [otherUserId, setOtherUserId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [users, setUsers] = useState<UserQuick[]>([]);

  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/employees`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) return;
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUsers();
  }, [token]);

  const filteredUsers = users.filter((u) =>
    u.firstName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    u.lastName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-2">Project and direct real-time messaging</p>
          </div>

          <Card className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project ID for group chat</label>
                <div className="flex gap-2">
                  <Input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Project ID" />
                  <Button type="button" onClick={() => {}} className="px-4">Join</Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Direct chat user</label>
                <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search users" />
                <div className="max-h-40 overflow-y-auto mt-2 space-y-1">
                  {filteredUsers.map((u) => (
                    <button
                      key={u._id}
                      className={`block w-full text-left px-3 py-2 rounded-lg ${otherUserId === u._id ? 'bg-primary/10' : 'hover:bg-secondary'}`}
                      onClick={() => setOtherUserId(u._id)}
                    >
                      {u.firstName} {u.lastName} ({u.email})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {projectId && <ProjectChat projectId={projectId} />}
          {otherUserId && <DirectChat otherUserId={otherUserId} />}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
