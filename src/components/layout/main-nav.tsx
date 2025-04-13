'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { API_ENDPOINTS } from '@/lib/config';
import { Mail, Inbox, Activity, User, LogOut, Menu, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { ThemeToggle } from '@/components/theme-toggle';

export function MainNav() {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  // Define navigation items with their required permissions
  const navItems = [
    {
      title: 'Emails',
      href: '/emails',
      icon: Mail,
      description: 'Manage and monitor email communications',
      permissions: [
        PERMISSIONS.VIEW_EMAILS,
        PERMISSIONS.APPROVE_EMAILS,
        PERMISSIONS.REJECT_EMAILS,
        PERMISSIONS.RECEIVE_EMAIL,
        PERMISSIONS.SEND_EMAIL,
      ],
    },
    {
      title: 'Queue',
      href: '/queue',
      icon: Inbox,
      description: 'View and manage email queue',
      permissions: [PERMISSIONS.VIEW_QUEUE, PERMISSIONS.MANAGE_QUEUE, PERMISSIONS.SEND_EMAIL],
    },
    {
      title: 'Users',
      href: '/users',
      icon: User,
      description: 'Manage user accounts and permissions',
      permissions: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.REGISTER_USERS],
    },
    {
      title: 'Monitoring',
      href: '/monitoring',
      icon: Activity,
      description: 'Monitor system metrics and health',
      permissions: [
        PERMISSIONS.VIEW_METRICS,
        PERMISSIONS.VIEW_HEALTH,
        PERMISSIONS.VIEW_SYSTEM_METRICS,
      ],
    },
    {
      title: 'Profile',
      href: '/profile',
      icon: User,
      description: 'Manage your account settings',
      permissions: [],
    },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/auth/login';
    }
  };

  // Check if user has any of the permissions required for navigation
  const hasAnyNavPermission = navItems.some(
    item =>
      item.permissions.length === 0 ||
      item.permissions.some(permission => hasPermission(permission))
  );

  // If user doesn't have any navigation permissions, show a message
  if (!hasAnyNavPermission) {
    return (
      <div className="border-b bg-primary text-primary-foreground">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-2 font-bold text-xl">
            <Mail className="h-6 w-6" />
            <span>NCCC Mail Manager</span>
          </div>
          <div className="ml-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Logout</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-card text-card-foreground">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-2 font-bold text-xl">
          <Mail className="h-6 w-6" />
          <span>NCCC Mail Manager</span>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const hasRequiredPermission: boolean =
                item.permissions.length === 0 ||
                item.permissions.some(permission => hasPermission(permission));

              if (!hasRequiredPermission) return null;

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        pathname === item.href
                          ? 'bg-primary text-primary-foreground'
                          : 'text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.title}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>{item.description}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Logout</TooltipContent>
          </Tooltip>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-card text-card-foreground">
              <div className="flex flex-col h-full">
                <div className="flex items-center space-x-2 font-bold text-xl mb-6">
                  <Mail className="h-6 w-6" />
                  <span>NCCC Mail Manager</span>
                </div>
                <nav className="flex flex-col space-y-2">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const hasRequiredPermission: boolean =
                      item.permissions.length === 0 ||
                      item.permissions.some(permission => hasPermission(permission));

                    if (!hasRequiredPermission) return null;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          pathname === item.href
                            ? 'bg-primary text-primary-foreground'
                            : 'text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <div className="flex flex-col">
                          <span>{item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
                <Separator className="my-4 bg-border" />
                <Button
                  variant="ghost"
                  className="text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
