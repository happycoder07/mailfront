'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth';
import { API_ENDPOINTS } from '@/lib/config';
import { Loader2 } from 'lucide-react';
import { PERMISSIONS } from '@/lib/permissions';

interface SystemSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: boolean;
  maxRetries: number;
  retryDelay: number;
  autoApprove: boolean;
}

export function SettingsForm() {
  const { user, hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: true,
    maxRetries: 3,
    retryDelay: 300,
    autoApprove: false,
  });

  const canManageSettings = hasPermission(PERMISSIONS.MANAGE_SETTINGS);

  useEffect(() => {
    if (canManageSettings) {
      fetchSettings();
    } else {
      setIsLoading(false);
    }
  }, [canManageSettings]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS.GET, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) return;

    setIsSaving(true);

    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS.UPDATE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canManageSettings) {
    return (
      <Card>
        <CardContent className="flex h-[450px] items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Access Denied</h3>
            <p className="text-muted-foreground">You don't have permission to manage settings.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SMTP Configuration</CardTitle>
            <CardDescription>Configure your email server settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={settings.smtpHost}
                  onChange={e => setSettings({ ...settings, smtpHost: e.target.value })}
                  placeholder="smtp.example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={settings.smtpPort}
                  onChange={e => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                  placeholder="587"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpUsername">SMTP Username</Label>
                <Input
                  id="smtpUsername"
                  value={settings.smtpUsername}
                  onChange={e => setSettings({ ...settings, smtpUsername: e.target.value })}
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={settings.smtpPassword}
                  onChange={e => setSettings({ ...settings, smtpPassword: e.target.value })}
                  placeholder="********"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="smtpSecure"
                checked={settings.smtpSecure}
                onCheckedChange={checked => setSettings({ ...settings, smtpSecure: checked })}
              />
              <Label htmlFor="smtpSecure">Use SSL/TLS</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Queue Settings</CardTitle>
            <CardDescription>Configure email queue behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxRetries">Maximum Retries</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  value={settings.maxRetries}
                  onChange={e => setSettings({ ...settings, maxRetries: parseInt(e.target.value) })}
                  placeholder="3"
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryDelay">Retry Delay (seconds)</Label>
                <Input
                  id="retryDelay"
                  type="number"
                  value={settings.retryDelay}
                  onChange={e => setSettings({ ...settings, retryDelay: parseInt(e.target.value) })}
                  placeholder="300"
                  min={0}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="autoApprove"
                checked={settings.autoApprove}
                onCheckedChange={checked => setSettings({ ...settings, autoApprove: checked })}
              />
              <Label htmlFor="autoApprove">Auto-approve emails</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
