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
        ...(data.items.waiting || []),
        ...(data.items.active || []),
        ...(data.items.completed || []),
        ...(data.items.failed || []),
      ];

      setItems(allItems);
    } catch (error) {
      console.error('Error fetching queue items:', error);
      // Set empty array on error to prevent mapping errors
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueItems();
    const interval = setInterval(fetchQueueItems, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleProcess = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.QUEUE.PROCESS(id)}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to process queue item');
      }

      // Refresh the list
      fetchQueueItems();
    } catch (error) {
      console.error('Error processing queue item:', error);
    }
  };

  // Format date safely
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'PPp') : 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items && items.length > 0 ? (
            items.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.emailId}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{formatDate(item.createdAt)}</TableCell>
                <TableCell>{item.attempts}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleProcess(item.id)}>
                    Process
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                No items in queue
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
