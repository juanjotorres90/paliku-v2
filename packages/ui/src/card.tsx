import { type JSX } from "react";

export function Card({
  className = "",
  title,
  children,
  href,
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}): JSX.Element {
  return (
      <a
        className={`ui:group ui:block ui:p-6 ui:rounded-xl ui:border ui:border-black/10 dark:ui:border-white/15 ui:transition-all ui:duration-200 hover:ui:border-black/20 dark:hover:ui:border-white/25 hover:ui:bg-gray-50 dark:hover:ui:bg-gray-900 ${className}`}
        href={`${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo`}
        rel="noopener noreferrer"
        target="_blank"
      >
      <h2 className="ui:text-xl ui:font-semibold ui:mb-2 ui:text-gray-900 dark:ui:text-gray-100">
        {title} <span className="ui:inline-block ui:transition-transform group-hover:ui:translate-x-1">-&gt;</span>
      </h2>
      <p className="ui:text-gray-600 dark:ui:text-gray-400">{children}</p>
    </a>
  );
}
