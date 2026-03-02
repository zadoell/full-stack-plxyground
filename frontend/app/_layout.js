import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="login" />
          <Stack.Screen name="business-signup" />
          <Stack.Screen name="business-login" />
          <Stack.Screen name="feed" />
          <Stack.Screen name="content/[id]" />
          <Stack.Screen name="create-post" />
          <Stack.Screen name="edit-post/[id]" />
          <Stack.Screen name="profile/[id]" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="discover" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="privacy" />
        </Stack>
      </View>
    </AuthProvider>
  );
}
