"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink {
  href: string;
  label: string;
}

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4 text-sm">
      {links.map(({ href, label }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={
              isActive
                ? "text-foreground font-medium transition-colors"
                : "text-muted-foreground hover:text-foreground transition-colors"
            }
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
