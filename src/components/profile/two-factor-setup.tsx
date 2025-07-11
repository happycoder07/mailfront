'use client';

import { useState, useEffect, useId } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Smartphone,
  CheckCircle,
  XCircle,
  Key,
  Copy,
  Download,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type {
  TwoFactorStatusResponseDto,
  TwoFactorSetupResponseDto,
  TwoFactorVerificationResponseDto,
  RegenerateBackupCodesDto,
} from '@/lib/config';
import {
  enableTwoFactorSchema,
  disableTwoFactorSchema,
  regenerateBackupCodesSchema,
  EnableTwoFactorFormData,
  DisableTwoFactorFormData,
  RegenerateBackupCodesFormData,
} from '@/lib/validation';
import { API_ENDPOINTS } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';

interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

interface TwoFactorSetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  otpauthUrl: string;
}

interface TwoFactorSetupProps {
  onStatusChange?: () => void;
}

export function TwoFactorSetup({ onStatusChange }: TwoFactorSetupProps) {
  const { getCSRFToken } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatusResponseDto | null>(null);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponseDto | null>(null);
  const [currentBackupCodes, setCurrentBackupCodes] = useState<string[]>([]);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [showDisable, setShowDisable] = useState<boolean>(false);
  const [showBackupCodes, setShowBackupCodes] = useState<boolean>(false);
  const [setupLoading, setIsSetupLoading] = useState<boolean>(false);
  const [statusLoading, setIsStatusLoading] = useState<boolean>(true);

  // Generate unique IDs for accessibility
  const tokenId = useId();
  const tokenErrorId = useId();

  // Forms
  const enableForm = useForm<EnableTwoFactorFormData>({
    resolver: zodResolver(enableTwoFactorSchema),
    defaultValues: {
      token: '',
    },
  });

  const disableForm = useForm<DisableTwoFactorFormData>({
    resolver: zodResolver(disableTwoFactorSchema),
    defaultValues: {
      token: '',
    },
  });

  const regenerateForm = useForm<RegenerateBackupCodesFormData>({
    resolver: zodResolver(regenerateBackupCodesSchema),
    defaultValues: {
      token: '',
    },
  });

  // Fetch 2FA status
  const fetchStatus = async (): Promise<void> => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.TWO_FACTOR.STATUS, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
      });
      if (response.ok) {
        const data: TwoFactorStatusResponseDto = await response.json();
        setStatus(data);
      } else {
        console.error('Failed to fetch 2FA status');
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    } finally {
      setIsStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Handle 2FA setup
  const handleSetup = async (): Promise<void> => {
    setIsSetupLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.TWO_FACTOR.SETUP, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
      });
      if (response.ok) {
        const data: TwoFactorSetupResponseDto = await response.json();
        setSetupData(data);
        setCurrentBackupCodes(data.backupCodes);
        setShowSetup(true);
        setShowBackupCodes(true);
        toast({
          title: 'Setup Generated',
          description: 'Scan the QR code with your authenticator app.',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to generate 2FA setup',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate 2FA setup',
        variant: 'destructive',
      });
    } finally {
      setIsSetupLoading(false);
    }
  };

  // Handle 2FA enable
  const handleEnable = async (data: EnableTwoFactorFormData): Promise<void> => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.TWO_FACTOR.ENABLE, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const result: TwoFactorVerificationResponseDto = await response.json();
        setShowSetup(false);
        setSetupData(null);
        await fetchStatus();
        onStatusChange?.();
        toast({
          title: 'Success',
          description: 'Two-factor authentication has been enabled.',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to enable 2FA',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to enable 2FA',
        variant: 'destructive',
      });
    }
  };

  // Handle 2FA disable
  const handleDisable = async (data: DisableTwoFactorFormData): Promise<void> => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.TWO_FACTOR.DISABLE, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setShowDisable(false);
        setCurrentBackupCodes([]);
        await fetchStatus();
        onStatusChange?.();
        toast({
          title: 'Success',
          description: 'Two-factor authentication has been disabled.',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to disable 2FA',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disable 2FA',
        variant: 'destructive',
      });
    }
  };

  // Handle backup codes regeneration
  const handleRegenerateBackupCodes = async (
    data: RegenerateBackupCodesFormData
  ): Promise<void> => {
    try {
      const requestBody: RegenerateBackupCodesDto = data;
      const response = await fetch(API_ENDPOINTS.AUTH.TWO_FACTOR.REGENERATE_BACKUP_CODES, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        body: JSON.stringify(requestBody),
      });
      if (response.ok) {
        const result: { backupCodes: string[]; message: string } = await response.json();
        setCurrentBackupCodes(result.backupCodes);
        regenerateForm.reset();
        await fetchStatus();
        setShowBackupCodes(true);
        toast({
          title: 'Success',
          description: 'Backup codes have been regenerated.',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to regenerate backup codes',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate backup codes',
        variant: 'destructive',
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'Text copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    const codes = currentBackupCodes.length > 0 ? currentBackupCodes : setupData?.backupCodes || [];
    if (codes.length === 0) {
      toast({
        title: 'Error',
        description: 'No backup codes available to download',
        variant: 'destructive',
      });
      return;
    }

    const content = `Backup Codes for Two-Factor Authentication

IMPORTANT: Save these codes in a secure location. Each code can only be used once.

${codes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Generated on: ${new Date().toLocaleString()}
Total codes: ${codes.length}

Note: These codes will be invalidated if you regenerate new backup codes.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Backup codes have been downloaded',
    });
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {status?.enabled ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disabled
                </Badge>
              )}
            </div>
            {status?.enabled && (
              <div className="text-sm text-muted-foreground">
                {status.backupCodesRemaining} backup codes remaining
              </div>
            )}
          </div>

          {!status?.enabled ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">How it works</p>
                  <p className="text-blue-700 mt-1">
                    Two-factor authentication adds an extra layer of security by requiring a code
                    from your authenticator app in addition to your password.
                  </p>
                </div>
              </div>
              <Button onClick={handleSetup} disabled={setupLoading} className="w-full">
                {setupLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Setup...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Enable Two-Factor Authentication
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-900">Two-factor authentication is enabled</p>
                  <p className="text-green-700 mt-1">
                    Your account is now protected with an additional layer of security.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDisable(true)} className="flex-1">
                  <XCircle className="mr-2 h-4 w-4" />
                  Disable 2FA
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBackupCodes(true)}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Backup Codes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Modal */}
      {showSetup && setupData && (
        <Card>
          <CardHeader>
            <CardTitle>Complete 2FA Setup</CardTitle>
            <CardDescription>
              Scan the QR code with your authenticator app and enter the code to verify
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border">
                <img src={setupData.qrCode} alt="QR Code for 2FA setup" className="w-48 h-48" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Manual Entry (if QR code doesn&apos;t work):</p>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <code className="text-sm flex-1">{setupData.secret}</code>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(setupData.secret)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Form {...enableForm}>
              <form onSubmit={enableForm.handleSubmit(handleEnable)} className="space-y-4">
                <FormField
                  control={enableForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor={tokenId}>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          id={tokenId}
                          placeholder="000000"
                          maxLength={6}
                          className="text-center text-lg tracking-widest"
                          {...field}
                          aria-describedby={
                            enableForm.formState.errors.token ? tokenErrorId : undefined
                          }
                        />
                      </FormControl>
                      <FormMessage id={tokenErrorId} />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Enable 2FA
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowSetup(false);
                      setSetupData(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Disable Modal */}
      {showDisable && (
        <Card>
          <CardHeader>
            <CardTitle>Disable Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter your 6-digit authentication code or 8-character backup code to disable 2FA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">Warning</p>
                <p className="text-yellow-700 mt-1">
                  Disabling two-factor authentication will reduce the security of your account.
                </p>
              </div>
            </div>

            <Form {...disableForm}>
              <form onSubmit={disableForm.handleSubmit(handleDisable)} className="space-y-4">
                <FormField
                  control={disableForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Authentication Code or Backup Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 6-digit code or 8-character backup code"
                          maxLength={8}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="destructive" className="flex-1">
                    Disable 2FA
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowDisable(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <Card>
          <CardHeader>
            <CardTitle>Regenerate Backup Codes</CardTitle>
            <CardDescription>
              Generate new backup codes. This will invalidate all existing backup codes. Codes are
              only shown once after generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentBackupCodes.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {currentBackupCodes.map((code, index) => (
                    <div key={index} className="p-2 bg-muted rounded font-mono text-sm text-center">
                      {code}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBackupCodes(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
                <Separator />
              </>
            )}
            <div className="space-y-2">
              <Form {...regenerateForm}>
                <form
                  onSubmit={regenerateForm.handleSubmit(handleRegenerateBackupCodes)}
                  className="space-y-4"
                >
                  <FormField
                    control={regenerateForm.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authentication Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter 6-digit code" maxLength={6} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="outline" className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Backup Codes
                  </Button>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
