'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/lib/config';
import { FileText, Check, X, FileText as FileTextIcon } from 'lucide-react';

interface EmailDialogProps {
  email: {
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export function EmailDialog({ email, open, onOpenChange, onActionComplete }: EmailDialogProps) {
  const handleApprove = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.EMAIL.APPROVE(email.id)}`, {
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
      onActionComplete();
      onOpenChange(false);
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
      const response = await fetch(`${API_ENDPOINTS.EMAIL.REJECT(email.id)}`, {
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
      onActionComplete();
      onOpenChange(false);
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
      const response = await fetch(`${API_ENDPOINTS.EMAIL.SIGN(email.id)}`, {
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
      onActionComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error signing email:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign email',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{email.subject}</DialogTitle>
            <Badge variant={email.status === 'APPROVED' ? 'default' : 'destructive'}>
              {email.status}
            </Badge>
          </div>
        </DialogHeader>
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

          {email.attachments.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-2">Attachments</div>
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
              </div>
            </>
          )}

          {email.status === 'PENDING' && (
            <div className="flex space-x-2 pt-4">
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
      </DialogContent>
    </Dialog>
  );
}
