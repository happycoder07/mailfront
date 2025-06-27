'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS, CreateContactListDto, ContactDto } from '@/lib/config';
import { Loader2, ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

export function CreateContactListForm() {
  const router = useRouter();
  const { hasPermission, getCSRFToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contacts, setContacts] = useState<ContactDto[]>([]);
  const [formData, setFormData] = useState<CreateContactListDto>({
    name: '',
    description: '',
    contactIds: [],
  });

  const canCreate = hasPermission(PERMISSIONS.CREATE_CONTACT_LIST);

  useEffect(() => {
    if (!canCreate) {
      router.push('/contact-lists');
      return;
    }

    // Fetch contacts for selection
    const fetchContacts = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.CONTACTS.LIST, {
          credentials: 'include',
          headers: {
            'X-XSRF-TOKEN': getCSRFToken(),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setContacts(data.items || []);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    fetchContacts();
  }, [canCreate, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(API_ENDPOINTS.CONTACT_LISTS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create contact list');
      }

      toast({
        title: 'Success',
        description: 'Contact list created successfully',
      });
      router.push('/contact-lists');
    } catch (error) {
      console.error('Error creating contact list:', error);
      toast({
        title: 'Error',
        description: 'Failed to create contact list',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactToggle = (contactId: number) => {
    setFormData(prev => ({
      ...prev,
      contactIds: prev.contactIds?.includes(contactId)
        ? prev.contactIds.filter(id => id !== contactId)
        : [...(prev.contactIds || []), contactId],
    }));
  };

  if (!canCreate) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contact-lists">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contact Lists
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center space-x-2">
            <div className="p-1.5 bg-list-primary/10 dark:bg-list-primary/20 rounded-lg">
              <Users className="h-4 w-4 text-list-primary" />
            </div>
            <span>Create New Contact List</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter contact list name"
                  className="border-input focus:border-list-primary focus:ring-list-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Contact Count</Label>
                <div className="p-3 bg-list-primary/5 dark:bg-list-primary/10 rounded-lg border border-list-primary/20 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-list-primary font-medium">
                      {formData.contactIds?.length || 0} contact{(formData.contactIds?.length || 0) !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description (optional)"
                className="border-input focus:border-list-primary focus:ring-list-primary/20"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-foreground">Contacts</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-border/50 rounded-md p-4 bg-muted/30">
                {contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={`contact-${contact.id}`}
                        checked={formData.contactIds?.includes(contact.id) || false}
                        onCheckedChange={() => handleContactToggle(contact.id)}
                        className="text-list-primary border-border focus:ring-list-primary/20"
                      />
                      <Label htmlFor={`contact-${contact.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium text-foreground">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">{contact.eid}</div>
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No contacts available
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-list-primary hover:bg-list-primary/90 text-list-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Contact List'
                )}
              </Button>
              <Link href="/contact-lists">
                <Button type="button" variant="outline" className="hover:bg-accent">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
