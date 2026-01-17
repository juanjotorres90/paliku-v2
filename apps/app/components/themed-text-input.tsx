import { forwardRef, useState } from "react";
import {
  StyleSheet,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { ThemedText } from "./themed-text";

export type ThemedTextInputProps = RNTextInputProps & {
  label?: string;
  error?: string;
};

export const ThemedTextInput = forwardRef<RNTextInput, ThemedTextInputProps>(
  function ThemedTextInput({ label, error, style, ...props }, ref) {
    const colorScheme = useColorScheme() ?? "light";
    const colors = Colors[colorScheme];
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = error
      ? "#ef4444" // red-500
      : isFocused
        ? colors.tint
        : colorScheme === "dark"
          ? "#374151" // gray-700
          : "#d1d5db"; // gray-300

    const backgroundColor =
      colorScheme === "dark"
        ? "#1f2937" // gray-800
        : "#ffffff";

    return (
      <View style={styles.container}>
        {label && (
          <ThemedText style={styles.label} type="defaultSemiBold">
            {label}
          </ThemedText>
        )}
        <RNTextInput
          ref={ref}
          style={[
            styles.input,
            {
              borderColor,
              backgroundColor,
              color: colors.text,
            },
            style,
          ]}
          placeholderTextColor={colors.icon}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: {
    color: "#ef4444", // red-500
    fontSize: 12,
  },
});
