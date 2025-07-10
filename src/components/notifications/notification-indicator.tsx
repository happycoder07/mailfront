'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, BellOff, RefreshCw } from 'lucide-react';
import { useEmailNotifications } from '@/hooks/use-email-notifications';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { toast } from '@/components/ui/use-toast';

interface NotificationIndicatorProps {
  variant?: 'default' | 'compact';
  showCount?: boolean;
  showStatus?: boolean;
}

export function NotificationIndicator({
  variant = 'default',
  showCount = true,
  showStatus = true
}: NotificationIndicatorProps) {
  const { hasPermission } = useAuth();
  const {
    settings,
    pendingEmailCount,
    isChecking,
    manuallyCheck,
    resetNotifications,
    hasInitialized,
  } = useEmailNotifications();

  // Check if user has permission to view emails
  const canViewEmails = hasPermission(PERMISSIONS.VIEW_EMAILS);

  if (!canViewEmails) {
    return null;
  }

  const isActive = settings.enabled && canViewEmails;
  const hasPendingEmails = pendingEmailCount > 0;

  if (variant === 'compact') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={manuallyCheck}
            onContextMenu={(e) => {
              e.preventDefault();
              resetNotifications();
              toast({
                title: 'Notifications Reset',
                description: 'Notification tracking has been reset. You will be notified of new emails again.',
                duration: 3000,
              });
            }}
            disabled={isChecking || !isActive}
            className="relative"
          >
            {isActive ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            {showCount && hasPendingEmails && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {pendingEmailCount > 99 ? '99+' : pendingEmailCount}
              </Badge>
            )}
            {isChecking && (
              <RefreshCw className="h-4 w-4 animate-spin absolute" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">
              {isActive ? 'Notifications Active' : 'Notifications Disabled'}
            </p>
            {showCount && (
              <p className="text-sm">
                {!hasInitialized
                  ? 'Loading...'
                  : hasPendingEmails
                    ? `${pendingEmailCount} pending email${pendingEmailCount !== 1 ? 's' : ''}`
                    : 'No pending emails'
                }
              </p>
            )}
            {showStatus && (
              <p className="text-xs text-muted-foreground">
                {settings.browserNotifications ? 'Browser notifications enabled' : 'Browser notifications disabled'}
              </p>
            )}
            <p className="text-xs text-black">
              Right-click to reset notifications
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={manuallyCheck}
            onContextMenu={(e) => {
              e.preventDefault();
              resetNotifications();
              toast({
                title: 'Notifications Reset',
                description: 'Notification tracking has been reset. You will be notified of new emails again.',
                duration: 3000,
              });
            }}
            disabled={isChecking || !isActive}
            className="relative"
          >
            {isActive ? (
              <Bell className="h-4 w-4 mr-2" />
            ) : (
              <BellOff className="h-4 w-4 mr-2 text-muted-foreground" />
            )}
            {isActive ? 'Notifications' : 'Notifications Off'}
            {showCount && hasPendingEmails && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {pendingEmailCount > 99 ? '99+' : pendingEmailCount}
              </Badge>
            )}
            {isChecking && (
              <RefreshCw className="h-4 w-4 animate-spin ml-2" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">
              {isActive ? 'Notifications Active' : 'Notifications Disabled'}
            </p>
            {showCount && (
              <p className="text-sm">
                {!hasInitialized
                  ? 'Loading...'
                  : hasPendingEmails
                    ? `${pendingEmailCount} pending email${pendingEmailCount !== 1 ? 's' : ''}`
                    : 'No pending emails'
                }
              </p>
            )}
            {showStatus && (
              <p className="text-xs text-muted-foreground">
                {settings.browserNotifications ? 'Browser notifications enabled' : 'Browser notifications disabled'}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Right-click to reset notifications
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
