'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Server, Database, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type HealthStatus = {
  status: 'healthy' | 'unhealthy';
  message: string;
  metrics?: {
    cpu: number;
    memory: number;
    disk: number;
  };
};

export function MonitoringStats() {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'healthy',
    message: 'All systems operational',
    metrics: {
      cpu: 0,
      memory: 0,
      disk: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { hasPermission } = useAuth();

  // Check if user has permission to view monitoring stats
  const canViewMonitoring =
    hasPermission(PERMISSIONS.VIEW_METRICS) || hasPermission(PERMISSIONS.VIEW_HEALTH);

  const fetchHealthStatus = async () => {
    if (!canViewMonitoring) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.MONITORING.HEALTH, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch health status');
      }
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Error fetching health status:', error);
      setHealth({
        status: 'unhealthy',
        message: 'Failed to fetch health status',
        metrics: {
          cpu: 0,
          memory: 0,
          disk: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
    let interval: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      interval = setInterval(fetchHealthStatus, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [canViewMonitoring, autoRefresh]);

  // If user doesn't have permission to view monitoring stats, show a message
  if (!canViewMonitoring) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permission Required</AlertTitle>
            <AlertDescription>
              You do not have permission to view monitoring statistics. Please contact your
              administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Alert variant={health.status === 'healthy' ? 'default' : 'destructive'}>
          <Activity className="h-4 w-4" />
          <AlertTitle>System Status</AlertTitle>
          <AlertDescription>{health.message}</AlertDescription>
        </Alert>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={checked => setAutoRefresh(checked as boolean)}
            />
            <Label htmlFor="auto-refresh">Auto-refresh</Label>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchHealthStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.metrics?.cpu}%</div>
            <Progress value={health.metrics?.cpu} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Current CPU utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.metrics?.memory}%</div>
            <Progress value={health.metrics?.memory} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Current memory utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.metrics?.disk}%</div>
            <Progress value={health.metrics?.disk} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Current disk utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mail Service</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'}>
                {health.status === 'healthy' ? 'Active' : 'Inactive'}
              </Badge>
              <p className="text-xs text-muted-foreground">Mail service status</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
