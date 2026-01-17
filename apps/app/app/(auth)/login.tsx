import { LoginRequestSchema } from "@repo/validators/auth";
import { Image } from "expo-image";
import { Link, useRouter, type Href } from "expo-router";
import { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const colorScheme = useColorScheme() ?? "light";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    try {
      // Validate input
      const parsed = LoginRequestSchema.safeParse({ email, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid form");
        setLoading(false);
        return;
      }

      const result = await login(parsed.data.email, parsed.data.password);

      if (!result.ok) {
        setError(result.error ?? "Failed to sign in");
        setLoading(false);
        return;
      }

      // Success - navigation is handled by auth state change in root layout
      router.replace("/(tabs)");
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoid}
    >
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
        headerImage={
          <Image
            source={require("@/assets/images/partial-react-logo.png")}
            style={styles.headerImage}
          />
        }
      >
        <ThemedView style={styles.header}>
          <ThemedText type="title">Sign In</ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: Colors[colorScheme].icon }]}
          >
            Enter your email and password to continue
          </ThemedText>
          <View style={styles.registerLink}>
            <ThemedText
              style={[styles.registerText, { color: Colors[colorScheme].icon }]}
            >
              New here?{" "}
            </ThemedText>
            <Link href={"/register" as Href} asChild>
              <Pressable>
                <ThemedText style={styles.link}>Create an account</ThemedText>
              </Pressable>
            </Link>
          </View>
        </ThemedView>

        <View style={styles.form}>
          <ThemedTextInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            editable={!loading}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <ThemedTextInput
            ref={passwordRef}
            label="Password"
            placeholder="********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
            editable={!loading}
            onSubmitEditing={handleSubmit}
          />

          {error && (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          <ThemedButton
            title={loading ? "Signing in..." : "Sign In"}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
        </View>
      </ParallaxScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  headerImage: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  registerLink: {
    flexDirection: "row",
    marginTop: 4,
  },
  registerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    color: "#0a7ea4",
    textDecorationLine: "underline",
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
  },
});
