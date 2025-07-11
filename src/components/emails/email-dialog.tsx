'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { API_ENDPOINTS, EmailResponseDto, AttachmentDto } from '@/lib/config';
import { FileText, Check, X, FileText as FileTextIcon, Download, Eye, Loader2 } from 'lucide-react';
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
  const { hasPermission, getCSRFToken } = useAuth();

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.MAIL.APPROVE(email.id.toString())}`, {
        method: 'POST',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
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
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
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

  const handleDownloadAttachment = async (attachment: AttachmentDto) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.FILE.GET(attachment.minioKey)}`, {
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
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

  const handleViewAttachment = async (attachment: AttachmentDto) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.FILE.GET(attachment.minioKey)}`, {
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
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
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          status === 'PENDING'
            ? 'bg-[var(--status-pending)] text-[var(--status-pending-foreground)]'
            : status === 'APPROVED'
              ? 'bg-[var(--status-approved)] text-[var(--status-approved-foreground)]'
              : status === 'REJECTED'
                ? 'bg-[var(--status-rejected)] text-[var(--status-rejected-foreground)]'
                : status === 'SENT'
                  ? 'bg-[var(--status-sent)] text-[var(--status-sent-foreground)]'
                  : 'bg-[var(--status-failed)] text-[var(--status-failed-foreground)]'
        }`}
      >
        {status}
      </span>
    );
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
          <RejectEmailForm emailId={email.id.toString()} />
        ) : (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Email Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <div className="text-sm font-medium text-muted-foreground">Status</div>
                      <div className="text-sm">{getStatusBadge(email.status)}</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Recipients</div>
                    <div className="flex flex-wrap gap-2">
                      {email.recipients.map(r => (
                        <Badge
                          key={r.id}
                          variant={
                            r.type === 'TO' ? 'default' : r.type === 'CC' ? 'secondary' : 'outline'
                          }
                        >
                          {r.type}: {r.address}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Content</div>
                    <ScrollArea className="h-[200px] rounded-md border p-4">
                      <pre className="text-sm whitespace-pre-wrap">{email.content}</pre>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="attachments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  {email.attachments && email.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {email.attachments.map(attachment => (
                        <Card key={attachment.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileTextIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">{attachment.filename}</span>
                              </div>
                              <div className="flex items-center gap-2">
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
                                      onClick={() => handleDownloadAttachment(attachment)}
                                      disabled={!canViewAttachments}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Download attachment</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {attachment.contentType} • {Math.round(attachment.size / 1024)} KB
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No attachments found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        {!isRejecting && (
          <div className="flex justify-end gap-2 mt-4">
            {email.status === 'PENDING' && canApprove && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" onClick={handleApprove} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Approve this email</TooltipContent>
              </Tooltip>
            )}
            {email.status === 'PENDING' && canReject && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reject this email</TooltipContent>
              </Tooltip>
            )}
            {email.status === 'PENDING' && canSign && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleSign} disabled={isLoading}>
                    <FileText className="mr-2 h-4 w-4" />
                    Sign
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign this email</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
