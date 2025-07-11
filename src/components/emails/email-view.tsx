'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/lib/config';
import { Loader2, Download, Check, X, FileText, Eye, FileSignature } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Email {
  id: number;
  from: string;
  subject: string;
  content: string;
  html?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT' | 'FAILED';
  signedContent?: string;
  rejectionReason?: string;
  approvedBy?: {
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  rejectedBy?: {
    firstName: string;
    lastName: string;
  };
  rejectedAt?: string;
  attachments: {
    id: number;
    filename: string;
    contentType: string;
    size: number;
    minioKey: string;
    emailId: number;
    createdAt: string;
    updatedAt: string;
  }[];
  recipients: {
    id: number;
    emailId: number;
    address: string;
    type: 'TO' | 'CC' | 'BCC';
    createdAt: string;
    updatedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export function EmailView({ id }: { id: string }) {
  const router = useRouter();
  const { hasPermission, getCSRFToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<Email | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check permissions
  const canApproveEmails = hasPermission(PERMISSIONS.APPROVE_EMAILS);
  const canRejectEmails = hasPermission(PERMISSIONS.REJECT_EMAILS);
  const canSignEmails = hasPermission(PERMISSIONS.SIGN_EMAIL);

  useEffect(() => {
    const fetchEmail = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.MAIL.DETAIL(id), {
          headers: {
            'X-XSRF-TOKEN': getCSRFToken(),
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch email');
        }

        const data = await response.json();
        setEmail(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch email',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmail();
  }, [id]);

  const handleApprove = async () => {
    if (!canApproveEmails) return;

    setIsProcessing(true);
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.APPROVE(id), {
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

      router.push('/emails');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve email',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!canRejectEmails) return;

    setIsProcessing(true);
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.REJECT(id), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        body: JSON.stringify({
          reason: 'Email rejected by user',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject email');
      }

      toast({
        title: 'Success',
        description: 'Email rejected successfully',
      });

      router.push('/emails');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject email',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSign = async () => {
    if (!canSignEmails) return;

    setIsProcessing(true);
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.SIGN(id), {
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
        description: 'Email signed and approved successfully',
      });

      router.push('/emails');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign email',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAttachment = async (attachment: Email['attachments'][0]) => {
    try {
      const response = await fetch(API_ENDPOINTS.FILE.GET(attachment.minioKey), {
        method: 'GET',
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
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download attachment',
        variant: 'destructive',
      });
    }
  };

  const handleViewAttachment = async (attachment: Email['attachments'][0]) => {
    try {
      const response = await fetch(API_ENDPOINTS.FILE.GET(attachment.minioKey), {
        method: 'GET',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to view attachment');
      }

      const blob = await response.blob();
      const file = new File([blob], attachment.filename, { type: attachment.contentType });
      const fileUrl = URL.createObjectURL(file);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);

      // Click the link to open in new tab
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(fileUrl);
      }, 100);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to view attachment',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Email Not Found</h2>
        <p className="text-muted-foreground">The email you are looking for could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{email.subject}</CardTitle>
              <CardDescription>
                From: {email.from} • {format(new Date(email.createdAt), 'PPpp')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
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
              >
                {email.status}
              </span>
              {email.signedContent && (
                <Tooltip>
                  <TooltipTrigger>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      <FileSignature className="h-3 w-3" />
                      Signed
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Email is digitally signed</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Recipients</h3>
              <div className="flex flex-wrap gap-2">
                {email.recipients.map(recipient => (
                  <Badge
                    key={recipient.id}
                    variant={
                      recipient.type === 'TO'
                        ? 'default'
                        : recipient.type === 'CC'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {recipient.address} ({recipient.type})
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Content</h3>
              {email.html ? (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: email.content }}
                />
              ) : (
                <p className="whitespace-pre-wrap">{email.content}</p>
              )}
            </div>

            {email.signedContent && (
              <div>
                <h3 className="text-sm font-medium mb-2">PGP Signature</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">{email.signedContent}</pre>
              </div>
            )}

            {email.rejectionReason && (
              <div>
                <h3 className="text-sm font-medium mb-2">Rejection Reason</h3>
                <p className="text-destructive">{email.rejectionReason}</p>
              </div>
            )}

            {(email.approvedBy || email.rejectedBy) && (
              <div>
                <h3 className="text-sm font-medium mb-2">Action Details</h3>
                <div className="space-y-2">
                  {email.approvedBy && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {email.signedContent ? 'Signed by' : 'Approved by'}:
                      </span>
                      <span className="text-sm font-medium">
                        {email.approvedBy.firstName} {email.approvedBy.lastName}
                      </span>
                      {email.approvedAt && (
                        <span className="text-sm text-muted-foreground">
                          on {format(new Date(email.approvedAt), 'PPpp')}
                        </span>
                      )}
                    </div>
                  )}
                  {email.rejectedBy && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rejected by:</span>
                      <span className="text-sm font-medium">
                        {email.rejectedBy.firstName} {email.rejectedBy.lastName}
                      </span>
                      {email.rejectedAt && (
                        <span className="text-sm text-muted-foreground">
                          on {format(new Date(email.rejectedAt), 'PPpp')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {email.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Attachments</h3>
                <div className="space-y-2">
                  {email.attachments.map(attachment => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium">{attachment.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {attachment.contentType} • {(attachment.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAttachment(attachment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadAttachment(attachment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {email.status === 'PENDING' && (
              <div className="flex items-center gap-2">
                {canApproveEmails && (
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                )}
                {canRejectEmails && (
                  <Button onClick={handleReject} disabled={isProcessing} variant="destructive">
                    {isProcessing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Reject
                  </Button>
                )}
                {canSignEmails && (
                  <Button
                    onClick={handleSign}
                    disabled={isProcessing}
                    variant="outline"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Sign & Approve
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
