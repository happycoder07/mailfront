'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import {
  Eye,
  Pencil,
  Save,
  X,
  Loader2,
  User,
  Calendar,
  Trash2,
  Users,
  Hash,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import { useFormShortcuts } from '@/hooks/use-keyboard-shortcuts';

interface ContactDialogProps {
  contact: ContactResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactUpdated: () => void;
  initialEditMode?: boolean;
}

export function ContactDialog({
  contact,
  open,
  onOpenChange,
  onContactUpdated,
  initialEditMode = false,
}: ContactDialogProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [allContactLists, setAllContactLists] = useState<ContactListDto[]>([]);
  const [loadingContactLists, setLoadingContactLists] = useState(false);
  const [formData, setFormData] = useState<UpdateContactDto>({
    name: contact.name,
    eid: contact.eid,
    contactListIds: contact.contactLists.map(cl => cl.id),
  });
  const { hasPermission, getCSRFToken } = useAuth();

  const canEdit = hasPermission(PERMISSIONS.UPDATE_CONTACT);
  const canDelete = hasPermission(PERMISSIONS.DELETE_CONTACT);

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

  // Fetch all available contact lists
  const fetchAllContactLists = async () => {
    setLoadingContactLists(true);
    try {
      const response = await fetch(API_ENDPOINTS.CONTACT_LISTS.LIST, {
        credentials: 'include',
        headers: {
          'X-XSRF-TOKEN': getCSRFToken(),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAllContactLists(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching contact lists:', error);
    } finally {
      setLoadingContactLists(false);
    }
  };

  // Reset edit mode when dialog opens/closes
  useEffect(() => {
    if (open) {
      setIsEditing(initialEditMode);
      setFormData({
        name: contact.name,
        eid: contact.eid,
        contactListIds: contact.contactLists.map(cl => cl.id),
      });
      // Fetch all contact lists when dialog opens
      fetchAllContactLists();
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
      onOpenChange(false);
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
        <DialogDescription className="sr-only">
          {isEditing
            ? 'Edit contact details and manage contact list assignments'
            : `Contact: ${contact.name} with ${contact.contactLists.length} contact list${contact.contactLists.length !== 1 ? 's' : ''}`}
        </DialogDescription>
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-contact-primary/10 via-contact-primary/5 to-contact-secondary/10 dark:from-contact-primary/20 dark:via-contact-primary/10 dark:to-contact-secondary/20">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-contact-primary/15 dark:bg-contact-primary/25 rounded-lg shadow-sm">
                <User className="h-5 w-5 text-contact-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {isEditing ? 'Edit Contact' : contact.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {!isEditing &&
                    `${contact.contactLists.length} contact list${contact.contactLists.length !== 1 ? 's' : ''}`}
                  {isEditing && 'Edit contact details and manage contact list assignments'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="hover:bg-contact-primary/10 hover:border-contact-primary/30 hover:text-contact-primary transition-colors"
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
                    className="hover:bg-accent"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-contact-primary hover:bg-contact-primary/90 text-contact-primary-foreground"
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
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-background data-[state=active]:text-contact-primary data-[state=active]:shadow-sm"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="contact-lists"
                  className="data-[state=active]:bg-background data-[state=active]:text-contact-primary data-[state=active]:shadow-sm"
                >
                  Contact Lists
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details" className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/80">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="p-1.5 bg-contact-primary/10 dark:bg-contact-primary/20 rounded-lg">
                        <Eye className="h-4 w-4 text-contact-primary" />
                      </div>
                      <span>Contact Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="name"
                          className="text-sm font-medium text-foreground flex items-center space-x-2"
                        >
                          <User className="h-4 w-4" />
                          <span>Name</span>
                        </Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="border-input focus:border-contact-primary focus:ring-contact-primary/20"
                            placeholder="Enter contact name..."
                          />
                        ) : (
                          <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                            <span className="text-foreground font-medium">{contact.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="eid"
                          className="text-sm font-medium text-foreground flex items-center space-x-2"
                        >
                          <Mail className="h-4 w-4" />
                          <span>Email Address</span>
                        </Label>
                        {isEditing ? (
                          <Input
                            id="eid"
                            value={formData.eid || ''}
                            onChange={e => setFormData(prev => ({ ...prev, eid: e.target.value }))}
                            className="border-input focus:border-contact-primary focus:ring-contact-primary/20 font-mono"
                            placeholder="Enter EID..."
                          />
                        ) : (
                          <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                            <span className="text-foreground font-mono">{contact.eid}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-foreground">
                        Contact Lists Count
                      </Label>
                      <div className="p-3 bg-contact-primary/5 dark:bg-contact-primary/10 rounded-lg border border-contact-primary/20 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-contact-primary" />
                          <span className="text-contact-primary font-medium">
                            {contact.contactLists.length} contact list
                            {contact.contactLists.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created: {new Date(contact.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Updated: {new Date(contact.updatedAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contact-lists" className="flex-1 p-6 overflow-y-auto">
              <Card className="border-0 shadow-sm h-full bg-gradient-to-br from-card to-card/80">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="p-1.5 bg-contact-primary/10 dark:bg-contact-primary/20 rounded-lg">
                      <Users className="h-4 w-4 text-contact-primary" />
                    </div>
                    <span>Contact Lists ({contact.contactLists.length})</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isEditing
                      ? 'Select contact lists to assign this contact to'
                      : 'Contact lists this contact belongs to'}
                  </p>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-foreground">
                          Manage Contact Lists
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          {formData.contactListIds?.length || 0} selected
                        </div>
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto border border-border/50 rounded-md p-4 bg-muted/30">
                        {loadingContactLists ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-contact-primary" />
                            <span className="ml-2 text-muted-foreground">
                              Loading contact lists...
                            </span>
                          </div>
                        ) : allContactLists.length > 0 ? (
                          allContactLists.map(list => (
                            <div
                              key={list.id}
                              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                id={`list-${list.id}`}
                                checked={formData.contactListIds?.includes(list.id) || false}
                                onCheckedChange={checked => {
                                  if (checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      contactListIds: [...(prev.contactListIds || []), list.id],
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      contactListIds: (prev.contactListIds || []).filter(
                                        id => id !== list.id
                                      ),
                                    }));
                                  }
                                }}
                                className="text-contact-primary border-border focus:ring-contact-primary/20"
                              />
                              <div className="flex items-center space-x-3 flex-1">
                                <div className="p-2 bg-list-primary/15 dark:bg-list-primary/25 rounded-lg shadow-sm">
                                  <Users className="h-4 w-4 text-list-primary" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-foreground">{list.name}</div>
                                  {list.description && (
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {list.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Badge
                                variant="secondary"
                                className="bg-success/10 text-success border-success/20"
                              >
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
                              No contact lists available
                            </h3>
                            <p className="text-muted-foreground">
                              There are no contact lists to assign this contact to.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {contact.contactLists.length > 0 ? (
                        <ScrollArea className="h-[240px] pr-4">
                          <div className="space-y-3">
                            {contact.contactLists.map(list => (
                              <div
                                key={list.id}
                                className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-muted/30 to-muted/50 border-border/50 hover:from-muted/50 hover:to-muted/70 hover:border-list-primary/30 transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="p-2 bg-list-primary/15 dark:bg-list-primary/25 rounded-lg shadow-sm">
                                    <Users className="h-4 w-4 text-list-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-foreground">{list.name}</div>
                                    {list.description && (
                                      <div className="text-sm text-muted-foreground mt-1">
                                        {list.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className="bg-success/10 text-success border-success/20"
                                >
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
                            No contact lists assigned
                          </h3>
                          <p className="text-muted-foreground">
                            This contact is not part of any contact lists.
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
              Delete Contact
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
