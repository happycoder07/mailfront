import { Metadata } from 'next';
import { NewEmailForm } from '@/components/emails/new-email-form';

export const metadata: Metadata = {
  title: 'New Email',
  description: 'Create a new email',
};

export default function NewEmailPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Email</h1>
        <p className="text-muted-foreground">Create and send a new email</p>
      </div>
      <NewEmailForm />
    </div>
  );
}
