import { type JSX, type ReactNode } from "react";

export function Code({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <code
      className={`font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded font-semibold text-gray-800 dark:text-gray-200 ${className}`}
    >
      {children}
    </code>
  );
}
