'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
};

const progressVariants = {
  hidden: { width: 0 },
  visible: (width: number) => ({
    width: `${width}%`,
    transition: {
      duration: 1,
      ease: 'easeOut',
      delay: 0.5,
    },
  }),
};

const alertVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } },
};

export function MonitoringStats() {
  const [basicHealth, setBasicHealth] = useState<HealthResponseDto | null>(null);
  const [terminusHealth, setTerminusHealth] = useState<TerminusHealthResponseDto | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { hasPermission, getCSRFToken } = useAuth();

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
          'X-XSRF-TOKEN': getCSRFToken(),
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
          'X-XSRF-TOKEN': getCSRFToken(),
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
          'X-XSRF-TOKEN': getCSRFToken(),
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
      <motion.div variants={alertVariants} initial="hidden" animate="visible">
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
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[...Array(4)].map((_, i) => (
          <motion.div key={i} variants={cardVariants} custom={i}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div variants={alertVariants} initial="hidden" animate="visible">
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
      </motion.div>
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
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="flex items-center justify-between" variants={alertVariants}>
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
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
          <Button variant="outline" size="sm" onClick={fetchHealthStatus}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </motion.div>
      </motion.div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="auto-refresh"
          checked={autoRefresh}
          onCheckedChange={checked => setAutoRefresh(checked as boolean)}
        />
        <Label htmlFor="auto-refresh">Auto-refresh every 10 seconds</Label>
      </div>

      <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" variants={containerVariants}>
        <motion.div variants={cardVariants} custom={0} whileHover="hover">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={overallStatus === 'ok' ? 'default' : 'destructive'}>
                  {overallStatus.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {overallStatus === 'ok' ? 'All systems operational' : 'Issues detected'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} custom={1} whileHover="hover">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {queueInfo ? (
                  <Badge variant={queueInfo.status === 'up' ? 'default' : 'destructive'}>
                    {queueInfo.status.toUpperCase()}
                  </Badge>
                ) : (
                  <Badge variant="secondary">UNKNOWN</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {queueInfo ? `Queue is ${queueInfo.status}` : 'Queue status unavailable'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} custom={2} whileHover="hover">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {databaseInfo ? (
                  <Badge variant={databaseInfo.status === 'up' ? 'default' : 'destructive'}>
                    {databaseInfo.status.toUpperCase()}
                  </Badge>
                ) : (
                  <Badge variant="secondary">UNKNOWN</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {databaseInfo
                  ? `Database is ${databaseInfo.status}`
                  : 'Database status unavailable'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} custom={3} whileHover="hover">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemStatus?.memory
                  ? `${Math.round((systemStatus.memory.used / systemStatus.memory.total) * 100)}%`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {systemStatus?.memory
                  ? `${Math.round(systemStatus.memory.used / 1024 / 1024)}MB / ${Math.round(
                      systemStatus.memory.total / 1024 / 1024
                    )}MB`
                  : 'Memory info unavailable'}
              </p>
              {systemStatus?.memory && (
                <motion.div className="mt-2">
                  <Progress
                    value={(systemStatus.memory.used / systemStatus.memory.total) * 100}
                    className="h-2"
                  />
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {systemStatus && (
        <motion.div variants={cardVariants} custom={4} whileHover="hover">
          <Card>
            <CardHeader>
              <CardTitle>System Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-muted-foreground">
                    {cpuUsage ? `${Math.round(cpuUsage)}%` : 'N/A'}
                  </span>
                </div>
                <motion.div
                  variants={progressVariants}
                  initial="hidden"
                  animate="visible"
                  custom={cpuUsage || 0}
                >
                  <Progress value={cpuUsage || 0} className="h-2" />
                </motion.div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-muted-foreground">
                    {systemStatus.memory
                      ? `${Math.round((systemStatus.memory.used / systemStatus.memory.total) * 100)}%`
                      : 'N/A'}
                  </span>
                </div>
                <motion.div
                  variants={progressVariants}
                  initial="hidden"
                  animate="visible"
                  custom={
                    systemStatus.memory
                      ? (systemStatus.memory.used / systemStatus.memory.total) * 100
                      : 0
                  }
                >
                  <Progress
                    value={
                      systemStatus.memory
                        ? (systemStatus.memory.used / systemStatus.memory.total) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
