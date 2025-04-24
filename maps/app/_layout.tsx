import { Slot } from 'expo-router';
import { DatabaseProvider } from '../contexts/DatabaseContext';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <Slot />
    </DatabaseProvider>
  );
}