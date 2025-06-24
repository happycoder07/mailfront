import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { ContactListsTable } from '@/components/contact-lists/contact-lists-table';

export default function ContactListsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Lists</h1>
          <p className="text-muted-foreground">Manage your contact lists</p>
        </div>
        <Link href="/contact-lists/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Contact List
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
        <ContactListsTable />
      </Suspense>
    </div>
  );
}
