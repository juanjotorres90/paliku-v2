import { type JSX } from "react";

export function Code({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <code className={`ui:font-mono ui:bg-black/5 dark:ui:bg-white/10 ui:px-1.5 ui:py-0.5 ui:rounded ui:font-semibold ui:text-gray-800 dark:ui:text-gray-200 ${className}`}>
      {children}
    </code>
  );
}
