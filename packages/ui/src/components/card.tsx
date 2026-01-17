import { type JSX, type ReactNode } from "react";

export function Card({
  className = "",
  title,
  children,
  href,
}: {
  className?: string;
  title: string;
  children: ReactNode;
  href: string;
}): JSX.Element {
  return (
    <a
      className={`group block p-6 rounded-xl border border-black/10 dark:border-white/15 transition-all duration-200 hover:border-black/20 dark:hover:border-white/25 hover:bg-gray-50 dark:hover:bg-gray-900 ${className}`}
      href={`${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
        {title}{" "}
        <span className="inline-block transition-transform group-hover:translate-x-1">
          -&gt;
        </span>
      </h2>
      <p className="text-gray-600 dark:text-gray-400">{children}</p>
    </a>
  );
}
