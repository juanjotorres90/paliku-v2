export function Gradient({
  conic,
  className,
  small,
}: {
  small?: boolean;
  conic?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`ui:absolute ui:mix-blend-normal ui:will-change-[filter] ui:rounded-[100%] ${
        small ? "ui:blur-[32px]" : "ui:blur-[75px]"
      } ${
        conic
          ? "ui:bg-gradient-to-r ui:from-blue-500 ui:via-purple-500 ui:to-pink-500 dark:ui:from-blue-400 dark:ui:via-purple-400 dark:ui:to-pink-400 ui:opacity-70 dark:ui:opacity-50"
          : "ui:bg-gradient-to-br ui:from-gray-200 ui:to-gray-400 dark:ui:from-gray-700 dark:ui:to-gray-900"
      } ${className ?? ""}`}
    />
  );
}
