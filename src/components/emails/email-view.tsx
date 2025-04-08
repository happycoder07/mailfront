'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/lib/config';
import { FileText, Check, X, FileText as FileTextIcon } from 'lucide-react';

interface EmailViewProps {
  id: string;
}

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

export function EmailView({ id }: EmailViewProps) {
  const router = useRouter();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.EMAIL.DETAIL(id)}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch email');
        }
        const data = await response.json();
        setEmail(data);
      } catch (error) {
        console.error('Error fetching email:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch email details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEmail();
  }, [id]);

  const handleApprove = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.EMAIL.APPROVE(id)}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to approve email');
      }
      toast({
        title: 'Success',
        description: 'Email approved successfully',
      });
      router.refresh();
    } catch (error) {
      console.error('Error approving email:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve email',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.EMAIL.REJECT(id)}`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ reason: 'Rejected by user' }),
      });
      if (!response.ok) {
        throw new Error('Failed to reject email');
      }
      toast({
        title: 'Success',
        description: 'Email rejected successfully',
      });
      router.refresh();
    } catch (error) {
      console.error('Error rejecting email:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject email',
        variant: 'destructive',
      });
    }
  };

  const handleSign = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.EMAIL.SIGN(id)}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to sign email');
      }
      toast({
        title: 'Success',
        description: 'Email signed successfully',
      });
      router.refresh();
    } catch (error) {
      console.error('Error signing email:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign email',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!email) {
    return <div>Email not found</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{email.subject}</CardTitle>
            <Badge variant={email.status === 'APPROVED' ? 'default' : 'destructive'}>
              {email.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium">From</div>
              <div className="text-sm text-muted-foreground">{email.from}</div>
            </div>
            <div>
              <div className="text-sm font-medium">To</div>
              <div className="text-sm text-muted-foreground">
                {email.recipients
                  .filter(r => r.type === 'TO')
                  .map(r => r.address)
                  .join(', ')}
              </div>
            </div>
            {email.recipients.some(r => r.type === 'CC') && (
              <div>
                <div className="text-sm font-medium">CC</div>
                <div className="text-sm text-muted-foreground">
                  {email.recipients
                    .filter(r => r.type === 'CC')
                    .map(r => r.address)
                    .join(', ')}
                </div>
              </div>
            )}
            {email.recipients.some(r => r.type === 'BCC') && (
              <div>
                <div className="text-sm font-medium">BCC</div>
                <div className="text-sm text-muted-foreground">
                  {email.recipients
                    .filter(r => r.type === 'BCC')
                    .map(r => r.address)
                    .join(', ')}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium">Date</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(email.createdAt), 'PPp')}
              </div>
            </div>
            <Separator />
            <div className="whitespace-pre-wrap">{email.content}</div>
          </div>
        </CardContent>
      </Card>

      {email.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {email.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="flex items-center space-x-2">
                    <FileTextIcon className="h-4 w-4" />
                    <span>{attachment.filename}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {email.status === 'PENDING' && (
        <div className="flex space-x-2">
          <Button onClick={handleApprove} className="flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>Approve</span>
          </Button>
          <Button
            onClick={handleReject}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Reject</span>
          </Button>
          <Button onClick={handleSign} className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Sign</span>
          </Button>
        </div>
      )}
    </div>
  );
}
