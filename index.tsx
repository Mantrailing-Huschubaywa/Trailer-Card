
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* Remove initialEntries, as it's not supported by HashRouter. */}
    {/* Initial navigation is handled by App.tsx based on login status. */}
    <HashRouter> 
      <App />
    </HashRouter>
  </React.StrictMode>
);