import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">NCCC NCCC Mail Manager</span>
        </Link>
      </div>
    </header>
  );
}
