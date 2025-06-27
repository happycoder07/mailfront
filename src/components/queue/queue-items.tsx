'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Loader2, RefreshCw, Play, Pause, Trash2 } from 'lucide-react';
import { useTableShortcuts } from '@/hooks/use-keyboard-shortcuts';

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
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
  hover: {
    scale: 1.01,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: 'easeOut',
    },
  }),
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } },
};

export function QueueItems() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { hasPermission, getCSRFToken } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  // Check if user has permission to manage queue
  const canManageQueue = hasPermission(PERMISSIONS.MANAGE_QUEUE);

  // Table navigation shortcuts
  useTableShortcuts(
    // onNextPage
    () => {
      if (pagination.page < pagination.totalPages) {
        setPagination(prev => ({ ...prev, page: prev.page + 1 }));
      }
    },
    // onPrevPage
    () => {
      if (pagination.page > 1) {
        setPagination(prev => ({ ...prev, page: prev.page - 1 }));
      }
    },
    // onFirstPage
    () => {
      if (pagination.page > 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    },
    // onLastPage
    () => {
      if (pagination.page < pagination.totalPages) {
        setPagination(prev => ({ ...prev, page: prev.totalPages }));
      }
    }
  );

  const fetchQueueItems = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.QUEUE.ITEMS, {
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
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
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
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
      <motion.div variants={cardVariants} initial="hidden" animate="visible">
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
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="main"
      aria-labelledby="queue-items-title"
    >
      <h1 id="queue-items-title" className="sr-only">Email Queue Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Queue Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus} aria-label="Queue status tabs">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" aria-label="Show all queue items">All</TabsTrigger>
              <TabsTrigger value="waiting" aria-label="Show waiting queue items">Waiting</TabsTrigger>
              <TabsTrigger value="active" aria-label="Show active queue items">Active</TabsTrigger>
              <TabsTrigger value="completed" aria-label="Show completed queue items">Completed</TabsTrigger>
              <TabsTrigger value="failed" aria-label="Show failed queue items">Failed</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <QueueTable items={items} onProcess={handleProcess} canManageQueue={canManageQueue} loading={loading} formatDate={formatDate} />
            </TabsContent>
            <TabsContent value="waiting" className="mt-6">
              <QueueTable
                items={items.filter(item => item.status === 'waiting')}
                onProcess={handleProcess}
                canManageQueue={canManageQueue}
                loading={loading}
                formatDate={formatDate}
              />
            </TabsContent>
            <TabsContent value="active" className="mt-6">
              <QueueTable
                items={items.filter(item => item.status === 'active')}
                onProcess={handleProcess}
                canManageQueue={canManageQueue}
                loading={loading}
                formatDate={formatDate}
              />
            </TabsContent>
            <TabsContent value="completed" className="mt-6">
              <QueueTable
                items={items.filter(item => item.status === 'completed')}
                onProcess={handleProcess}
                canManageQueue={canManageQueue}
                loading={loading}
                formatDate={formatDate}
              />
            </TabsContent>
            <TabsContent value="failed" className="mt-6">
              <QueueTable
                items={items.filter(item => item.status === 'failed')}
                onProcess={handleProcess}
                canManageQueue={canManageQueue}
                loading={loading}
                formatDate={formatDate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// QueueTable component
function QueueTable({
  items,
  onProcess,
  canManageQueue,
  loading,
  formatDate
}: {
  items: QueueItem[];
  onProcess: (id: string) => void;
  canManageQueue: boolean;
  loading: boolean;
  formatDate: (dateString: string | undefined | null) => string;
}) {
  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading queue items">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8" role="alert">
        <p className="text-muted-foreground">No queue items found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table role="table" aria-label="Queue items table">
        <TableHeader>
          <TableRow className='bg-background'>
            <TableHead scope="col">ID</TableHead>
            <TableHead scope="col">Name</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Progress</TableHead>
            <TableHead scope="col">Attempts</TableHead>
            <TableHead scope="col">Created</TableHead>
            <TableHead scope="col">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              role="row"
              aria-label={`Queue item ${item.name} with status ${item.status}`}
            >
              <TableCell className="font-mono text-sm">
                {item.id.slice(0, 8)}...
              </TableCell>
              <TableCell>{item.name}</TableCell>
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
                  aria-label={`Status: ${item.status}`}
                >
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="w-full bg-secondary rounded-full h-2" role="progressbar" aria-valuenow={item.progress || 0} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${item.progress || 0}%` }}
                  />
                </div>
              </TableCell>
              <TableCell>
                {item.attemptsMade} / {item.opts.attempts}
              </TableCell>
              <TableCell>
                {formatDate(new Date(item.timestamp).toISOString())}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  onClick={() => onProcess(item.id)}
                  disabled={item.status === 'completed'}
                  aria-label={`Process queue item ${item.name}`}
                >
                  Process
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
