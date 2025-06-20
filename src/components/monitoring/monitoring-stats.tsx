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
import { getXsrfToken } from '@/lib/utils';

type HealthStatus = {
  status: 'ok' | 'error';
  info: {
    database: {
      status: 'up' | 'down';
    };
    queue: {
      status: 'up' | 'down';
      queueSize: number;
      backlogAge: number;
    };
    system: {
      status: 'up' | 'down';
      memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
        external: number;
      };
      cpu: {
        usage: number;
        cores: number;
      };
    };
  };
  error: Record<string, any>;
  details: {
    database: {
      status: 'up' | 'down';
    };
    queue: {
      status: 'up' | 'down';
      queueSize: number;
      backlogAge: number;
    };
    system: {
      status: 'up' | 'down';
      memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
        external: number;
      };
      cpu: {
        usage: number;
        cores: number;
      };
    };
  };
};

export function MonitoringStats() {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'ok',
    info: {
      database: { status: 'up' },
      queue: { status: 'up', queueSize: 0, backlogAge: 0 },
      system: {
        status: 'up',
        memory: { heapUsed: 0, heapTotal: 0, rss: 0, external: 0 },
        cpu: { usage: 0, cores: 0 },
      },
    },
    error: {},
    details: {
      database: { status: 'up' },
      queue: { status: 'up', queueSize: 0, backlogAge: 0 },
      system: {
        status: 'up',
        memory: { heapUsed: 0, heapTotal: 0, rss: 0, external: 0 },
        cpu: { usage: 0, cores: 0 },
      },
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
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
        },
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
        status: 'error',
        info: {
          database: { status: 'down' },
          queue: { status: 'down', queueSize: 0, backlogAge: 0 },
          system: {
            status: 'down',
            memory: { heapUsed: 0, heapTotal: 0, rss: 0, external: 0 },
            cpu: { usage: 0, cores: 0 },
          },
        },
        error: {},
        details: {
          database: { status: 'down' },
          queue: { status: 'down', queueSize: 0, backlogAge: 0 },
          system: {
            status: 'down',
            memory: { heapUsed: 0, heapTotal: 0, rss: 0, external: 0 },
            cpu: { usage: 0, cores: 0 },
          },
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
        <Alert variant={health.status === 'ok' ? 'default' : 'destructive'}>
          <Activity className="h-4 w-4" />
          <AlertTitle>System Status</AlertTitle>
          <AlertDescription>
            {health.status === 'ok' ? 'All systems operational' : 'System issues detected'}
          </AlertDescription>
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
            <div className="text-2xl font-bold">{health.info.system.cpu.usage.toFixed(2)}%</div>
            <Progress value={health.info.system.cpu.usage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {health.info.system.cpu.cores} cores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(health.info.system.memory.heapUsed / 1024 / 1024).toFixed(2)} MB
            </div>
            <Progress
              value={
                (health.info.system.memory.heapUsed / health.info.system.memory.heapTotal) * 100
              }
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Total: {(health.info.system.memory.heapTotal / 1024 / 1024).toFixed(2)} MB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={health.info.queue.status === 'up' ? 'default' : 'destructive'}>
                {health.info.queue.status === 'up' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Queue Size: {health.info.queue.queueSize}
            </p>
            <p className="text-xs text-muted-foreground">
              Backlog Age: {health.info.queue.backlogAge}s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={health.info.database.status === 'up' ? 'default' : 'destructive'}>
                {health.info.database.status === 'up' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
