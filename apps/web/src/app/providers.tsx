'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { Toaster } from '@/shared/components/ui/Toaster';

// Client-side providers tree. Kept tiny — Redux + a single toaster.
// Auth bootstrap runs inside the slice (localStorage hydration on import).
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster />
    </Provider>
  );
}
