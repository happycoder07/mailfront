import { Metadata } from 'next';
import { EmailView } from '@/components/emails/email-view';

export const metadata: Metadata = {
  title: 'View Email',
  description: 'View email details and content',
};

interface EmailViewPageProps {
  params: {
    id: string;
  };
}

export default function EmailViewPage({ params }: EmailViewPageProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">View Email</h1>
        <p className="text-muted-foreground">View email details and content</p>
      </div>
      <EmailView id={params.id} />
    </div>
  );
}
