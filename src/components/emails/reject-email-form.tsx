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
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/lib/config';
import { rejectEmailSchema, RejectEmailFormData } from '@/lib/validation';
import { Loader2, X } from 'lucide-react';
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
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to reject emails. Please contact your administrator.
        </p>
        <Button type="button" variant="outline" className="mt-4" onClick={onCancel}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rejection Reason</FormLabel>
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
        <div className="flex space-x-2">
          <Button type="submit" variant="destructive" className="flex-1" disabled={isLoading}>
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
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
