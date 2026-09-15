import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ModuleChrome } from '@/components/ModuleChrome';
import '@/styles/pulse-ui.css';
import '@/styles/module-chrome.css';

const el = document.getElementById('pulse-react-chrome');
if (el) {
  const title = el.getAttribute('data-title') || 'Pulse';
  createRoot(el).render(
    <StrictMode>
      <ModuleChrome title={title} />
    </StrictMode>
  );
}
