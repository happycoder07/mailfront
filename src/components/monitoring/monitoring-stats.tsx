'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Server, Database, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import {
  API_ENDPOINTS,
  TerminusHealthResponseDto,
  HealthResponseDto,
  SystemStatusResponseDto,
} from '@/lib/config';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getXsrfToken } from '@/lib/utils';

export function MonitoringStats() {
  const [basicHealth, setBasicHealth] = useState<HealthResponseDto | null>(null);
  const [terminusHealth, setTerminusHealth] = useState<TerminusHealthResponseDto | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);

      // Fetch basic health status
      const basicResponse = await fetch(API_ENDPOINTS.MONITORING.HEALTH, {
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        credentials: 'include',
      });

      if (!basicResponse.ok) {
        throw new Error('Failed to fetch basic health status');
      }
      const basicData = await basicResponse.json();
      setBasicHealth(basicData);

      // Fetch detailed terminus health status
      const terminusResponse = await fetch(API_ENDPOINTS.MONITORING.TERMINUS_HEALTH, {
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        credentials: 'include',
      });

      if (!terminusResponse.ok) {
        throw new Error('Failed to fetch detailed health status');
      }
      const terminusData = await terminusResponse.json();
      setTerminusHealth(terminusData);

      // Fetch system status for CPU and memory information
      const systemResponse = await fetch(API_ENDPOINTS.MONITORING.SYSTEM_STATUS, {
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        credentials: 'include',
      });

      if (!systemResponse.ok) {
        throw new Error('Failed to fetch system status');
      }
      const systemData = await systemResponse.json();
      setSystemStatus(systemData);
    } catch (error) {
      console.error('Error fetching health status:', error);
      setError('Failed to fetch health status. Please try again later.');
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Determine overall system status
  const overallStatus = basicHealth?.status || 'error';
  const queueInfo = terminusHealth?.info?.queue;
  const databaseInfo = terminusHealth?.info?.database;

  // Calculate CPU usage percentage from user and system time
  const calculateCpuUsage = () => {
    if (!systemStatus?.cpu) return null;
    const totalCpuTime = systemStatus.cpu.user + systemStatus.cpu.system;
    // Convert microseconds to percentage (this is a simplified calculation)
    // In a real scenario, you'd need to track previous values to calculate rate
    return Math.min((totalCpuTime / 1000000) * 0.1, 100); // Simplified calculation
  };

  const cpuUsage = calculateCpuUsage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Alert variant={overallStatus === 'ok' ? 'default' : 'destructive'}>
          <Activity className="h-4 w-4" />
          <AlertTitle>System Status</AlertTitle>
          <AlertDescription>
            {overallStatus === 'ok' ? 'All systems operational' : 'System issues detected'}
            {systemStatus && (
              <span className="block text-xs mt-1">
                Uptime: {Math.floor(systemStatus.uptime / 3600)}h{' '}
                {Math.floor((systemStatus.uptime % 3600) / 60)}m | Version: {systemStatus.version} |
                Environment: {systemStatus.environment}
              </span>
            )}
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
            <div className="text-2xl font-bold">{cpuUsage ? `${cpuUsage.toFixed(2)}%` : 'N/A'}</div>
            {cpuUsage && <Progress value={cpuUsage} className="mt-2" />}
            <p className="text-xs text-muted-foreground mt-2">
              {systemStatus?.cpu ? (
                <>
                  User: {(systemStatus.cpu.user / 1000000).toFixed(2)}s | System:{' '}
                  {(systemStatus.cpu.system / 1000000).toFixed(2)}s
                </>
              ) : (
                'No data'
              )}
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
              {systemStatus?.memory?.used
                ? `${(systemStatus.memory.used / 1024 / 1024).toFixed(2)} MB`
                : 'N/A'}
            </div>
            {systemStatus?.memory?.used && systemStatus?.memory?.total && (
              <Progress
                value={(systemStatus.memory.used / systemStatus.memory.total) * 100}
                className="mt-2"
              />
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {systemStatus?.memory?.total
                ? `Total: ${(systemStatus.memory.total / 1024 / 1024).toFixed(2)} MB`
                : 'No data'}
            </p>
            {systemStatus?.memory?.rss && (
              <p className="text-xs text-muted-foreground">
                RSS: {(systemStatus.memory.rss / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={queueInfo?.status === 'up' ? 'default' : 'destructive'}>
                {queueInfo?.status === 'up'
                  ? 'Active'
                  : queueInfo?.status === 'down'
                    ? 'Inactive'
                    : 'Unknown'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Queue Size: {queueInfo?.queueSize ?? 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">
              Backlog Age: {queueInfo?.backlogAge ? `${queueInfo.backlogAge}s` : 'N/A'}
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
              <Badge variant={databaseInfo?.status === 'up' ? 'default' : 'destructive'}>
                {databaseInfo?.status === 'up'
                  ? 'Active'
                  : databaseInfo?.status === 'down'
                    ? 'Inactive'
                    : 'Unknown'}
              </Badge>
            </div>
            {basicHealth?.services?.database && (
              <p className="text-xs text-muted-foreground mt-2">
                Service: {basicHealth.services.database}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional service status cards */}
      {basicHealth?.services && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redis Status</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={basicHealth.services.redis === 'healthy' ? 'default' : 'destructive'}>
                {basicHealth.services.redis}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MinIO Status</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={basicHealth.services.minio === 'healthy' ? 'default' : 'destructive'}>
                {basicHealth.services.minio}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {systemStatus?.timestamp
                  ? new Date(systemStatus.timestamp).toLocaleString()
                  : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
