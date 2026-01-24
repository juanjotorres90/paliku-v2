import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { UserMenu } from "../user-menu";
import { UserProvider } from "../user-context";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [tNav, tCommon] = await Promise.all([
    getTranslations("nav"),
    getTranslations("common"),
  ]);

  return (
    <UserProvider>
      <div className="min-h-dvh flex flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          {tCommon("skipToContent")}
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
                  {tNav("home")}
                </Link>
                <Link
                  href="/people"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tNav("people")}
                </Link>
                <Link
                  href="/chats"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tNav("chats")}
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </div>
        </header>

        <main id="content" className="flex-1">
          {children}
        </main>

        <footer className="border-t border-border py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            {tCommon("footerCopyright", {
              year: new Date().getFullYear(),
              brand: "Paliku",
            })}
          </div>
        </footer>
      </div>
    </UserProvider>
  );
}
