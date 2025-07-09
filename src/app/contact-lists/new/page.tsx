import { CreateContactListForm } from '@/components/contact-lists/create-contact-list-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mail Manger - New Contact List',
  description: 'Create a new contact list',
};

export default function NewContactListPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Contact List</h1>
        <p className="text-muted-foreground">Create a new contact list</p>
      </div>
      <CreateContactListForm />
    </div>
  );
}
