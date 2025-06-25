'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Mail, Inbox, Activity, User, LogOut, Menu, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { ThemeToggle } from '@/components/theme-toggle';

const navItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
};

const logoVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const buttonVariants = {
  hover: { scale: 1.1, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } },
};

const mobileMenuVariants = {
  hidden: { opacity: 0, x: 300 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

const mobileItemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
};

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, logout } = useAuth();

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
      title: 'Contacts',
      href: '/contacts',
      icon: User,
      description: 'Manage contacts',
      permissions: [PERMISSIONS.READ_CONTACT],
    },
    {
      title: 'Contact Lists',
      href: '/contact-lists',
      icon: Inbox,
      description: 'Manage contact lists',
      permissions: [PERMISSIONS.READ_CONTACT_LIST],
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
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout fails
      router.push('/auth/login');
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
          <motion.div
            className="flex items-center space-x-2 font-bold text-xl"
            variants={logoVariants}
            initial="hidden"
            animate="visible"
          >
            <Mail className="h-6 w-6" />
            <span>NCCC Mail Manager</span>
          </motion.div>
          <div className="ml-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>Logout</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-nav-background text-card-foreground">
      <div className="flex h-16 items-center px-4">
        <motion.div
          className="flex items-center space-x-2 font-bold text-xl"
          variants={logoVariants}
          initial="hidden"
          animate="visible"
        >
          <Mail className="h-6 w-6" />
          <span>NCCC Mail Manager</span>
        </motion.div>
        <div className="ml-auto flex items-center space-x-4">
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const hasRequiredPermission: boolean =
                item.permissions.length === 0 ||
                item.permissions.some(permission => hasPermission(permission));

              if (!hasRequiredPermission) return null;

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <motion.div
                      variants={navItemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                      whileHover="hover"
                    >
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
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>{item.description}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
            <ThemeToggle />
          </motion.div>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>Logout</TooltipContent>
          </Tooltip>
          <Sheet>
            <SheetTrigger asChild>
              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-card text-card-foreground">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <motion.div
                className="flex flex-col h-full"
                variants={mobileMenuVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="flex items-center space-x-2 font-bold text-xl mb-6"
                  variants={logoVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Mail className="h-6 w-6" />
                  <span>NCCC Mail Manager</span>
                </motion.div>
                <nav className="flex flex-col space-y-2">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const hasRequiredPermission: boolean =
                      item.permissions.length === 0 ||
                      item.permissions.some(permission => hasPermission(permission));

                    if (!hasRequiredPermission) return null;

                    return (
                      <motion.div
                        key={item.href}
                        variants={mobileItemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={index}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
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
                      </motion.div>
                    );
                  })}
                </nav>
                <Separator className="my-4" />
                <motion.div
                  variants={mobileItemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={navItems.length}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </motion.div>
              </motion.div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
