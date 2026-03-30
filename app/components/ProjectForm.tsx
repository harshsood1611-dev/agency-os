'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ProjectFormProps {
  projectId?: string;
  onSuccess?: () => void;
}

interface ProjectData {
  name: string;
  clientId: string;
  description: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  startDate: string;
  dueDate: string;
  budget: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string[];
  invoicedAmount: string;
  paidAmount: string;
  billingStatus: 'Not Invoiced' | 'Invoiced' | 'Partial' | 'Paid';
  paymentTerms: string;
}

interface Client {
  _id: string;
  name: string;
  company: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export function ProjectForm({ projectId, onSuccess }: ProjectFormProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState<ProjectData>({
    name: '',
    clientId: '',
    description: '',
    status: 'Not Started',
    startDate: '',
    dueDate: '',
    budget: '',
    priority: 'Medium',
    assignedTo: [],
    invoicedAmount: '',
    paidAmount: '',
    billingStatus: 'Not Invoiced',
    paymentTerms: 'Net 30'
  });

  // Load clients and project if editing
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        // Fetch clients
        const clientsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/clients?limit=100`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData.clients);
        }

        // Fetch employees for assigning to project (manager/admin)
        const employeesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/employees`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          setEmployees(employeesData);
        }

        // Fetch project if editing
        if (projectId) {
          const projectResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/projects/${projectId}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          if (!projectResponse.ok) throw new Error('Failed to load project');

          const project = await projectResponse.json();
          setFormData({
            name: project.name,
            clientId: project.clientId._id,
            description: project.description || '',
            status: project.status,
            startDate: project.startDate ? project.startDate.split('T')[0] : '',
            dueDate: project.dueDate ? project.dueDate.split('T')[0] : '',
            budget: project.budget ? project.budget.toString() : '',
            priority: project.priority,
            assignedTo: (project.assignedTo || []).map((user: any) => user._id),
            invoicedAmount: project.invoicedAmount ? project.invoicedAmount.toString() : '',
            paidAmount: project.paidAmount ? project.paidAmount.toString() : '',
            billingStatus: project.billingStatus || 'Not Invoiced',
            paymentTerms: project.paymentTerms || 'Net 30'
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      }
    };

    fetchData();
  }, [projectId, token]);

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
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        invoicedAmount: formData.invoicedAmount ? parseFloat(formData.invoicedAmount) : 0,
        paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : 0
      };

      const method = projectId ? 'PUT' : 'POST';
      const url = projectId
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/projects/${projectId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/projects`;

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
        throw new Error(error.error || 'Failed to save project');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="p-8 bg-white max-w-2xl flex-1 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {projectId ? 'Edit Project' : 'Create New Project'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.name} ({client.company})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Project description..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Dates and Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline & Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <Input
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <Input
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
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

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget ($)</label>
            <Input
              name="budget"
              type="number"
              step="0.01"
              value={formData.budget}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          {/* Billing/Payment Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing / Payment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoiced Amount ($)</label>
                <Input
                  name="invoicedAmount"
                  type="number"
                  step="0.01"
                  value={formData.invoicedAmount}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paid Amount ($)</label>
                <Input
                  name="paidAmount"
                  type="number"
                  step="0.01"
                  value={formData.paidAmount}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billing Status</label>
                <select
                  name="billingStatus"
                  value={formData.billingStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Not Invoiced">Not Invoiced</option>
                  <option value="Invoiced">Invoiced</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                <Input
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  placeholder="Net 30"
                />
              </div>
            </div>
          </div>

          {/* Team Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Team Members</label>
            <select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                setFormData(prev => ({ ...prev, assignedTo: selectedOptions }));
              }}
              multiple
              className="w-full h-28 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 sticky bottom-0 bg-white border-t border-gray-200 p-6 -mx-8 -mb-8">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
            >
              {loading ? 'Saving...' : (projectId ? 'Update Project' : 'Create Project')}
            </Button>
            <button
              type="button"
              onClick={() => router.push('/projects')}
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
