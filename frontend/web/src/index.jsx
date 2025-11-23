import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Suppress FontFaceObserver timeout errors - fonts load via Google Fonts link tag
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('timeout exceeded') && event.message.includes('FontFaceObserver')) {
    event.preventDefault();
    console.warn('FontFaceObserver timeout (non-critical): Fonts will still load via Google Fonts');
    return false;
  }
});

// Also catch unhandled promise rejections from FontFaceObserver
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason === 'object' && event.reason.message && 
      event.reason.message.includes('timeout exceeded') && event.reason.message.includes('FontFaceObserver')) {
    event.preventDefault();
    console.warn('FontFaceObserver timeout (non-critical): Fonts will still load via Google Fonts');
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();