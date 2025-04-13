'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { format, isValid, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { API_ENDPOINTS } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';

type QueueItem = {
  id: string;
  emailId: string;
  status: string;
  createdAt: string;
  attempts: number;
};

type QueueItemsResponse = {
  items: {
    waiting: QueueItem[];
    active: QueueItem[];
    completed: QueueItem[];
    failed: QueueItem[];
  };
};

export function QueueItems() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = useAuth();

  // Check if user has permission to manage queue
  const canManageQueue = hasPermission(PERMISSIONS.MANAGE_QUEUE);

  const fetchQueueItems = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.QUEUE.ITEMS, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch queue items');
      }
      const data: QueueItemsResponse = await response.json();

      // Combine all queue items into a single array
      const allItems = [
        ...data.items.waiting,
        ...data.items.active,
        ...data.items.completed,
        ...data.items.failed,
      ];
      setItems(allItems);
    } catch (error) {
      console.error('Error fetching queue items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch queue items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueItems();
  }, []);

  const handleProcess = async (id: string) => {
    if (!canManageQueue) {
      toast({
        title: 'Error',
        description: 'You do not have permission to manage the queue',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.QUEUE.PROCESS(id), {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to process queue item');
      }
      toast({
        title: 'Success',
        description: 'Queue item processed successfully',
      });
      fetchQueueItems();
    } catch (error) {
      console.error('Error processing queue item:', error);
      toast({
        title: 'Error',
        description: 'Failed to process queue item',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'PPp');
      }
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // If user doesn't have permission to manage queue, show a message
  if (!canManageQueue) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to manage the queue. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No queue items found.
                </TableCell>
              </TableRow>
            ) : (
              items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.emailId}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === 'completed'
                          ? 'default'
                          : item.status === 'failed'
                            ? 'destructive'
                            : item.status === 'active'
                              ? 'secondary'
                              : 'outline'
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                  <TableCell>{item.attempts}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProcess(item.id)}
                      disabled={item.status === 'active'}
                    >
                      Process
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
