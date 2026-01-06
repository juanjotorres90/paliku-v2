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
          ? "ui:bg-gradient-to-r ui:from-blue-500 ui:via-purple-500 ui:to-pink-500 ui:dark:from-blue-400 ui:dark:via-purple-400 ui:dark:to-pink-400 ui:opacity-70 ui:dark:opacity-50"
          : "ui:bg-gradient-to-br ui:from-gray-200 ui:to-gray-400 ui:dark:from-gray-700 ui:dark:to-gray-900"
      } ${className ?? ""}`}
    />
  );
}
