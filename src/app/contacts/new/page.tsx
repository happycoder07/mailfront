import { CreateContactForm } from '@/components/contacts/create-contact-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mail Manger - New Contact',
  description: 'Create a new contact',
};
export default function NewContactPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Contact</h1>
        <p className="text-muted-foreground">Create a new contact</p>
      </div>
      <CreateContactForm />
    </div>
  );
}
