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
      className={`absolute mix-blend-normal will-change-[filter] rounded-[100%] ${
        small ? "blur-[32px]" : "blur-[75px]"
      } ${
        conic
          ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 opacity-70 dark:opacity-50"
          : "bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-700 dark:to-gray-900"
      } ${className ?? ""}`}
    />
  );
}
