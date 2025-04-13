'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Server, Database, Mail } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';

type HealthStatus = {
  status: 'healthy' | 'unhealthy';
  message: string;
};

export function MonitoringStats() {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'healthy',
    message: 'All systems operational',
  });
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
    const interval = setInterval(fetchHealthStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [canViewMonitoring]);

  // If user doesn't have permission to view monitoring stats, show a message
  if (!canViewMonitoring) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to view monitoring statistics. Please contact your
          administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'}>
              {health.status}
            </Badge>
            <p className="text-xs text-muted-foreground">{health.message}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Server Status</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Online</div>
          <p className="text-xs text-muted-foreground">Server is running and responding</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Database Status</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Connected</div>
          <p className="text-xs text-muted-foreground">Database connection is active</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mail Service</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Active</div>
          <p className="text-xs text-muted-foreground">Mail service is operational</p>
        </CardContent>
      </Card>
    </div>
  );
}
