'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, FileText, XCircle } from 'lucide-react';

interface Application {
  id: string;
  tenant_id: string;
  lead_id: string;
  created_at: string;
  updated_at: string;
}

function ApplicationsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const leadIdFilter = searchParams.get('lead_id');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    lead_id: leadIdFilter || '',
  });

  // Fetch leads for dropdown
  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('id').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch applications
  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['applications', leadIdFilter],
    queryFn: async () => {
      let query = supabase.from('applications').select('*').order('created_at', { ascending: false });

      if (leadIdFilter) {
        query = query.eq('lead_id', leadIdFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Application[];
    },
  });

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (appData: { lead_id: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) throw new Error('Not authenticated');

      const user = session.session.user;
      const tenant_id = (user.user_metadata?.tenant_id as string) || user.id;

      const { data, error } = await supabase
        .from('applications')
        .insert({
          tenant_id,
          lead_id: appData.lead_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setShowCreateForm(false);
      setFormData({ lead_id: leadIdFilter || '' });
    },
  });

  useEffect(() => {
    if (leadIdFilter) {
      setFormData({ lead_id: leadIdFilter });
    }
  }, [leadIdFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lead_id) {
      return;
    }
    await createApplicationMutation.mutateAsync(formData);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Applications</h1>
            <p className="text-muted-foreground mt-1">Manage your applications</p>
          </div>
          <div className="flex gap-2">
            {leadIdFilter && (
              <Link href="/dashboard/applications">
                <Button variant="outline">
                  <XCircle className="mr-2 h-4 w-4" />
                  Clear Filter
                </Button>
              </Link>
            )}
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Application
                </>
              )}
            </Button>
          </div>
        </div>

        {leadIdFilter && (
          <Alert>
            <AlertDescription>
              Filtered by Lead ID: <Badge variant="outline">{leadIdFilter.substring(0, 8)}...</Badge>
            </AlertDescription>
          </Alert>
        )}

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Application</CardTitle>
              <CardDescription>Link an application to a lead</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lead_id">Lead</Label>
                  <Select
                    value={formData.lead_id}
                    onValueChange={(value) => setFormData({ ...formData, lead_id: value })}
                    required
                  >
                    <SelectTrigger id="lead_id">
                      <SelectValue placeholder="Select a lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads?.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.id.substring(0, 8)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={createApplicationMutation.isPending}>
                  {createApplicationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Application'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Error loading applications: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {applications && applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No applications found</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first application to get started</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
              <CardDescription>View and manage all your applications</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications?.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-sm">
                        {app.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <Link href="/dashboard/leads" className="text-primary hover:underline">
                          {app.lead_id.substring(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(app.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/tasks/create?application_id=${app.id}`}>
                          <Button variant="outline" size="sm">
                            Create Task
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense
      fallback={
        <ProtectedRoute>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </ProtectedRoute>
      }
    >
      <ApplicationsContent />
    </Suspense>
  );
}

