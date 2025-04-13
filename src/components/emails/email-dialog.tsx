'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS, EmailResponseDto } from '@/lib/config';
import { FileText, Check, X, FileText as FileTextIcon, Download, Eye } from 'lucide-react';
import { RejectEmailForm } from './reject-email-form';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';

interface EmailDialogProps {
  email: EmailResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailUpdated: () => void;
}

export function EmailDialog({ email, open, onOpenChange, onEmailUpdated }: EmailDialogProps) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { hasPermission } = useAuth();

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.MAIL.APPROVE(email.id.toString())}`, {
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
      onEmailUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error approving email:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    setIsRejecting(true);
  };

  const handleRejectCancel = () => {
    setIsRejecting(false);
  };

  const handleRejectComplete = () => {
    setIsRejecting(false);
    onEmailUpdated();
    onOpenChange(false);
  };

  const handleSign = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.MAIL.SIGN(email.id.toString())}`, {
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
      onEmailUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error signing email:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
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
    }
  };

  const handleViewAttachment = async (attachment: any) => {
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

  const getStatusBadge = (status: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{email.subject}</DialogTitle>
            {getStatusBadge(email.status)}
          </div>
        </DialogHeader>
        {isRejecting ? (
          <RejectEmailForm
            emailId={email.id}
            onRejected={handleRejectComplete}
            onCancel={handleRejectCancel}
          />
        ) : (
          <div className="space-y-6">
            {/* Email Metadata Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">From</div>
                <div className="text-sm">{email.from}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Created At</div>
                <div className="text-sm">{format(new Date(email.createdAt), 'PPp')}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                <div className="text-sm">{format(new Date(email.updatedAt), 'PPp')}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Email ID</div>
                <div className="text-sm">{email.id}</div>
              </div>
            </div>

            {/* Recipients Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">To</div>
                <div className="text-sm">
                  {email.recipients
                    .filter(r => r.type === 'TO')
                    .map(r => r.address)
                    .join(', ')}
                </div>
              </div>
              {email.recipients.some(r => r.type === 'CC') && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">CC</div>
                  <div className="text-sm">
                    {email.recipients
                      .filter(r => r.type === 'CC')
                      .map(r => r.address)
                      .join(', ')}
                  </div>
                </div>
              )}
              {email.recipients.some(r => r.type === 'BCC') && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">BCC</div>
                  <div className="text-sm">
                    {email.recipients
                      .filter(r => r.type === 'BCC')
                      .map(r => r.address)
                      .join(', ')}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Status Information Section */}
            <div className="space-y-4">
              {email.approvedBy && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Approval Information
                  </div>
                  <div className="text-sm">
                    Approved by user ID: {email.approvedBy} on{' '}
                    {format(new Date(email.approvedAt!), 'PPp')}
                  </div>
                </div>
              )}
              {email.rejectedBy && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Rejection Information
                  </div>
                  <div className="text-sm">
                    Rejected by user ID: {email.rejectedBy} on{' '}
                    {format(new Date(email.rejectedAt!), 'PPp')}
                  </div>
                  {email.rejectionReason && (
                    <div className="text-sm text-muted-foreground">
                      Reason: {email.rejectionReason}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Email Content Section */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Content</div>
              <textarea
                readOnly
                value={email.content}
                className="w-full whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg min-h-[150px] max-h-[300px] overflow-y-auto resize-y"
              />
              {email.signedContent && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-muted-foreground">Signed Content</div>
                  <textarea
                    readOnly
                    value={email.signedContent}
                    className="w-full whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg min-h-[150px] max-h-[300px] overflow-y-auto resize-y"
                  />
                </div>
              )}
            </div>

            {/* Attachments Section */}
            {email.attachments.length > 0 && canViewAttachments && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Attachments</div>
                  <div className="space-y-2">
                    {email.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3 bg-muted/50"
                      >
                        <div className="flex items-center space-x-3">
                          <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{attachment.filename}</div>
                            <div className="text-xs text-muted-foreground">
                              {attachment.contentType} • {(attachment.size / 1024).toFixed(1)} KB
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created: {format(new Date(attachment.createdAt), 'PPp')}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewAttachment(attachment)}
                            title="View attachment"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadAttachment(attachment)}
                            title="Download attachment"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Actions Section */}
            {email.status === 'PENDING' && (canApprove || canReject || canSign) && (
              <div className="flex space-x-2 pt-4">
                {canApprove && (
                  <Button
                    onClick={handleApprove}
                    className="flex items-center space-x-2"
                    disabled={isLoading}
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve</span>
                  </Button>
                )}
                {canReject && (
                  <Button
                    onClick={handleReject}
                    variant="destructive"
                    className="flex items-center space-x-2"
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                    <span>Reject</span>
                  </Button>
                )}
                {canSign && (
                  <Button
                    onClick={handleSign}
                    className="flex items-center space-x-2"
                    disabled={isLoading}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Sign</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
