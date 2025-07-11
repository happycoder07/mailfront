'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, BellOff, Volume2, VolumeX, RefreshCw, Settings } from 'lucide-react';
import { useEmailNotifications } from '@/hooks/use-email-notifications';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';

export function NotificationSettings() {
  const { hasPermission } = useAuth();
  const {
    settings,
    updateSettings,
    pendingEmailCount,
    lastChecked,
    isChecking,
    manuallyCheck,
    hasInitialized,
  } = useEmailNotifications();

  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Check if user has permission to view emails
  const canViewEmails = hasPermission(PERMISSIONS.VIEW_EMAILS);

  // Show loading state if settings haven't been loaded yet
  if (!settings.checkInterval) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Configure notification settings for new pending emails</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
            <p className="text-muted-foreground">Loading notification settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleRequestNotificationPermission = async () => {
    setIsRequestingPermission(true);
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Update settings to enable browser notifications
          updateSettings({ browserNotifications: true });
        }
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const formatLastChecked = () => {
    if (!lastChecked) return 'Never';
    return lastChecked.toLocaleString();
  };

  const getNotificationStatus = () => {
    if (!settings.enabled) return { text: 'Disabled', variant: 'secondary' as const };
    if (!canViewEmails) return { text: 'No Permission', variant: 'destructive' as const };
    return { text: 'Active', variant: 'default' as const };
  };

  const notificationStatus = getNotificationStatus();

  if (!canViewEmails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Configure notification settings for new pending emails</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              You don&apos;t have permission to manage notification settings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>Configure notification settings for new pending emails</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Notification Status</p>
            <div className="flex items-center gap-2">
              <Badge variant={notificationStatus.variant}>{notificationStatus.text}</Badge>
              {settings.enabled && (
                <span className="text-sm text-muted-foreground">
                  {!hasInitialized ? 'Loading...' : `${pendingEmailCount} pending emails`}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={manuallyCheck}
            disabled={isChecking || !settings.enabled}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Check Now
          </Button>
        </div>

        <Separator />

        {/* Main Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Turn on email notifications for pending emails
              </p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={settings.enabled}
              onCheckedChange={checked => updateSettings({ enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="toast-notifications">Toast Notifications</Label>
              <p className="text-sm text-muted-foreground">Show in-app toast notifications</p>
            </div>
            <Switch
              id="toast-notifications"
              checked={settings.toastNotifications}
              onCheckedChange={checked => updateSettings({ toastNotifications: checked })}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="browser-notifications">Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">Show system browser notifications</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="browser-notifications"
                checked={settings.browserNotifications}
                onCheckedChange={checked => updateSettings({ browserNotifications: checked })}
                disabled={!settings.enabled}
              />
              {settings.browserNotifications && Notification.permission === 'default' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestNotificationPermission}
                  disabled={isRequestingPermission}
                >
                  {isRequestingPermission ? 'Requesting...' : 'Request Permission'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-enabled">Notification Sound</Label>
              <p className="text-sm text-muted-foreground">Play sound when new emails arrive</p>
            </div>
            <Switch
              id="sound-enabled"
              checked={settings.soundEnabled}
              onCheckedChange={checked => updateSettings({ soundEnabled: checked })}
              disabled={!settings.enabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="check-interval">Check Interval</Label>
            <Select
              value={settings.checkInterval?.toString() || '60000'}
              onValueChange={value => updateSettings({ checkInterval: parseInt(value) })}
              disabled={!settings.enabled}
            >
              <SelectTrigger id="check-interval">
                <SelectValue>
                  {settings.checkInterval === 30000 && 'Every 30 seconds'}
                  {settings.checkInterval === 60000 && 'Every minute (recommended)'}
                  {settings.checkInterval === 300000 && 'Every 5 minutes'}
                  {settings.checkInterval === 600000 && 'Every 10 minutes'}
                  {!settings.checkInterval && 'Every minute (recommended)'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30000">Every 30 seconds</SelectItem>
                <SelectItem value="60000">Every minute (recommended)</SelectItem>
                <SelectItem value="300000">Every 5 minutes</SelectItem>
                <SelectItem value="600000">Every 10 minutes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How often to check for new pending emails. Lower intervals use more resources.
            </p>
          </div>
        </div>

        <Separator />

        {/* Status Information */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Status Information</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Last Check:</span>
              <p>{formatLastChecked()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Browser Permission:</span>
              <p className="capitalize">{Notification.permission}</p>
            </div>
          </div>
        </div>

        {/* Browser Notification Status */}
        {settings.browserNotifications && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {Notification.permission === 'granted' ? (
                <Bell className="h-4 w-4 text-green-600" />
              ) : (
                <BellOff className="h-4 w-4 text-orange-600" />
              )}
              <span className="text-sm font-medium">Browser Notifications</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {Notification.permission === 'granted'
                ? 'Browser notifications are enabled and will show when new emails arrive.'
                : Notification.permission === 'denied'
                  ? 'Browser notifications are blocked. Please enable them in your browser settings.'
                  : 'Click "Request Permission" to enable browser notifications.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
