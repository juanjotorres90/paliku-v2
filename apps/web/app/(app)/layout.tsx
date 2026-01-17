import Link from "next/link";
import { ThemeToggle } from "@repo/ui/theme-toggle";
import { UserMenu } from "../user-menu";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh flex flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold text-lg">
              Paliku
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                href="/people"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                People
              </Link>
              <Link
                href="/chats"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Chats
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main id="content" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Paliku. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
