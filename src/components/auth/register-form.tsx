'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/lib/config';
import { registerSchema, RegisterFormData } from '@/lib/validation';
import { Mail, Lock, User, UserCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { hasPermission, getCSRFToken } = useAuth();

  // Check if user has permission to register users
  const canRegisterUsers = hasPermission(PERMISSIONS.REGISTER_USERS);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleId: 1, // Default role ID
    },
  });

  async function onSubmit(data: RegisterFormData) {
    if (!canRegisterUsers) {
      toast({
        title: 'Error',
        description: 'You do not have permission to register users',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      toast({
        title: 'Success',
        description: 'Your account has been created successfully.',
      });

      router.push('/auth/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Registration failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // If user doesn't have permission to register users, show a message
  if (!canRegisterUsers) {
    return (
      <div className="p-6 text-center" role="alert" aria-live="polite">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to register users. Please contact your administrator.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/auth/login')}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div role="main" aria-labelledby="register-form-title">
      <h1 id="register-form-title" className="sr-only">Create new user account</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          aria-label="Registration form"
          noValidate
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="email">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      {...field}
                      aria-describedby={form.formState.errors.email ? `email-error` : undefined}
                      aria-invalid={!!form.formState.errors.email}
                      autoComplete="email"
                      required
                    />
                  </div>
                </FormControl>
                <FormMessage id="email-error" />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="firstName">First Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        id="firstName"
                        placeholder="John"
                        className="pl-10"
                        {...field}
                        aria-describedby={form.formState.errors.firstName ? `firstName-error` : undefined}
                        aria-invalid={!!form.formState.errors.firstName}
                        autoComplete="given-name"
                        required
                      />
                    </div>
                  </FormControl>
                  <FormMessage id="firstName-error" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="lastName">Last Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        className="pl-10"
                        {...field}
                        aria-describedby={form.formState.errors.lastName ? `lastName-error` : undefined}
                        aria-invalid={!!form.formState.errors.lastName}
                        autoComplete="family-name"
                        required
                      />
                    </div>
                  </FormControl>
                  <FormMessage id="lastName-error" />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="password">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="password"
                      type="password"
                      className="pl-10"
                      {...field}
                      aria-describedby={form.formState.errors.password ? `password-error` : undefined}
                      aria-invalid={!!form.formState.errors.password}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </FormControl>
                <FormMessage id="password-error" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="role">Role</FormLabel>
                <Select
                  onValueChange={value => field.onChange(parseInt(value, 10))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger id="role" className="pl-10">
                      <UserCircle
                        className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">User</SelectItem>
                    <SelectItem value="2">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
            aria-describedby={isLoading ? "loading-description" : undefined}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                <span id="loading-description" className="sr-only">Creating account, please wait</span>
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
