'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MoreHorizontal,
  Search,
  Check,
  X,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import {
  API_ENDPOINTS,
  EmailResponseDto,
  PaginatedEmailResponseDto,
  EmailStatus,
} from '@/lib/config';
import { EmailDialog } from './email-dialog';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function EmailList() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [emails, setEmails] = useState<EmailResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [selectedEmail, setSelectedEmail] = useState<EmailResponseDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const fetchEmails = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (status !== 'ALL') {
        params.append('status', status);
      }
      if (search) {
        params.append('subject', search);
      }
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());

      const url = `${API_ENDPOINTS.MAIL.LIST}?${params.toString()}`;

      const response = await fetch(url, {
        credentials: 'include', // Include cookies in the request
      });

      if (response.status === 401) {
        // Unauthorized, redirect to login
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }

      const data: PaginatedEmailResponseDto = await response.json();
      setEmails(data.items || []);
      setPagination({
        ...pagination,
        totalItems: data.meta.totalItems,
        totalPages: data.meta.totalPages,
      });
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch emails',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    let interval: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      interval = setInterval(fetchEmails, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, pagination.page, pagination.pageSize, autoRefresh]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchEmails();
  };

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.APPROVE(id.toString()), {
        method: 'POST',
        credentials: 'include',
      });

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to approve email');
      }

      // Refresh the list
      fetchEmails();

      toast({
        title: 'Success',
        description: 'Email approved successfully',
      });
    } catch (error) {
      console.error('Error approving email:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve email',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.REJECT(id.toString()), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Rejected by user' }),
      });

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to reject email');
      }

      // Refresh the list
      fetchEmails();

      toast({
        title: 'Success',
        description: 'Email rejected successfully',
      });
    } catch (error) {
      console.error('Error rejecting email:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject email',
        variant: 'destructive',
      });
    }
  };

  const handleSign = async (id: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.SIGN(id.toString()), {
        method: 'POST',
        credentials: 'include',
      });

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to sign email');
      }

      // Refresh the list
      fetchEmails();

      toast({
        title: 'Success',
        description: 'Email signed successfully',
      });
    } catch (error) {
      console.error('Error signing email:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign email',
        variant: 'destructive',
      });
    }
  };

  const handleView = (email: EmailResponseDto) => {
    setSelectedEmail(email);
    setDialogOpen(true);
  };

  const handleEmailUpdated = () => {
    fetchEmails();
  };

  const getStatusBadge = (status: EmailStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="default">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'SENT':
        return <Badge variant="secondary">Sent</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canApprove = hasPermission(PERMISSIONS.APPROVE_EMAILS);
  const canReject = hasPermission(PERMISSIONS.REJECT_EMAILS);
  const canSign = hasPermission(PERMISSIONS.APPROVE_EMAILS);
  const canViewAttachments = hasPermission(PERMISSIONS.VIEW_ATTACHMENTS);

  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          email.subject.toLowerCase().includes(searchLower) ||
          email.from.toLowerCase().includes(searchLower) ||
          email.recipients.some(r => r.address.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }, [emails, search]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Email Management</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={checked => setAutoRefresh(checked as boolean)}
                />
                <Label htmlFor="auto-refresh">Auto-refresh</Label>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchEmails} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search emails..."
                  className="pl-8"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="w-full md:w-auto">
                Search
              </Button>
            </div>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={value => handlePageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-full md:w-[120px]">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEmails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No emails found</AlertTitle>
                        <AlertDescription>
                          Try adjusting your search or filter criteria
                        </AlertDescription>
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmails.map(email => (
                    <TableRow key={email.id}>
                      <TableCell className="font-medium">
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium"
                          onClick={() => router.push(`/emails/${email.id}`)}
                        >
                          {email.subject}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {email.recipients.map(r => (
                            <Badge
                              key={r.id}
                              variant={
                                r.type === 'TO'
                                  ? 'default'
                                  : r.type === 'CC'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className="w-fit"
                            >
                              {r.address}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(email.createdAt), 'PPp')}</TableCell>
                      <TableCell>{getStatusBadge(email.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem onClick={() => handleView(email)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent>View email details</TooltipContent>
                            </Tooltip>
                            {email.status === 'PENDING' && canApprove && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DropdownMenuItem onClick={() => handleApprove(email.id)}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                </TooltipTrigger>
                                <TooltipContent>Approve this email</TooltipContent>
                              </Tooltip>
                            )}
                            {email.status === 'PENDING' && canReject && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DropdownMenuItem onClick={() => handleReject(email.id)}>
                                    <X className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </TooltipTrigger>
                                <TooltipContent>Reject this email</TooltipContent>
                              </Tooltip>
                            )}
                            {email.status === 'PENDING' && canSign && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DropdownMenuItem onClick={() => handleSign(email.id)}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Sign
                                  </DropdownMenuItem>
                                </TooltipTrigger>
                                <TooltipContent>Sign this email</TooltipContent>
                              </Tooltip>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredEmails.length} of {pagination.totalItems} emails
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEmail && (
        <EmailDialog
          email={selectedEmail}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onEmailUpdated={handleEmailUpdated}
        />
      )}
    </div>
  );
}
