'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
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
import { loginSchema, LoginFormData } from '@/lib/validation';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      delay: 0.4,
    },
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);

    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'You have been logged in successfully.',
          variant: 'default',
          duration: 500,
        });

        router.push('/emails');
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Invalid email or password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md mx-auto"
      role="main"
      aria-labelledby="login-form-title"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          aria-label="Login form"
          noValidate
        >
          <h1 id="login-form-title" className="sr-only">Sign in to your account</h1>

          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <motion.div
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
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
                    </motion.div>
                  </FormControl>
                  <FormMessage id="email-error" />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">Password</FormLabel>
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
                        id="password"
                        type="password"
                        className="pl-10"
                        {...field}
                        aria-describedby={form.formState.errors.password ? `password-error` : undefined}
                        aria-invalid={!!form.formState.errors.password}
                        autoComplete="current-password"
                        required
                      />
                    </motion.div>
                  </FormControl>
                  <FormMessage id="password-error" />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div variants={buttonVariants}>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
              aria-describedby={isLoading ? "loading-description" : undefined}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span id="loading-description" className="sr-only">Signing in, please wait</span>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </motion.div>
        </form>
      </Form>
    </motion.div>
  );
}
