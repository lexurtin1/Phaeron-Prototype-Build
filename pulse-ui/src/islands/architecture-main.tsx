import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ArchitectureDemo } from '@/components/architecture/ArchitectureDemo';
import '@/styles/pulse-ui.css';

const el = document.getElementById('architecture-root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <ArchitectureDemo />
    </StrictMode>
  );
}
