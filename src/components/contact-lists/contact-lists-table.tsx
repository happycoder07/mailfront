'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  API_ENDPOINTS,
  PaginatedContactListResponseDto,
  ContactListResponseDto,
} from '@/lib/config';
import { Loader2, Eye, Pencil, Trash, Search } from 'lucide-react';
import { ContactListDialog } from './contact-list-dialog';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTableShortcuts } from '@/hooks/use-keyboard-shortcuts';

export function ContactListsTable() {
  const [lists, setLists] = useState<ContactListResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactList, setSelectedContactList] = useState<ContactListResponseDto | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactListToDelete, setContactListToDelete] = useState<ContactListResponseDto | null>(
    null
  );
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const { hasPermission, getCSRFToken } = useAuth();

  const canUpdate = hasPermission(PERMISSIONS.UPDATE_CONTACT_LIST);
  const canDelete = hasPermission(PERMISSIONS.DELETE_CONTACT_LIST);

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

  const fetchLists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(searchQuery && { name: searchQuery }),
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      const response = await fetch(`${API_ENDPOINTS.CONTACT_LISTS.LIST}?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
      });
      const data: PaginatedContactListResponseDto = await response.json();
      setLists(data.items || []);
      setPagination(prev => ({
        ...prev,
        totalItems: data.meta.totalItems,
        totalPages: data.meta.totalPages,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [pagination.page, pagination.pageSize, searchQuery]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleView = (contactList: ContactListResponseDto) => {
    setSelectedContactList(contactList);
    setIsEditMode(false);
    setDialogOpen(true);
  };

  const handleEdit = (contactList: ContactListResponseDto) => {
    setSelectedContactList(contactList);
    setIsEditMode(true);
    setDialogOpen(true);
  };

  const handleDelete = async (contactList: ContactListResponseDto) => {
    setContactListToDelete(contactList);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contactListToDelete) return;

    try {
      const response = await fetch(API_ENDPOINTS.CONTACT_LISTS.DELETE(contactListToDelete.id), {
        method: 'DELETE',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact list');
      }

      toast({
        title: 'Success',
        description: 'Contact list deleted successfully',
      });
      fetchLists();
    } catch (error) {
      console.error('Error deleting contact list:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contact list',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setContactListToDelete(null);
    }
  };

  const handleContactListUpdated = () => {
    fetchLists();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Contact Lists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Search by name..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="max-w-xs"
              aria-label="Search contact lists by name"
            />
            <Button onClick={handleSearch} size="sm">
              <Search className="h-4 w-4 mr-2" aria-hidden="true" />
              Search
            </Button>
            {searchQuery && (
              <Button
                onClick={handleClearSearch}
                variant="outline"
                size="sm"
                aria-label="Clear search"
              >
                Clear
              </Button>
            )}
          </div>
          <div className="rounded-md border">
            <Table role="table" aria-label="Contact lists table">
              <TableHeader>
                <TableRow className="bg-background">
                  <TableHead className="w-2/7" scope="col">
                    Name
                  </TableHead>
                  <TableHead className="w-3/7" scope="col">
                    Description
                  </TableHead>
                  <TableHead className="w-1/7 hidden md:table-cell text-center" scope="col">
                    Created At
                  </TableHead>
                  <TableHead className="w-1/7 text-center" scope="col">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" aria-hidden="true" />
                      <span className="sr-only">Loading contact lists</span>
                    </TableCell>
                  </TableRow>
                ) : lists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center" role="alert">
                      No contact lists found
                    </TableCell>
                  </TableRow>
                ) : (
                  lists.map(list => (
                    <TableRow key={list.id} role="row" aria-label={`Contact list ${list.name}`}>
                      <TableCell>{list.name}</TableCell>
                      <TableCell>{list.description || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell text-center">
                        {new Date(list.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleView(list)}
                            title="View contact list"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canUpdate && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(list)}
                              title="Edit contact list"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(list)}
                              title="Delete contact list"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Showing {lists.length} of {pagination.totalItems} contact lists
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))
                }
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedContactList && (
        <ContactListDialog
          contactList={selectedContactList}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onContactListUpdated={handleContactListUpdated}
          initialEditMode={isEditMode}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{contactListToDelete?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
