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
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/lib/config';
import { changePasswordSchema, ChangePasswordFormData } from '@/lib/validation';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { getCSRFToken } = useAuth();

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  async function onSubmit(data: ChangePasswordFormData) {
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      toast({
        title: 'Success',
        description: 'Your password has been changed successfully.',
      });

      // Reset form
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div role="main" aria-labelledby="change-password-form-title">
      <h1 id="change-password-form-title" className="sr-only">Change your password</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          aria-label="Change password form"
          noValidate
        >
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="currentPassword">Current Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="currentPassword"
                      type="password"
                      className="pl-10"
                      autoComplete="current-password"
                      {...field}
                      aria-describedby={form.formState.errors.currentPassword ? `currentPassword-error` : undefined}
                      aria-invalid={!!form.formState.errors.currentPassword}
                      required
                    />
                  </div>
                </FormControl>
                <FormMessage id="currentPassword-error" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="newPassword">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="newPassword"
                      type="password"
                      className="pl-10"
                      autoComplete="new-password"
                      {...field}
                      aria-describedby={form.formState.errors.newPassword ? `newPassword-error` : undefined}
                      aria-invalid={!!form.formState.errors.newPassword}
                      required
                    />
                  </div>
                </FormControl>
                <FormMessage id="newPassword-error" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            disabled={isLoading}
            aria-describedby={isLoading ? "loading-description" : undefined}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                <span id="loading-description" className="sr-only">Changing password, please wait</span>
                Changing password...
              </>
            ) : (
              'Change Password'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
