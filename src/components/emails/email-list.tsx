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
import { MoreHorizontal, Search, Check, X, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/lib/config';
import { EmailDialog } from './email-dialog';

type Email = {
  id: string;
  from: string;
  subject: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT' | 'FAILED';
  createdAt: string;
  recipients: {
    address: string;
    type: 'TO' | 'CC' | 'BCC';
  }[];
  attachments: {
    filename: string;
    contentType: string;
    size: number;
  }[];
};

export function EmailList() {
  const router = useRouter();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchEmails = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.EMAIL.LIST, {
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

      const data = await response.json();
      setEmails(data.items || []);
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
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.EMAIL.APPROVE(id), {
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

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.EMAIL.REJECT(id), {
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

  const handleSign = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.EMAIL.SIGN(id), {
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

  const handleView = (email: Email) => {
    setSelectedEmail(email);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: Email['status']) => {
    const variants = {
      PENDING: 'default',
      APPROVED: 'default',
      REJECTED: 'destructive',
      SENT: 'default',
      FAILED: 'destructive',
    } as const;
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  // Filter emails based on search and status
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      // Filter by status
      if (status !== 'ALL' && email.status !== status) {
        return false;
      }

      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          email.from.toLowerCase().includes(searchLower) ||
          email.subject.toLowerCase().includes(searchLower) ||
          email.content.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [emails, status, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredEmails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No emails found
                </TableCell>
              </TableRow>
            ) : (
              filteredEmails.map(email => (
                <TableRow key={email.id}>
                  <TableCell>{email.from}</TableCell>
                  <TableCell>{email.subject}</TableCell>
                  <TableCell>{getStatusBadge(email.status)}</TableCell>
                  <TableCell>{format(new Date(email.createdAt), 'PPp')}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(email)}>View</DropdownMenuItem>
                        {email.status === 'PENDING' && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(email.id)}>
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReject(email.id)}>
                              Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSign(email.id)}>
                              Sign
                            </DropdownMenuItem>
                          </>
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

      {selectedEmail && (
        <EmailDialog
          email={selectedEmail}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onActionComplete={() => {
            // Refresh the list after action completion
            fetchEmails();
          }}
        />
      )}
    </div>
  );
}
