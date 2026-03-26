'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { FolderOpen, Upload, FileText, AlertCircle, Download, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Document {
  _id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  clientId?: { name: string };
  projectId?: { name: string };
  createdAt: string;
}

export default function DocumentsPage() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/documents?limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents);
        } else {
          throw new Error('Failed to load documents');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [token]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Contract':
        return '📋';
      case 'Invoice':
        return '💵';
      case 'Report':
        return '📊';
      case 'Media':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Document Management</h1>
              <p className="text-muted-foreground mt-2">Upload and manage files for clients and projects</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <Upload size={18} />
              Upload File
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-40 bg-muted rounded-lg"></div>
                </Card>
              ))}
            </div>
          ) : documents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <Card key={doc._id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">{getCategoryIcon(doc.category)}</div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                          <Download size={16} />
                        </button>
                        <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive hover:text-destructive/80">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{doc.fileName}</h3>
                    
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <p className="flex items-center gap-2">
                        <span className="inline-block px-2 py-1 bg-secondary rounded text-xs font-medium">
                          {doc.category}
                        </span>
                      </p>
                      <p>{formatFileSize(doc.fileSize)}</p>
                      <p>{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>

                    {(doc.clientId || doc.projectId) && (
                      <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                        {doc.clientId && <p>Client: {doc.clientId.name}</p>}
                        {doc.projectId && <p>Project: {doc.projectId.name}</p>}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <FolderOpen size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-4">Start by uploading your first document</p>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  <Upload size={18} />
                  Upload Now
                </button>
              </div>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
