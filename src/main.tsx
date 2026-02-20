import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML = '<p style="padding:2rem;font-family:system-ui;">Kon nie app laai nie (geen root-element).</p>';
} else {
  try {
    createRoot(rootEl).render(<App />);
  } catch (e) {
    console.error('Startup error:', e);
    rootEl.innerHTML = '<p style="padding:2rem;font-family:system-ui;">Kon nie app laai nie. Ververs die bladsy (F5).</p>';
  }
}
