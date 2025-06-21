'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getXsrfToken } from '@/lib/utils';

type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

type Metric = {
  name: string;
  value: string;
  type: MetricType;
  help: string;
  labels?: Record<string, string>;
};

type MetricGroup = {
  name: string;
  type: MetricType;
  help: string;
  metrics: Metric[];
};

export function MetricsDisplay() {
  const [metricGroups, setMetricGroups] = useState<MetricGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { hasPermission } = useAuth();

  // Check if user has permission to view metrics
  const canViewMetrics = hasPermission(PERMISSIONS.VIEW_METRICS);

  const fetchMetrics = async () => {
    if (!canViewMetrics) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.MONITORING.METRICS, {
        headers: {
          'Content-Type': 'text/plain', // Prometheus metrics are returned as text/plain
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const text = await response.text();
      const parsedMetrics = parsePrometheusMetrics(text);
      setMetricGroups(parsedMetrics);
      setError(null);

      // Initialize all groups as expanded
      const expandedState: Record<string, boolean> = {};
      parsedMetrics.forEach(group => {
        expandedState[group.name] = true;
      });
      setExpandedGroups(expandedState);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError('Failed to fetch metrics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    let interval: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [canViewMetrics, autoRefresh]);

  // If user doesn't have permission to view metrics, show a message
  if (!canViewMetrics) {
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
              You do not have permission to view metrics. Please contact your administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const formatValue = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;

    // Format large numbers with appropriate units
    if (numValue >= 1000000000) {
      return `${(numValue / 1000000000).toFixed(2)}B`;
    } else if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(2)}M`;
    } else if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(2)}K`;
    } else if (numValue < 0.01 && numValue > 0) {
      return numValue.toExponential(2);
    } else {
      return numValue.toFixed(2);
    }
  };

  const getMetricTypeColor = (type: MetricType) => {
    switch (type) {
      case 'counter':
        return 'bg-primary/10 text-primary';
      case 'gauge':
        return 'bg-success/10 text-success';
      case 'histogram':
        return 'bg-accent/10 text-accent';
      case 'summary':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'info':
        return 'bg-primary/10 text-primary';
      case 'success':
        return 'bg-success/10 text-success';
      case 'warning':
        return 'bg-warning/10 text-warning';
      case 'error':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System Metrics</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={checked => setAutoRefresh(checked as boolean)}
              />
              <Label htmlFor="auto-refresh">Auto-refresh</Label>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchMetrics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full">
          {metricGroups.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Metrics Available</AlertTitle>
              <AlertDescription>
                There are currently no metrics to display. Please check back later.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {metricGroups.map(group => (
                <div key={group.name} className="rounded-lg border">
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between p-4"
                    onClick={() => toggleGroup(group.name)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.name}</span>
                      <Badge className={getMetricTypeColor(group.type)}>{group.type}</Badge>
                    </div>
                    {expandedGroups[group.name] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  {expandedGroups[group.name] && (
                    <div className="p-4 pt-0 space-y-4">
                      <p className="text-sm text-muted-foreground">{group.help}</p>
                      <Separator />
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead>Labels</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.metrics.map((metric, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{metric.name}</TableCell>
                              <TableCell>
                                {metric.labels && Object.keys(metric.labels).length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(metric.labels).map(([key, value], i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {key}={value}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatValue(metric.value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function parsePrometheusMetrics(text: string): MetricGroup[] {
  const lines = text.split('\n');
  const groups: Record<string, MetricGroup> = {};
  let currentName = '';
  let currentHelp = '';
  let currentType: MetricType = 'counter';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) {
      // Parse HELP line
      if (line.startsWith('# HELP ')) {
        const parts = line.substring(7).split(' ');
        currentName = parts[0];
        currentHelp = parts.slice(1).join(' ');

        // Initialize group if it doesn't exist
        if (!groups[currentName]) {
          groups[currentName] = {
            name: currentName,
            help: currentHelp,
            type: 'counter', // Default type
            metrics: [],
          };
        } else {
          groups[currentName].help = currentHelp;
        }
      }
      // Parse TYPE line
      else if (line.startsWith('# TYPE ')) {
        const parts = line.substring(7).split(' ');
        currentName = parts[0];
        const typeStr = parts[1];

        // Map Prometheus types to our types
        if (typeStr === 'counter' || typeStr === 'gauge' || typeStr === 'histogram' || typeStr === 'summary') {
          currentType = typeStr as MetricType;
        }

        if (groups[currentName]) {
          groups[currentName].type = currentType;
        }
      }
      continue;
    }

    // Parse metric line (not starting with #)
    const parts = line.split(' ');
    if (parts.length < 2) continue;

    const metricName = parts[0];
    const value = parts[parts.length - 1];
    const labels: Record<string, string> = {};

    // Parse labels if they exist
    if (parts[0].includes('{')) {
      const labelStart = parts[0].indexOf('{');
      const labelEnd = parts[0].indexOf('}');
      if (labelStart !== -1 && labelEnd !== -1 && labelEnd > labelStart) {
        const labelStr = parts[0].substring(labelStart + 1, labelEnd);
        labelStr.split(',').forEach(label => {
          const [key, value] = label.split('=');
          if (key && value) {
            // Remove quotes from value
            labels[key] = value.replace(/"/g, '');
          }
        });
      }
    }

    const metric: Metric = {
      name: metricName.split('{')[0],
      value,
      type: currentType,
      help: currentHelp,
      labels: Object.keys(labels).length > 0 ? labels : undefined,
    };

    // Find the appropriate group for this metric
    const baseMetricName = metricName.split('{')[0];
    if (groups[baseMetricName]) {
      groups[baseMetricName].metrics.push(metric);
    } else {
      // Create a new group if none exists
      groups[baseMetricName] = {
        name: baseMetricName,
        help: currentHelp || `Metric: ${baseMetricName}`,
        type: currentType,
        metrics: [metric],
      };
    }
  }

  return Object.values(groups);
}
