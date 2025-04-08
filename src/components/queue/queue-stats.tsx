'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/config';

export function QueueStats() {
  const [queueSize, setQueueSize] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueueSize = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.QUEUE.SIZE, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch queue size');
        }
        const data = await response.json();
        setQueueSize(data.size);
      } catch (error) {
        console.error('Error fetching queue size:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueueSize();
    const interval = setInterval(fetchQueueSize, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? 'Loading...' : queueSize}</div>
          <p className="text-xs text-muted-foreground">Emails waiting to be processed</p>
        </CardContent>
      </Card>
    </div>
  );
}
