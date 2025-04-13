'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';

export function QueueStats() {
  const [queueSize, setQueueSize] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = useAuth();

  // Check if user has permission to view queue stats
  const canViewQueueStats = hasPermission(PERMISSIONS.VIEW_QUEUE);

  useEffect(() => {
    const fetchQueueSize = async () => {
      if (!canViewQueueStats) {
        setLoading(false);
        return;
      }

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
  }, [canViewQueueStats]);

  // If user doesn't have permission to view queue stats, show a message
  if (!canViewQueueStats) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to view queue statistics. Please contact your administrator.
        </p>
      </div>
    );
  }

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
