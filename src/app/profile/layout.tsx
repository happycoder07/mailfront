import { MainNav } from '@/components/layout/main-nav';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <MainNav />
      </div>
      <div className="flex-1 container mx-auto py-6 px-4 mt-16">{children}</div>
    </div>
  );
}
