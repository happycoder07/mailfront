'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS, CreateContactDto, ContactListDto } from '@/lib/config';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export function CreateContactForm() {
  const router = useRouter();
  const { hasPermission, getCSRFToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactLists, setContactLists] = useState<ContactListDto[]>([]);
  const [formData, setFormData] = useState<CreateContactDto>({
    name: '',
    eid: '',
    contactListIds: [],
  });

  const canCreate = hasPermission(PERMISSIONS.CREATE_CONTACT);

  useEffect(() => {
    if (!canCreate) {
      router.push('/contacts');
      return;
    }

    // Fetch contact lists for selection
    const fetchContactLists = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.CONTACT_LISTS.LIST, {
          credentials: 'include',
          headers: {
            'X-XSRF-TOKEN': getCSRFToken(),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setContactLists(data.items || []);
        }
      } catch (error) {
        console.error('Error fetching contact lists:', error);
      }
    };

    fetchContactLists();
  }, [canCreate, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.eid.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and EID are required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(API_ENDPOINTS.CONTACTS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create contact');
      }

      toast({
        title: 'Success',
        description: 'Contact created successfully',
      });
      router.push('/contacts');
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to create contact',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactListToggle = (listId: number) => {
    setFormData(prev => ({
      ...prev,
      contactListIds: prev.contactListIds?.includes(listId)
        ? prev.contactListIds.filter(id => id !== listId)
        : [...(prev.contactListIds || []), listId],
    }));
  };

  if (!canCreate) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contacts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter contact name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eid">EID *</Label>
                <Input
                  id="eid"
                  value={formData.eid}
                  onChange={(e) => setFormData(prev => ({ ...prev, eid: e.target.value }))}
                  placeholder="Enter EID"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Contact Lists</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-4">
                {contactLists.length > 0 ? (
                  contactLists.map((list) => (
                    <div key={list.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`list-${list.id}`}
                        checked={formData.contactListIds?.includes(list.id) || false}
                        onCheckedChange={() => handleContactListToggle(list.id)}
                      />
                      <Label htmlFor={`list-${list.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{list.name}</div>
                        {list.description && (
                          <div className="text-sm text-muted-foreground">{list.description}</div>
                        )}
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No contact lists available
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
                  'Create Contact'
                )}
              </Button>
              <Link href="/contacts">
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
