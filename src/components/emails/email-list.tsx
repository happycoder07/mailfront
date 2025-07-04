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

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MoreHorizontal,
  Search,
  Check,
  X,
  FileText,
  Eye,
  AlertCircle,
  RefreshCw,
  Loader2,
  FileSignature,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useEmailShortcuts, useTableShortcuts } from '@/hooks/use-keyboard-shortcuts';

export function EmailList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission, getCSRFToken } = useAuth();
  const [emails, setEmails] = useState<EmailResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [selectedEmail, setSelectedEmail] = useState<EmailResponseDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    from: '',
    to: '',
    subject: '',
    status: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedEmailForRejection, setSelectedEmailForRejection] =
    useState<EmailResponseDto | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Email-specific keyboard shortcuts
  useEmailShortcuts(
    // onApprove - approve the first pending email
    () => {
      const pendingEmail = emails.find(email => email.status === 'PENDING');
      if (pendingEmail) {
        handleApprove(pendingEmail.id);
      }
    },
    // onReject - reject the first pending email
    () => {
      const pendingEmail = emails.find(email => email.status === 'PENDING');
      if (pendingEmail) {
        openRejectDialog(pendingEmail);
      }
    },
    // onSign - sign the first pending email
    () => {
      const pendingEmail = emails.find(email => email.status === 'PENDING');
      if (pendingEmail) {
        handleSign(pendingEmail.id);
      }
    },
    // onView - view the first email
    () => {
      if (emails.length > 0) {
        handleView(emails[0]);
      }
    }
  );

  // Table navigation shortcuts
  useTableShortcuts(
    // onNextPage
    () => {
      if (pagination.page < pagination.totalPages) {
        handlePageChange(pagination.page + 1);
      }
    },
    // onPrevPage
    () => {
      if (pagination.page > 1) {
        handlePageChange(pagination.page - 1);
      }
    },
    // onFirstPage
    () => {
      if (pagination.page > 1) {
        handlePageChange(1);
      }
    },
    // onLastPage
    () => {
      if (pagination.page < pagination.totalPages) {
        handlePageChange(pagination.totalPages);
      }
    }
  );

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handleDateChange = (key: 'startDate' | 'endDate', date: Date | undefined) => {
    setFilters(prev => ({ ...prev, [key]: date ? format(date, 'yyyy-MM-dd') : '' }));
  };

  const handleSearch = () => {
    setSearching(true);
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchEmails();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(appliedFilters.startDate && { startDate: appliedFilters.startDate }),
        ...(appliedFilters.endDate && { endDate: appliedFilters.endDate }),
        ...(appliedFilters.from && { from: appliedFilters.from }),
        ...(appliedFilters.to && { to: appliedFilters.to }),
        ...(appliedFilters.subject && { subject: appliedFilters.subject }),
        ...(appliedFilters.status &&
          appliedFilters.status !== 'ALL' && { status: appliedFilters.status }),
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      const url = `${API_ENDPOINTS.MAIL.LIST}?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'X-XSRF-TOKEN': getCSRFToken()
        },
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
      setSearching(false);
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
  }, [pagination.page, pagination.pageSize, autoRefresh, appliedFilters]);

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.APPROVE(id.toString()), {
        method: 'POST',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken()
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve email');
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
        description: error instanceof Error ? error.message : 'Failed to approve email',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.REJECT(id.toString()), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject email');
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
        description: error instanceof Error ? error.message : 'Failed to reject email',
        variant: 'destructive',
      });
    }
  };

  const handleSign = async (id: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.SIGN(id.toString()), {
        method: 'POST',
        headers: {

          'X-XSRF-TOKEN': getCSRFToken()
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sign email');
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
        description: error instanceof Error ? error.message : 'Failed to sign email',
        variant: 'destructive',
      });
    }
  };

  const handleView = (email: EmailResponseDto) => {
    router.push(`/emails/${email.id}`);
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

  const openRejectDialog = (email: EmailResponseDto) => {
    setSelectedEmailForRejection(email);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = () => {
    if (selectedEmailForRejection && rejectionReason.trim()) {
      handleReject(selectedEmailForRejection.id, rejectionReason.trim());
      setRejectDialogOpen(false);
    }
  };

  if (!hasPermission(PERMISSIONS.VIEW_EMAILS)) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-destructive">
          You do not have permission to view emails. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchEmails}
                disabled={loading}
                aria-label="Refresh email list"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search by subject..."
                  className="pl-10"
                  value={filters.subject}
                  onChange={e => handleFilterChange('subject', e.target.value)}
                  aria-label="Search emails by subject"
                />
              </div>
              <div className="relative">
                <Input
                  placeholder="Filter by sender..."
                  value={filters.from}
                  onChange={e => handleFilterChange('from', e.target.value)}
                  aria-label="Filter emails by sender"
                />
              </div>
              <div className="relative">
                <Input
                  placeholder="Filter by recipient..."
                  value={filters.to}
                  onChange={e => handleFilterChange('to', e.target.value)}
                  aria-label="Filter emails by recipient"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="w-full">
                <DatePicker
                  date={filters.startDate ? new Date(filters.startDate) : undefined}
                  onSelect={date => handleDateChange('startDate', date)}
                  placeholder="Start date"
                  aria-label="Select start date for email filter"
                />
              </div>
              <div className="w-full">
                <DatePicker
                  date={filters.endDate ? new Date(filters.endDate) : undefined}
                  onSelect={date => handleDateChange('endDate', date)}
                  placeholder="End date"
                  aria-label="Select end date for email filter"
                />
              </div>
              <div className="w-full">
                <Select value={filters.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full" aria-label="Filter by email status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full">
                <Button
                  onClick={handleSearch}
                  disabled={searching}
                  className="w-full"
                  aria-describedby={searching ? "searching-description" : undefined}
                >
                  {searching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span id="searching-description" className="sr-only">Searching emails, please wait</span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <Table role="table" aria-label="Email list">
                  <TableHeader>
                    <TableRow className='bg-background'>
                      <TableHead className="whitespace-nowrap text-center" scope="col">From</TableHead>
                      <TableHead className="whitespace-nowrap text-center" scope="col">Subject</TableHead>
                      <TableHead className="whitespace-nowrap text-center" scope="col">Status</TableHead>
                      <TableHead className="whitespace-nowrap text-center" scope="col">Signed</TableHead>
                      <TableHead className="whitespace-nowrap text-center" scope="col">Created At</TableHead>
                      <TableHead className="whitespace-nowrap text-center" scope="col">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" aria-hidden="true" />
                          <span className="sr-only">Loading emails</span>
                        </TableCell>
                      </TableRow>
                    ) : emails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          <Alert role="alert">
                            <AlertCircle className="h-4 w-4" aria-hidden="true" />
                            <AlertTitle>No emails found</AlertTitle>
                            <AlertDescription>
                              Try adjusting your search or filter criteria
                            </AlertDescription>
                          </Alert>
                        </TableCell>
                      </TableRow>
                    ) : (
                      emails.map(email => (
                        <TableRow
                          key={email.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleView(email)}
                          role="row"
                          aria-label={`Email from ${email.from} with subject ${email.subject}`}
                        >
                          <TableCell className="max-w-[200px] truncate text-center">
                            <Tooltip>
                              <TooltipTrigger>{email.from}</TooltipTrigger>
                              <TooltipContent>{email.from}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate text-center">
                            <Tooltip>
                              <TooltipTrigger>{email.subject}</TooltipTrigger>
                              <TooltipContent>{email.subject}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  email.status === 'PENDING'
                                    ? 'bg-[var(--status-pending)] text-[var(--status-pending-foreground)]'
                                    : email.status === 'APPROVED'
                                      ? 'bg-[var(--status-approved)] text-[var(--status-approved-foreground)]'
                                      : email.status === 'REJECTED'
                                        ? 'bg-[var(--status-rejected)] text-[var(--status-rejected-foreground)]'
                                        : email.status === 'SENT'
                                          ? 'bg-[var(--status-sent)] text-[var(--status-sent-foreground)]'
                                          : 'bg-[var(--status-failed)] text-[var(--status-failed-foreground)]'
                                }`}
                                aria-label={`Email status: ${email.status}`}
                              >
                                {email.status}
                              </span>
                              {email.approvedBy && (
                                <span className="text-xs text-muted-foreground">
                                  {email.signedContent ? 'Signed by' : 'Approved by'}: {email.approvedBy.firstName} {email.approvedBy.lastName}
                                </span>
                              )}
                              {email.rejectedBy && (
                                <span className="text-xs text-muted-foreground">
                                  Rejected by: {email.rejectedBy.firstName} {email.rejectedBy.lastName}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {email.signedContent ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <FileSignature className="h-4 w-4 text-green-500" aria-hidden="true" />
                                </TooltipTrigger>
                                <TooltipContent>Email is signed</TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-muted-foreground" aria-label="Email is not signed">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-center">
                            {format(new Date(email.createdAt), 'PPpp')}
                          </TableCell>
                          <TableCell className="text-center">
                            <div
                              className="flex items-center justify-center"
                              onClick={e => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Actions for email from ${email.from}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" aria-label="Email actions">
                                  <DropdownMenuItem onClick={() => handleView(email)}>
                                    <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                                    View
                                  </DropdownMenuItem>
                                  {email.status === 'PENDING' && (
                                    <>
                                      {canApprove && (
                                        <DropdownMenuItem onClick={() => handleApprove(email.id)}>
                                          <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                                          Approve
                                        </DropdownMenuItem>
                                      )}
                                      {canReject && (
                                        <DropdownMenuItem onClick={() => openRejectDialog(email)}>
                                          <X className="mr-2 h-4 w-4" aria-hidden="true" />
                                          Reject
                                        </DropdownMenuItem>
                                      )}
                                      {canSign && (
                                        <DropdownMenuItem onClick={() => handleSign(email.id)}>
                                          <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                                          Sign
                                        </DropdownMenuItem>
                                      )}
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {emails.length} of {pagination.totalItems} emails
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
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

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Email</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this email.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRejectSubmit} disabled={!rejectionReason.trim()}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
