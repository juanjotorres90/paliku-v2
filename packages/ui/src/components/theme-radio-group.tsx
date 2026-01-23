import type { JSX } from "react";
import type { Theme } from "../theme";
import { cn } from "@repo/ui/lib/utils";

export interface ThemeRadioGroupProps {
  value: Theme;
  onChange: (theme: Theme) => void;
  className?: string;
  name?: string;
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx={12} cy={12} r={5} />
      <line x1={12} y1={1} x2={12} y2={3} />
      <line x1={12} y1={21} x2={12} y2={23} />
      <line x1={4.22} y1={4.22} x2={5.64} y2={5.64} />
      <line x1={18.36} y1={18.36} x2={19.78} y2={19.78} />
      <line x1={1} y1={12} x2={3} y2={12} />
      <line x1={21} y1={12} x2={23} y2={12} />
      <line x1={4.22} y1={19.78} x2={5.64} y2={18.36} />
      <line x1={18.36} y1={5.64} x2={19.78} y2={4.22} />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x={2} y={3} width={20} height={14} rx={2} ry={2} />
      <line x1={8} y1={21} x2={16} y2={21} />
      <line x1={12} y1={17} x2={12} y2={21} />
    </svg>
  );
}

/**
 * Radio button group for theme selection (system/light/dark).
 * Position via className prop (e.g., "ui:w-full").
 */
export function ThemeRadioGroup({
  value,
  onChange,
  className = "",
  name = "theme",
}: ThemeRadioGroupProps): JSX.Element {
  const themes: { value: Theme; label: string; icon: typeof SunIcon }[] = [
    { value: "system", label: "System", icon: SystemIcon },
    { value: "light", label: "Light", icon: SunIcon },
    { value: "dark", label: "Dark", icon: MoonIcon },
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {themes.map((theme) => {
        const Icon = theme.icon;
        const isSelected = value === theme.value;

        return (
          <label
            key={theme.value}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background",
            )}
          >
            <input
              type="radio"
              name={name}
              value={theme.value}
              checked={isSelected}
              onChange={() => onChange(theme.value)}
              className="sr-only"
            />
            <Icon className="size-4" />
            <span>{theme.label}</span>
          </label>
        );
      })}
    </div>
  );
}
