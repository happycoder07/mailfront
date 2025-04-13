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
import { FileText, Check, X, FileText as FileTextIcon, Download, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
    id: string;
    minioKey: string;
  }[];
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  signedContent?: string;
};

export function EmailView({ id }: EmailViewProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Check permissions
  const canApprove = hasPermission(PERMISSIONS.APPROVE_EMAILS);
  const canReject = hasPermission(PERMISSIONS.REJECT_EMAILS);
  const canSign = hasPermission(PERMISSIONS.APPROVE_EMAILS);
  const canViewAttachments = hasPermission(PERMISSIONS.VIEW_ATTACHMENTS);

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.MAIL.DETAIL(id)}`, {
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
      const response = await fetch(`${API_ENDPOINTS.MAIL.APPROVE(id)}`, {
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
      const response = await fetch(`${API_ENDPOINTS.MAIL.REJECT(id)}`, {
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
      const response = await fetch(`${API_ENDPOINTS.MAIL.SIGN(id)}`, {
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

  const handleDownload = async (attachment: Email['attachments'][0]) => {
    try {
      setDownloading(attachment.id);
      const response = await fetch(`${API_ENDPOINTS.FILE.GET(attachment.minioKey)}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download attachment');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Attachment downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast({
        title: 'Error',
        description: 'Failed to download attachment',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleViewAttachment = async (attachment: Email['attachments'][0]) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.FILE.GET(attachment.minioKey)}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to view attachment');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a new window/tab based on file type
      if (
        attachment.contentType.startsWith('image/') ||
        attachment.contentType === 'application/pdf'
      ) {
        // For images and PDFs, open directly in a new tab
        window.open(url, '_blank');
      } else if (attachment.contentType.startsWith('text/')) {
        // For text files, create a new window with formatted content
        const text = await blob.text();
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${attachment.filename}</title>
                <style>
                  body { font-family: monospace; white-space: pre-wrap; padding: 20px; }
                  pre { margin: 0; }
                </style>
              </head>
              <body>
                <pre>${text}</pre>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      } else {
        // For other file types, download instead
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      // Clean up the URL after a short delay to allow the new window to load
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      toast({
        title: 'Success',
        description: 'Attachment opened in new tab',
      });
    } catch (error) {
      console.error('Error viewing attachment:', error);
      toast({
        title: 'Error',
        description: 'Failed to view attachment',
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{email.subject}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{format(new Date(email.createdAt), 'PPp')}</span>
                <span>•</span>
                <Badge variant={email.status === 'APPROVED' ? 'default' : 'destructive'}>
                  {email.status}
                </Badge>
              </div>
            </div>
            {email.status === 'PENDING' && (canApprove || canReject || canSign) && (
              <div className="flex gap-2">
                {canApprove && (
                  <Button onClick={handleApprove} className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Approve</span>
                  </Button>
                )}
                {canReject && (
                  <Button
                    onClick={handleReject}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Reject</span>
                  </Button>
                )}
                {canSign && (
                  <Button onClick={handleSign} className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Sign</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">From</h3>
                <p className="text-sm">{email.from}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">To</h3>
                <div className="space-y-1">
                  {email.recipients
                    .filter(r => r.type === 'TO')
                    .map((r, index) => (
                      <p key={index} className="text-sm">
                        {r.address}
                      </p>
                    ))}
                </div>
              </div>
              {email.recipients.some(r => r.type === 'CC') && (
                <div>
                  <h3 className="text-sm font-medium mb-2">CC</h3>
                  <div className="space-y-1">
                    {email.recipients
                      .filter(r => r.type === 'CC')
                      .map((r, index) => (
                        <p key={index} className="text-sm">
                          {r.address}
                        </p>
                      ))}
                  </div>
                </div>
              )}
              {email.recipients.some(r => r.type === 'BCC') && (
                <div>
                  <h3 className="text-sm font-medium mb-2">BCC</h3>
                  <div className="space-y-1">
                    {email.recipients
                      .filter(r => r.type === 'BCC')
                      .map((r, index) => (
                        <p key={index} className="text-sm">
                          {r.address}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Date</h3>
                <p className="text-sm">{format(new Date(email.createdAt), 'PPp')}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Status</h3>
                <Badge variant={email.status === 'APPROVED' ? 'default' : 'destructive'}>
                  {email.status}
                </Badge>
              </div>
              {email.rejectionReason && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Rejection Reason</h3>
                  <p className="text-sm text-destructive">{email.rejectionReason}</p>
                </div>
              )}
              {email.approvedBy && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Approved By</h3>
                  <p className="text-sm">User ID: {email.approvedBy}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(email.approvedAt!), 'PPp')}
                  </p>
                </div>
              )}
              {email.rejectedBy && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Rejected By</h3>
                  <p className="text-sm">User ID: {email.rejectedBy}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(email.rejectedAt!), 'PPp')}
                  </p>
                </div>
              )}
              {email.attachments.length > 0 && canViewAttachments && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {email.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <FileTextIcon className="h-4 w-4" />
                          <span className="text-sm">{attachment.filename}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {attachment.contentType}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewAttachment(attachment)}
                                disabled={!canViewAttachments}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View attachment</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownload(attachment)}
                                disabled={!canViewAttachments || downloading === attachment.id}
                              >
                                {downloading === attachment.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download attachment</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Content</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap font-mono text-sm">{email.content}</div>
            </div>
          </div>

          {email.signedContent && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Signed Content</h3>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap font-mono text-sm">{email.signedContent}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
