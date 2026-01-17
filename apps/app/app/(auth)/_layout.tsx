import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/lib/auth-context";

export default function AuthLayout() {
  const { state } = useAuth();

  // If already authenticated, redirect to home
  if (state === "authenticated") {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: "Sign In" }} />
      <Stack.Screen name="register" options={{ title: "Register" }} />
    </Stack>
  );
}
