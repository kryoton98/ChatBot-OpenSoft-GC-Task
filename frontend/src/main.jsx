import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './store/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google'; // <--- IMPORT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="500551401336-afj4fc0u0asb0jrho87rucul8b4p4vh9.apps.googleusercontent.com">
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);