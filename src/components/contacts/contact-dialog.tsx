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
import { API_ENDPOINTS, ContactResponseDto, ContactListDto, UpdateContactDto } from '@/lib/config';
import { Eye, Pencil, Save, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';

interface ContactDialogProps {
  contact: ContactResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactUpdated: () => void;
  initialEditMode?: boolean;
}

export function ContactDialog({ contact, open, onOpenChange, onContactUpdated, initialEditMode = false }: ContactDialogProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateContactDto>({
    name: contact.name,
    eid: contact.eid,
    contactListIds: contact.contactLists.map(cl => cl.id),
  });
  const { hasPermission, getCSRFToken } = useAuth();

  const canEdit = hasPermission(PERMISSIONS.UPDATE_CONTACT);
  const canDelete = hasPermission(PERMISSIONS.DELETE_CONTACT);

  // Reset edit mode when dialog opens/closes
  useEffect(() => {
    if (open) {
      setIsEditing(initialEditMode);
      setFormData({
        name: contact.name,
        eid: contact.eid,
        contactListIds: contact.contactLists.map(cl => cl.id),
      });
    }
  }, [open, initialEditMode, contact]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(API_ENDPOINTS.CONTACTS.UPDATE(contact.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update contact');
      }

      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });
      setIsEditing(false);
      onContactUpdated();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
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
      onOpenChange(false);
      onContactUpdated();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contact',
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
              {isEditing ? 'Edit Contact' : contact.name}
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
                        name: contact.name,
                        eid: contact.eid,
                        contactListIds: contact.contactLists.map(cl => cl.id),
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
            <TabsTrigger value="contact-lists">Contact Lists</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    ) : (
                      <div className="text-sm">{contact.name}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eid">EID</Label>
                    {isEditing ? (
                      <Input
                        id="eid"
                        value={formData.eid || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, eid: e.target.value }))}
                      />
                    ) : (
                      <div className="text-sm">{contact.eid}</div>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Created At</Label>
                  <div className="text-sm">{new Date(contact.createdAt).toLocaleString()}</div>
                </div>
                <div className="space-y-2">
                  <Label>Updated At</Label>
                  <div className="text-sm">{new Date(contact.updatedAt).toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact-lists" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Lists</CardTitle>
              </CardHeader>
              <CardContent>
                {contact.contactLists.length > 0 ? (
                  <div className="space-y-2">
                    {contact.contactLists.map((list) => (
                      <div
                        key={list.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{list.name}</div>
                          {list.description && (
                            <div className="text-sm text-muted-foreground">{list.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No contact lists assigned
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
              Delete Contact
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
