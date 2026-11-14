import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { createQueryClient } from '@/shared/api';
import { initMonitoring } from './monitoring';
import { router } from './router';
import { GlobalStyles } from './styles/GlobalStyles';

initMonitoring();

const queryClient = createQueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GlobalStyles />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
