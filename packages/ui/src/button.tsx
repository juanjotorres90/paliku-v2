"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
}

export const Button = ({ children, className = "", appName }: ButtonProps) => {
  return (
    <button
      className={`ui:appearance-none ui:rounded-full ui:h-12 ui:px-5 ui:border ui:border-black/10 ui:dark:border-white/15 ui:transition-all ui:duration-200 ui:cursor-pointer ui:flex ui:items-center ui:justify-center ui:text-base ui:leading-5 ui:font-medium ui:bg-white ui:dark:bg-gray-800 ui:text-gray-900 ui:dark:text-gray-100 ui:min-w-45 ui:hover:bg-gray-100 ui:dark:hover:bg-gray-700 ui:shadow-sm ui:hover:shadow-md ${className}`}
      onClick={() => alert(`Hello from your ${appName} app!`)}
    >
      {children}
    </button>
  );
};
