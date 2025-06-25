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
import { Eye, Pencil, Save, X, Loader2, Users, Calendar, Trash2, AlertCircle, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Checkbox } from '@/components/ui/checkbox';

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

  const handleContactToggle = (contactId: number, checked: boolean) => {
    if (checked) {
      // Add contact to the list
      setFormData(prev => ({
        ...prev,
        contactIds: [...(prev.contactIds || []), contactId],
      }));
    } else {
      // Remove contact from the list
      setFormData(prev => ({
        ...prev,
        contactIds: (prev.contactIds || []).filter(id => id !== contactId),
      }));
    }
  };

  const isContactSelected = (contactId: number) => {
    return (formData.contactIds || []).includes(contactId);
  };

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
      onOpenChange(false);
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {isEditing ? 'Edit Contact List' : contactList.name}
                </DialogTitle>
                {!isEditing && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {contactList.contacts.length} contact{contactList.contacts.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/30"
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
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
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

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="details" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  Details
                </TabsTrigger>
                <TabsTrigger value="contacts" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  Contacts
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details" className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded">
                        <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span>Contact List Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Name
                        </Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Enter contact list name..."
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{contactList.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Contact Count
                        </Label>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-900 dark:text-blue-100 font-medium">
                              {contactList.contacts.length} contact{contactList.contacts.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </Label>
                      {isEditing ? (
                        <Textarea
                          id="description"
                          value={formData.description || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter description..."
                          className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border min-h-[100px]">
                          <span className="text-gray-900 dark:text-gray-100">
                            {contactList.description || 'No description provided'}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator className="my-6" />

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created: {new Date(contactList.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Updated: {new Date(contactList.updatedAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="flex-1 p-6 overflow-y-auto">
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded">
                      <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span>
                      Contacts ({contactList.contacts.length})
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Contacts in this list
                  </p>
                </CardHeader>
                <CardContent>
                  {contactList.contacts.length > 0 ? (
                    <ScrollArea className="h-[240px] pr-4">
                      <div className="space-y-3">
                        {contactList.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {contact.name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                  {contact.eid}
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Member
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No contacts in this list
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        This contact list is empty.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {canDelete && (
          <div className="flex justify-end p-6 border-t bg-gray-50 dark:bg-gray-800/50">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Contact List
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
