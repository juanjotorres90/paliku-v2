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
        className={`ui:group ui:block ui:p-6 ui:rounded-xl ui:border ui:border-black/10 ui:dark:border-white/15 ui:transition-all ui:duration-200 ui:hover:border-black/20 ui:dark:hover:border-white/25 ui:hover:bg-gray-50 ui:dark:hover:bg-gray-900 ${className}`}
        href={`${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo`}
        rel="noopener noreferrer"
        target="_blank"
      >
      <h2 className="ui:text-xl ui:font-semibold ui:mb-2 ui:text-gray-900 ui:dark:text-gray-100">
        {title} <span className="ui:inline-block ui:transition-transform ui:group-hover:translate-x-1">-&gt;</span>
      </h2>
      <p className="ui:text-gray-600 ui:dark:text-gray-400">{children}</p>
    </a>
  );
}
