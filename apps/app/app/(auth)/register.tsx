import { RegisterRequestSchema } from "@repo/validators/auth";
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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const colorScheme = useColorScheme() ?? "light";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Check passwords match
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      // Validate input
      const parsed = RegisterRequestSchema.safeParse({
        email,
        password,
        displayName,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid form");
        setLoading(false);
        return;
      }

      const result = await register(
        parsed.data.email,
        parsed.data.password,
        parsed.data.displayName,
      );

      if (!result.ok) {
        setError(result.error ?? "Failed to create account");
        setLoading(false);
        return;
      }

      if (result.needsEmailConfirmation) {
        setSuccess(
          "Check your email to confirm your account. After confirming, please sign in.",
        );
        setLoading(false);
        return;
      }

      // Success - navigation is handled by auth state change
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
          <ThemedText type="title">Create account</ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: Colors[colorScheme].icon }]}
          >
            Sign up with your email. You may need to confirm via email.
          </ThemedText>
          <View style={styles.loginLink}>
            <ThemedText
              style={[styles.loginText, { color: Colors[colorScheme].icon }]}
            >
              Already have an account?{" "}
            </ThemedText>
            <Link href={"/login" as Href} asChild>
              <Pressable>
                <ThemedText style={styles.link}>Sign in</ThemedText>
              </Pressable>
            </Link>
          </View>
        </ThemedView>

        <View style={styles.form}>
          <ThemedTextInput
            label="Display name"
            placeholder="Your name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            editable={!loading}
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <ThemedTextInput
            ref={emailRef}
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
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            editable={!loading}
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          />

          <ThemedTextInput
            ref={confirmPasswordRef}
            label="Confirm password"
            placeholder="********"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            editable={!loading}
            onSubmitEditing={handleSubmit}
          />

          {error && (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          {success && (
            <View style={styles.successContainer}>
              <ThemedText style={styles.successText}>{success}</ThemedText>
            </View>
          )}

          <ThemedButton
            title={loading ? "Creating account..." : "Create account"}
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
  loginLink: {
    flexDirection: "row",
    marginTop: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  loginText: {
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
  successContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  successText: {
    color: "#10b981",
    fontSize: 14,
  },
});
