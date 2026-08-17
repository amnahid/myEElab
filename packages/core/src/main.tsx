import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './style.css'

if (import.meta.env.DEV) {
  let logBuffer: any[] = [];
  let flushTimeout: any = null;

  const flushLogs = () => {
    if (logBuffer.length === 0) return;
    const toSend = [...logBuffer];
    logBuffer = [];
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSend)
    }).catch(() => {});
  };

  const sendLog = (level: string, ...args: any[]) => {
    const messages = args.map(a => {
       try { return typeof a === 'object' ? JSON.stringify(a) : String(a) }
       catch(e) { return String(a) }
    });
    logBuffer.push({ level, messages });
    
    // limit buffer size to prevent memory leaks if network is slow
    if (logBuffer.length > 5000) {
      logBuffer = logBuffer.slice(-5000);
    }
    
    if (!flushTimeout) {
      flushTimeout = setTimeout(() => {
        flushTimeout = null;
        flushLogs();
      }, 500);
    }
  };

  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  console.log = (...args) => { sendLog('LOG', ...args); originalConsoleLog.apply(console, args); };
  console.warn = (...args) => { sendLog('WARN', ...args); originalConsoleWarn.apply(console, args); };
  console.error = (...args) => { sendLog('ERROR', ...args); originalConsoleError.apply(console, args); };
  
  window.addEventListener('error', (e) => {
    sendLog('WINDOW_ERROR', e.message, e.filename, e.lineno, e.colno, e.error?.stack);
  });
  window.addEventListener('unhandledrejection', (e) => {
    sendLog('UNHANDLED_REJECTION', e.reason);
  });
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
