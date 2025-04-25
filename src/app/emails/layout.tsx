import { MainNav } from '@/components/layout/main-nav';

export default function EmailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="flex-1 container mx-auto py-6 px-4">{children}</div>
    </div>
  );
}
