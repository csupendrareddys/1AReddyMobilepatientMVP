import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PatientScopeProvider } from '../src/scope/PatientScope';
import { colors } from '../src/theme/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <PatientScopeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="doctor/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="booking/[doctorId]" options={{ presentation: 'card' }} />
          <Stack.Screen name="book-by-type" options={{ presentation: 'card' }} />
          <Stack.Screen name="category/[key]" options={{ presentation: 'card' }} />
          <Stack.Screen name="agent" options={{ presentation: 'modal' }} />
          <Stack.Screen name="more/index" options={{ presentation: 'card' }} />
          {/* Call room takes over the screen — no card chrome behind it. */}
          <Stack.Screen name="consult/[appointmentId]" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
        </PatientScopeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
