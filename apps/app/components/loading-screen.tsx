import { Image } from "expo-image";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const colorScheme = useColorScheme() ?? "light";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <View style={styles.content}>
        <Image
          source={require("@/assets/images/splash-icon.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme].tint}
          style={styles.spinner}
        />
        {message && <ThemedText style={styles.message}>{message}</ThemedText>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    gap: 24,
  },
  logo: {
    width: 120,
    height: 120,
  },
  spinner: {
    marginTop: 8,
  },
  message: {
    fontSize: 16,
    opacity: 0.7,
  },
});
