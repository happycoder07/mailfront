import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { ContactsList } from '@/components/contacts/contacts-list';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mail Manger - Contacts',
  description: 'Manage your contacts',
};

export default function ContactsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Manage your contacts</p>
        </div>
        <Link href="/contacts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Button>
        </Link>
      </div>
      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-[200px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        }
      >
        <ContactsList />
      </Suspense>
    </div>
  );
}
