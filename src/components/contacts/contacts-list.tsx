'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_ENDPOINTS, PaginatedContactResponseDto, ContactResponseDto } from '@/lib/config';
import { Loader2, Eye, Pencil, Trash } from 'lucide-react';
import { ContactDialog } from './contact-dialog';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { toast } from '@/components/ui/use-toast';

export function ContactsList() {
  const [contacts, setContacts] = useState<ContactResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactResponseDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const { hasPermission, getCSRFToken } = useAuth();

  const canUpdate = hasPermission(PERMISSIONS.UPDATE_CONTACT);
  const canDelete = hasPermission(PERMISSIONS.DELETE_CONTACT);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(search && { name: search }),
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      const response = await fetch(`${API_ENDPOINTS.CONTACTS.LIST}?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
      });
      const data: PaginatedContactResponseDto = await response.json();
      setContacts(data.items || []);
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
    fetchContacts();
  }, [pagination.page, pagination.pageSize, search]);

  const handleView = (contact: ContactResponseDto) => {
    setSelectedContact(contact);
    setIsEditMode(false);
    setDialogOpen(true);
  };

  const handleEdit = (contact: ContactResponseDto) => {
    setSelectedContact(contact);
    setIsEditMode(true);
    setDialogOpen(true);
  };

  const handleDelete = async (contact: ContactResponseDto) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.CONTACTS.DELETE(contact.id), {
        method: 'DELETE',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      toast({
        title: 'Success',
        description: 'Contact deleted successfully',
      });
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contact',
        variant: 'destructive',
      });
    }
  };

  const handleContactUpdated = () => {
    fetchContacts();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>EID</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No contacts found</TableCell>
                  </TableRow>
                ) : (
                  contacts.map(contact => (
                    <TableRow key={contact.id}>
                      <TableCell>{contact.name}</TableCell>
                      <TableCell>{contact.eid}</TableCell>
                      <TableCell>{new Date(contact.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleView(contact)}
                            title="View contact"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canUpdate && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(contact)}
                              title="Edit contact"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(contact)}
                              title="Delete contact"
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
              Showing {contacts.length} of {pagination.totalItems} contacts
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
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedContact && (
        <ContactDialog
          contact={selectedContact}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onContactUpdated={handleContactUpdated}
          initialEditMode={isEditMode}
        />
      )}
    </>
  );
}
