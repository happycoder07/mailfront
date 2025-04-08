import { Metadata } from 'next';
import { MonitoringStats } from '@/components/monitoring/monitoring-stats';
import { MetricsDisplay } from '@/components/monitoring/metrics-display';

export const metadata: Metadata = {
  title: 'Monitoring',
  description: 'System monitoring and metrics',
};

export default function MonitoringPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
        <p className="text-muted-foreground">System health and performance metrics</p>
      </div>
      <MonitoringStats />
      <MetricsDisplay />
    </div>
  );
}
