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
import { getXsrfToken } from '@/lib/utils';

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
  const { hasPermission } = useAuth();

  // Check if user has permission to manage queue
  const canManageQueue = hasPermission(PERMISSIONS.MANAGE_QUEUE);

  const fetchQueueItems = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.QUEUE.ITEMS, {
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
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
          'X-XSRF-TOKEN': getXsrfToken(),
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Queue Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
              <motion.div variants={containerVariants}>
                <TabsList className="grid w-full grid-cols-5">
                  {[
                    { value: 'all', label: 'All', count: statusCounts.all },
                    { value: 'waiting', label: 'Waiting', count: statusCounts.waiting },
                    { value: 'active', label: 'Active', count: statusCounts.active },
                    { value: 'completed', label: 'Completed', count: statusCounts.completed },
                    { value: 'failed', label: 'Failed', count: statusCounts.failed },
                  ].map((tab, index) => (
                    <motion.div key={tab.value} variants={tabVariants} custom={index}>
                      <TabsTrigger value={tab.value} className="flex items-center gap-2">
                        {tab.label}
                        <Badge variant="secondary" className="ml-1">
                          {tab.count}
                        </Badge>
                      </TabsTrigger>
                    </motion.div>
                  ))}
                </TabsList>
              </motion.div>

              <AnimatePresence mode="wait">
                <TabsContent key={selectedStatus} value={selectedStatus}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {loading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <Skeleton className="h-12 w-full" />
                          </motion.div>
                        ))}
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8"
                      >
                        <p className="text-muted-foreground">No queue items found</p>
                      </motion.div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Progress</TableHead>
                              <TableHead>Attempts</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <AnimatePresence mode="wait">
                              {filteredItems.map((item, index) => (
                                <motion.tr
                                  key={item.id}
                                  variants={tableRowVariants}
                                  initial="hidden"
                                  animate="visible"
                                  custom={index}
                                  whileHover="hover"
                                  exit="exit"
                                  className="cursor-pointer"
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
                                    >
                                      {item.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="w-full bg-secondary rounded-full h-2">
                                      <motion.div
                                        className="bg-primary h-2 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.progress || 0}%` }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
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
                                    <motion.div
                                      variants={buttonVariants}
                                      whileHover="hover"
                                      whileTap="tap"
                                    >
                                      <Button
                                        size="sm"
                                        onClick={() => handleProcess(item.id)}
                                        disabled={item.status === 'completed'}
                                      >
                                        Process
                                      </Button>
                                    </motion.div>
                                  </TableCell>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
