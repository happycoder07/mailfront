'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_ENDPOINTS } from '@/lib/config';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { Loader2, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const rejectEmailSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

type RejectEmailFormData = z.infer<typeof rejectEmailSchema>;

interface RejectEmailFormProps {
  emailId: string;
}

export function RejectEmailForm({ emailId }: RejectEmailFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hasPermission } = useAuth();

  const canRejectEmails = hasPermission(PERMISSIONS.REJECT_EMAILS);

  const form = useForm<RejectEmailFormData>({
    resolver: zodResolver(rejectEmailSchema),
    defaultValues: {
      reason: '',
    },
  });

  const onSubmit = async (data: RejectEmailFormData) => {
    if (!canRejectEmails) {
      toast({
        title: 'Error',
        description: 'You do not have permission to reject emails',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(API_ENDPOINTS.MAIL.REJECT(emailId), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      setIsSubmitting(false);
    }
  };

  // If user doesn't have permission to reject emails, show a message
  if (!canRejectEmails) {
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
            <Button type="button" variant="outline" onClick={() => router.push('/emails')}>
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
                  <FormLabel>Reason for Rejection</FormLabel>
                  <FormDescription>
                    Please provide a clear reason for rejecting this email. This will help the
                    sender understand why their email was rejected.
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the reason for rejecting this email..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
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
