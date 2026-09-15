import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HomePage } from '@/pages/HomePage';
import '@/styles/pulse-ui.css';
import '@/styles/module-chrome.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HomePage />
  </StrictMode>
);
