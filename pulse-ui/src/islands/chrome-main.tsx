import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ModuleChrome } from '@/components/ModuleChrome';
import '@/styles/pulse-ui.css';
import '@/styles/module-chrome.css';

const el = document.getElementById('pulse-react-chrome');
if (el) {
  const title = el.getAttribute('data-title') || 'Pulse';
  const moduleId = el.getAttribute('data-module');
  const viewId = el.getAttribute('data-view');
  const showGestures = el.getAttribute('data-gestures') === 'true';
  createRoot(el).render(
    <StrictMode>
      <ModuleChrome
        title={title}
        moduleId={moduleId}
        viewId={viewId}
        showGestures={showGestures}
      />
    </StrictMode>
  );
}
