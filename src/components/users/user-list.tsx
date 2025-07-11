'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Search, Loader2, Pencil, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserDialog } from './user-dialog';
import type { User, UserListResponse } from '@/lib/config';
import { useTableShortcuts } from '@/hooks/use-keyboard-shortcuts';

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

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
  hover: {
    scale: 1.01,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

const searchVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  focus: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } },
};

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const { hasPermission, getCSRFToken } = useAuth();

  const canManageUsers = hasPermission(PERMISSIONS.MANAGE_USERS);
  const canEditUsers = hasPermission(PERMISSIONS.EDIT_USERS);
  const canDeleteUsers = hasPermission(PERMISSIONS.DELETE_USERS);

  // Table navigation shortcuts
  useTableShortcuts(
    // onNextPage
    () => {
      if (pagination.page < pagination.totalPages) {
        setPagination(prev => ({ ...prev, page: prev.page + 1 }));
      }
    },
    // onPrevPage
    () => {
      if (pagination.page > 1) {
        setPagination(prev => ({ ...prev, page: prev.page - 1 }));
      }
    },
    // onFirstPage
    () => {
      if (pagination.page > 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    },
    // onLastPage
    () => {
      if (pagination.page < pagination.totalPages) {
        setPagination(prev => ({ ...prev, page: prev.totalPages }));
      }
    }
  );

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.AUTH.USERS}?search=${searchQuery}`, {
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data: UserListResponse = await response.json();

      if (data && data.data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!canDeleteUsers) {
      toast({
        title: 'Error',
        description: 'You do not have permission to delete users',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.USER(userId.toString()), {
        method: 'DELETE',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  if (!canManageUsers) {
    return (
      <motion.div
        className="p-6 text-center"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-destructive">
          You do not have permission to manage users. Please contact your administrator.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="flex items-center space-x-2" variants={searchVariants}>
        <motion.div className="relative flex-1" whileFocus="focus" variants={searchVariants}>
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </motion.div>
      </motion.div>

      <motion.div className="rounded-md border" variants={itemVariants}>
        <Table>
          <TableHeader>
            <TableRow className="bg-background">
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Email</TableHead>
              <TableHead className="text-center">Role</TableHead>
              <TableHead className="text-center">Created At</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {loading ? (
                <motion.tr
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TableCell colSpan={5} className="h-24 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-flex items-center gap-2"
                    >
                      <Loader2 className="h-4 w-4" />
                      Loading...
                    </motion.div>
                  </TableCell>
                </motion.tr>
              ) : users.length === 0 ? (
                <motion.tr
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TableCell colSpan={5} className="h-24 text-center">
                    <p className="text-muted-foreground">No users found.</p>
                  </TableCell>
                </motion.tr>
              ) : (
                users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    whileHover="hover"
                    exit="exit"
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-center">{user.email}</TableCell>
                    <TableCell className="text-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.3 }}
                      >
                        <Badge variant="outline">{user.role.name}</Badge>
                      </motion.div>
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center space-x-2">
                      {canEditUsers && (
                        <motion.div
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className="inline-block"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      )}
                      {canDeleteUsers && (
                        <motion.div
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className="inline-block"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      )}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </motion.div>

      {selectedUser && (
        <UserDialog
          user={selectedUser}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={fetchUsers}
        />
      )}
    </motion.div>
  );
}
