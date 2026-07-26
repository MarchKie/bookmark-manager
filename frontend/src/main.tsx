import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './context/AuthContext';
import { App } from './App';
import './index.css';

const domain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-yg.us.auth0.com';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'H9F6QG5SzTKMv0tbmgxLj9LjG1EKVllA';
const audience = import.meta.env.VITE_AUTH0_AUDIENCE || 'https://bbl-candidate-test-api';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin + '/callback',
        audience: audience,
        scope: 'openid profile email',
      }}
      cacheLocation="localstorage"
    >
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>,
);
