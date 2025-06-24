import { CreateContactListForm } from '@/components/contact-lists/create-contact-list-form';

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
