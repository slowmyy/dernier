import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { MediaCacheProvider } from '@/contexts/MediaCacheContext';

export default function RootLayout() {
  useFrameworkReady();
  useAuthRedirect();

  return (
    <MediaCacheProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </MediaCacheProvider>
  );
}