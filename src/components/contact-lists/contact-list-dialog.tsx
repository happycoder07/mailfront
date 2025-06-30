'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { useFormShortcuts } from '@/hooks/use-keyboard-shortcuts';

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
  const [allContacts, setAllContacts] = useState<ContactDto[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [formData, setFormData] = useState<UpdateContactListDto>({
    name: contactList.name,
    description: contactList.description || '',
    contactIds: contactList.contacts.map(c => c.id),
  });
  const { hasPermission, getCSRFToken } = useAuth();

  const canEdit = hasPermission(PERMISSIONS.UPDATE_CONTACT_LIST);
  const canDelete = hasPermission(PERMISSIONS.DELETE_CONTACT_LIST);

  // Form shortcuts
  useFormShortcuts(
    // onSubmit
    () => {
      if (isEditing) {
        handleSave();
      }
    },
    // onCancel
    () => {
      if (isEditing) {
        setIsEditing(false);
      } else {
        onOpenChange(false);
      }
    },
    // onSave
    () => {
      if (isEditing) {
        handleSave();
      }
    }
  );

  // Fetch all available contacts
  const fetchAllContacts = async () => {
    setLoadingContacts(true);
    try {
      const response = await fetch(API_ENDPOINTS.CONTACTS.LIST, {
        credentials: 'include',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAllContacts(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Reset edit mode when dialog opens/closes
  useEffect(() => {
    if (open) {
      setIsEditing(initialEditMode);
      setFormData({
        name: contactList.name,
        description: contactList.description || '',
        contactIds: contactList.contacts.map(c => c.id),
      });
      // Fetch all contacts when dialog opens
      fetchAllContacts();
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
          'X-XSRF-TOKEN': getCSRFToken()
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
        <DialogDescription className="sr-only">
          {isEditing ? 'Edit contact list details and manage contacts' : `Contact list: ${contactList.name} with ${contactList.contacts.length} contact${contactList.contacts.length !== 1 ? 's' : ''}`}
        </DialogDescription>
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-list-primary/10 via-list-primary/5 to-list-secondary/10 dark:from-list-primary/20 dark:via-list-primary/10 dark:to-list-secondary/20">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-list-primary/15 dark:bg-list-primary/25 rounded-lg shadow-sm">
                <Users className="h-5 w-5 text-list-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {isEditing ? 'Edit Contact List' : contactList.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {!isEditing && `${contactList.contacts.length} contact${contactList.contacts.length !== 1 ? 's' : ''}`}
                  {isEditing && 'Edit contact list details and manage contacts'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="hover:bg-list-primary/10 hover:border-list-primary/30 hover:text-list-primary transition-colors"
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
                    className="hover:bg-accent"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-list-primary hover:bg-list-primary/90 text-list-primary-foreground"
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
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="details" className="data-[state=active]:bg-background data-[state=active]:text-list-primary data-[state=active]:shadow-sm">
                  Details
                </TabsTrigger>
                <TabsTrigger value="contacts" className="data-[state=active]:bg-background data-[state=active]:text-list-primary data-[state=active]:shadow-sm">
                  Contacts
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details" className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/80">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="p-1.5 bg-list-primary/10 dark:bg-list-primary/20 rounded-lg">
                        <Eye className="h-4 w-4 text-list-primary" />
                      </div>
                      <span>Contact List Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-medium text-foreground">
                          Name
                        </Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="border-input focus:border-list-primary focus:ring-list-primary/20"
                            placeholder="Enter contact list name..."
                          />
                        ) : (
                          <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                            <span className="text-foreground font-medium">{contactList.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-foreground">
                          Contact Count
                        </Label>
                        <div className="p-3 bg-list-primary/5 dark:bg-list-primary/10 rounded-lg border border-list-primary/20 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-list-primary" />
                            <span className="text-list-primary font-medium">
                              {contactList.contacts.length} contact{contactList.contacts.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-sm font-medium text-foreground">
                        Description
                      </Label>
                      {isEditing ? (
                        <Textarea
                          id="description"
                          value={formData.description || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter description..."
                          className="border-input focus:border-list-primary focus:ring-list-primary/20 min-h-[100px]"
                        />
                      ) : (
                        <div className="p-3 bg-muted/50 rounded-lg border border-border/50 min-h-[100px]">
                          <span className="text-foreground">
                            {contactList.description || 'No description provided'}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator className="my-6" />

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
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
              <Card className="border-0 shadow-sm h-full bg-gradient-to-br from-card to-card/80">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="p-1.5 bg-list-primary/10 dark:bg-list-primary/20 rounded-lg">
                      <Users className="h-4 w-4 text-list-primary" />
                    </div>
                    <span>
                      Contacts ({contactList.contacts.length})
                    </span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isEditing ? 'Select contacts to include in this list' : 'Contacts in this list'}
                  </p>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-foreground">
                          Manage Contacts
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          {formData.contactIds?.length || 0} selected
                        </div>
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto border border-border/50 rounded-md p-4 bg-muted/30">
                        {loadingContacts ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-list-primary" />
                            <span className="ml-2 text-muted-foreground">Loading contacts...</span>
                          </div>
                        ) : allContacts.length > 0 ? (
                          allContacts.map((contact) => (
                            <div key={contact.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                              <Checkbox
                                id={`contact-${contact.id}`}
                                checked={isContactSelected(contact.id)}
                                onCheckedChange={(checked) => handleContactToggle(contact.id, checked as boolean)}
                                className="text-list-primary border-border focus:ring-list-primary/20"
                              />
                              <div className="flex items-center space-x-3 flex-1">
                                <div className="p-2 bg-contact-primary/15 dark:bg-contact-primary/25 rounded-lg shadow-sm">
                                  <User className="h-4 w-4 text-contact-primary" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-foreground">
                                    {contact.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground font-mono">
                                    {contact.eid}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                                Member
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-sm">
                              <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground mb-2">
                              No contacts available
                            </h3>
                            <p className="text-muted-foreground">
                              There are no contacts to manage in this list.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {contactList.contacts.length > 0 ? (
                        <ScrollArea className="h-[310px] pr-4">
                          <div className="space-y-3">
                            {contactList.contacts.map((contact) => (
                              <div
                                key={contact.id}
                                className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-muted/30 to-muted/50 border-border/50 hover:from-muted/50 hover:to-muted/70 hover:border-list-primary/30 transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="p-2 bg-contact-primary/15 dark:bg-contact-primary/25 rounded-lg shadow-sm">
                                    <User className="h-4 w-4 text-contact-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-foreground">
                                      {contact.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground font-mono">
                                      {contact.eid}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                                  Member
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-12">
                          <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-sm">
                            <Users className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            No contacts in this list
                          </h3>
                          <p className="text-muted-foreground">
                            This contact list is empty.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {canDelete && (
          <div className="flex justify-end p-6 border-t bg-gradient-to-r from-muted/30 to-muted/50">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="hover:bg-destructive/90"
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
