
import { QueueStats } from '@/components/queue/queue-stats';
import { QueueItems } from '@/components/queue/queue-items';



export default function QueuePage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Queue</h1>
        <p className="text-muted-foreground">Monitor and manage the email queue</p>
      </div>
      <QueueStats />
      <QueueItems />
    </div>
  );
}
