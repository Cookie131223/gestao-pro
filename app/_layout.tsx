// app/_layout.tsx
import { Stack } from 'expo-router';
import { ObraProvider } from '../context/ObraContext';

export default function RootLayout() {
  return (
    <ObraProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ObraProvider>
  );
}