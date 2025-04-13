'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_ENDPOINTS } from '@/lib/config';
import { rejectEmailSchema, RejectEmailFormData } from '@/lib/validation';
import { Loader2, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';

interface RejectEmailFormProps {
  emailId: number;
  onRejected: () => void;
  onCancel: () => void;
}

export function RejectEmailForm({ emailId, onRejected, onCancel }: RejectEmailFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { hasPermission } = useAuth();

  // Check if user has permission to reject emails
  const canReject = hasPermission(PERMISSIONS.REJECT_EMAILS);

  const form = useForm<RejectEmailFormData>({
    resolver: zodResolver(rejectEmailSchema),
    defaultValues: {
      reason: '',
    },
  });

  async function onSubmit(data: RejectEmailFormData) {
    if (!canReject) {
      toast({
        title: 'Error',
        description: 'You do not have permission to reject emails',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.MAIL.REJECT(emailId.toString())}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject email');
      }

      toast({
        title: 'Success',
        description: 'Email rejected successfully',
      });

      onRejected();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // If user doesn't have permission to reject emails, show a message
  if (!canReject) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permission Required</AlertTitle>
            <AlertDescription>
              You do not have permission to reject emails. Please contact your administrator.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reject Email</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rejection Reason</FormLabel>
                  <FormDescription>
                    Please provide a clear reason for rejecting this email. This will help the
                    sender understand why their email was rejected.
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a reason for rejecting this email..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Reject Email
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
