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
import { Eye, Pencil, Save, X, Loader2, User, Calendar, Trash2, Users, Hash } from 'lucide-react';
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <User className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {isEditing ? 'Edit Contact' : contact.name}
                </DialogTitle>
                {!isEditing && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {contact.contactLists.length} contact list{contact.contactLists.length !== 1 ? 's' : ''}
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
                  className="hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950/30"
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
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
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
                <TabsTrigger value="contact-lists" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  Contact Lists
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
                      <span>Contact Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Name</span>
                        </Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                            placeholder="Enter contact name..."
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{contact.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="eid" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                          <Hash className="h-4 w-4" />
                          <span>EID</span>
                        </Label>
                        {isEditing ? (
                          <Input
                            id="eid"
                            value={formData.eid || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, eid: e.target.value }))}
                            className="border-gray-200 focus:border-green-500 focus:ring-green-500 font-mono"
                            placeholder="Enter EID..."
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                            <span className="text-gray-900 dark:text-gray-100 font-mono">{contact.eid}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contact Lists Count
                      </Label>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-900 dark:text-green-100 font-medium">
                            {contact.contactLists.length} contact list{contact.contactLists.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Created At</span>
                        </Label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                          <span className="text-gray-900 dark:text-gray-100">
                            {new Date(contact.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Updated At</span>
                        </Label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                          <span className="text-gray-900 dark:text-gray-100">
                            {new Date(contact.updatedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contact-lists" className="flex-1 p-6 overflow-y-auto">
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded">
                      <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span>
                      Contact Lists ({contact.contactLists.length})
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Contact lists this contact belongs to
                  </p>
                </CardHeader>
                <CardContent>
                  {contact.contactLists.length > 0 ? (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {contact.contactLists.map((list) => (
                          <div
                            key={list.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {list.name}
                                </div>
                                {list.description && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {list.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
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
                        No contact lists assigned
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        This contact is not part of any contact lists.
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
              Delete Contact
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
