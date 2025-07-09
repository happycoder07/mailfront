import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b bg-background" role="banner">
      <div className="container flex h-16 items-center px-4">
        <Link
          href="/"
          className="flex items-center space-x-2"
          aria-label="Go to home page"
        >
          <span className="text-xl font-bold">Mail Manager</span>
        </Link>
      </div>
    </header>
  );
}
