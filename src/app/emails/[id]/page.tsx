import { Metadata } from 'next';
import { EmailView } from '@/components/emails/email-view';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Mail Manger - View Email',
  description: 'View email details and content',
};

type EmailViewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EmailViewPage({ params }: EmailViewPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">View Email</h1>
        <p className="text-muted-foreground">View email details and content</p>
      </div>
      <EmailView id={id} />
    </div>
  );
}
