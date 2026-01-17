import { ThemeToggle } from "@repo/ui/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      {children}
    </div>
  );
}
