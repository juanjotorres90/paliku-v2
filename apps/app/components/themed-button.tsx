import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { ThemedText } from "./themed-text";

export type ThemedButtonProps = Omit<PressableProps, "style"> & {
  title: string;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ThemedButton({
  title,
  variant = "primary",
  loading = false,
  disabled,
  style,
  ...props
}: ThemedButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const isDisabled = disabled || loading;

  const getBackgroundColor = (pressed: boolean) => {
    if (isDisabled) {
      return colorScheme === "dark" ? "#374151" : "#e5e7eb"; // gray-700 / gray-200
    }

    switch (variant) {
      case "primary":
        return pressed
          ? colorScheme === "dark"
            ? "#0369a1" // sky-700
            : "#0284c7" // sky-600
          : "#0a7ea4"; // Use teal for both light and dark mode
      case "secondary":
        return pressed
          ? colorScheme === "dark"
            ? "#374151" // gray-700
            : "#e5e7eb" // gray-200
          : colorScheme === "dark"
            ? "#4b5563" // gray-600
            : "#f3f4f6"; // gray-100
      case "ghost":
        return pressed
          ? colorScheme === "dark"
            ? "#374151" // gray-700
            : "#f3f4f6" // gray-100
          : "transparent";
    }
  };

  const getTextColor = () => {
    if (isDisabled) {
      return colorScheme === "dark" ? "#6b7280" : "#9ca3af"; // gray-500 / gray-400
    }

    switch (variant) {
      case "primary":
        return "#ffffff";
      case "secondary":
      case "ghost":
        return colors.text;
    }
  };

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor:
            colorScheme === "dark"
              ? "#4b5563" // gray-600
              : "#d1d5db", // gray-300
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <ThemedText
          style={[
            styles.text,
            {
              color: getTextColor(),
            },
          ]}
        >
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
