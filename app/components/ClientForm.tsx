'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ClientFormProps {
  clientId?: string;
  onSuccess?: () => void;
}

interface ClientData {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'active' | 'inactive' | 'prospect';
  rate: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

export function ClientForm({ clientId, onSuccess }: ClientFormProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ClientData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active',
    rate: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: ''
  });

  // Load client if editing
  useEffect(() => {
    if (clientId && token) {
      const fetchClient = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/clients/${clientId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to load client');
          }

          const client = await response.json();
          setFormData({
            name: client.name,
            email: client.email,
            phone: client.phone || '',
            company: client.company || '',
            status: client.status,
            rate: client.rate ? client.rate.toString() : '',
            address: client.address || '',
            city: client.city || '',
            state: client.state || '',
            zip: client.zip || '',
            notes: client.notes || ''
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error loading client');
        }
      };

      fetchClient();
    }
  }, [clientId, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        rate: formData.rate ? parseFloat(formData.rate) : 0
      };

      const method = clientId ? 'PUT' : 'POST';
      const url = clientId
        ? `http://localhost:5000/api/clients/${clientId}`
        : 'http://localhost:5000/api/clients';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error('Failed to save client');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/clients');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 bg-white max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {clientId ? 'Edit Client' : 'Add New Client'}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Client name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="client@example.com"
                required
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <Input
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Company name"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zip</label>
                <Input
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  placeholder="Zip code"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate ($)</label>
              <Input
                name="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any notes about this client..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
          >
            {loading ? (clientId ? 'Updating...' : 'Creating...') : (clientId ? 'Update Client' : 'Create Client')}
          </Button>
          <button
            type="button"
            onClick={() => router.push('/clients')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
