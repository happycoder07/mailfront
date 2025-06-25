'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { API_ENDPOINTS, ContactListDto } from '@/lib/config';
import { createContactSchema, CreateContactFormData } from '@/lib/validation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSIONS } from '@/lib/permissions';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';

export function CreateContactForm() {
  const router = useRouter();
  const { hasPermission, getCSRFToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactLists, setContactLists] = useState<ContactListDto[]>([]);

  const form = useForm<CreateContactFormData>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      name: '',
      eid: '',
      contactListIds: [],
    },
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
  }, [canCreate, router, getCSRFToken]);

  const handleSubmit = async (data: CreateContactFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(API_ENDPOINTS.CONTACTS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify(data),
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
    const currentIds = form.getValues('contactListIds') || [];
    const newIds = currentIds.includes(listId)
      ? currentIds.filter(id => id !== listId)
      : [...currentIds, listId];
    form.setValue('contactListIds', newIds);
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter contact name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter email address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormLabel>Contact Lists</FormLabel>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-4">
                  {contactLists.length > 0 ? (
                    contactLists.map((list) => (
                      <div key={list.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`list-${list.id}`}
                          checked={form.watch('contactListIds')?.includes(list.id) || false}
                          onCheckedChange={() => handleContactListToggle(list.id)}
                        />
                        <label htmlFor={`list-${list.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{list.name}</div>
                          {list.description && (
                            <div className="text-sm text-muted-foreground">{list.description}</div>
                          )}
                        </label>
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
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
