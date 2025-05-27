import { Metadata } from 'next';
import { EmailList } from '@/components/emails/email-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Emails',
  description: 'Manage your emails',
};

export default function EmailsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emails</h1>
          <p className="text-muted-foreground">Manage and track your email communications</p>
        </div>
        <Link href="/emails/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Email
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
        <EmailList />
      </Suspense>
    </div>
  );
}
