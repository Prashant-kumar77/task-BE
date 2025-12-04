'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Task {
  id: string;
  type: string;
  application_id: string;
  due_at: string;
  status: string;
}

export default function TodayPage() {
  const queryClient = useQueryClient();
  const [markingComplete, setMarkingComplete] = useState<string | null>(null);

  // Fetch tasks due today
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('tasks')
        .select('id, type, application_id, due_at, status')
        .gte('due_at', today.toISOString())
        .lt('due_at', tomorrow.toISOString())
        .neq('status', 'completed')
        .order('due_at', { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
  });

  // Mutation to mark task as complete
  const markCompleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today'] });
      setMarkingComplete(null);
    },
    onError: (error) => {
      console.error('Error marking task complete:', error);
      setMarkingComplete(null);
    },
  });

  const handleMarkComplete = (taskId: string) => {
    setMarkingComplete(taskId);
    markCompleteMutation.mutate(taskId);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'email':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'review':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Error loading tasks: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Today&apos;s Tasks</h1>
            <p className="text-muted-foreground mt-1">
              {tasks?.length || 0} task{tasks?.length !== 1 ? 's' : ''} due today
            </p>
          </div>
        </div>

        {tasks && tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No tasks due today</p>
              <p className="text-sm text-muted-foreground mt-1">
                You&apos;re all caught up!
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Tasks due today that need your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks?.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Badge variant="outline" className={`${getTypeColor(task.type)} capitalize`}>
                          {task.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {task.application_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatDate(task.due_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleMarkComplete(task.id)}
                          disabled={markingComplete === task.id}
                          size="sm"
                        >
                          {markingComplete === task.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark Complete
                            </>
                          )}
                        </Button>
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

