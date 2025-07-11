'use client';

import { useState, useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';
import type { Role } from '@/lib/config';
import type { UserResponseDto, RegisterDto } from '@/lib/config';

const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    roleId: z.number().min(1, 'Role is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface UserRegisterFormProps {
  onSuccess?: () => void;
}

export function UserRegisterForm({ onSuccess }: UserRegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const { hasPermission, getCSRFToken } = useAuth();
  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const roleId = useId();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      roleId: 1,
    },
  });

  const canManageUsers = hasPermission(PERMISSIONS.MANAGE_USERS);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.AUTH.ROLES, {
          headers: {
            'X-XSRF-TOKEN': getCSRFToken(),
          },
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch roles');
        }
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch available roles',
          variant: 'destructive',
        });
      }
    };

    if (canManageUsers) {
      fetchRoles();
    }
  }, [canManageUsers]);

  async function onSubmit(data: RegisterFormData) {
    if (!canManageUsers) {
      toast({
        title: 'Error',
        description: 'You do not have permission to register users',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to register user');
      }

      toast({
        title: 'Success',
        description: 'User registered successfully',
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error registering user:', error);
      toast({
        title: 'Error',
        description: 'Failed to register user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (!canManageUsers) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-destructive">
          You do not have permission to register users. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={firstNameId}>First Name</FormLabel>
                <FormControl>
                  <Input id={firstNameId} placeholder="John" {...field} aria-label="First name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={lastNameId}>Last Name</FormLabel>
                <FormControl>
                  <Input id={lastNameId} placeholder="Doe" {...field} aria-label="Last name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={emailId}>Email</FormLabel>
              <FormControl>
                <Input
                  id={emailId}
                  type="email"
                  placeholder="john@example.com"
                  {...field}
                  aria-label="Email address"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={passwordId}>Password</FormLabel>
              <FormControl>
                <Input id={passwordId} type="password" {...field} aria-label="Password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={confirmPasswordId}>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  id={confirmPasswordId}
                  type="password"
                  {...field}
                  aria-label="Confirm password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={roleId}>Role</FormLabel>
              <Select
                onValueChange={value => field.onChange(Number(value))}
                defaultValue={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger id={roleId} aria-label="Select user role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
          aria-label="Register new user"
          title="Register new user"
        >
          {loading ? 'Registering...' : 'Register User'}
        </Button>
      </form>
    </Form>
  );
}
