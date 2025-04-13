'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
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
  const { hasPermission } = useAuth();

  // Check if user has permission to view metrics
  const canViewMetrics = hasPermission(PERMISSIONS.VIEW_METRICS);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!canViewMetrics) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(API_ENDPOINTS.MONITORING.METRICS, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const text = await response.text();
        const parsedMetrics = parsePrometheusMetrics(text);
        setMetricGroups(parsedMetrics);

        // Initialize all groups as expanded
        const expandedState: Record<string, boolean> = {};
        parsedMetrics.forEach(group => {
          expandedState[group.name] = true;
        });
        setExpandedGroups(expandedState);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [canViewMetrics]);

  // If user doesn't have permission to view metrics, show a message
  if (!canViewMetrics) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to view metrics. Please contact your administrator.
        </p>
      </div>
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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'gauge':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'histogram':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'summary':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System Metrics</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full">
          {loading ? (
            <div>Loading metrics...</div>
          ) : metricGroups.length === 0 ? (
            <div>No metrics available</div>
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
    if (!line) continue;

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
      currentType = parts[1] as MetricType;

      // Update group type
      if (groups[currentName]) {
        groups[currentName].type = currentType;
      }
    }

    // Parse metric line
    else if (!line.startsWith('#')) {
      const parts = line.split(' ');
      if (parts.length < 2) continue;

      const metricName = parts[0];
      const value = parts[parts.length - 1];

      // Extract labels if present
      let labels: Record<string, string> | undefined;
      if (metricName.includes('{') && metricName.includes('}')) {
        const nameParts = metricName.split('{');
        const name = nameParts[0];
        const labelsStr = nameParts[1].split('}')[0];

        labels = {};
        labelsStr.split(',').forEach(label => {
          const [key, value] = label.split('=');
          if (key && value) {
            labels![key] = value.replace(/"/g, '');
          }
        });

        // Use the base name for grouping
        currentName = name;
      }

      // Add metric to group
      if (groups[currentName]) {
        groups[currentName].metrics.push({
          name: metricName,
          value,
          type: groups[currentName].type,
          help: groups[currentName].help,
          labels,
        });
      }
    }
  }

  // Convert to array and sort by name
  return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
}
