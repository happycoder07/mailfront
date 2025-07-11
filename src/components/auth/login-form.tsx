'use client';

import { useState, useId } from 'react';
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
import { loginSchema, loginWithTwoFactorSchema, LoginFormData, LoginWithTwoFactorFormData } from '@/lib/validation';
import { Mail, Lock, Loader2, Shield, ArrowLeft } from 'lucide-react';
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
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string>('');
  const { login, loginWithTwoFactor } = useAuth();

  // Generate unique IDs for accessibility
  const emailId = useId();
  const passwordId = useId();
  const tokenId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const tokenErrorId = useId();
  const loadingDescId = useId();

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // 2FA form
  const twoFactorForm = useForm<LoginWithTwoFactorFormData>({
    resolver: zodResolver(loginWithTwoFactorSchema),
    defaultValues: {
      token: '',
      tempToken: '',
    },
  });

  // Handle back to login
  const handleBackToLogin = () => {
    setRequires2FA(false);
    setTempToken('');
    loginForm.reset();
    twoFactorForm.reset();
  };

  // Handle initial login
  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'You have been logged in successfully.',
          variant: 'default',
          duration: 500,
        });
        router.push('/emails');
      } else if (result.requires2FA && result.tempToken) {
        setRequires2FA(true);
        setTempToken(result.tempToken);
        twoFactorForm.setValue('tempToken', result.tempToken);
        toast({
          title: 'Two-Factor Authentication Required',
          description: 'Please enter your 6-digit authentication code.',
          variant: 'default',
        });
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
  };

  // Handle 2FA verification
  const handleTwoFactor = async (data: LoginWithTwoFactorFormData) => {
    setIsLoading(true);

    try {
      const result = await loginWithTwoFactor(data.token, data.tempToken);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'You have been logged in successfully.',
          variant: 'default',
          duration: 500,
        });
        router.push('/emails');
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Invalid two-factor authentication token',
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
  };

  // Render 2FA form
  if (requires2FA) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md mx-auto"
        role="main"
        aria-labelledby="two-factor-form-title"
      >
        <div className="space-y-6">
          <h1 id="two-factor-form-title" className="sr-only">
            Two-Factor Authentication
          </h1>

          <motion.div variants={itemVariants} className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Two-Factor Authentication</h2>
            <p className="text-muted-foreground">
              Enter the 6-digit code from your authenticator app or an 8-character backup code
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const token = formData.get('token') as string;

                if (token && (token.length === 6 || token.length === 8)) {
                  handleTwoFactor({ token, tempToken });
                } else {
                  toast({
                    title: 'Error',
                    description: 'Please enter a valid 6-digit authentication code or 8-character backup code',
                    variant: 'destructive',
                  });
                }
              }}
              className="space-y-6"
            >
              <div>
                <label htmlFor={tokenId} className="block text-sm font-medium mb-2">
                  Authentication Code or Backup Code
                </label>
                <Input
                  id={tokenId}
                  name="token"
                  type="text"
                  placeholder="000000 or A1B2C3D4"
                  className="text-center text-lg tracking-widest w-full"
                  maxLength={8}
                  autoComplete="off"
                  autoFocus
                  required
                  aria-label="6-digit authentication code or 8-character backup code"
                />
              </div>

              <motion.div variants={buttonVariants}>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                  aria-describedby={isLoading ? loadingDescId : undefined}
                  aria-label="Verify two-factor authentication"
                  title="Verify two-factor authentication"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span id={loadingDescId} className="sr-only">
                        Verifying authentication code, please wait
                      </span>
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBackToLogin}
              aria-label="Back to login"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Login
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Render login form
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md mx-auto"
      role="main"
      aria-labelledby="login-form-title"
    >
      <Form {...loginForm}>
        <form
          onSubmit={loginForm.handleSubmit(handleLogin)}
          className="space-y-6"
          aria-label="Login form"
          noValidate
        >
          <h1 id="login-form-title" className="sr-only">
            Sign in to your account
          </h1>

          <motion.div variants={itemVariants}>
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor={emailId}>Email</FormLabel>
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
                        id={emailId}
                        type="email"
                        placeholder="name@example.com"
                        className="pl-10"
                        {...field}
                        aria-describedby={loginForm.formState.errors.email ? emailErrorId : undefined}
                        aria-invalid={!!loginForm.formState.errors.email}
                        autoComplete="email"
                        required
                        aria-label="Email address"
                      />
                    </motion.div>
                  </FormControl>
                  <FormMessage id={emailErrorId} />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor={passwordId}>Password</FormLabel>
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
                        id={passwordId}
                        type="password"
                        className="pl-10"
                        {...field}
                        aria-describedby={loginForm.formState.errors.password ? passwordErrorId : undefined}
                        aria-invalid={!!loginForm.formState.errors.password}
                        autoComplete="current-password"
                        required
                        aria-label="Password"
                      />
                    </motion.div>
                  </FormControl>
                  <FormMessage id={passwordErrorId} />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div variants={buttonVariants}>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
              aria-describedby={isLoading ? loadingDescId : undefined}
              aria-label="Sign in to your account"
              title="Sign in to your account"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span id={loadingDescId} className="sr-only">
                    Signing in, please wait
                  </span>
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
