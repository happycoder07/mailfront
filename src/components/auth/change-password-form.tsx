'use client';

import { useState, useId } from 'react';
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
import { motion } from 'framer-motion';

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { getCSRFToken } = useAuth();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const currentPasswordErrorId = useId();
  const newPasswordErrorId = useId();
  const loadingDescId = useId();

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
                <FormLabel htmlFor={currentPasswordId}>Current Password</FormLabel>
                <FormControl>
                  <motion.div
                    className="relative"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Lock
                      className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id={currentPasswordId}
                      type="password"
                      className="pl-10"
                      {...field}
                      aria-describedby={form.formState.errors.currentPassword ? currentPasswordErrorId : undefined}
                      aria-invalid={!!form.formState.errors.currentPassword}
                      autoComplete="current-password"
                      required
                      aria-label="Current password"
                    />
                  </motion.div>
                </FormControl>
                <FormMessage id={currentPasswordErrorId} />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={newPasswordId}>New Password</FormLabel>
                <FormControl>
                  <motion.div
                    className="relative"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Lock
                      className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id={newPasswordId}
                      type="password"
                      className="pl-10"
                      {...field}
                      aria-describedby={form.formState.errors.newPassword ? newPasswordErrorId : undefined}
                      aria-invalid={!!form.formState.errors.newPassword}
                      autoComplete="new-password"
                      required
                      aria-label="New password"
                    />
                  </motion.div>
                </FormControl>
                <FormMessage id={newPasswordErrorId} />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
            aria-describedby={isLoading ? loadingDescId : undefined}
            aria-label="Change your password"
            title="Change your password"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                <span id={loadingDescId} className="sr-only">
                  Changing password, please wait
                </span>
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
