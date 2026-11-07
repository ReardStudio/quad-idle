import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

window.addEventListener('error', e => window.api.log('error', 'window', e.message));
window.addEventListener('unhandledrejection', e => window.api.log('error', 'promise', String(e.reason?.stack ?? e.reason)));

createRoot(document.getElementById('root')!).render(<App />);
