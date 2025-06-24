'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS, ContactListResponseDto, ContactDto, UpdateContactListDto } from '@/lib/config';
import { Eye, Pencil, Save, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';

interface ContactListDialogProps {
  contactList: ContactListResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactListUpdated: () => void;
  initialEditMode?: boolean;
}

export function ContactListDialog({ contactList, open, onOpenChange, onContactListUpdated, initialEditMode = false }: ContactListDialogProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateContactListDto>({
    name: contactList.name,
    description: contactList.description || '',
    contactIds: contactList.contacts.map(c => c.id),
  });
  const { hasPermission, getCSRFToken } = useAuth();

  const canEdit = hasPermission(PERMISSIONS.UPDATE_CONTACT_LIST);
  const canDelete = hasPermission(PERMISSIONS.DELETE_CONTACT_LIST);

  // Reset edit mode when dialog opens/closes
  useEffect(() => {
    if (open) {
      setIsEditing(initialEditMode);
      setFormData({
        name: contactList.name,
        description: contactList.description || '',
        contactIds: contactList.contacts.map(c => c.id),
      });
    }
  }, [open, initialEditMode, contactList]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(API_ENDPOINTS.CONTACT_LISTS.UPDATE(contactList.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update contact list');
      }

      toast({
        title: 'Success',
        description: 'Contact list updated successfully',
      });
      setIsEditing(false);
      onContactListUpdated();
    } catch (error) {
      console.error('Error updating contact list:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact list',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact list?')) {
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.CONTACT_LISTS.DELETE(contactList.id), {
        method: 'DELETE',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
          'Content-Type': 'application/json',
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
      onOpenChange(false);
      onContactListUpdated();
    } catch (error) {
      console.error('Error deleting contact list:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contact list',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? 'Edit Contact List' : contactList.name}
            </DialogTitle>
            <div className="flex gap-2">
              {!isEditing && canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: contactList.name,
                        description: contactList.description || '',
                        contactIds: contactList.contacts.map(c => c.id),
                      });
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact List Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  ) : (
                    <div className="text-sm">{contactList.name}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  {isEditing ? (
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description..."
                    />
                  ) : (
                    <div className="text-sm">{contactList.description || 'No description'}</div>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Created At</Label>
                  <div className="text-sm">{new Date(contactList.createdAt).toLocaleString()}</div>
                </div>
                <div className="space-y-2">
                  <Label>Updated At</Label>
                  <div className="text-sm">{new Date(contactList.updatedAt).toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contacts ({contactList.contacts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {contactList.contacts.length > 0 ? (
                  <div className="space-y-2">
                    {contactList.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-muted-foreground">{contact.eid}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No contacts in this list
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {canDelete && (
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              Delete Contact List
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
