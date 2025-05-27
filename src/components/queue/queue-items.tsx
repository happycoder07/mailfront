'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { format, isValid, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { API_ENDPOINTS } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

type QueueItem = {
  id: string;
  name: string;
  data: {
    emailId: number;
    retryCount: number;
  };
  opts: {
    attempts: number;
    backoff: {
      type: string;
      delay: number;
    };
    removeOnComplete: boolean;
    removeOnFail: boolean;
    jobId: string;
    delay: number;
    timestamp: number;
  };
  progress: number;
  delay: number;
  timestamp: number;
  attemptsMade: number;
  failedReason: string;
  stacktrace: string[];
  returnvalue: any;
  debounceId: string | null;
  finishedOn: number;
  processedOn: number;
  status: 'waiting' | 'active' | 'completed' | 'failed';
};

type QueueItemsResponse = {
  items: {
    waiting: QueueItem[];
    active: QueueItem[];
    completed: QueueItem[];
    failed: QueueItem[];
  };
};

export function QueueItems() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { hasPermission } = useAuth();

  // Check if user has permission to manage queue
  const canManageQueue = hasPermission(PERMISSIONS.MANAGE_QUEUE);

  const fetchQueueItems = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.QUEUE.ITEMS, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch queue items');
      }
      const data: QueueItemsResponse = await response.json();

      // Combine all queue items into a single array with their status
      const allItems: QueueItem[] = [
        ...data.items.waiting.map(item => ({ ...item, status: 'waiting' as const })),
        ...data.items.active.map(item => ({ ...item, status: 'active' as const })),
        ...data.items.completed.map(item => ({ ...item, status: 'completed' as const })),
        ...data.items.failed.map(item => ({ ...item, status: 'failed' as const })),
      ];
      setItems(allItems);
    } catch (error) {
      console.error('Error fetching queue items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch queue items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueItems();
  }, []);

  const handleProcess = async (id: string) => {
    if (!canManageQueue) {
      toast({
        title: 'Error',
        description: 'You do not have permission to manage the queue',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.QUEUE.PROCESS(id), {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to process queue item');
      }
      toast({
        title: 'Success',
        description: 'Queue item processed successfully',
      });
      fetchQueueItems();
    } catch (error) {
      console.error('Error processing queue item:', error);
      toast({
        title: 'Error',
        description: 'Failed to process queue item',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'PPp');
      }
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const filteredItems =
    selectedStatus === 'all' ? items : items.filter(item => item.status === selectedStatus);

  const statusCounts = {
    all: items.length,
    waiting: items.filter(item => item.status === 'waiting').length,
    active: items.filter(item => item.status === 'active').length,
    completed: items.filter(item => item.status === 'completed').length,
    failed: items.filter(item => item.status === 'failed').length,
  };

  // If user doesn't have permission to manage queue, show a message
  if (!canManageQueue) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You do not have permission to manage the queue. Please contact your administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Queue Items</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setSelectedStatus}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="waiting">Waiting ({statusCounts.waiting})</TabsTrigger>
            <TabsTrigger value="active">Active ({statusCounts.active})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
            <TabsTrigger value="failed">Failed ({statusCounts.failed})</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[600px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Email ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Failed Reason</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Finished At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[50px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[60px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[200px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-[80px] ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No queue items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.data.emailId}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'completed'
                              ? 'default'
                              : item.status === 'failed'
                                ? 'destructive'
                                : item.status === 'active'
                                  ? 'secondary'
                                  : 'outline'
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.attemptsMade} / {item.opts.attempts}
                      </TableCell>
                      <TableCell>
                        {item.failedReason && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="text-primary underline-offset-4 hover:underline cursor-pointer">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="line-clamp-1 max-w-[200px] block">
                                        {item.failedReason}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-[300px] break-words">
                                        {item.failedReason}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                              <DialogHeader>
                                <DialogTitle>Error Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
                                <div>
                                  <h4 className="font-medium mb-2">Error Message</h4>
                                  <p className="text-sm text-muted-foreground break-words">
                                    {item.failedReason}
                                  </p>
                                </div>
                                {item.stacktrace && item.stacktrace.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Stack Trace</h4>
                                    <ScrollArea className="h-[300px] rounded-md border">
                                      <div className="p-4 bg-muted/50">
                                        <pre className="text-sm font-mono whitespace-pre-wrap break-words overflow-x-auto">
                                          {item.stacktrace.map((line, index) => (
                                            <div key={index} className="py-0.5">
                                              {line}
                                            </div>
                                          ))}
                                        </pre>
                                      </div>
                                    </ScrollArea>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(new Date(item.timestamp).toISOString())}</TableCell>
                      <TableCell>{formatDate(new Date(item.finishedOn).toISOString())}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProcess(item.data.emailId.toString())}
                          disabled={item.status === 'active'}
                        >
                          Process
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
