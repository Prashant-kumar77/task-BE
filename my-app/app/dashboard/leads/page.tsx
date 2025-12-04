'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, X, Users } from 'lucide-react';

interface Lead {
  id: string;
  tenant_id: string;
  owner_id: string | null;
  stage: string | null;
  created_at: string;
  updated_at: string;
}

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    owner_id: '',
    stage: '',
  });

  // Fetch leads
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: { owner_id?: string; stage?: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) throw new Error('Not authenticated');

      const user = session.session.user;
      const tenant_id = (user.user_metadata?.tenant_id as string) || user.id;

      const { data, error } = await supabase
        .from('leads')
        .insert({
          tenant_id,
          owner_id: leadData.owner_id || null,
          stage: leadData.stage || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowCreateForm(false);
      setFormData({ owner_id: '', stage: '' });
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLeadMutation.mutateAsync(formData);
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
            <h1 className="text-4xl font-bold">Leads</h1>
            <p className="text-muted-foreground mt-1">Manage your leads</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Lead
              </>
            )}
          </Button>
        </div>

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Lead</CardTitle>
              <CardDescription>Add a new lead to your system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="owner_id">Owner ID (optional)</Label>
                  <Input
                    id="owner_id"
                    type="text"
                    value={formData.owner_id}
                    onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                    placeholder="User UUID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage (optional)</Label>
                  <Input
                    id="stage"
                    type="text"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    placeholder="e.g., qualified, contacted, etc."
                  />
                </div>
                <Button type="submit" disabled={createLeadMutation.isPending}>
                  {createLeadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Lead'
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
              Error loading leads: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {leads && leads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No leads found</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first lead to get started</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Leads</CardTitle>
              <CardDescription>View and manage all your leads</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Owner ID</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads?.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-mono text-sm">
                        {lead.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {lead.owner_id ? lead.owner_id.substring(0, 8) + '...' : 'N/A'}
                      </TableCell>
                      <TableCell>{lead.stage || 'N/A'}</TableCell>
                      <TableCell>{formatDate(lead.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/applications?lead_id=${lead.id}`}>
                          <Button variant="outline" size="sm">
                            View Applications
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

