'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function CreateTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    application_id: searchParams.get('application_id') || '',
    task_type: 'call' as 'call' | 'email' | 'review',
    due_at: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const appId = searchParams.get('application_id');
    if (appId) {
      setFormData((prev) => ({ ...prev, application_id: appId }));
    }
  }, [searchParams]);

  // Fetch applications for dropdown
  const { data: applications } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('id, lead_id')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: typeof formData) => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const response = await fetch(`${supabaseUrl}/functions/v1/create-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          application_id: taskData.application_id,
          task_type: taskData.task_type,
          due_at: taskData.due_at,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      router.push('/dashboard/tasks');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await createTaskMutation.mutateAsync(formData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tasks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold">Create New Task</h1>
            <p className="text-muted-foreground mt-1">Add a new task to track</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>Fill in the information to create a new task</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="application_id">Application</Label>
                <Select
                  value={formData.application_id}
                  onValueChange={(value) => setFormData({ ...formData, application_id: value })}
                  required
                >
                  <SelectTrigger id="application_id">
                    <SelectValue placeholder="Select an application" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications?.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.id.substring(0, 8)}... (Lead: {app.lead_id.substring(0, 8)}...)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task_type">Task Type</Label>
                <Select
                  value={formData.task_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, task_type: value as 'call' | 'email' | 'review' })
                  }
                  required
                >
                  <SelectTrigger id="task_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_at">Due Date & Time</Label>
                <Input
                  id="due_at"
                  type="datetime-local"
                  required
                  value={formData.due_at}
                  onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function CreateTaskPage() {
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
      <CreateTaskContent />
    </Suspense>
  );
}

