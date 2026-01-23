import type { JSX } from "react";

export interface LocaleOption {
  value: string;
  label: string;
}

export interface LanguageSwitcherProps {
  value: string;
  onChange: (locale: string) => void;
  options: LocaleOption[];
  className?: string;
  id?: string;
  name?: string;
}

/**
 * Select dropdown for language selection using native language names.
 * Position via className prop (e.g., "ui:w-full").
 */
export function LanguageSwitcher({
  value,
  onChange,
  options,
  className = "",
  id = "language-select",
  name = "language",
}: LanguageSwitcherProps): JSX.Element {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`inline-flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
