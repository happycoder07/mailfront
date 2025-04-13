'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/lib/config';
import { Mail, Inbox, Activity, User, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';

export function MainNav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { hasPermission } = useAuth();

  // Define navigation items with their required permissions
  const navItems = [
    {
      title: 'Emails',
      href: '/emails',
      icon: Mail,
      // Emails section requires any of these permissions
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
      // Queue section requires any of these permissions
      permissions: [PERMISSIONS.VIEW_QUEUE, PERMISSIONS.MANAGE_QUEUE, PERMISSIONS.SEND_EMAIL],
    },
    {
      title: 'Users',
      href: '/users',
      icon: User,
      // Users section requires any of these permissions
      permissions: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.REGISTER_USERS],
    },
    {
      title: 'Monitoring',
      href: '/monitoring',
      icon: Activity,
      // Monitoring section requires any of these permissions
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
      // Profile section doesn't require any specific permission
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
      <div className="border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-2 font-bold text-xl">
            <Mail className="h-6 w-6" />
            <span>Mail Manager</span>
          </div>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-2 font-bold text-xl">
          <Mail className="h-6 w-6" />
          <span>Mail Manager</span>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/20"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden p-4 bg-indigo-800">
          <nav className="flex flex-col space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
