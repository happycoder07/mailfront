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
import { Loader2, ArrowLeft } from 'lucide-react';
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

      <Card>
        <CardHeader>
          <CardTitle>Create New Contact List</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter contact list name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label>Contacts</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-4">
                {contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`contact-${contact.id}`}
                        checked={formData.contactIds?.includes(contact.id) || false}
                        onCheckedChange={() => handleContactToggle(contact.id)}
                      />
                      <Label htmlFor={`contact-${contact.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{contact.name}</div>
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
                className="flex-1"
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
                <Button type="button" variant="outline">
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
